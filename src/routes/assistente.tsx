import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  LoaderCircle,
  Mail,
  MapPin,
  Search,
  Send,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Notice, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { lawyerDirectorySupabase } from "@/integrations/supabase/lawyer-directory-client";
import { BRAND } from "@/config/brand";
import { askLegalQuestion, type LegalAssistantCitation } from "@/lib/legal-assistant.functions";
import {
  DEMO_LAWYERS,
  filterLawyers,
  parsePracticeAreas,
  type LawyerDirectoryEntry,
} from "@/lib/lawyer-directory";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: `Assistente jurídico — ${BRAND.name}` },
      {
        name: "description",
        content: "Encontre profissionais que publicaram seu perfil ou consulte fontes jurídicas.",
      },
      { property: "og:title", content: `Assistente jurídico — ${BRAND.name}` },
      { property: "og:description", content: "Busca de advogados e informações jurídicas." },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const [activeTab, setActiveTab] = useState("advogados");
  return (
    <AppShell>
      <PageHeader
        title="Assistente jurídico"
        description="Consulte informações jurídicas ou encontre um profissional."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
          <TabsTrigger value="advogados" className="min-h-10 gap-2">
            <UserRoundSearch className="h-4 w-4" aria-hidden /> Encontrar advogado
          </TabsTrigger>
          <TabsTrigger value="profissional" className="min-h-10 gap-2">
            <BriefcaseBusiness className="h-4 w-4" aria-hidden /> Sou advogado
          </TabsTrigger>
          <TabsTrigger value="assistente" className="min-h-10 gap-2">
            <Sparkles className="h-4 w-4" aria-hidden /> Assistente jurídico
          </TabsTrigger>
        </TabsList>
        <TabsContent value="advogados">
          <LawyerSearch />
        </TabsContent>
        <TabsContent value="profissional">
          <LawyerProfileEditor />
        </TabsContent>
        <TabsContent value="assistente">
          <LegalAssistantChat />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function LawyerSearch() {
  const [query, setQuery] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-lawyer-directory"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await lawyerDirectorySupabase
        .from("lawyer_directory_public")
        .select(
          "user_id, display_name, description, practice_areas, city, contact_email, updated_at",
        )
        .order("display_name");
      if (error) throw error;
      return (data ?? []).flatMap((entry) =>
        entry.user_id
          ? [
              {
                user_id: entry.user_id,
                display_name: entry.display_name ?? "",
                description: entry.description ?? "",
                practice_areas: entry.practice_areas ?? [],
                city: entry.city ?? "",
                contact_email: entry.contact_email ?? "",
                updated_at: entry.updated_at ?? "",
              },
            ]
          : [],
      );
    },
  });
  const realLawyers = useMemo(() => filterLawyers(data ?? [], query), [data, query]);
  const demoMatches = filterLawyers([...DEMO_LAWYERS], query);

  return (
    <section className="mt-4 space-y-4 rounded-xl border bg-card p-4 shadow-card sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-primary">Encontre um advogado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pesquise por nome, área de atuação ou cidade. Perfis profissionais aparecem somente se os
          próprios titulares autorizarem a publicação.
        </p>
      </div>
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <Label className="sr-only" htmlFor="lawyer-search">
          Buscar por nome, área ou cidade
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="lawyer-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: consumidor, contratos, São Paulo"
            className="h-12 pl-9 text-base"
          />
        </div>
      </form>

      {isError && (
        <Notice tone="warning" title="Diretório real ainda não disponível">
          A configuração do diretório precisa ser aplicada no banco de dados. Os perfis reais não
          foram carregados; você ainda pode consultar o perfil fictício de demonstração abaixo.
        </Notice>
      )}
      {!isError && isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          Carregando profissionais…
        </p>
      )}
      {!isError && !isLoading && query.trim() && realLawyers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum perfil real publicado corresponde à busca.
        </p>
      )}

      {realLawyers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Perfis profissionais publicados</h3>
          {realLawyers.map((lawyer) => (
            <article
              key={lawyer.user_id}
              className="rounded-xl border bg-background p-4"
              data-testid="real-lawyer-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="font-semibold text-primary">{lawyer.display_name}</h4>
                <StatusBadge tone="neutral">Dados autodeclarados</StatusBadge>
              </div>
              {lawyer.city && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden /> {lawyer.city}
                </p>
              )}
              {lawyer.description && (
                <p className="mt-2 whitespace-pre-line text-sm">{lawyer.description}</p>
              )}
              {lawyer.practice_areas.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Áreas de atuação">
                  {lawyer.practice_areas.map((area) => (
                    <li
                      key={area}
                      className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Perfil informado pelo próprio profissional; a plataforma não verificou formação,
                registro ou disponibilidade.
              </p>
              {isContactEmail(lawyer.contact_email) && (
                <Button asChild size="sm" className="mt-3">
                  <a href={`mailto:${lawyer.contact_email}`}>
                    <Mail aria-hidden /> Contatar por e-mail
                  </a>
                </Button>
              )}
            </article>
          ))}
        </div>
      )}

      {demoMatches.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">Advogados fictícios para demonstração</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Um exemplo por área. Os retratos são ilustrações demonstrativas, não fotos de
              profissionais reais.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {demoMatches.map((lawyer) => (
              <LawyerCard key={lawyer.user_id} lawyer={lawyer} />
            ))}
          </div>
        </div>
      )}
      {realLawyers.length === 0 && demoMatches.length === 0 && !isLoading && !isError && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Nenhum perfil correspondeu. Tente outro nome, área ou cidade.
        </p>
      )}
      <Notice>
        A listagem não representa recomendação ou verificação profissional. Confirme a inscrição
        diretamente nos canais oficiais da OAB antes de contratar.
      </Notice>
    </section>
  );
}

