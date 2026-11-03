export const CASE_CATEGORIES = [
  "Direito do Consumidor",
  "Cobranças e dívidas",
  "Contratos",
  "Danos materiais",
  "Outro",
] as const;

export const CASE_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};
