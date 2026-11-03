import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Calculator,
  FolderOpen,
  HelpCircle,
  Scale,
  Search,
  Star,
  FileText,
  CalendarDays,
  Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/common";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/wiki";
import { formatDate } from "@/lib/format";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: `Início — ${BRAND.name}` },
      { name: "description", content: "Seu painel personalizado." },
      { property: "og:title", content: `Início — ${BRAND.name}` },
      { property: "og:description", content: "Seu painel personalizado." },
    ],
  }),
  component: Home,
});

const CITIZEN_CARDS = [
  {
    to: "/wiki",
    icon: Scale,
    title: "Consultar meus direitos",
    search: { categoria: "Direito do Consumidor" },
  },
  { to: "/dicionario", icon: HelpCircle, title: "Entender um problema jurídico" },
  { to: "/wiki", icon: BookOpen, title: "Consultar a Wiki jurídica" },
  { to: "/calculadoras", icon: Calculator, title: "Calcular um valor" },
  { to: "/casos", icon: FileText, title: "Organizar documentos" },
  { to: "/casos", icon: FolderOpen, title: "Acompanhar meus casos" },
] as const;

function Home() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  if (loading || !profile) return <Loading />;
  const first = profile.full_name?.split(" ")[0];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">
          Olá{first ? `, ${first}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.account_type === "lawyer"
            ? "Seu painel profissional"
            : "Como podemos ajudar hoje?"}
        </p>
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/wiki", search: { q: q.trim() || undefined } });
        }}
        className="rounded-2xl bg-primary p-4 text-primary-foreground sm:p-6"
      >
        <label htmlFor="home-q" className="text-sm font-semibold">
          Pesquisa jurídica
        </label>
        <div className="mt-2 flex gap-2">
          <Input
            id="home-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Descreva sua dúvida ou pesquise uma lei."
            className="h-12 border-0 bg-card text-base text-foreground"
          />
          <Button
            type="submit"
            variant="highlight"
            size="icon"
            className="h-12 w-12 shrink-0"
            aria-label="Pesquisar"
          >
            <Search />
          </Button>
        </div>
      </form>

      {profile.account_type === "lawyer" ? (
        <LawyerHome />
      ) : (
        <>
          <section aria-labelledby="h-acoes">
            <h2 id="h-acoes" className="sr-only">
              Ações
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CITIZEN_CARDS.map((c) => (
                <Link
                  key={c.title}
                  to={c.to}
                  {...("search" in c ? { search: c.search } : {})}
                  className="flex min-h-28 flex-col justify-between rounded-xl border bg-card p-4 shadow-card hover:border-highlight/40"
                >
                  <c.icon className="h-6 w-6 text-highlight" aria-hidden />
                  <span className="text-sm font-semibold leading-snug">{c.title}</span>
                </Link>
              ))}
            </div>
          </section>
          <section aria-labelledby="h-cat">
            <h2 id="h-cat" className="mb-3 text-lg font-semibold text-primary">
              Categorias populares
            </h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 6).map((c) => (
                <Link
                  key={c}
                  to="/wiki"
                  search={{ categoria: c }}
                  className="inline-flex min-h-10 items-center rounded-full border bg-card px-4 text-sm font-medium hover:bg-accent"
                >
                  {c}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LawyerHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["lawyer-home"],
    queryFn: async () => {
      const [cases, favs, hist] = await Promise.all([
        supabase
          .from("cases")
          .select("id, title, status, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("favorites")
          .select("id, label, ref_slug, kind")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("search_history")
          .select("id, query, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      return { cases: cases.data ?? [], favs: favs.data ?? [], hist: hist.data ?? [] };
    },
  });
  if (isLoading || !data) return <Loading />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Casos recentes" icon={<FolderOpen className="h-4 w-4" />} link="/casos">
        {data.cases.length === 0 ? (
          <Empty text="Nenhum caso cadastrado." />
        ) : (
          data.cases.map((c) => (
            <Link
              key={c.id}
              to="/casos/$id"
              params={{ id: c.id }}
              className="flex justify-between gap-2 py-2 text-sm"
            >
              <span className="truncate font-medium">{c.title}</span>
              <span className="shrink-0 text-muted-foreground">{formatDate(c.updated_at)}</span>
            </Link>
          ))
        )}
      </Panel>
      <Panel title="Pesquisas salvas" icon={<Star className="h-4 w-4" />} link="/favoritos">
        {data.favs.length === 0 ? (
          <Empty text="Favorite normas para acessá-las aqui." />
        ) : (
          data.favs.map((f) => (
            <Link
              key={f.id}
              to="/wiki/$slug"
              params={{ slug: f.ref_slug }}
              className="block py-2 text-sm font-medium"
            >
              {f.label}
            </Link>
          ))
        )}
      </Panel>
      <Panel title="Histórico de consultas" icon={<Search className="h-4 w-4" />}>
        {data.hist.length === 0 ? (
          <Empty text="Suas buscas na Wiki aparecem aqui." />
        ) : (
          data.hist.map((h) => (
            <Link key={h.id} to="/wiki" search={{ q: h.query }} className="block py-2 text-sm">
              {h.query}
            </Link>
          ))
        )}
      </Panel>
      <Panel title="Próximos compromissos" icon={<CalendarDays className="h-4 w-4" />}>
        <Empty text="Agenda disponível em breve." />
      </Panel>
      <Panel
        title="Calculadoras recentes"
        icon={<Calculator className="h-4 w-4" />}
        link="/calculadoras"
      >
        <Empty text="Nenhum cálculo salvo." />
      </Panel>
      <Panel title="Atualizações legislativas" icon={<Bell className="h-4 w-4" />}>
        <Empty text="Monitoramento de fontes ainda não configurado." />
      </Panel>
    </div>
  );
}

function Panel({
  title,
  icon,
  link,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  link?: "/casos" | "/favoritos" | "/calculadoras";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-sans text-sm font-semibold">
          {icon}
          {title}
        </h2>
        {link && (
          <Link to={link} className="text-xs font-semibold text-highlight">
            Ver tudo
          </Link>
        )}
      </div>
      <div className="divide-y">{children}</div>
    </section>
  );
}
const Empty = ({ text }: { text: string }) => (
  <p className="py-3 text-sm text-muted-foreground">{text}</p>
);
