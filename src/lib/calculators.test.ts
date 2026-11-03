import { describe, expect, it } from "vitest";
import {
  calculateCaseValue,
  calculateDebtUpdate,
  calculateJudgmentBalance,
  parseBrlToCents,
  parsePercent,
  sumMaterialDamages,
} from "./calculators";

describe("entrada de valores das calculadoras", () => {
  it("interpreta valores em reais como centavos inteiros", () => {
    expect(parseBrlToCents("1.234,56")).toBe(123456);
    expect(parseBrlToCents("0,5")).toBe(50);
    expect(parseBrlToCents("R$ 10,00")).toBe(1000);
    expect(parseBrlToCents("1,234.56")).toBeNull();
    expect(parseBrlToCents("")).toBeNull();
  });

  it("interpreta percentuais brasileiros e rejeita entradas inválidas", () => {
    expect(parsePercent("1,25")).toBe(1.25);
    expect(parsePercent("1.25")).toBe(1.25);
    expect(parsePercent("-1")).toBeNull();
    expect(parsePercent("10001")).toBeNull();
  });
});

describe("calculadora de valor da causa", () => {
  it("soma pedidos e anualiza prestações mensais em doze parcelas", () => {
    expect(
      calculateCaseValue([
        { description: "Danos materiais", amountCents: 50000, kind: "amount" },
        { description: "Prestação mensal", amountCents: 10000, kind: "monthly" },
      ]),
    ).toBe(170000);
  });

  it("rejeita lista vazia e valores fora do intervalo seguro", () => {
    expect(() => calculateCaseValue([])).toThrow();
    expect(() =>
      calculateCaseValue([{ description: "Pedido", amountCents: -1, kind: "amount" }]),
    ).toThrow();
  });
});

describe("calculadora de atualização de dívida", () => {
  it("aplica correção acumulada e juros simples mensais com memória de cálculo", () => {
    expect(
      calculateDebtUpdate({
        principalCents: 100000,
        correctionPercent: 10,
        monthlyInterestPercent: 1,
        months: 2,
        interestMode: "simple",
      }),
    ).toEqual({
      principalCents: 100000,
      correctionCents: 10000,
      correctedPrincipalCents: 110000,
      interestCents: 2200,
      totalCents: 112200,
    });
  });

  it("permite juros compostos quando informados como critério aplicável", () => {
    expect(
      calculateDebtUpdate({
        principalCents: 100000,
        correctionPercent: 0,
        monthlyInterestPercent: 10,
        months: 2,
        interestMode: "compound",
      }).interestCents,
    ).toBe(21000);
  });

  it("rejeita períodos e valores que excedam os limites suportados", () => {
    expect(() =>
      calculateDebtUpdate({
        principalCents: Number.MAX_SAFE_INTEGER,
        correctionPercent: 100,
        monthlyInterestPercent: 1,
        months: 2,
        interestMode: "simple",
      }),
    ).toThrow();
  });
});

describe("calculadora de danos materiais", () => {
  it("soma os prejuízos informados", () => {
    expect(sumMaterialDamages([12345, 7655])).toBe(20000);
  });
});

describe("calculadora de cumprimento de sentença", () => {
  it("aplica parâmetros informados, despesas, multa e pagamentos", () => {
    expect(
      calculateJudgmentBalance({
        principalCents: 100000,
        correctionPercent: 10,
        monthlyInterestPercent: 1,
        months: 2,
        interestMode: "simple",
        penaltyPercent: 10,
        costsCents: 5000,
        paymentsCents: 20000,
      }),
    ).toMatchObject({
      correctedPrincipalCents: 110000,
      interestCents: 2200,
      penaltyCents: 11000,
      costsCents: 5000,
      grossTotalCents: 128200,
      balanceCents: 108200,
      creditCents: 0,
    });
  });

  it("mostra crédito quando pagamentos excedem o total calculado", () => {
    expect(
      calculateJudgmentBalance({
        principalCents: 10000,
        correctionPercent: 0,
        monthlyInterestPercent: 0,
        months: 0,
        interestMode: "simple",
        penaltyPercent: 0,
        costsCents: 0,
        paymentsCents: 12000,
      }),
    ).toMatchObject({ balanceCents: 0, creditCents: 2000 });
  });
});
