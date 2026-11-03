export type LawyerDirectoryEntry = {
  user_id: string;
  display_name: string;
  description: string;
  practice_areas: string[];
  city: string;
  contact_email: string;
  updated_at: string;
};

export type LawyerSearchable = Pick<
  LawyerDirectoryEntry,
  "display_name" | "description" | "practice_areas" | "city"
>;

export const DEMO_LAWYERS = [
  {
    user_id: "demo-consumidor",
    display_name: "Dra. Lara Exemplo",
    description:
      "Perfil fictício para demonstrar informações sobre relações de consumo, produtos e serviços.",
    practice_areas: ["Direito do Consumidor"],
    city: "Cidade de demonstração",
    contact_email: "",
    updated_at: "",
    is_demo: true,
    photoVariant: "consumer",
  },
  {
    user_id: "demo-juizados",
    display_name: "Dr. Bruno Demonstração",
    description: "Perfil fictício para demonstrar orientações gerais sobre os Juizados Especiais.",
    practice_areas: ["Juizados Especiais"],
    city: "Cidade de demonstração",
    contact_email: "",
    updated_at: "",
    is_demo: true,
    photoVariant: "small-claims",
  },
  {
    user_id: "demo-contratos",
    display_name: "Dra. Camila Teste",
    description: "Perfil fictício para demonstrar temas de contratos, obrigações e relações civis.",
    practice_areas: ["Contratos"],
    city: "Cidade de demonstração",
    contact_email: "",
    updated_at: "",
    is_demo: true,
    photoVariant: "contracts",
  },
  {
    user_id: "demo-cobrancas-dividas",
    display_name: "Dr. Diego Fictício",
    description:
      "Perfil fictício para demonstrar organização de informações sobre cobranças e dívidas.",
    practice_areas: ["Cobranças e dívidas"],
    city: "Cidade de demonstração",
    contact_email: "",
    updated_at: "",
    is_demo: true,
    photoVariant: "debts",
  },
  {
    user_id: "demo-danos-materiais",
    display_name: "Dra. Elisa Modelo",
    description: "Perfil fictício para demonstrar o registro de danos e prejuízos materiais.",
    practice_areas: ["Danos materiais"],
    city: "Cidade de demonstração",
    contact_email: "",
    updated_at: "",
    is_demo: true,
    photoVariant: "damages",
  },
  {
    user_id: "demo-acesso-justica",
    display_name: "Dr. Felipe Ilustração",
    description: "Perfil fictício para demonstrar conteúdos informativos sobre acesso à Justiça.",
    practice_areas: ["Acesso à Justiça"],
    city: "Cidade de demonstração",
    contact_email: "",
    updated_at: "",
    is_demo: true,
    photoVariant: "justice",
  },
  {
    user_id: "demo-processo-civil",
    display_name: "Dra. Gabriela Exemplo",
    description:
      "Perfil fictício para demonstrar temas gerais de processo civil e etapas processuais.",
    practice_areas: ["Processo Civil"],
    city: "Cidade de demonstração",
    contact_email: "",
    updated_at: "",
    is_demo: true,
    photoVariant: "civil-procedure",
  },
] as const satisfies readonly (LawyerDirectoryEntry & {
  is_demo: true;
  photoVariant: string;
})[];

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function filterLawyers<T extends LawyerSearchable>(lawyers: T[], query: string): T[] {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return lawyers;

  const terms = normalizedQuery.split(/\s+/);
  return lawyers.filter((lawyer) => {
    const searchable = normalizeSearch(
      [lawyer.display_name, lawyer.description, lawyer.city, ...lawyer.practice_areas].join(" "),
    );
    return terms.every((term) => searchable.includes(term));
  });
}

export function parsePracticeAreas(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean),
    ),
  ];
}
