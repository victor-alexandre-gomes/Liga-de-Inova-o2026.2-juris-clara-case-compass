import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: `Nova senha — ${BRAND.name}` },
      { name: "description", content: "Defina uma nova senha para sua conta." },
      { property: "og:title", content: `Nova senha — ${BRAND.name}` },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
    ],
  }),
  component: Page,
});

function Page() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen px-4 py-6">
      <Logo />
      <main className="mx-auto mt-8 max-w-md">
        <h1 className="text-3xl font-semibold text-primary">Criar nova senha</h1>
        <form
          className="mt-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pw.length < 8) return setError("A senha deve ter pelo menos 8 caracteres.");
            const { error } = await supabase.auth.updateUser({ password: pw });
            if (error) return setError("Link inválido ou expirado. Solicite um novo.");
            toast.success("Senha alterada.");
            navigate({ to: "/inicio" });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pw">Nova senha</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full">
            Salvar senha
          </Button>
        </form>
      </main>
    </div>
  );
}
