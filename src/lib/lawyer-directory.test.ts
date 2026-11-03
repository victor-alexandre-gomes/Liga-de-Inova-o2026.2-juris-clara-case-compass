import { describe, expect, it } from "vitest";
import { DEMO_LAWYERS, filterLawyers, parsePracticeAreas } from "./lawyer-directory";

describe("diretório de advogados", () => {
  it("fornece um advogado fictício ilustrativo por área sem contato real", () => {
    expect(DEMO_LAWYERS).toHaveLength(7);
    expect(DEMO_LAWYERS.every((lawyer) => lawyer.is_demo)).toBe(true);
    expect(DEMO_LAWYERS.every((lawyer) => lawyer.description.includes("fictício"))).toBe(true);
    expect(DEMO_LAWYERS.every((lawyer) => lawyer.contact_email === "")).toBe(true);
    expect(new Set(DEMO_LAWYERS.map((lawyer) => lawyer.photoVariant)).size).toBe(7);
    expect(DEMO_LAWYERS.map((lawyer) => lawyer.practice_areas[0])).toEqual([
      "Direito do Consumidor",
      "Juizados Especiais",
      "Contratos",
      "Cobranças e dívidas",
      "Danos materiais",
      "Acesso à Justiça",
      "Processo Civil",
    ]);
  });

  it("filtra por área ou cidade sem diferenciar acentos ou caixa", () => {
    const lawyers = [
      {
        display_name: "Ana Exemplo",
        description: "Atuação profissional",
        practice_areas: ["Direito do Consumidor"],
        city: "São Paulo",
      },
      {
        display_name: "Bia Exemplo",
        description: "Atuação profissional",
        practice_areas: ["Contratos"],
        city: "Curitiba",
      },
    ];

    expect(filterLawyers(lawyers, "sao paulo")).toEqual([lawyers[0]]);
    expect(filterLawyers(lawyers, "CONSUMIDOR")).toEqual([lawyers[0]]);
    expect(filterLawyers(lawyers, "")).toEqual(lawyers);
  });

  it("normaliza áreas, remove duplicadas e permite validar o limite de oito", () => {
    expect(parsePracticeAreas("Consumidor, Contratos, Consumidor")).toEqual([
      "Consumidor",
      "Contratos",
    ]);
    expect(parsePracticeAreas("a,b,c,d,e,f,g,h,i")).toHaveLength(9);
  });
});
