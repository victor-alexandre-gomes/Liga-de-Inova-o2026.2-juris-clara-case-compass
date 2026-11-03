import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: `Termos de uso — ${BRAND.name}` },
      { name: "description", content: `Condições de uso da plataforma ${BRAND.name}.` },
      { property: "og:title", content: `Termos de uso — ${BRAND.name}` },
      { property: "og:description", content: `Condições de uso da plataforma ${BRAND.name}.` },
    ],
  }),
  component: () => (
    <LegalPage title="Termos de uso">
      <h2>Natureza do serviço</h2>
      <p>
        O {BRAND.name} fornece informação jurídica geral e ferramentas de organização. Não presta
        consultoria jurídica e não substitui advogado ou Defensoria Pública.
      </p>
      <h2>Estimativas e cálculos</h2>
      <p>
        Resultados de calculadoras são estimativas baseadas nos dados informados e não representam
        valores reconhecidos judicialmente.
      </p>
      <h2>Conteúdo jurídico</h2>
      <p>
        Textos legais são exibidos somente após importação de fonte oficial. Sempre confira a fonte
        indicada.
      </p>
      <h2>Responsabilidades do usuário</h2>
      <p>
        Você é responsável pela veracidade das informações e documentos que cadastra. Nenhuma
        petição é enviada automaticamente a tribunais.
      </p>
    </LegalPage>
  ),
});