type DemoLawyer = (typeof DEMO_LAWYERS)[number];

function LawyerCard({ lawyer }: { lawyer: DemoLawyer }) {
  return (
    <article
      className="overflow-hidden rounded-xl border border-dashed border-warning-foreground/30 bg-warning/30"
      data-testid="demo-lawyer-card"
    >
      <div className="flex gap-4 p-4">
        <DemoPortrait variant={lawyer.photoVariant} name={lawyer.display_name} />
        <div className="min-w-0 flex-1">
          <StatusBadge tone="pending">FICTÍCIO · NÃO É ADVOGADO REAL</StatusBadge>
          <h4 className="mt-2 font-semibold">{lawyer.display_name}</h4>
          <p className="mt-2 text-sm">{lawyer.description}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden /> {lawyer.city}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Áreas de demonstração">
            {lawyer.practice_areas.map((area) => (
              <li key={area} className="rounded-full bg-background px-3 py-1 text-xs">
                {area}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Sem OAB, contato ou atendimento. Retrato ilustrativo.
          </p>
        </div>
      </div>
    </article>
  );
}

const PORTRAIT_PALETTES = {
  consumer: { background: "#d9e8e2", skin: "#bd7959", hair: "#382b2b", clothes: "#244d56" },
  "small-claims": { background: "#e9dfcf", skin: "#8f5a43", hair: "#20242b", clothes: "#72513d" },
  contracts: { background: "#e5dfe9", skin: "#e0aa83", hair: "#533933", clothes: "#4b536d" },
  debts: { background: "#dce6ec", skin: "#d39973", hair: "#302820", clothes: "#31556b" },
  damages: { background: "#eee0dc", skin: "#9b6047", hair: "#201d24", clothes: "#794855" },
  justice: { background: "#e0e9d8", skin: "#e1b18d", hair: "#624639", clothes: "#46644d" },
  "civil-procedure": {
    background: "#e7e2d5",
    skin: "#b87855",
    hair: "#282329",
    clothes: "#49566a",
  },
} as const;

function DemoPortrait({ variant, name }: { variant: DemoLawyer["photoVariant"]; name: string }) {
  const palette = PORTRAIT_PALETTES[variant as keyof typeof PORTRAIT_PALETTES];
  const gradientId = `portrait-${variant}`;

  return (
    <svg
      role="img"
      aria-label={`Retrato ilustrativo de ${name}`}
      viewBox="0 0 120 144"
      className="h-32 w-24 shrink-0 rounded-lg border bg-background shadow-sm"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={palette.background} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity=".4" />
        </linearGradient>
      </defs>
      <rect width="120" height="144" rx="10" fill={`url(#${gradientId})`} />
      <circle cx="92" cy="27" r="13" fill="#ffffff" opacity=".42" />
      <path d="M12 144c4-26 20-40 48-40s44 14 48 40" fill={palette.clothes} />
      <path d="m43 111 17 20 17-20-8-13H51z" fill="#fff" opacity=".88" />
      <path d="M49 85h22v22c-4 9-18 9-22 0z" fill={palette.skin} />
      <ellipse cx="60" cy="61" rx="30" ry="37" fill={palette.skin} />
      <path
        d="M30 58c-4-29 10-43 31-43 22 0 33 16 28 43-6-4-10-12-11-22-12 9-28 13-48 12z"
        fill={palette.hair}
      />
      <path d="M36 58c-4 8-2 17 3 19l2-15zm48 0c4 8 2 17-3 19l-2-15z" fill={palette.skin} />
      <ellipse cx="49" cy="63" rx="2.2" ry="1.7" fill="#302923" />
      <ellipse cx="70" cy="63" rx="2.2" ry="1.7" fill="#302923" />
      <path
        d="M53 78q7 5 14 0"
        fill="none"
        stroke="#7d443d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M44 56q5-4 10-1m11 0q5-3 10 1"
        fill="none"
        stroke={palette.hair}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 144q3-25 16-34l12 10 12 20zm80 0q-3-25-16-34l-12 10-12 20z"
        fill={palette.clothes}
      />
    </svg>
  );
}

function LawyerProfileEditor() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [areas, setAreas] = useState("");
  const [city, setCity] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["lawyer-directory-own", user?.id],
    enabled: Boolean(user && profile?.account_type === "lawyer"),
    retry: false,
    queryFn: async () => {
      if (!user) throw new Error("É necessário entrar na conta.");
      const { data, error } = await lawyerDirectorySupabase
        .from("lawyer_directory")
        .select("display_name, description, practice_areas, city, contact_email, is_published")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setDisplayName(data.display_name);
      setDescription(data.description);
      setAreas(data.practice_areas.join(", "));
      setCity(data.city);
      setContactEmail(data.contact_email);
      setIsPublished(data.is_published);
      return;
    }
    if (!isLoading && !isError && profile?.full_name) {
      setDisplayName((current) => current || profile.full_name || "");
    }
  }, [data, isError, isLoading, profile?.full_name]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user || profile?.account_type !== "lawyer") return;
    const trimmedName = displayName.trim();
    const trimmedDescription = description.trim();
    const practiceAreas = parsePracticeAreas(areas);
    const trimmedCity = city.trim();
    const trimmedContactEmail = contactEmail.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error("Informe um nome público entre 2 e 100 caracteres.");
      return;
    }
    if (trimmedDescription.length > 1200 || trimmedCity.length > 120) {
      toast.error("Confira os limites da descrição (1.200) e cidade (120 caracteres).");
      return;
    }
    if (practiceAreas.length > 8 || practiceAreas.some((area) => area.length > 80)) {
      toast.error("Informe no máximo 8 áreas de atuação, com até 80 caracteres cada.");
      return;
    }
    if (trimmedContactEmail && !isContactEmail(trimmedContactEmail)) {
      toast.error("Informe um e-mail de contato válido.");
      return;
    }
    if (isPublished && (!trimmedDescription || practiceAreas.length === 0)) {
      toast.error("Para publicar, informe uma descrição e ao menos uma área de atuação.");
      return;
    }

    setSaving(true);
    const { error } = await lawyerDirectorySupabase.from("lawyer_directory").upsert(
      {
        user_id: user.id,
        display_name: trimmedName,
        description: trimmedDescription,
        practice_areas: practiceAreas,
        city: trimmedCity,
        contact_email: trimmedContactEmail,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) {
      toast.error(
        "Não foi possível salvar. Verifique se a migração do diretório já foi aplicada ao banco.",
      );
      return;
    }
    toast.success(isPublished ? "Perfil publicado na busca." : "Perfil salvo como privado.");
    await refetch();
  }

  if (!user) {
    return (
      <section className="mt-4 rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold text-primary">Perfil profissional</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre ou crie uma conta com o perfil Advogado para preparar uma listagem profissional.
        </p>
        <Button asChild className="mt-4">
          <Link to="/auth">Entrar ou criar conta</Link>
        </Button>
      </section>
    );
  }

  if (profile?.account_type !== "lawyer") {
    return (
      <section className="mt-4 space-y-3 rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold text-primary">Quero divulgar meu perfil</h2>
        <p className="text-sm text-muted-foreground">
          O diretório usa o tipo de conta Advogado. Você pode alterar o tipo de conta nas
          configurações do perfil; isso não valida a inscrição profissional.
        </p>
        <Button asChild variant="outline">
          <Link to="/perfil">Abrir perfil e tipo de conta</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-xl border bg-card p-4 shadow-card sm:p-6">
      <h2 className="text-xl font-semibold text-primary">Seu perfil profissional</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Somente contas do tipo Advogado podem criar um perfil no diretório. A publicação é opcional
        e desligada por padrão.
      </p>
      <Notice tone="warning" className="mt-4">
        O tipo de conta, nome e número da OAB são autodeclarados. A plataforma não verificou a
        identidade, inscrição ou áreas de atuação.
      </Notice>
      {isError && (
        <Notice tone="warning" className="mt-4">
          Não foi possível carregar o perfil do diretório. Confira se a migração foi aplicada ao
          banco de dados antes de salvar.
        </Notice>
      )}
      {isLoading && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Carregando seu perfil…
        </p>
      )}

      <form onSubmit={saveProfile} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lawyer-display-name">Nome público</Label>
          <Input
            id="lawyer-display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={100}
            required
            className="h-11 bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lawyer-description">Descrição profissional</Label>
          <Textarea
            id="lawyer-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1200}
            rows={4}
            placeholder="Apresente sua atuação e experiência, sem incluir dados sigilosos de clientes."
          />
          <p className="text-right text-xs text-muted-foreground">{description.length}/1200</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lawyer-areas">Áreas de atuação (separe por vírgula; até 8)</Label>
          <Input
            id="lawyer-areas"
            value={areas}
            onChange={(event) => setAreas(event.target.value)}
            placeholder="Ex.: Direito do Consumidor, Contratos"
            className="h-11 bg-background"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lawyer-city">Cidade (opcional)</Label>
            <Input
              id="lawyer-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={120}
              className="h-11 bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lawyer-contact-email">E-mail público para contato (opcional)</Label>
            <Input
              id="lawyer-contact-email"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              maxLength={254}
              className="h-11 bg-background"
            />
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            Publicar meu perfil na busca. Ao ativar, autorizo que nome público, descrição, áreas,
            cidade e e-mail de contato informado fiquem visíveis a qualquer pessoa. Posso retirar a
            publicação a qualquer momento.
          </span>
        </label>
        <Button type="submit" disabled={saving || isLoading}>
          {saving ? "Salvando…" : isPublished ? "Salvar e publicar perfil" : "Salvar como privado"}
        </Button>
      </form>
    </section>
  );
}

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  citations?: LegalAssistantCitation[];
};

