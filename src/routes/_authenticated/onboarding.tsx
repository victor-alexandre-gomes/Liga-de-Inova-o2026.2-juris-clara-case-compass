import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: `Boas-vindas — ${BRAND.name}` },
      { name: "description", content: "Configure sua conta." },
      { property: "og:title", content: `Boas-vindas — ${BRAND.name}` },
      { property: "og:description", content: "Configure sua conta." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [type, setType] = useState<"citizen" | "lawyer">("citizen");
  const [oab, setOab] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setType(profile.account_type);
      setOab(profile.oab_number ?? "");
    }
  }, [profile]);

  async function finish() {
    if (!user) return;
    setBusy(true);
    if (type !== profile?.account_type) {
      const { error } = await supabase.rpc("set_account_type", { _type: type });
      if (error) {
        setBusy(false);
        return void toast.error("Não foi possível salvar o tipo de conta.");
      }
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim() || null,
        oab_number: type === "lawyer" ? oab.trim() || null : null,
        onboarded: true,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) return void toast.error("Não foi possível salvar. Tente novamente.");
    await refresh();
    navigate({ to: "/inicio" });
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-sm text-muted-foreground">Passo {step + 1} de 2</p>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-highlight transition-all"
          style={{ width: `${(step + 1) * 50}%` }}
        />
      </div>
      {step === 0 ? (
        <div className="mt-6 space-y-4">
          <h1 className="text-2xl font-semibold text-primary">Como podemos te chamar?</h1>
          <div className="space-y-1.5">
            <Label htmlFor="n">Nome</Label>
            <Input
              id="n"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <Button size="lg" className="w-full" onClick={() => setStep(1)}>
            Continuar
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <h1 className="text-2xl font-semibold text-primary">Qual é o seu perfil?</h1>
          <div className="grid gap-2">
            {(
              [
                ["citizen", "Cidadão", "Quero entender meus direitos e organizar um problema."],
                ["lawyer", "Advogado", "Pesquisa, cálculos, clientes e casos."],
              ] as const
            ).map(([v, l, d]) => (
              <button
                key={v}
                type="button"
                aria-pressed={type === v}
                onClick={() => setType(v)}
                className={cn(
                  "rounded-xl border bg-card p-4 text-left",
                  type === v && "border-highlight ring-2 ring-highlight/30",
                )}
              >
                <span className="block font-semibold">{l}</span>
                <span className="text-sm text-muted-foreground">{d}</span>
              </button>
            ))}
          </div>
          {type === "lawyer" && (
            <div className="space-y-1.5">
              <Label htmlFor="oab">Número da OAB (opcional)</Label>
              <Input
                id="oab"
                value={oab}
                onChange={(e) => setOab(e.target.value)}
                placeholder="Ex.: SP 123456"
                className="h-12 text-base"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setStep(0)}>
              Voltar
            </Button>
            <Button size="lg" className="flex-1" onClick={finish} disabled={busy}>
              {busy ? "Salvando…" : "Concluir"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
