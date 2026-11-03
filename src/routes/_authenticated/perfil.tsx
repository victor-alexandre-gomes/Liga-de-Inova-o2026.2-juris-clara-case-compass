import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, LogOut, ShieldCheck, Star } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: `Perfil e configurações — ${BRAND.name}` },
      { name: "description", content: "Seus dados, privacidade e conta." },
      { property: "og:title", content: `Perfil — ${BRAND.name}` },
      { property: "og:description", content: "Seus dados, privacidade e conta." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, profile, isAdmin, refresh } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [oab, setOab] = useState("");
  useEffect(() => {
    setName(profile?.full_name ?? "");
    setOab(profile?.oab_number ?? "");
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() || null, oab_number: oab.trim() || null })
      .eq("id", user!.id);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Perfil atualizado");
    refresh();
  }

  async function switchType() {
    const next = profile?.account_type === "lawyer" ? "citizen" : "lawyer";
    const { error } = await supabase.rpc("set_account_type", { _type: next });
    if (error) return void toast.error("Não foi possível alterar.");
    toast.success("Tipo de conta alterado");
    refresh();
  }

  async function exportData() {
    const [p, c, f, h] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("cases").select("*"),
      supabase.from("favorites").select("*"),
      supabase.from("search_history").select("*"),
    ]);
    const blob = new Blob(
      [
        JSON.stringify(
          {
            email: user?.email,
            perfil: p.data,
            casos: c.data,
            favoritos: f.data,
            historico: h.data,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meus-dados.json";
    a.click();
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Perfil" description={user?.email ?? ""} />
      <form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="n">Nome</Label>
          <Input
            id="n"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        {profile?.account_type === "lawyer" && (
          <div className="space-y-1.5">
            <Label htmlFor="o">OAB</Label>
            <Input
              id="o"
              value={oab}
              onChange={(e) => setOab(e.target.value)}
              className="h-12 text-base"
            />
          </div>
        )}
        <Button type="submit" className="w-full">
          Salvar
        </Button>
      </form>

      <section className="space-y-2 rounded-xl border bg-card p-4">
        <h2 className="font-sans font-semibold">Tipo de conta</h2>
        <p className="text-sm text-muted-foreground">
          Atual: {profile?.account_type === "lawyer" ? "Advogado" : "Cidadão"}
        </p>
        <Button variant="outline" onClick={switchType}>
          Mudar para {profile?.account_type === "lawyer" ? "Cidadão" : "Advogado"}
        </Button>
      </section>

      <nav className="grid gap-2">
        <Button asChild variant="outline" className="justify-start">
          <Link to="/favoritos">
            <Star /> Favoritos e pesquisas
          </Link>
        </Button>
        {isAdmin && (
          <Button asChild variant="outline" className="justify-start">
            <Link to="/admin">
              <ShieldCheck /> Painel administrativo
            </Link>
          </Button>
        )}
      </nav>

      <section className="space-y-2 rounded-xl border bg-card p-4">
        <h2 className="font-sans font-semibold">Privacidade (LGPD)</h2>
        <p className="text-sm text-muted-foreground">
          Baixe uma cópia dos seus dados. Para excluir a conta, escreva para {BRAND.supportEmail}.
        </p>
        <Button variant="outline" onClick={exportData}>
          <Download /> Exportar meus dados
        </Button>
        <div className="flex gap-4 pt-1 text-sm">
          <Link to="/termos" className="text-highlight">
            Termos
          </Link>
          <Link to="/privacidade" className="text-highlight">
            Privacidade
          </Link>
        </div>
      </section>

      <Button variant="ghost" className="w-full text-destructive" onClick={signOut}>
        <LogOut /> Sair
      </Button>
    </div>
  );
}
