import { describe, expect, it } from "vitest";
import { formatCents, formatDate } from "./format";

describe("formatação pt-BR", () => {
  it("formata datas como DD/MM/AAAA", () => {
    expect(formatDate("1990-09-11")).toBe("11/09/1990");
  });
  it("mostra traço para data vazia ou inválida", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("xx")).toBe("—");
  });
  it("formata centavos como R$", () => {
    expect(formatCents(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
    expect(formatCents(0).replace(/\s/g, " ")).toBe("R$ 0,00");
  });
});
