import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, FileClock, FileDown, FileText, ShieldCheck } from "lucide-react";
import { EmptyState, Loading, Notice, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TEXT_STATUS_LABEL } from "@/lib/wiki";
import {
  getLegislationRepositoryUrl,
  parseLegislationArticles,
  type SourceArticle,
} from "@/lib/legislation-source";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: `Administração — ${BRAND.name}` },
      { name: "description", content: "Gestão de conteúdos e fontes da Wiki." },
      { property: "og:title", content: `Administração — ${BRAND.name}` },
      { property: "og:description", content: "Gestão de conteúdos e fontes." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading, user } = useAuth();
  const [normId, setNormId] = useState("");
  const [art, setArt] = useState({ number: "", text: "", explanation: "" });
  const [sourceArticles, setSourceArticles] = useState<SourceArticle[]>([]);
  const [sourceArticleNumber, setSourceArticleNumber] = useState("");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [importingConstitution, setImportingConstitution] = useState(false);
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["admin-norms"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: norms, error } = await supabase
        .from("norms")
        .select(
          "id, slug, short_name, official_name, norm_type, number, year, signed_on, official_url, text_status, content_version",
        )
        .order("short_name");
      if (error) throw error;
      return norms ?? [];
    },
  });
  if (loading) return <Loading />;
  if (!isAdmin)
    return (
      <EmptyState
        title="Acesso restrito"
        description="Esta área é exclusiva para administradores."
      />
    );

  const norms = data ?? [];
  const verifiedCount = norms.filter((norm) => norm.text_status === "verificado").length;
  const importedCount = norms.filter((norm) => norm.text_status === "importado").length;
  const pendingCount = norms.filter(
    (norm) => norm.text_status !== "verificado" && norm.text_status !== "importado",
  ).length;

  async function addArticle(e: React.FormEvent) {
    e.preventDefault();
    const norm = data?.find((n) => n.id === normId);
    if (!norm || !art.number.trim() || art.text.trim().length < 5)
      return void toast.error("Preencha norma, número e texto.");
    const version = norm.content_version + 1;
    const { error } = await supabase.from("norm_articles").insert({
      norm_id: normId,
      article_number: art.number.trim(),
      position: parseInt(art.number) || 0,
      legal_text: art.text.trim(),
      plain_explanation: art.explanation.trim() || null,
      source_version: version,
    });
    if (error) return void toast.error("Erro ao salvar artigo (já existe?).");
    const { error: normError } = await supabase
      .from("norms")
      .update({
        text_status: "importado",
        content_version: version,
        updated_at: new Date().toISOString(),
      })
      .eq("id", normId);
    if (normError) {
      toast.error("Artigo salvo, mas não foi possível atualizar o status da norma.");
      refetch();
      return;
    }
    const { error: historyError } = await supabase.from("norm_updates").insert({
      norm_id: normId,
      description: `Art. ${art.number} importado${sourceUrl ? " do acervo ctresb/leis" : " manualmente"} (não verificado).`,
      version,
      created_by: user!.id,
      source_consulted: sourceUrl,
    });
    if (historyError) {
      toast.error("Artigo salvo, mas não foi possível registrar a fonte no histórico.");
      refetch();
      return;
    }
    toast.success("Artigo adicionado");
    setArt({ number: "", text: "", explanation: "" });
    setSourceArticleNumber("");
    refetch();
  }

  async function loadSource() {
    const norm = data?.find((n) => n.id === normId);
    const url = norm ? getLegislationRepositoryUrl(norm) : null;
    if (!url) return void toast.error("Não há caminho correspondente no acervo para esta norma.");

    setLoadingSource(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`O acervo respondeu com status ${response.status}.`);
      const articles = parseLegislationArticles(await response.text());
      if (articles.length === 0)
        throw new Error("O arquivo não contém artigos em formato reconhecido.");

      setSourceArticles(articles);
      setSourceArticleNumber(articles[0].number);
      setArt((current) => ({ ...current, number: articles[0].number, text: articles[0].text }));
      setSourceUrl(url);
      toast.success(`${articles.length} artigos carregados para revisão.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Falha ao carregar o acervo: ${error.message}`
          : "Falha ao carregar o acervo.",
      );
    } finally {
      setLoadingSource(false);
    }
  }

  async function importConstitution() {
    const norm = data?.find((item) => item.id === normId);
    if (!norm || norm.slug !== "constituicao-federal" || !sourceUrl || sourceArticles.length === 0)
      return void toast.error("Carregue primeiro o texto da Constituição Federal do acervo.");

    if (
      !window.confirm(
        `Importar os ${sourceArticles.length} artigos da Constituição Federal que ainda não existem? Os artigos existentes serão mantidos e o texto ficará marcado como não verificado.`,
      )
    )
      return;

    setImportingConstitution(true);
    try {
      const { data: existingArticles, error: existingError } = await supabase
        .from("norm_articles")
        .select("article_number")
        .eq("norm_id", normId);
      if (existingError) throw existingError;

      const existingNumbers = new Set((existingArticles ?? []).map((item) => item.article_number));
      const missingArticles = sourceArticles.filter(
        (article) => !existingNumbers.has(article.number),
      );
      if (missingArticles.length === 0) {
        toast.info("Todos os artigos do arquivo já estão cadastrados.");
        return;
      }

      const version = norm.content_version + 1;
      const { error: insertError } = await supabase.from("norm_articles").insert(
        missingArticles.map((article) => ({
          norm_id: normId,
          article_number: article.number,
          position: sourceArticles.indexOf(article),
          legal_text: article.text,
          plain_explanation: null,
          source_version: version,
        })),
      );
      if (insertError) throw insertError;

      const { error: normError } = await supabase
        .from("norms")
        .update({
          text_status: "importado",
          content_version: version,
          updated_at: new Date().toISOString(),
        })
        .eq("id", normId);
      if (normError) {
        toast.error(
          "Os artigos foram importados, mas não foi possível atualizar o status da norma.",
        );
        await refetch();
        return;
      }

      const { error: historyError } = await supabase.from("norm_updates").insert({
        norm_id: normId,
        description: `${missingArticles.length} artigos importados em lote do acervo ctresb/leis (não verificados).`,
        version,
        created_by: user!.id,
        source_consulted: sourceUrl,
      });
      if (historyError) {
        toast.error(
          "Os artigos foram importados, mas não foi possível registrar a fonte no histórico.",
        );
        await refetch();
        return;
      }

      toast.success(`${missingArticles.length} artigos importados para revisão.`);
      await refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Falha ao importar os artigos: ${error.message}`
          : "Falha ao importar os artigos.",
      );
    } finally {
      setImportingConstitution(false);
    }
  }

  async function markVerified(id: string) {
    const norm = data?.find((item) => item.id === id);
    const { error } = await supabase
      .from("norms")
      .update({ text_status: "verificado", last_verified_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return void toast.error("Erro");
    const { error: historyError } = await supabase.from("norm_updates").insert({
      norm_id: id,
      description: "Texto conferido com a fonte oficial.",
      created_by: user!.id,
      source_consulted: norm?.official_url ?? null,
    });
    if (historyError) {
      toast.error("Norma verificada, mas não foi possível registrar a fonte no histórico.");
      refetch();
      return;
    }
    toast.success("Marcado como verificado");
    refetch();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel de administração"
        description="Acompanhe e mantenha os conteúdos jurídicos da Wiki."
      />
      <section aria-label="Resumo das normas" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          icon={<BookOpen className="h-5 w-5" />}
          label="Normas cadastradas"
          value={norms.length}
        />
        <AdminMetric
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Textos verificados"
          value={verifiedCount}
        />
        <AdminMetric
          icon={<FileText className="h-5 w-5" />}
          label="Textos importados"
          value={importedCount}
        />
        <AdminMetric
          icon={<FileClock className="h-5 w-5" />}
          label="Pendentes de revisão"
          value={pendingCount}
        />
      </section>
      <section className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Conta administrativa</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <StatusBadge tone="ok">Administrador</StatusBadge>
      </section>
      <Notice tone="warning">
        Os textos do acervo ctresb/leis são transcrições compiladas. Revise cada artigo e confira a
        fonte primária antes de publicar ou marcar como verificado.
      </Notice>
      <section className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-primary">Normas</h2>
            <p className="text-sm text-muted-foreground">
              Revise o status editorial e confirme os textos nas fontes oficiais.
            </p>
          </div>
        </div>
        {isLoading ? (
          <Loading label="Carregando normas…" />
        ) : isError ? (
          <Notice tone="warning" title="Não foi possível carregar as normas">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error instanceof Error ? error.message : "Tente novamente."}</span>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            </div>
          </Notice>
        ) : norms.length === 0 ? (
          <EmptyState
            title="Nenhuma norma cadastrada"
            description="As normas exibidas na Wiki dependem dos metadados cadastrados no sistema."
          />
        ) : (
          norms.map((n) => (
            <div
              key={n.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3"
            >
              <span className="flex-1 font-medium">{n.short_name}</span>
              <StatusBadge tone={n.text_status === "verificado" ? "ok" : "pending"}>
                {TEXT_STATUS_LABEL[n.text_status]}
              </StatusBadge>
              {n.text_status === "importado" && (
                <Button size="sm" variant="outline" onClick={() => markVerified(n.id)}>
                  Marcar verificado
                </Button>
              )}
            </div>
          ))
        )}
      </section>
      <form onSubmit={addArticle} className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold text-primary">Importar artigo</h2>
        <div className="space-y-1.5">
          <Label htmlFor="nm">Norma</Label>
          <select
            id="nm"
            value={normId}
            onChange={(e) => {
              setNormId(e.target.value);
              setSourceArticles([]);
              setSourceArticleNumber("");
              setSourceUrl(null);
              setArt({ number: "", text: "", explanation: "" });
            }}
            className="h-12 w-full rounded-md border border-input bg-card px-3 text-base"
          >
            <option value="">Selecione…</option>
            {data?.map((n) => (
              <option key={n.id} value={n.id}>
                {n.short_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadSource}
            disabled={!normId || loadingSource}
          >
            {loadingSource ? "Carregando acervo…" : "Carregar do acervo ctresb/leis"}
          </Button>
          {sourceUrl && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {sourceArticles.length} itens (preâmbulo e artigos) carregados para revisão. Fonte:{" "}
                <a className="underline" href={sourceUrl} target="_blank" rel="noreferrer noopener">
                  ver arquivo no GitHub
                </a>
              </p>
              {data?.find((item) => item.id === normId)?.slug === "constituicao-federal" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={importConstitution}
                  disabled={importingConstitution}
                >
                  <FileDown />
                  {importingConstitution
                    ? "Importando texto…"
                    : "Importar texto faltante da Constituição"}
                </Button>
              )}
            </div>
          )}
        </div>
        {sourceArticles.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="source-article">Artigo do acervo</Label>
            <select
              id="source-article"
              value={sourceArticleNumber}
              onChange={(e) => {
                const selected = sourceArticles.find((item) => item.number === e.target.value);
                if (!selected) return;
                setSourceArticleNumber(selected.number);
                setArt((current) => ({ ...current, number: selected.number, text: selected.text }));
              }}
              className="h-12 w-full rounded-md border border-input bg-card px-3 text-base"
            >
              {sourceArticles.map((item) => (
                <option key={item.number} value={item.number}>
                  {item.number === "Preâmbulo" ? "Preâmbulo" : `Art. ${item.number}`}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="an">Número do artigo</Label>
          <Input
            id="an"
            value={art.number}
            onChange={(e) => setArt({ ...art, number: e.target.value })}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="at">Texto legal para revisão</Label>
          <Textarea
            id="at"
            rows={5}
            value={art.text}
            onChange={(e) => setArt({ ...art, text: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae">Explicação simples (opcional)</Label>
          <Textarea
            id="ae"
            rows={3}
            value={art.explanation}
            onChange={(e) => setArt({ ...art, explanation: e.target.value })}
          />
        </div>
        <Button type="submit" className="w-full">
          Adicionar artigo
        </Button>
      </form>
    </div>
  );
}

function AdminMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}
