import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Loading, Notice } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { CASE_CATEGORIES, CASE_STATUS } from "@/lib/cases";
import { formatDateTime } from "@/lib/format";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/_authenticated/casos/$id")({
  head: () => ({
    meta: [
      { title: `Caso — ${BRAND.name}` },
      { name: "description", content: "Detalhes do caso." },
      { property: "og:title", content: `Caso — ${BRAND.name}` },
      { property: "og:description", content: "Detalhes do caso." },
    ],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => (await supabase.from("cases").select("*").eq("id", id).maybeSingle()).data,
  });
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    status: "rascunho",
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data)
      setForm({
        title: data.title,
        category: data.category,
        description: data.description ?? "",
        status: data.status,
      });
  }, [data]);

  if (isLoading) return <Loading />;
  if (!data)
    return (
      <EmptyState
        title="Caso não encontrado"
        description="Ele pode ter sido excluído."
        action={
          <Button asChild>
            <Link to="/casos">Meus casos</Link>
          </Button>
        }
      />
    );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 3) return void toast.error("Título muito curto.");
    setBusy(true);
    const { error } = await supabase
      .from("cases")
      .update({ ...form, title: form.title.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);
    setBusy(false);
    if (error)
      return void toast.error("Não foi possível salvar. Suas alterações continuam na tela.");
    toast.success("Alterações salvas");
    refetch();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/casos"
        className="mb-4 inline-flex h-10 items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Meus casos
      </Link>
      <h1 className="text-2xl font-semibold text-primary">{data.title}</h1>
      <p className="text-sm text-muted-foreground">
        Atualizado em {formatDateTime(data.updated_at)}
      </p>

      <Notice className="mt-4">
        Tudo aqui são fatos informados por você. Etapas guiadas (datas, valores, documentos, resumo
        e PDF) chegam nas próximas versões.
      </Notice>

      <form onSubmit={save} className="mt-5 space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="t">Título</Label>
          <Input
            id="t"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-12 text-base"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c">Categoria</Label>
            <select
              id="c"
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
            <Label htmlFor="s">Situação</Label>
            <select
              id="s"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="h-12 w-full rounded-md border border-input bg-card px-3 text-base"
            >
              {Object.entries(CASE_STATUS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d">Descrição dos acontecimentos</Label>
          <Textarea
            id="d"
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="text-base"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="mt-4 text-destructive">
            <Trash2 /> Excluir caso
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este caso?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const { error } = await supabase.from("cases").delete().eq("id", id);
                if (error) return void toast.error("Não foi possível excluir.");
                toast.success("Caso excluído");
                navigate({ to: "/casos" });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
