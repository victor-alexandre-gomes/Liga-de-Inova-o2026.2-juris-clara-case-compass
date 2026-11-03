export interface LegislationSourceNorm {
  slug: string;
  short_name: string;
  official_name: string;
  norm_type: string;
  number: string | null;
  year: number | null;
  signed_on: string | null;
  official_url: string | null;
}

export interface SourceArticle {
  number: string;
  text: string;
}

const REPOSITORY_RAW_URL = "https://raw.githubusercontent.com/ctresb/leis/main";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
}

function normalizeLawNumber(value: string | null) {
  const match = value?.match(/(\d[\d.]*)/);
  return match?.[1].replace(/\./g, "") ?? null;
}

function isFederalOfficialSource(value: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (host === "planalto.gov.br" || host.endsWith(".planalto.gov.br")) return true;
    if (host === "camara.leg.br" || host.endsWith(".camara.leg.br")) return true;
    if (host === "senado.leg.br" || host.endsWith(".senado.leg.br")) return true;
    if (host === "normas.leg.br")
      return url.searchParams.get("urn")?.includes(":federal:") ?? false;
  } catch {
    return false;
  }

  return false;
}

export function getLegislationRepositoryUrl(norm: LegislationSourceNorm): string | null {
  const identity = normalizeText(`${norm.slug} ${norm.short_name} ${norm.official_name}`);
  const normType = normalizeText(norm.norm_type);

  if (
    identity.includes("constituicao federal") ||
    identity.includes("constituicao da republica federativa do brasil")
  ) {
    return `${REPOSITORY_RAW_URL}/constituicao.md`;
  }

  const sourcePathByType: Record<string, { directory: string; prefix: string }> = {
    "lei ordinaria": { directory: "leis-ordinarias", prefix: "lei" },
    "lei complementar": { directory: "leis-complementares", prefix: "lcp" },
    "lei delegada": { directory: "leis-delegadas", prefix: "ldl" },
    "decreto lei": { directory: "decretos-lei", prefix: "del" },
  };
  const sourcePath = sourcePathByType[normType];
  const number = normalizeLawNumber(norm.number);
  const date = norm.signed_on?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const year = date?.[1] ?? (norm.year ? String(norm.year) : null);

  if (!sourcePath || !number || !date || !year || !isFederalOfficialSource(norm.official_url))
    return null;

  return `${REPOSITORY_RAW_URL}/federal/${sourcePath.directory}/${year}/${sourcePath.prefix}-${number}-${date[0]}.md`;
}

export function parseLegislationArticles(markdown: string): SourceArticle[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const articleHeader = /^\*\*Art\.\s*(.*?)\*\*\s*(.*)$/i;
  const starts: Array<{ index: number; number: string; firstLine: string }> = [];
  const preambleIndex = lines.findIndex(
    (line) =>
      /^#{1,6}\s+/.test(line) &&
      normalizeText(line.replace(/^#{1,6}\s+/, "").trim()) === "preambulo",
  );
  const preambleEnd =
    preambleIndex < 0
      ? -1
      : lines.findIndex((line, index) => index > preambleIndex && /^#{1,6}\s/.test(line));
  let inADCT = false;

  lines.forEach((line, index) => {
    if (normalizeText(line).includes("ato das disposicoes constitucionais transitorias")) {
      inADCT = true;
    }

    const match = line.match(articleHeader);
    if (!match) return;

    let number = match[1]
      .trim()
      .replace(/\s+/g, "")
      .replace(/(\d+)[º°o]/gi, "$1")
      .replace(/\.$/, "");
    if (inADCT) number += " (ADCT)";
    if (number) starts.push({ index, number, firstLine: match[2] });
  });

  const articles = starts.map((start, index) => {
    const end = starts[index + 1]?.index ?? lines.length;
    const previousStart = starts[index - 1]?.index;
    const headingStart =
      previousStart === undefined
        ? preambleEnd < 0
          ? start.index
          : preambleEnd
        : previousStart + 1;
    const headings = lines
      .slice(headingStart, start.index)
      .filter((line) => /^#{1,6}\s/.test(line))
      .map((line) => line.replace(/^#{1,6}\s+/, "").trim())
      .filter(
        (heading) =>
          normalizeText(heading) !== "preambulo" &&
          !normalizeText(heading).startsWith("constituicao da republica federativa do brasil"),
      );
    const body = lines.slice(start.index + 1, end).filter((line) => !/^#{1,6}\s/.test(line));
    const text = [...headings, start.firstLine, ...body].join("\n").trim();
    return { number: start.number, text };
  });

  if (preambleIndex < 0) return articles;

  const preambleText = lines
    .slice(preambleIndex + 1, preambleEnd < 0 ? lines.length : preambleEnd)
    .join("\n")
    .trim();
  return preambleText ? [{ number: "Preâmbulo", text: preambleText }, ...articles] : articles;
}
