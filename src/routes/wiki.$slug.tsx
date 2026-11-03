import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Copy, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, Loading, Notice, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorite-button";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime } from "@/lib/format";
import { TEXT_STATUS_LABEL, VIGENCY_LABEL, articleReference } from "@/lib/wiki";
import { getLegislationRepositoryUrl } from "@/lib/legislation-source";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/wiki/$slug")({
  head: () => ({
    meta: [
      { title: `Norma — Wiki ${BRAND.name}` },
      {
        name: "description",
        content: "Texto legal organizado por artigos, explicação simples e fonte oficial.",
      },
      { property: "og:title", content: `Norma — Wiki ${BRAND.name}` },
      {
        property: "og:description",
        content: "Texto legal organizado por artigos, com fonte oficial.",
      },
    ],
  }),
  component: NormPage,
});

function NormPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["norm", slug],
    queryFn: async () => {
      const { data: norm, error } = await supabase
        .from("norms")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!norm) return null;
      const [arts, ups] = await Promise.all([
        supabase.from("norm_articles").select("*").eq("norm_id", norm.id).order("position"),
        supabase
          .from("norm_updates")
          .select("*")
          .eq("norm_id", norm.id)
          .order("created_at", { ascending: false }),
      ]);
      return { norm, articles: arts.data ?? [], updates: ups.data ?? [] };
    },
  });

  useEffect(() => {
    if (data && window.location.hash)
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [data]);

  if (isLoading)
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  if (error || !data)
    return (
      <AppShell>
        <EmptyState
          title="Norma não encontrada"
          description="Ela pode ter sido removida ou o endereço está incorreto."
          action={
            <Button asChild>
              <Link to="/wiki">Voltar à Wiki</Link>
            </Button>
          }
        />
      </AppShell>
    );

  const { norm, articles, updates } = data;
  const legislationRepositoryUrl = getLegislationRepositoryUrl(norm);
  const copyRef = (n: string) => {
    navigator.clipboard.writeText(articleReference(norm.short_name, norm.official_name, n)).then(
      () => toast.success("Referência copiada"),
      () => toast.error("Não foi possível copiar"),
    );
  };

  return (
    <AppShell>
      <Link
        to="/wiki"
        className="mb-4 inline-flex h-10 items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Wiki
      </Link>
      <article>
        <header>
          <p className="text-sm font-medium text-highlight">{norm.category}</p>
          <h1 className="mt-1 text-3xl font-semibold text-primary">{norm.short_name}</h1>
          <p className="mt-1 text-muted-foreground">{norm.official_name}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusBadge tone={norm.vigency_status === "vigente" ? "ok" : "pending"}>
              {VIGENCY_LABEL[norm.vigency_status] ?? norm.vigency_status}
            </StatusBadge>
            <StatusBadge tone={norm.text_status === "verificado" ? "ok" : "pending"}>
              {TEXT_STATUS_LABEL[norm.text_status]}
            </StatusBadge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {norm.official_url && (
              <Button asChild variant="outline">
                <a href={norm.official_url} target="_blank" rel="noreferrer noopener">
                  <ExternalLink /> Fonte oficial
                </a>
              </Button>
            )}
            {legislationRepositoryUrl && (
              <Button asChild variant="outline">
                <a href={legislationRepositoryUrl} target="_blank" rel="noreferrer noopener">
                  <ExternalLink /> Acervo ctresb/leis
                </a>
              </Button>
            )}
            <FavoriteButton kind="norma" refSlug={norm.slug} label={norm.short_name} />
          </div>
          {legislationRepositoryUrl && (
            <p className="mt-2 text-xs text-muted-foreground">
              O acervo é uma transcrição compilada; confira a fonte primária indicada no documento
              antes de citar.
            </p>
          )}
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Número</dt>
            <dd className="font-semibold">{norm.number ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ano</dt>
            <dd className="font-semibold">{norm.year ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Data da norma</dt>
            <dd className="font-semibold">{formatDate(norm.signed_on)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Última verificação</dt>
            <dd className="font-semibold">
              {norm.last_verified_at ? formatDate(norm.last_verified_at) : "Não verificada"}
            </dd>
          </div>
        </dl>

        {norm.plain_summary && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold text-primary">Em linguagem simples</h2>
            <p className="mt-2 text-sm leading-relaxed">{norm.plain_summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Resumo editorial — não é texto legal.
            </p>
          </section>
        )}

        <section className="mt-8" aria-labelledby="h-text">
          <h2 id="h-text" className="text-xl font-semibold text-primary">
            Texto legal
          </h2>
          {articles.length === 0 ? (
            <Notice tone="warning" title="Texto legal ainda não importado" className="mt-3">
              Para evitar informações incorretas, o texto só é exibido depois de importado e
              conferido com a fonte oficial ({norm.source_name ?? "fonte oficial"}). Enquanto isso,
              consulte os links de fonte acima.
            </Notice>
          ) : (
            <ol className="mt-3 space-y-3">
              {articles.map((a) => (
                <li
                  key={a.id}
                  id={`art-${a.article_number}`}
                  className="scroll-mt-24 rounded-xl border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-sans font-semibold">
                      {a.article_number === "Preâmbulo" ? "Preâmbulo" : `Art. ${a.article_number}`}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyRef(a.article_number)}
                      aria-label={
                        a.article_number === "Preâmbulo"
                          ? "Copiar referência do preâmbulo"
                          : `Copiar referência do art. ${a.article_number}`
                      }
                    >
                      <Copy /> Copiar
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-line font-serif text-[15px] leading-relaxed">
                    {a.legal_text}
                  </p>
                  {a.plain_explanation && (
                    <div className="mt-3 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
                      <p className="font-semibold">Explicação simples (editorial)</p>
                      <p className="mt-1">{a.plain_explanation}</p>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Versão {a.source_version} ·{" "}
                    {a.verified_at
                      ? `verificado em ${formatDate(a.verified_at)}`
                      : "não verificado"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-8" aria-labelledby="h-hist">
          <h2 id="h-hist" className="text-xl font-semibold text-primary">
            Histórico de atualização
          </h2>
          <ul className="mt-3 space-y-2">
            {updates.map((u) => (
              <li key={u.id} className="flex gap-3 rounded-xl border bg-card p-3 text-sm">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p>{u.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(u.created_at)} · versão {u.version ?? 0}
                  </p>
                  {u.source_consulted && (
                    <a
                      className="text-xs text-highlight underline"
                      href={u.source_consulted}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Fonte consultada
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </AppShell>
  );
}
