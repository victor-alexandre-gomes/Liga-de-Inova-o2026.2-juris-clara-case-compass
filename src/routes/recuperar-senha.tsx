import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: `Recuperar senha — ${BRAND.name}` },
      { name: "description", content: "Receba um link para redefinir sua senha." },
      { property: "og:title", content: `Recuperar senha — ${BRAND.name}` },
      { property: "og:description", content: "Receba um link para redefinir sua senha." },
    ],
  }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="min-h-screen px-4 py-6">
      <Logo />
      <main className="mx-auto mt-8 max-w-md">
        <h1 className="text-3xl font-semibold text-primary">Recuperar senha</h1>
        {sent ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Se houver uma conta com <strong>{email}</strong>, você receberá um link para criar uma
            nova senha.
          </p>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/redefinir-senha`,
              });
              setBusy(false);
              if (error) setError("Não foi possível enviar. Verifique o e-mail e tente novamente.");
              else setSent(true);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Enviando…" : "Enviar link"}
            </Button>
          </form>
        )}
        <Link to="/auth" className="mt-6 block text-center text-sm text-highlight">
          Voltar ao login
        </Link>
      </main>
    </div>
  );
}
