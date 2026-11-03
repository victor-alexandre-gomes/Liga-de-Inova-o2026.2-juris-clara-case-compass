export type ValueClaim = {
  description: string;
  amountCents: number;
  kind: "amount" | "monthly";
};

export type DebtUpdateInput = {
  principalCents: number;
  correctionPercent: number;
  monthlyInterestPercent: number;
  months: number;
  interestMode: "simple" | "compound";
};

export type DebtUpdateResult = {
  principalCents: number;
  correctionCents: number;
  correctedPrincipalCents: number;
  interestCents: number;
  totalCents: number;
};

export type JudgmentInput = DebtUpdateInput & {
  penaltyPercent: number;
  costsCents: number;
  paymentsCents: number;
};

export type JudgmentResult = DebtUpdateResult & {
  penaltyCents: number;
  costsCents: number;
  grossTotalCents: number;
  paymentsCents: number;
  balanceCents: number;
  creditCents: number;
};

function assertCents(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} deve ser um valor não negativo em centavos.`);
  }
}

function assertPercent(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 10_000) {
    throw new RangeError(`${label} deve estar entre 0 e 10.000%.`);
  }
}

function assertMonths(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 1_200) {
    throw new RangeError("O período deve estar entre 0 e 1.200 meses.");
  }
}

function safeCents(value: number, label: string) {
  const rounded = Math.round(value);
  assertCents(rounded, label);
  return rounded;
}

export function parseBrlToCents(value: string): number | null {
  const normalized = value.trim().replace(/^R\$\s*/i, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(",");
  const cents = Number(whole.replace(/\./g, "")) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function parsePercent(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,4})?$/.test(normalized)) return null;
  const percent = Number(normalized);
  return Number.isFinite(percent) && percent <= 10_000 ? percent : null;
}

export function calculateCaseValue(claims: ValueClaim[]): number {
  if (claims.length === 0) throw new RangeError("Adicione pelo menos um pedido.");

  return claims.reduce((total, claim) => {
    assertCents(claim.amountCents, "O valor do pedido");
    if (!claim.description.trim()) throw new RangeError("Informe a descrição de cada pedido.");

    const amount = safeCents(
      claim.amountCents * (claim.kind === "monthly" ? 12 : 1),
      "O valor anualizado do pedido",
    );
    return safeCents(total + amount, "A soma dos pedidos");
  }, 0);
}

export function calculateDebtUpdate(input: DebtUpdateInput): DebtUpdateResult {
  assertCents(input.principalCents, "O principal");
  assertPercent(input.correctionPercent, "A correção acumulada");
  assertPercent(input.monthlyInterestPercent, "Os juros mensais");
  assertMonths(input.months);

  const correctedPrincipalCents = safeCents(
    input.principalCents * (1 + input.correctionPercent / 100),
    "O principal corrigido",
  );
  const correctionCents = correctedPrincipalCents - input.principalCents;
  const monthlyRate = input.monthlyInterestPercent / 100;
  const interestFactor =
    input.interestMode === "compound"
      ? (1 + monthlyRate) ** input.months - 1
      : monthlyRate * input.months;
  const interestCents = safeCents(correctedPrincipalCents * interestFactor, "Os juros calculados");
  const totalCents = safeCents(correctedPrincipalCents + interestCents, "O total atualizado");

  return {
    principalCents: input.principalCents,
    correctionCents,
    correctedPrincipalCents,
    interestCents,
    totalCents,
  };
}

export function calculateJudgmentBalance(input: JudgmentInput): JudgmentResult {
  assertCents(input.costsCents, "As despesas");
  assertCents(input.paymentsCents, "Os pagamentos");
  assertPercent(input.penaltyPercent, "A multa");

  const update = calculateDebtUpdate(input);
  const penaltyCents = safeCents(
    update.correctedPrincipalCents * (input.penaltyPercent / 100),
    "A multa calculada",
  );
  const grossTotalCents = safeCents(
    update.totalCents + penaltyCents + input.costsCents,
    "O total bruto",
  );
  const balanceCents = Math.max(0, grossTotalCents - input.paymentsCents);
  const creditCents = Math.max(0, input.paymentsCents - grossTotalCents);

  return {
    ...update,
    penaltyCents,
    costsCents: input.costsCents,
    grossTotalCents,
    paymentsCents: input.paymentsCents,
    balanceCents,
    creditCents,
  };
}

export function sumMaterialDamages(amountsCents: number[]): number {
  if (amountsCents.length === 0) throw new RangeError("Adicione pelo menos um prejuízo.");

  return amountsCents.reduce((total, amount) => {
    assertCents(amount, "O valor do prejuízo");
    return safeCents(total + amount, "A soma dos prejuízos");
  }, 0);
}
