import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Calculator, FolderOpen, ShieldCheck, Scale, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/brand";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND.name} — Seus direitos, explicados com clareza` },
      { name: "description", content: BRAND.description },
      { property: "og:title", content: `${BRAND.name} — Seus direitos, explicados com clareza` },
      { property: "og:description", content: BRAND.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: BookOpen,
    title: "Wiki jurídica",
    text: "Leis organizadas, com fonte oficial e explicação simples.",
  },
  {
    icon: Calculator,
    title: "Calculadoras",
    text: "Estimativas com memória de cálculo e fundamentação.",
  },
  {
    icon: FolderOpen,
    title: "Organize seu caso",
    text: "Fatos, datas, valores e documentos em um só lugar.",
  },
  {
    icon: Sparkles,
    title: "Assistente com fontes",
    text: "Respostas baseadas apenas em fontes verificáveis.",
  },
];

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/wiki">Wiki</Link>
          </Button>
          {user ? (
            <Button asChild>
              <Link to="/inicio">Abrir app</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:pt-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Scale className="h-3.5 w-3.5" aria-hidden /> Para cidadãos e advogados
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-primary sm:text-6xl">
            Seus direitos, explicados com clareza.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Pesquise leis, entenda procedimentos dos Juizados Especiais e organize seu caso — com
            fontes oficiais à vista.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to={user ? "/inicio" : "/auth"}>
                {user ? "Ir para o início" : "Criar conta grátis"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/wiki">Explorar a Wiki</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-3 px-4 pb-12 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 rounded-xl border bg-card p-5 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-sans text-base font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="flex gap-3 rounded-xl bg-primary p-6 text-primary-foreground">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p className="text-sm">
              O {BRAND.name} oferece informação jurídica e ferramentas de organização. Não substitui
              a orientação de um advogado ou da Defensoria Pública.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-4 px-4 py-6 text-sm text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {BRAND.name}
          </span>
          <Link to="/termos" className="hover:text-foreground">
            Termos de uso
          </Link>
          <Link to="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
