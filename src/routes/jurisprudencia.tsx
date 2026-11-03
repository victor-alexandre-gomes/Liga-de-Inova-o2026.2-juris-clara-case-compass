import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gavel } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, Notice, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/jurisprudencia")({
  head: () => ({
    meta: [
      { title: `Pesquisa de jurisprudência — ${BRAND.name}` },
      {
        name: "description",
        content: "Pesquise decisões judiciais em fontes oficiais integradas.",
      },
      { property: "og:title", content: `Jurisprudência — ${BRAND.name}` },
      { property: "og:description", content: "Pesquise decisões judiciais em fontes oficiais." },
    ],
  }),
  component: Page,
});

function Page() {
  const [searched, setSearched] = useState(false);
  return (
    <AppShell>
      <PageHeader title="Jurisprudência" description="Decisões judiciais de fontes oficiais." />
      <Notice tone="warning" title="Nenhuma fonte de jurisprudência configurada">
        A integração com tribunais ainda não foi conectada. Nenhuma decisão é exibida até que uma
        fonte oficial esteja ativa — não criamos resultados fictícios.
      </Notice>
      <form
        className="mt-5 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
      >
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="t">Termos</Label>
          <Input id="t" className="h-12 text-base" placeholder="Ex.: produto com defeito" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trib">Tribunal</Label>
          <Input id="trib" className="h-12 text-base" placeholder="Ex.: TJSP, STJ" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proc">Número do processo</Label>
          <Input id="proc" inputMode="numeric" className="h-12 text-base" />
        </div>
        <Button type="submit" size="lg" className="sm:col-span-2">
          Pesquisar
        </Button>
      </form>
      {searched && (
        <div className="mt-6">
          <EmptyState
            icon={<Gavel className="h-5 w-5" />}
            title="Sem resultados"
            description="Não há fontes de jurisprudência integradas no momento."
          />
        </div>
      )}
    </AppShell>
  );
}
