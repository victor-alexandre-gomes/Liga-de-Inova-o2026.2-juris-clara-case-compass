import { describe, expect, it } from "vitest";
import {
  buildLegalAssistantSystemPrompt,
  extractArticleNumber,
  extractGeminiAnswer,
  extractLegalSearchTerms,
} from "./legal-assistant";
import { allowAssistantRequest, formatLegalSourceLabel } from "./legal-assistant.functions";

describe("busca de fontes do assistente jurídico", () => {
  it("extrai termos relevantes mantendo a forma original e sem duplicatas", () => {
    expect(extractLegalSearchTerms("Meu produto com defeito, consumidor e consumidor")).toEqual([
      "produto",
      "defeito",
      "consumidor",
    ]);
  });

  it("limita a busca a cinco termos", () => {
    expect(
      extractLegalSearchTerms("contrato produto defeito cobrança indevida danos"),
    ).toHaveLength(5);
  });

  it("reconhece referências a artigo", () => {
    expect(extractArticleNumber("O que diz o art. 18º do CDC?")).toBe("18");
    expect(extractArticleNumber("artigo 5-A")).toBe("5-A");
    expect(extractArticleNumber("Quais são meus direitos?")).toBeNull();
  });

  it("instrui o modelo a não criar citações sem base", () => {
    expect(buildLegalAssistantSystemPrompt()).toContain("Não invente leis");
    expect(buildLegalAssistantSystemPrompt()).toContain("[1]");
  });

  it("extrai e combina o texto da resposta do Gemini", () => {
    expect(
      extractGeminiAnswer({
        candidates: [{ content: { parts: [{ text: "Resposta " }, { text: "do Gemini." }] } }],
      }),
    ).toBe("Resposta do Gemini.");
    expect(extractGeminiAnswer({ candidates: [] })).toBeNull();
  });

  it("limita solicitações por usuário e libera após a janela", () => {
    const userId = "legal-assistant-rate-limit-test";
    for (let request = 0; request < 10; request += 1) {
      expect(allowAssistantRequest(userId, 1_000)).toBe(true);
    }

    expect(allowAssistantRequest(userId, 1_000)).toBe(false);
    expect(allowAssistantRequest(userId, 61_001)).toBe(true);
  });

  it("formata a citação com o nome da norma e o artigo", () => {
    expect(formatLegalSourceLabel("CDC", "18")).toBe("CDC, art. 18");
  });
});
