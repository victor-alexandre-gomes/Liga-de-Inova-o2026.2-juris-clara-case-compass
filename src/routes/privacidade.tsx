import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: `Política de privacidade — ${BRAND.name}` },
      { name: "description", content: "Como tratamos seus dados pessoais conforme a LGPD." },
      { property: "og:title", content: `Política de privacidade — ${BRAND.name}` },
      { property: "og:description", content: "Como tratamos seus dados pessoais conforme a LGPD." },
    ],
  }),
  component: () => (
    <LegalPage title="Política de privacidade">
      <h2>Dados coletados</h2>
      <p>
        Coletamos apenas o necessário: nome, e-mail, tipo de conta e as informações que você
        cadastra em seus casos.
      </p>
      <h2>Diretório profissional</h2>
      <p>
        Advogados podem optar por publicar um perfil de busca. Somente após essa escolha ficam
        públicos o nome de exibição, a descrição, as áreas de atuação e a cidade; o e-mail só é
        exibido se informado como contato público. A publicação pode ser desativada pelo próprio
        profissional. As informações são autodeclaradas e não são verificadas pela plataforma.
      </p>
      <h2>Isolamento e segurança</h2>
      <p>
        Seus dados são acessíveis somente por você (e pela sua organização, quando autorizado).
        Documentos ficam em armazenamento privado. Senhas nunca são armazenadas em texto puro.
      </p>
      <h2>Inteligência artificial</h2>
      <p>
        Documentos privados não são enviados a serviços de IA sem seu aviso e consentimento, e não
        são usados para treinamento de modelos.
      </p>
      <h2>Seus direitos (LGPD)</h2>
      <p>
        Você pode acessar, corrigir, exportar e excluir seus dados a qualquer momento em Perfil →
        Privacidade, ou pelo e-mail {BRAND.supportEmail}.
      </p>
      <h2>Retenção</h2>
      <p>
        Ao excluir sua conta, seus dados pessoais e casos são removidos, salvo obrigação legal de
        guarda.
      </p>
    </LegalPage>
  ),
});
