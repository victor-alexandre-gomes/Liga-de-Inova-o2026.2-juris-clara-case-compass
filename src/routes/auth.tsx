import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Entrar ou criar conta — ${BRAND.name}` },
      { name: "description", content: `Acesse sua conta ${BRAND.name}.` },
      { property: "og:title", content: `Entrar — ${BRAND.name}` },
      { property: "og:description", content: `Acesse sua conta ${BRAND.name}.` },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [type, setType] = useState<"citizen" | "lawyer">("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/inicio", replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    if (mode === "signup") {
      if (name.trim().length < 2) return setError("Informe seu nome.");
      if (password.length < 8) return setError("A senha deve ter pelo menos 8 caracteres.");
      if (!accepted) return setError("É preciso aceitar os Termos e a Política de Privacidade.");
    }
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        const unconfirmed = error.message.toLowerCase().includes("email not confirmed");
        setNeedsConfirmation(unconfirmed);
        return setError(
          unconfirmed
            ? "Este e-mail ainda não foi confirmado. Abra a mensagem de confirmação enviada para sua caixa de entrada."
            : "E-mail ou senha incorretos.",
        );
      }
      toast.success("Bem-vindo de volta!");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/inicio",
          data: { full_name: name.trim(), account_type: type },
        },
      });
      setBusy(false);
      if (error)
        return setError(
          error.message.includes("registered")
            ? "Este e-mail já está cadastrado."
            : "Não foi possível criar a conta. Tente novamente.",
        );
      setSent(true);
    }
  }

  async function resendConfirmation() {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/inicio` },
    });
    setResending(false);
    if (error) return void toast.error("Não foi possível reenviar a confirmação. Tente novamente.");
    toast.success("E-mail de confirmação reenviado. Confira também a pasta de spam.");
  }

  return (
    <div className="flex min-h-screen flex-col px-4 py-6">
      <Logo />
      <main className="mx-auto mt-8 w-full max-w-md">
        {sent ? (
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <h1 className="text-2xl font-semibold text-primary">Confirme seu e-mail</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enviamos um link para <strong>{email}</strong>. Abra-o para ativar sua conta.
            </p>
            <Button
              className="mt-5 w-full"
              variant="outline"
              onClick={() => {
                setSent(false);
                setMode("login");
              }}
            >
              Voltar ao login
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-primary">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h1>
            <div role="tablist" className="mt-5 grid grid-cols-2 rounded-lg bg-muted p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={cn(
                    "h-10 rounded-md text-sm font-semibold",
                    mode === m ? "bg-card shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {m === "login" ? "Entrar" : "Cadastrar"}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
              {mode === "signup" && (
                <>
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">
                      Como você vai usar o {BRAND.name}?
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["citizen", "Cidadão", "Quero entender meus direitos"],
                          ["lawyer", "Advogado", "Uso profissional"],
                        ] as const
                      ).map(([v, l, d]) => (
                        <label
                          key={v}
                          className={cn(
                            "cursor-pointer rounded-xl border bg-card p-3",
                            type === v && "border-highlight ring-2 ring-highlight/30",
                          )}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={v}
                            checked={type === v}
                            onChange={() => setType(v)}
                            className="sr-only"
                          />
                          <span className="block text-sm font-semibold">{l}</span>
                          <span className="block text-xs text-muted-foreground">{d}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              {mode === "signup" && (
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5"
                  />
                  <span>
                    Li e aceito os{" "}
                    <Link to="/termos" className="text-highlight underline">
                      Termos de uso
                    </Link>{" "}
                    e a{" "}
                    <Link to="/privacidade" className="text-highlight underline">
                      Política de privacidade
                    </Link>
                    .
                  </span>
                </label>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              {needsConfirmation && mode === "login" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={resendConfirmation}
                  disabled={resending}
                >
                  {resending ? "Reenviando…" : "Reenviar e-mail de confirmação"}
                </Button>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
              {mode === "login" && (
                <Link to="/recuperar-senha" className="block text-center text-sm text-highlight">
                  Esqueci minha senha
                </Link>
              )}
            </form>
          </>
        )}
      </main>
    </div>
  );
}