function LegalAssistantChat() {
  const { user } = useAuth();
  const askQuestion = useServerFn(askLegalQuestion);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messageId = useRef(0);

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion || isSending) return;

    setQuestion("");
    const userMessage: ChatMessage = {
      id: messageId.current + 1,
      role: "user",
      content: currentQuestion,
    };
    messageId.current += 1;
    setMessages((current) => [...current, userMessage]);
    setIsSending(true);

    try {
      const result = await askQuestion({ data: { question: currentQuestion } });
      if (result.status === "answered") {
        const answerMessage: ChatMessage = {
          id: messageId.current + 1,
          role: "assistant",
          content: result.answer,
          citations: result.citations,
        };
        messageId.current += 1;
        setMessages((current) => [...current, answerMessage]);
      } else {
        const statusMessage: ChatMessage = {
          id: messageId.current + 1,
          role: "assistant",
          content: assistantStatusMessage(result.status),
        };
        messageId.current += 1;
        setMessages((current) => [...current, statusMessage]);
      }
    } catch (error) {
      console.error("[assistant] Failed to answer legal question", error);
      const errorMessage: ChatMessage = {
        id: messageId.current + 1,
        role: "assistant",
        content:
          "Não foi possível concluir a consulta agora. Verifique sua conexão e tente novamente.",
      };
      messageId.current += 1;
      setMessages((current) => [...current, errorMessage]);
      toast.error("Não foi possível consultar o assistente jurídico.");
    } finally {
      setIsSending(false);
    }
  }

  if (!user) {
    return (
      <section className="mt-4 rounded-xl border bg-card p-5">
        <h2 className="text-xl font-semibold text-primary">Assistente jurídico com IA</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre na sua conta para conversar com o assistente. Ele responde com base em textos legais
          revisados e mostra as fontes consultadas.
        </p>
        <Button asChild className="mt-4">
          <Link to="/auth">Entrar ou criar conta</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-4 space-y-4">
      <Notice tone="warning" title="Informação geral, não aconselhamento jurídico">
        O assistente usa apenas artigos marcados como verificados por um administrador. A pergunta
        atual e os trechos legais encontrados são enviados ao Gemini para gerar a resposta. Seu
        perfil, seus casos e o histórico desta conversa não são enviados. Não inclua dados pessoais
        ou sigilosos.
      </Notice>
      <div className="rounded-xl border bg-card p-4 shadow-card sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-highlight/15 p-2 text-highlight">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-semibold text-primary">Assistente jurídico</h2>
            <p className="text-sm text-muted-foreground">
              Pergunte sobre uma lei ou artigo da legislação brasileira.
            </p>
          </div>
        </div>
        <div
          aria-live="polite"
          aria-label="Conversa com o assistente jurídico"
          className="mb-4 max-h-[28rem] min-h-32 space-y-3 overflow-y-auto rounded-lg bg-muted/40 p-3"
        >
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Exemplo: “O que diz o artigo 18 do Código de Defesa do Consumidor?”
            </p>
          )}
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[90%] rounded-lg p-3 text-sm ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto border bg-card"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.citations && message.citations.length > 0 && (
                <ul className="mt-3 space-y-1 border-t pt-2 text-xs">
                  <li className="font-medium">Fontes consultadas</li>
                  {message.citations.map((citation) => (
                    <li key={citation.id}>
                      {isHttpUrl(citation.url) ? (
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline underline-offset-2"
                        >
                          {citation.label} — fonte oficial
                        </a>
                      ) : (
                        citation.label
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
          {isSending && (
            <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              Consultando fontes jurídicas…
            </p>
          )}
        </div>
        <form onSubmit={submitQuestion} className="space-y-2">
          <Label htmlFor="legal-assistant-question">Sua pergunta</Label>
          <Textarea
            id="legal-assistant-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Descreva sua dúvida sem incluir dados pessoais ou sigilosos."
            disabled={isSending}
            className="bg-background"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{question.length}/2000</span>
            <Button type="submit" disabled={isSending || question.trim().length < 3}>
              <Send aria-hidden />
              Enviar pergunta
            </Button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/wiki">Consultar Wiki</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/dicionario">Abrir dicionário</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function assistantStatusMessage(status: string) {
  switch (status) {
    case "not_configured":
      return "O serviço de IA ainda não está configurado. O administrador precisa adicionar GEMINI_API_KEY como segredo no servidor.";
    case "no_verified_sources":
      return "Não encontrei artigos verificados suficientes para responder com segurança. Consulte a Wiki ou tente outra pergunta.";
    case "rate_limited":
      return "Você enviou várias perguntas em pouco tempo. Aguarde um minuto antes de tentar novamente.";
    case "provider_error":
      return "O serviço de IA está temporariamente indisponível. Tente novamente mais tarde.";
    default:
      return "Não foi possível responder à pergunta.";
  }
}

function isHttpUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isContactEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
