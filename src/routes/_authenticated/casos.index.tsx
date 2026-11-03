import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronRight, FolderOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Loading, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CASE_CATEGORIES, CASE_STATUS } from "@/lib/cases";
import { formatDate } from "@/lib/format";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/_authenticated/casos/")({
  head: () => ({
    meta: [
      { title: `Meus casos — ${BRAND.name}` },
      { name: "description", content: "Organize seus problemas jurídicos." },
      { property: "og:title", content: `Meus casos — ${BRAND.name}` },
      { property: "og:description", content: "Organize seus problemas jurídicos." },
    ],
  }),
  component: CasesPage,
});

const DRAFT_KEY = "draft-new-case";

function CasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: CASE_CATEGORIES[0] as string,
    description: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem(DRAFT_KEY);
    if (d)
      try {
        setForm(JSON.parse(d));
      } catch {
        /* ignore */
      }
  }, []);
  useEffect(() => {
    if (open) localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, open]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cases"],
    queryFn: async () =>
      (await supabase.from("cases").select("*").order("updated_at", { ascending: false })).data ??
      [],
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 3) return setErr("Dê um título com pelo menos 3 letras.");
    setBusy(true);
    const { data: row, error } = await supabase
      .from("cases")
      .insert({
        user_id: user!.id,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim() || null,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error)
      return setErr("Não foi possível salvar. Seus dados continuam aqui — tente novamente.");
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Caso criado");
    setOpen(false);
    setForm({ title: "", category: CASE_CATEGORIES[0], description: "" });
    refetch();
    navigate({ to: "/casos/$id", params: { id: row.id } });
  }

  return (
    <div>
      <PageHeader
        title="Meus casos"
        description="Organize fatos, datas e documentos."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Novo caso
          </Button>
        }
      />
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="Nenhum caso ainda"
          description="Crie um caso para começar a organizar seu problema jurídico."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus /> Criar primeiro caso
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {data.map((c) => (
            <li key={c.id}>
              <Link
                to="/casos/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.category} · atualizado em {formatDate(c.updated_at)}
                  </p>
                </div>
                <StatusBadge tone={c.status === "concluido" ? "ok" : "neutral"}>
                  {CASE_STATUS[c.status] ?? c.status}
                </StatusBadge>
                <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] overflow-y-auto rounded-t-2xl pb-safe sm:mx-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Novo caso</SheetTitle>
          </SheetHeader>
          <form onSubmit={create} className="space-y-4 px-4 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="ct">Título</Label>
              <Input
                id="ct"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Celular com defeito"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc">Categoria</Label>
              <select
                id="cc"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-12 w-full rounded-md border border-input bg-card px-3 text-base"
              >
                {CASE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cd">O que aconteceu? (opcional)</Label>
              <Textarea
                id="cd"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="text-base"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Rascunho salvo automaticamente neste aparelho.
            </p>
            {err && (
              <p role="alert" className="text-sm text-destructive">
                {err}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Salvando…" : "Criar caso"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
