import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, Loading, Notice, PageHeader } from "@/components/common";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/dicionario")({
  head: () => ({
    meta: [
      { title: `Dicionário jurídico — ${BRAND.name}` },
      {
        name: "description",
        content: "Termos jurídicos explicados em linguagem simples, com exemplos.",
      },
      { property: "og:title", content: `Dicionário jurídico — ${BRAND.name}` },
      { property: "og:description", content: "Termos jurídicos explicados em linguagem simples." },
    ],
  }),
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["glossary"],
    queryFn: async () =>
      (await supabase.from("glossary_terms").select("*").order("term")).data ?? [],
  });
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const list = (data ?? []).filter((t) => norm(t.term).includes(norm(q)));
  return (
    <AppShell>
      <PageHeader title="Dicionário jurídico" description="Termos explicados sem juridiquês." />
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <label htmlFor="dq" className="sr-only">
          Pesquisar termo
        </label>
        <Input
          id="dq"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex.: sentença, recurso"
          className="h-12 pl-9 text-base"
        />
      </div>
      <Notice className="mt-4">
        Definições editoriais simplificadas. Não substituem o texto legal.
      </Notice>
      <div className="mt-4 space-y-3">
        {isLoading && <Loading />}
        {data && list.length === 0 && (
          <EmptyState title="Termo não encontrado" description="Tente outra palavra." />
        )}
        {list.map((t) => (
          <article
            key={t.id}
            id={t.slug}
            className="scroll-mt-24 rounded-xl border bg-card p-4 shadow-card"
          >
            <h2 className="text-lg font-semibold text-primary">{t.term}</h2>
            <p className="mt-1 text-sm leading-relaxed">{t.definition}</p>
            {t.example && (
              <p className="mt-2 rounded-lg bg-muted p-3 text-sm">
                <span className="font-semibold">Exemplo: </span>
                {t.example}
              </p>
            )}
            {t.related_refs.length > 0 && (
              <ul className="mt-2 text-xs text-muted-foreground">
                {t.related_refs.map((r) => (
                  <li key={r}>↳ {r}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
