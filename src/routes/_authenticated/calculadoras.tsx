import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, Coins, Plus, Receipt, Scale, Trash2 } from "lucide-react";
import { Notice, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BRAND } from "@/config/brand";
import {
  calculateCaseValue,
  calculateDebtUpdate,
  calculateJudgmentBalance,
  parseBrlToCents,
  parsePercent,
  sumMaterialDamages,
  type ValueClaim,
} from "@/lib/calculators";
import { formatCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/calculadoras")({
  head: () => ({
    meta: [
      { title: `Calculadoras jurídicas — ${BRAND.name}` },
      { name: "description", content: "Estimativas com memória de cálculo e fundamentação." },
      { property: "og:title", content: `Calculadoras jurídicas — ${BRAND.name}` },
      { property: "og:description", content: "Estimativas com memória de cálculo." },
    ],
  }),
  component: CalculadorasPage,
});

const CPC_URL = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm#art292";
const INPUT_CLASS = "h-11 bg-background";
const SELECT_CLASS =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

type CalculationLine = { label: string; cents: number; detail?: string };

function CalculadorasPage() {
  return (
    <div>
      <PageHeader
        title="Calculadoras jurídicas"
        description="Organize valores e confira cada etapa da memória de cálculo."
      />
      <Notice tone="warning" title="Estimativas para conferência">
        Os critérios devem corresponder aos pedidos, documentos e decisões do seu caso. Nenhum
        índice oficial é consultado automaticamente, e estes resultados não substituem a revisão
        profissional.
      </Notice>

      <Tabs defaultValue="causa" className="mt-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          <TabsTrigger value="causa" className="min-h-10 gap-2 px-2">
            <Scale className="h-4 w-4" aria-hidden /> Valor da causa
          </TabsTrigger>
          <TabsTrigger value="divida" className="min-h-10 gap-2 px-2">
            <Coins className="h-4 w-4" aria-hidden /> Atualizar dívida
          </TabsTrigger>
          <TabsTrigger value="danos" className="min-h-10 gap-2 px-2">
            <Receipt className="h-4 w-4" aria-hidden /> Danos materiais
          </TabsTrigger>
          <TabsTrigger value="sentenca" className="min-h-10 gap-2 px-2">
            <Calculator className="h-4 w-4" aria-hidden /> Sentença
          </TabsTrigger>
        </TabsList>

        <TabsContent value="causa">
          <CaseValueCalculator />
        </TabsContent>
        <TabsContent value="divida">
          <DebtCalculator />
        </TabsContent>
        <TabsContent value="danos">
          <MaterialDamagesCalculator />
        </TabsContent>
        <TabsContent value="sentenca">
          <JudgmentCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CaseValueCalculator() {
  const [claims, setClaims] = useState([{ description: "", amount: "", kind: "amount" as const }]);
  const [result, setResult] = useState<{ total: number; lines: CalculationLine[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateClaim(index: number, field: "description" | "amount" | "kind", value: string) {
    setClaims((current) =>
      current.map((claim, itemIndex) =>
        itemIndex === index
          ? {
              ...claim,
              [field]: value,
            }
          : claim,
      ),
    );
    setResult(null);
    setError(null);
  }

  function calculate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const parsedClaims: ValueClaim[] = claims.map((claim, index) => {
        const amountCents = parseBrlToCents(claim.amount);
        if (!claim.description.trim()) throw new RangeError(`Descreva o pedido ${index + 1}.`);
        if (amountCents === null || amountCents <= 0)
          throw new RangeError(`Informe um valor válido para o pedido ${index + 1}.`);
        return {
          description: claim.description.trim(),
          amountCents,
          kind: claim.kind,
        };
      });
      const total = calculateCaseValue(parsedClaims);
      setResult({
        total,
        lines: parsedClaims.map((claim) => ({
          label: claim.description,
          cents: claim.amountCents * (claim.kind === "monthly" ? 12 : 1),
          detail:
            claim.kind === "monthly"
              ? `${formatCents(claim.amountCents)} por mês × 12 prestações`
              : "Valor informado para o pedido",
        })),
      });
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <CalculatorSection
      title="Estimativa do valor da causa"
      description="Informe cada pedido separadamente. As prestações mensais são anualizadas em doze parcelas."
    >
      <form onSubmit={calculate} className="space-y-4">
        {claims.map((claim, index) => (
          <fieldset key={index} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
            <legend className="px-1 text-sm font-semibold">Pedido {index + 1}</legend>
            <Field
              id={`claim-description-${index}`}
              label="Descrição"
              value={claim.description}
              onChange={(value) => updateClaim(index, "description", value)}
              placeholder="Ex.: restituição, indenização"
            />
            <div className="space-y-1.5">
              <Label htmlFor={`claim-kind-${index}`}>Critério informado</Label>
              <select
                id={`claim-kind-${index}`}
                className={SELECT_CLASS}
                value={claim.kind}
                onChange={(e) => updateClaim(index, "kind", e.target.value)}
              >
                <option value="amount">Valor total do pedido</option>
                <option value="monthly">Prestação mensal × 12</option>
              </select>
            </div>
            <MoneyField
              id={`claim-amount-${index}`}
              label={claim.kind === "monthly" ? "Valor mensal" : "Valor do pedido"}
              value={claim.amount}
              onChange={(value) => updateClaim(index, "amount", value)}
            />
            {claims.length > 1 && (
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setClaims((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    setResult(null);
                  }}
                  aria-label={`Remover pedido ${index + 1}`}
                >
                  <Trash2 aria-hidden /> Remover pedido
                </Button>
              </div>
            )}
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setClaims((current) => [...current, { description: "", amount: "", kind: "amount" }]);
              setResult(null);
            }}
          >
            <Plus aria-hidden /> Adicionar pedido
          </Button>
          <Button type="submit">Calcular valor estimado</Button>
        </div>
      </form>
      {error && <FormError>{error}</FormError>}
      {result && (
        <ResultPanel
          title="Valor estimado da causa"
          totalLabel="Soma dos pedidos"
          totalCents={result.total}
          lines={result.lines}
          source={
            <>
              Referência: art. 292, incisos III e VI, do{" "}
              <a className="underline" href={CPC_URL} target="_blank" rel="noreferrer noopener">
                Código de Processo Civil
              </a>
              . A classificação dos pedidos e outros critérios legais dependem do caso concreto;
              confira com um profissional.
            </>
          }
        />
      )}
    </CalculatorSection>
  );
}

type DebtFields = {
  principal: string;
  correction: string;
  monthlyInterest: string;
  months: string;
  interestMode: "simple" | "compound";
};

const EMPTY_DEBT_FIELDS: DebtFields = {
  principal: "",
  correction: "",
  monthlyInterest: "",
  months: "",
  interestMode: "simple",
};

function DebtCalculator() {
  const [fields, setFields] = useState(EMPTY_DEBT_FIELDS);
  const [result, setResult] = useState<ReturnType<typeof calculateDebtUpdate> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof DebtFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setResult(null);
    setError(null);
  }

  function calculate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const debt = calculateDebtUpdate({
        principalCents: requiredMoney(fields.principal, "o valor original", true),
        correctionPercent: requiredPercent(fields.correction, "o índice acumulado"),
        monthlyInterestPercent: requiredPercent(fields.monthlyInterest, "os juros mensais"),
        months: requiredMonths(fields.months),
        interestMode: fields.interestMode,
      });
      setResult(debt);
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <CalculatorSection
      title="Atualização estimada de dívida"
      description="Informe os parâmetros já definidos para seu caso. O índice de correção é acumulado e digitado manualmente."
    >
      <form onSubmit={calculate} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            id="debt-principal"
            label="Valor original"
            value={fields.principal}
            onChange={(value) => update("principal", value)}
          />
          <Field
            id="debt-correction"
            label="Correção monetária acumulada (%)"
            value={fields.correction}
            onChange={(value) => update("correction", value)}
            inputMode="decimal"
            placeholder="Ex.: 12,5 (ou 0)"
          />
          <Field
            id="debt-interest"
            label="Juros ao mês (%)"
            value={fields.monthlyInterest}
            onChange={(value) => update("monthlyInterest", value)}
            inputMode="decimal"
            placeholder="Ex.: 1 (ou 0)"
          />
          <Field
            id="debt-months"
            label="Período (meses)"
            value={fields.months}
            onChange={(value) => update("months", value)}
            inputMode="numeric"
            placeholder="Ex.: 6"
          />
          <div className="space-y-1.5">
            <Label htmlFor="debt-interest-mode">Método dos juros</Label>
            <select
              id="debt-interest-mode"
              className={SELECT_CLASS}
              value={fields.interestMode}
              onChange={(e) => update("interestMode", e.target.value)}
            >
              <option value="simple">Simples</option>
              <option value="compound">Compostos</option>
            </select>
          </div>
        </div>
        <Button type="submit">Atualizar dívida</Button>
      </form>
      {error && <FormError>{error}</FormError>}
      {result && (
        <ResultPanel
          title="Memória da atualização"
          totalLabel="Total estimado"
          totalCents={result.totalCents}
          lines={[
            { label: "Principal original", cents: result.principalCents },
            { label: "Correção acumulada", cents: result.correctionCents },
            { label: "Principal corrigido", cents: result.correctedPrincipalCents },
            {
              label: `Juros ${fields.interestMode === "simple" ? "simples" : "compostos"}`,
              cents: result.interestCents,
              detail: `${fields.monthlyInterest}% ao mês por ${fields.months} meses`,
            },
          ]}
          source="Cálculo demonstrativo: principal × (1 + índice acumulado); em seguida, juros mensais conforme o método escolhido. Índices oficiais, pagamentos, períodos fracionários e regras específicas não são consultados ou aplicados automaticamente."
        />
      )}
    </CalculatorSection>
  );
}

type DamageItem = {
  description: string;
  date: string;
  amount: string;
  proof: string;
};

function MaterialDamagesCalculator() {
  const [items, setItems] = useState<DamageItem[]>([
    { description: "", date: "", amount: "", proof: "" },
  ]);
  const [result, setResult] = useState<{ total: number; lines: CalculationLine[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, field: keyof DamageItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
    setResult(null);
    setError(null);
  }

  function calculate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const lines = items.map((item, index) => {
        const cents = parseBrlToCents(item.amount);
        if (!item.description.trim()) throw new RangeError(`Descreva o prejuízo ${index + 1}.`);
        if (!item.date) throw new RangeError(`Informe a data do prejuízo ${index + 1}.`);
        if (cents === null || cents <= 0)
          throw new RangeError(`Informe um valor válido para o prejuízo ${index + 1}.`);
        return {
          label: item.description.trim(),
          cents,
          detail: `${item.date.split("-").reverse().join("/")} · comprovante: ${item.proof.trim() || "não informado"}`,
        };
      });
      setResult({
        total: sumMaterialDamages(lines.map((line) => line.cents)),
        lines,
      });
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <CalculatorSection
      title="Demonstrativo de danos materiais"
      description="Organize os prejuízos por data, descrição e referência do comprovante."
    >
      <form onSubmit={calculate} className="space-y-4">
        {items.map((item, index) => (
          <fieldset key={index} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
            <legend className="px-1 text-sm font-semibold">Prejuízo {index + 1}</legend>
            <Field
              id={`damage-description-${index}`}
              label="Descrição"
              value={item.description}
              onChange={(value) => updateItem(index, "description", value)}
              placeholder="Ex.: reparo, transporte, produto"
            />
            <div className="space-y-1.5">
              <Label htmlFor={`damage-date-${index}`}>Data</Label>
              <Input
                id={`damage-date-${index}`}
                type="date"
                value={item.date}
                onChange={(e) => updateItem(index, "date", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <MoneyField
              id={`damage-amount-${index}`}
              label="Valor do prejuízo"
              value={item.amount}
              onChange={(value) => updateItem(index, "amount", value)}
            />
            <Field
              id={`damage-proof-${index}`}
              label="Comprovante (referência opcional)"
              value={item.proof}
              onChange={(value) => updateItem(index, "proof", value)}
              placeholder="Ex.: nota fiscal, recibo"
            />
            {items.length > 1 && (
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    setResult(null);
                  }}
                  aria-label={`Remover prejuízo ${index + 1}`}
                >
                  <Trash2 aria-hidden /> Remover prejuízo
                </Button>
              </div>
            )}
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setItems((current) => [
                ...current,
                { description: "", date: "", amount: "", proof: "" },
              ]);
              setResult(null);
            }}
          >
            <Plus aria-hidden /> Adicionar prejuízo
          </Button>
          <Button type="submit">Somar prejuízos</Button>
        </div>
      </form>
      {error && <FormError>{error}</FormError>}
      {result && (
        <ResultPanel
          title="Demonstrativo de prejuízos informados"
          totalLabel="Total informado"
          totalCents={result.total}
          lines={result.lines}
          source="Este demonstrativo apenas organiza e soma os valores digitados. Ele não valida documentos, nexo causal ou reconhecimento judicial dos prejuízos."
        />
      )}
    </CalculatorSection>
  );
}

type JudgmentFields = DebtFields & {
  penalty: string;
  costs: string;
  payments: string;
};

const EMPTY_JUDGMENT_FIELDS: JudgmentFields = {
  ...EMPTY_DEBT_FIELDS,
  penalty: "",
  costs: "",
  payments: "",
};

function JudgmentCalculator() {
  const [fields, setFields] = useState(EMPTY_JUDGMENT_FIELDS);
  const [result, setResult] = useState<ReturnType<typeof calculateJudgmentBalance> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof JudgmentFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setResult(null);
    setError(null);
  }

  function calculate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const judgment = calculateJudgmentBalance({
        principalCents: requiredMoney(fields.principal, "o valor do título", true),
        correctionPercent: requiredPercent(fields.correction, "a correção acumulada"),
        monthlyInterestPercent: requiredPercent(fields.monthlyInterest, "os juros mensais"),
        months: requiredMonths(fields.months),
        interestMode: fields.interestMode,
        penaltyPercent: requiredPercent(fields.penalty, "a multa"),
        costsCents: requiredMoney(fields.costs, "as despesas", false),
        paymentsCents: requiredMoney(fields.payments, "os pagamentos já realizados", false),
      });
      setResult(judgment);
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <CalculatorSection
      title="Memória de cumprimento de sentença"
      description="Transcreva os critérios e os valores do título judicial; a calculadora não escolhe índices nem cláusulas por conta própria."
    >
      <form onSubmit={calculate} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            id="judgment-principal"
            label="Principal definido no título"
            value={fields.principal}
            onChange={(value) => update("principal", value)}
          />
          <Field
            id="judgment-correction"
            label="Correção acumulada prevista (%)"
            value={fields.correction}
            onChange={(value) => update("correction", value)}
            inputMode="decimal"
            placeholder="Informe 0 se não houver"
          />
          <Field
            id="judgment-interest"
            label="Juros ao mês previstos (%)"
            value={fields.monthlyInterest}
            onChange={(value) => update("monthlyInterest", value)}
            inputMode="decimal"
            placeholder="Informe 0 se não houver"
          />
          <Field
            id="judgment-months"
            label="Período (meses)"
            value={fields.months}
            onChange={(value) => update("months", value)}
            inputMode="numeric"
            placeholder="Ex.: 6"
          />
          <div className="space-y-1.5">
            <Label htmlFor="judgment-interest-mode">Método dos juros definido</Label>
            <select
              id="judgment-interest-mode"
              className={SELECT_CLASS}
              value={fields.interestMode}
              onChange={(e) => update("interestMode", e.target.value)}
            >
              <option value="simple">Simples</option>
              <option value="compound">Compostos</option>
            </select>
          </div>
          <Field
            id="judgment-penalty"
            label="Multa prevista (%)"
            value={fields.penalty}
            onChange={(value) => update("penalty", value)}
            inputMode="decimal"
            placeholder="Informe 0 se não houver"
          />
          <MoneyField
            id="judgment-costs"
            label="Despesas e outros valores do título"
            value={fields.costs}
            onChange={(value) => update("costs", value)}
          />
          <MoneyField
            id="judgment-payments"
            label="Pagamentos já realizados"
            value={fields.payments}
            onChange={(value) => update("payments", value)}
          />
        </div>
        <Button type="submit">Calcular saldo estimado</Button>
      </form>
      {error && <FormError>{error}</FormError>}
      {result && (
        <ResultPanel
          title="Memória do saldo"
          totalLabel={result.creditCents > 0 ? "Crédito após os pagamentos" : "Saldo estimado"}
          totalCents={result.creditCents > 0 ? result.creditCents : result.balanceCents}
          lines={[
            { label: "Principal informado", cents: result.principalCents },
            { label: "Correção monetária", cents: result.correctionCents },
            { label: "Principal corrigido", cents: result.correctedPrincipalCents },
            { label: "Juros calculados", cents: result.interestCents },
            { label: "Multa informada", cents: result.penaltyCents },
            { label: "Despesas informadas", cents: result.costsCents },
            { label: "Total antes dos pagamentos", cents: result.grossTotalCents },
            { label: "Pagamentos informados", cents: result.paymentsCents },
          ]}
          source={
            result.creditCents > 0
              ? "Os pagamentos informados excedem o total calculado. O resultado mostra a diferença como crédito, sem decidir sua destinação."
              : "Fórmula demonstrativa: principal corrigido + juros + multa + despesas − pagamentos. Confira cada parâmetro no título e nas decisões posteriores; pagamentos e rubricas podem seguir critérios próprios."
          }
        />
      )}
    </CalculatorSection>
  );
}

function CalculatorSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-xl border bg-card p-4 shadow-card sm:p-6">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function MoneyField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field
      id={id}
      label={`${label} (R$)`}
      value={value}
      onChange={onChange}
      placeholder="Ex.: 1.234,56"
      inputMode="decimal"
    />
  );
}

