import { describe, expect, it } from "vitest";
import { getLegislationRepositoryUrl, parseLegislationArticles } from "./legislation-source";

describe("fonte de legislação ctresb/leis", () => {
  it("monta o caminho de uma lei federal pelo tipo, número e data", () => {
    expect(
      getLegislationRepositoryUrl({
        slug: "cdc",
        short_name: "CDC",
        official_name: "Código de Defesa do Consumidor",
        norm_type: "Lei Ordinária",
        number: "8.078",
        year: 1990,
        signed_on: "1990-09-11",
        official_url: "https://www.planalto.gov.br/ccivil_03/leis/l8078.htm",
      }),
    ).toBe(
      "https://raw.githubusercontent.com/ctresb/leis/main/federal/leis-ordinarias/1990/lei-8078-1990-09-11.md",
    );
  });

  it("usa o arquivo da Constituição Federal", () => {
    expect(
      getLegislationRepositoryUrl({
        slug: "constituicao-federal",
        short_name: "CF",
        official_name: "Constituição Federal",
        norm_type: "Constituição",
        number: null,
        year: 1988,
        signed_on: null,
        official_url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
      }),
    ).toBe("https://raw.githubusercontent.com/ctresb/leis/main/constituicao.md");
  });

  it("usa o prefixo do acervo para leis complementares", () => {
    expect(
      getLegislationRepositoryUrl({
        slug: "lrf",
        short_name: "LRF",
        official_name: "Lei de Responsabilidade Fiscal",
        norm_type: "Lei Complementar",
        number: "101",
        year: 2000,
        signed_on: "2000-05-04",
        official_url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm",
      }),
    ).toBe(
      "https://raw.githubusercontent.com/ctresb/leis/main/federal/leis-complementares/2000/lcp-101-2000-05-04.md",
    );
  });

  it("não cria caminho quando faltam dados ou o tipo não é compatível", () => {
    expect(
      getLegislationRepositoryUrl({
        slug: "codigo-de-defesa-do-consumidor",
        short_name: "CDC",
        official_name: "Código de Defesa do Consumidor",
        norm_type: "Lei Ordinária",
        number: "8.078",
        year: 1990,
        signed_on: null,
        official_url: "https://www.planalto.gov.br/ccivil_03/leis/l8078.htm",
      }),
    ).toBeNull();
  });

  it("não associa normas sem fonte federal", () => {
    expect(
      getLegislationRepositoryUrl({
        slug: "lei-estadual",
        short_name: "Lei estadual 8.078",
        official_name: "Lei estadual",
        norm_type: "Lei Ordinária",
        number: "8.078",
        year: 1990,
        signed_on: "1990-09-11",
        official_url: "https://www.al.sp.gov.br/repositorio/legislacao/lei/1990/lei-8078",
      }),
    ).toBeNull();
  });

  it("separa os artigos e mantém parágrafos no texto correspondente", () => {
    expect(
      parseLegislationArticles(
        [
          "# Lei",
          "**Art. 1º** Primeiro artigo.",
          "",
          "**Parágrafo único.** Complemento.",
          "**Art. 2º-A** Segundo artigo.",
          "Texto complementar.",
        ].join("\n"),
      ),
    ).toEqual([
      { number: "1", text: "Primeiro artigo.\n\n**Parágrafo único.** Complemento." },
      { number: "2-A", text: "Segundo artigo.\nTexto complementar." },
    ]);
  });

  it("distingue os artigos repetidos do Ato das Disposições Constitucionais Transitórias", () => {
    expect(
      parseLegislationArticles(
        [
          "# Constituição",
          "## PREÂMBULO",
          "Preâmbulo da Constituição.",
          "## TÍTULO I — Dos Princípios Fundamentais",
          "**Art. 1º** Artigo principal.",
          "# ATO DAS DISPOSIÇÕES CONSTITUCIONAIS TRANSITÓRIAS",
          "**Art. 1º** Artigo do ADCT.",
        ].join("\n"),
      ),
    ).toEqual([
      { number: "Preâmbulo", text: "Preâmbulo da Constituição." },
      { number: "1", text: "TÍTULO I — Dos Princípios Fundamentais\nArtigo principal." },
      {
        number: "1 (ADCT)",
        text: "ATO DAS DISPOSIÇÕES CONSTITUCIONAIS TRANSITÓRIAS\nArtigo do ADCT.",
      },
    ]);
  });
});
