import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BookOpen, BookA, ChevronRight, Filter, Gavel, Search, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, Loading, Notice, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, SOURCE_TYPES, TEXT_STATUS_LABEL, parseArticleQuery } from "@/lib/wiki";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";

type Search = { q?: string | undefined; categoria?: string | undefined; tipo?: string | undefined };

export const Route = createFileRoute("/wiki/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    categoria: typeof s["categoria"] === "string" && s["categoria"] ? s["categoria"] : undefined,
    tipo: typeof s["tipo"] === "string" && s["tipo"] ? s["tipo"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Wiki jurídica — ${BRAND.name}` },
      {
        name: "description",
        content:
          "Pesquise leis, artigos e termos jurídicos com fonte oficial e explicação simples.",
      },
      { property: "og:title", content: `Wiki jurídica — ${BRAND.name}` },
      {
        property: "og:description",
        content: "Pesquise leis, artigos e termos jurídicos com fonte oficial.",
      },
    ],
  }),
  component: WikiPage,
});

const clean = (q: string) => q.replace(/[,()%*\\]/g, " ").trim();

function WikiPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/wiki/" });
  const { user } = useAuth();
  const [text, setText] = useState(search.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setText(search.q ?? ""), [search.q]);

  const q = clean(search.q ?? "");

  const { data, isLoading, error } = useQuery({
    queryKey: ["wiki-search", q, search.categoria, search.tipo],
    queryFn: async () => {
      let nq = supabase
        .from("norms")
        .select("slug, short_name, official_name, category, source_type, text_status, year")
        .order("year");
      if (q)
        nq = nq.or(
          `short_name.ilike.%${q}%,official_name.ilike.%${q}%,number.ilike.%${q}%,plain_summary.ilike.%${q}%`,
        );
      if (search.categoria) nq = nq.eq("category", search.categoria);
      if (search.tipo) nq = nq.eq("source_type", search.tipo);
      const art = q ? parseArticleQuery(q) : null;
      const [norms, articles, terms] = await Promise.all([
        nq,
        q
          ? art
            ? supabase
                .from("norm_articles")
                .select("article_number, legal_text, norms(slug, short_name)")
                .eq("article_number", art)
                .limit(20)
            : supabase
                .from("norm_articles")
                .select("article_number, legal_text, norms(slug, short_name)")
                .ilike("legal_text", `%${q}%`)
                .limit(20)
          : Promise.resolve({ data: null, error: null }),
        q
          ? supabase
              .from("glossary_terms")
              .select("slug, term, definition")
              .ilike("term", `%${q}%`)
              .limit(10)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (norms.error) throw norms.error;
      return {
        norms: norms.data ?? [],
        articles: articles.data ?? [],
        terms: terms.data ?? [],
      };
    },
  });

  useEffect(() => {
    if (user && q) void supabase.from("search_history").insert({ user_id: user.id, query: q });
  }, [user, q]);

  const activeFilters = [search.categoria, search.tipo].filter(Boolean).length;

  const Filters = (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              active={search.categoria === c}
              onClick={() =>
                navigate({
                  search: (s: Search) => ({ ...s, categoria: s.categoria === c ? undefined : c }),
                })
              }
            >
              {c}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Tipo de fonte</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SOURCE_TYPES).map(([k, l]) => (
            <Chip
              key={k}
              active={search.tipo === k}
              onClick={() =>
                navigate({ search: (s: Search) => ({ ...s, tipo: s.tipo === k ? undefined : k }) })
              }
            >
              {l}
            </Chip>
          ))}
        </div>
      </fieldset>
      {activeFilters > 0 && (
        <Button variant="ghost" onClick={() => navigate({ search: (s: Search) => ({ q: s.q }) })}>
          <X /> Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <AppShell>
      <PageHeader title="Wiki jurídica" description="Leis, artigos e termos com fonte oficial." />

      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ search: (s: Search) => ({ ...s, q: text.trim() || undefined }) });
        }}
      >
        <label htmlFor="wiki-q" className="sr-only">
          Pesquisar na Wiki
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="wiki-q"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex.: consumidor, art. 18, 9.099"
            className="h-12 pl-9 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="px-4">
          Buscar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="relative px-3 lg:hidden"
          onClick={() => setFiltersOpen(true)}
          aria-label="Filtros"
        >
          <Filter />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-highlight text-[10px] text-highlight-foreground">
              {activeFilters}
            </span>
          )}
        </Button>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Button asChild variant="secondary" size="sm">
          <Link to="/dicionario">
            <BookA /> Dicionário
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link to="/jurisprudencia">
            <Gavel /> Jurisprudência
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-6">
          {isLoading && <Loading label="Pesquisando…" />}
          {error && (
            <Notice tone="warning">Não foi possível carregar a Wiki. Tente novamente.</Notice>
          )}
          {data && (
            <>
              {data.terms.length > 0 && (
                <section aria-labelledby="h-terms">
                  <h2
                    id="h-terms"
                    className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Termos do dicionário
                  </h2>
                  <div className="space-y-2">
                    {data.terms.map((t) => (
                      <Link
                        key={t.slug}
                        to="/dicionario"
                        hash={t.slug}
                        className="block rounded-xl border bg-card p-4"
                      >
                        <p className="font-semibold">{t.term}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {t.definition}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {data.articles.length > 0 && (
                <section aria-labelledby="h-arts">
                  <h2
                    id="h-arts"
                    className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Artigos
                  </h2>
                  <div className="space-y-2">
                    {data.articles.map((a, i) => (
                      <Link
                        key={i}
                        to="/wiki/$slug"
                        params={{ slug: a.norms.slug }}
                        hash={`art-${a.article_number}`}
                        className="block rounded-xl border bg-card p-4"
                      >
                        <p className="text-sm font-semibold">
                          {a.norms.short_name}, art. {a.article_number}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {a.legal_text}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              <section aria-labelledby="h-norms">
                <h2
                  id="h-norms"
                  className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Normas
                </h2>
                {data.norms.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-5 w-5" />}
                    title="Nada encontrado"
                    description="Tente outras palavras, o número da lei ou remova os filtros."
                  />
                ) : (
                  <ul className="space-y-2">
                    {data.norms.map((n) => (
                      <li key={n.slug}>
                        <Link
                          to="/wiki/$slug"
                          params={{ slug: n.slug }}
                          className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card hover:border-highlight/40"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-primary">{n.short_name}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {n.official_name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <StatusBadge tone="neutral">{n.category}</StatusBadge>
                              <StatusBadge tone={n.text_status === "verificado" ? "ok" : "pending"}>
                                {TEXT_STATUS_LABEL[n.text_status]}
                              </StatusBadge>
                            </div>
                          </div>
                          <ChevronRight
                            className="h-5 w-5 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {q && data.articles.length === 0 && (
                <Notice>
                  Nenhum artigo encontrado para "{q}". O texto legal das normas ainda está sendo
                  importado de fontes oficiais — por isso a busca por artigos pode retornar poucos
                  resultados.
                </Notice>
              )}
            </>
          )}
        </div>
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-24 rounded-xl border bg-card p-4">{Filters}</div>
        </aside>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-safe">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {Filters}
            <Button className="mt-6 w-full" size="lg" onClick={() => setFiltersOpen(false)}>
              Ver resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-full border px-3.5 text-sm font-medium",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