function ResultPanel({
  title,
  totalLabel,
  totalCents,
  lines,
  source,
}: {
  title: string;
  totalLabel: string;
  totalCents: number;
  lines: CalculationLine[];
  source: React.ReactNode;
}) {
  return (
    <section
      className="mt-6 rounded-xl border border-highlight/30 bg-accent/40 p-4"
      aria-live="polite"
    >
      <h3 className="font-semibold text-primary">{title}</h3>
      <dl className="mt-3 space-y-2">
        {lines.map((line, index) => (
          <div
            key={`${line.label}-${index}`}
            className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-border/70 pb-2 text-sm last:border-0"
          >
            <div>
              <dt className="font-medium">{line.label}</dt>
              {line.detail && <dd className="text-xs text-muted-foreground">{line.detail}</dd>}
            </div>
            <dd className="font-medium tabular-nums">{formatCents(line.cents)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="font-semibold">{totalLabel}</span>
        <output className="text-xl font-bold tabular-nums text-primary">
          {formatCents(totalCents)}
        </output>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{source}</p>
    </section>
  );
}

function FormError({ children }: { children: string }) {
  return (
    <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
      {children}
    </p>
  );
}

function requiredMoney(value: string, label: string, mustBePositive: boolean) {
  const cents = parseBrlToCents(value);
  if (cents === null || (mustBePositive && cents <= 0)) {
    throw new RangeError(`Informe ${label} em reais, por exemplo 1.234,56.`);
  }
  return cents;
}

function requiredPercent(value: string, label: string) {
  const percent = parsePercent(value);
  if (percent === null) {
    throw new RangeError(`Informe ${label} em percentual (use 0 se não se aplicar).`);
  }
  return percent;
}

function requiredMonths(value: string) {
  if (!/^\d+$/.test(value.trim())) {
    throw new RangeError("Informe o período em meses inteiros.");
  }
  const months = Number(value);
  if (months > 1_200) throw new RangeError("O período máximo é de 1.200 meses.");
  return months;
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível calcular com os valores informados.";
}
