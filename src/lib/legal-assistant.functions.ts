import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  buildLegalAssistantSystemPrompt,
  extractArticleNumber,
  extractGeminiAnswer,
  extractLegalSearchTerms,
} from "@/lib/legal-assistant";

const requestSchema = z.object({
  question: z.string().trim().min(3).max(2_000),
});

const requestTimesByUser = new Map<string, number[]>();
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_SOURCE_CHARS = 1_200;
const MAX_SOURCES = 4;

export type LegalAssistantCitation = {
  id: string;
  label: string;
  url: string | null;
};

type LegalSource = LegalAssistantCitation & {
  articleNumber: string;
  legalText: string;
};

export type LegalAssistantResponse =
  | { status: "answered"; answer: string; citations: LegalAssistantCitation[] }
  | { status: "not_configured" | "no_verified_sources" | "rate_limited" | "provider_error" };

export function allowAssistantRequest(userId: string, now: number) {
  const recentRequests = (requestTimesByUser.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (recentRequests.length >= RATE_LIMIT_REQUESTS) {
    requestTimesByUser.set(userId, recentRequests);
    return false;
  }
  recentRequests.push(now);
  requestTimesByUser.set(userId, recentRequests);
  return true;
}

export function formatLegalSourceLabel(shortName: string, articleNumber: string) {
  return `${shortName.slice(0, 80)}, art. ${articleNumber}`;
}

function excerptLegalText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_SOURCE_CHARS);
}

async function findVerifiedSources(
  supabase: SupabaseClient<Database>,
  question: string,
): Promise<LegalSource[]> {
  const searchTerms = extractLegalSearchTerms(question);
  const articleNumber = extractArticleNumber(question);
  const articleSearches = searchTerms.map((term) =>
    supabase
      .from("norm_articles")
      .select("id, norm_id, article_number, legal_text")
      .ilike("legal_text", `%${term}%`)
      .limit(5),
  );
  const articleNumberSearch = articleNumber
    ? supabase
        .from("norm_articles")
        .select("id, norm_id, article_number, legal_text")
        .eq("article_number", articleNumber)
        .limit(10)
    : null;
  const normSearch = searchTerms.length
    ? supabase
        .from("norms")
        .select("id, short_name, official_name, official_url")
        .eq("text_status", "verificado")
        .or(
          searchTerms
            .map((term) => `short_name.ilike.%${term}%,official_name.ilike.%${term}%`)
            .join(","),
        )
        .limit(10)
    : null;

  const [articleResults, articleNumberResult, normResult] = await Promise.all([
    Promise.all(articleSearches),
    articleNumberSearch,
    normSearch,
  ]);
  const articleRows = [
    ...(articleNumberResult?.data ?? []),
    ...articleResults.flatMap((result) => result.data ?? []),
  ];
  const matchedNormIds = new Set(normResult?.data?.map((norm) => norm.id) ?? []);
  const missingNormIds = [...new Set(articleRows.map((article) => article.norm_id))].filter(
    (id) => !matchedNormIds.has(id),
  );
  const [verifiedArticleNorms, verifiedMatchedNormArticles] = await Promise.all([
    missingNormIds.length
      ? supabase
          .from("norms")
          .select("id, short_name, official_name, official_url")
          .eq("text_status", "verificado")
          .in("id", missingNormIds)
      : Promise.resolve({ data: [], error: null }),
    matchedNormIds.size
      ? supabase
          .from("norm_articles")
          .select("id, norm_id, article_number, legal_text")
          .in("norm_id", [...matchedNormIds])
          .limit(12)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const errors = [
    ...articleResults.map((result) => result.error),
    articleNumberResult?.error,
    normResult?.error,
    verifiedArticleNorms.error,
    verifiedMatchedNormArticles.error,
  ].filter(Boolean);
  if (errors.length > 0) throw new Error("Falha ao pesquisar as fontes jurídicas verificadas.");

  const allArticles = [...articleRows, ...(verifiedMatchedNormArticles.data ?? [])].filter(
    (article, index, list) => list.findIndex((entry) => entry.id === article.id) === index,
  );
  const allNorms = [...(normResult?.data ?? []), ...(verifiedArticleNorms.data ?? [])];
  const normsById = new Map(allNorms.map((norm) => [norm.id, norm]));
  const sources: LegalSource[] = [];

  for (const article of allArticles) {
    const norm = normsById.get(article.norm_id);
    if (!norm) continue;

    sources.push({
      id: article.id,
      label: formatLegalSourceLabel(norm.short_name, article.article_number),
      url: norm.official_url,
      articleNumber: article.article_number,
      legalText: excerptLegalText(article.legal_text),
    });
    if (sources.length === MAX_SOURCES) break;
  }

  return sources;
}

export const askLegalQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => requestSchema.parse(data))
  .handler(async ({ data, context }): Promise<LegalAssistantResponse> => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) return { status: "not_configured" };

    if (!allowAssistantRequest(context.userId, Date.now())) {
      return { status: "rate_limited" };
    }

    const sources = await findVerifiedSources(context.supabase, data.question);
    if (sources.length === 0) return { status: "no_verified_sources" };

    const sourceContext = sources
      .map((source, index) => `[${index + 1}] ${source.label}\n${source.legalText}`)
      .join("\n\n");
    const citations: LegalAssistantCitation[] = sources.map(({ id, label, url }) => ({
      id,
      label,
      url,
    }));

    let response: Response;
    try {
      const model = process.env["GEMINI_MODEL"] || "gemini-2.5-flash";
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: buildLegalAssistantSystemPrompt() }],
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Pergunta:\n${data.question}\n\nTrechos de legislação verificada:\n${sourceContext}`,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 700,
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );
    } catch (error) {
      console.error("[assistant] Gemini request failed", error);
      return { status: "provider_error" };
    }

    if (!response.ok) {
      console.error(`[assistant] Gemini returned HTTP ${response.status}`);
      return { status: "provider_error" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      console.error("[assistant] Gemini returned invalid JSON", error);
      return { status: "provider_error" };
    }

    const answer = extractGeminiAnswer(payload);
    if (!answer) {
      console.error("[assistant] Gemini returned an empty answer");
      return { status: "provider_error" };
    }

    return { status: "answered", answer, citations };
  });
