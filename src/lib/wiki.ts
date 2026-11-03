export const CATEGORIES = [
  "Direito do Consumidor",
  "Juizados Especiais",
  "Contratos",
  "Cobranças e dívidas",
  "Danos materiais",
  "Acesso à Justiça",
  "Processo Civil",
] as const;

export const SOURCE_TYPES: Record<string, string> = {
  legislacao: "Legislação",
  jurisprudencia: "Jurisprudência",
  sumula: "Súmulas e precedentes",
  guia: "Guia prático",
};

export const VIGENCY_LABEL: Record<string, string> = {
  nao_verificada: "Vigência não verificada",
  vigente: "Vigente (verificada)",
  revogada: "Revogada",
};

export const TEXT_STATUS_LABEL: Record<string, string> = {
  pendente_importacao: "Texto pendente de importação",
  importado: "Texto importado",
  verificado: "Texto verificado",
};

/** Normalizes article queries like "art. 5", "artigo 5º", "5" -> "5". */
export function parseArticleQuery(q: string): string | null {
  const m = q
    .trim()
    .toLowerCase()
    .match(/^(?:art(?:igo)?\.?\s*)?(\d+[a-z-]*)\s*[ºo°]?$/);
  return m?.[1] ?? null;
}

export function articleReference(shortName: string, officialName: string, articleNumber: string) {
  const reference = articleNumber === "Preâmbulo" ? "preâmbulo" : `art. ${articleNumber}`;
  return `${shortName} (${officialName}), ${reference}`;
}
