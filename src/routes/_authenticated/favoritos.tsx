import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Loading, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: `Favoritos — ${BRAND.name}` },
      { name: "description", content: "Normas favoritas e histórico de pesquisas." },
      { property: "og:title", content: `Favoritos — ${BRAND.name}` },
      { property: "og:description", content: "Normas favoritas e histórico de pesquisas." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const [f, h] = await Promise.all([
        supabase.from("favorites").select("*").order("created_at", { ascending: false }),
        supabase
          .from("search_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      return { favs: f.data ?? [], hist: h.data ?? [] };
    },
  });
  if (isLoading || !data) return <Loading />;
  return (
    <div className="space-y-8">
      <PageHeader title="Favoritos e pesquisas" />
      <section>
        <h2 className="mb-3 text-lg font-semibold text-primary">Favoritos</h2>
        {data.favs.length === 0 ? (
          <EmptyState
            icon={<Star className="h-5 w-5" />}
            title="Nenhum favorito"
            description="Toque em “Favoritar” em uma norma da Wiki."
          />
        ) : (
          <ul className="space-y-2">
            {data.favs.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded-xl border bg-card p-3">
                <Link to="/wiki/$slug" params={{ slug: f.ref_slug }} className="flex-1 font-medium">
                  {f.label}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${f.label}`}
                  onClick={async () => {
                    await supabase.from("favorites").delete().eq("id", f.id);
                    toast.success("Removido");
                    refetch();
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Histórico de consultas</h2>
          {data.hist.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.from("search_history").delete().not("id", "is", null);
                toast.success("Histórico apagado");
                refetch();
              }}
            >
              Apagar
            </Button>
          )}
        </div>
        {data.hist.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pesquisa ainda.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {data.hist.map((h) => (
              <li key={h.id}>
                <Link
                  to="/wiki"
                  search={{ q: h.query }}
                  className="flex justify-between gap-2 p-3 text-sm"
                >
                  <span className="truncate">{h.query}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDateTime(h.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
