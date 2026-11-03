import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Home,
  BookOpen,
  Calculator,
  FolderOpen,
  User,
  Search,
  Bell,
  BookA,
  Gavel,
  Sparkles,
  Star,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/wiki", label: "Wiki", icon: BookOpen },
  { to: "/calculadoras", label: "Calculadoras", icon: Calculator },
  { to: "/casos", label: "Meus casos", icon: FolderOpen },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

const SECONDARY = [
  { to: "/dicionario", label: "Dicionário", icon: BookA },
  { to: "/jurisprudencia", label: "Jurisprudência", icon: Gavel },
  { to: "/assistente", label: "Assistente", icon: Sparkles },
  { to: "/favoritos", label: "Favoritos", icon: Star },
] as const;

function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] translate-y-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-base">Buscar</DialogTitle>
        </DialogHeader>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenChange(false);
            navigate({ to: "/wiki", search: { q: q.trim() || undefined } });
          }}
          className="flex gap-2"
        >
          <label htmlFor="global-search" className="sr-only">
            Pesquisar leis, artigos e termos
          </label>
          <Input
            id="global-search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Lei, artigo ou termo jurídico"
            className="h-11 text-base"
          />
          <Button type="submit" aria-label="Pesquisar">
            <Search />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Notifications() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="!size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-sm font-semibold">Notificações</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Você não tem notificações. Avisos de atualização das normas que você acompanha aparecerão
          aqui.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem("sidebar-collapsed", c ? "0" : "1");
      return !c;
    });
  };

  const initial = (profile?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3"
      >
        Pular para o conteúdo
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-sidebar transition-[width] lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
        aria-label="Navegação principal"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Logo compact={collapsed} />
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Recolher menu">
              <PanelLeftClose />
            </Button>
          )}
        </div>
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Expandir menu"
            className="mx-auto"
          >
            <PanelLeftOpen />
          </Button>
        )}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {[
            ...PRIMARY,
            ...SECONDARY,
            ...(isAdmin
              ? [{ to: "/admin", label: "Administração", icon: ShieldCheck } as const]
              : []),
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground" }}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              {!collapsed && <span>{item.label}</span>}
              {collapsed && <span className="sr-only">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <div className={cn("transition-[padding]", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 lg:h-16">
            <div className="lg:hidden">
              <Logo />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="ml-auto flex h-11 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground lg:ml-0 lg:w-80"
              aria-label="Abrir busca"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Buscar leis e termos…</span>
              <kbd className="ml-auto hidden rounded border px-1.5 text-xs lg:inline">Ctrl K</kbd>
            </button>
            <div className="flex items-center lg:ml-auto">
              <Notifications />
              {user ? (
                <Link
                  to="/perfil"
                  aria-label="Meu perfil"
                  className="ml-1 hidden h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground sm:grid"
                >
                  {initial}
                </Link>
              ) : (
                <Button asChild size="sm" className="ml-1">
                  <Link to="/auth">
                    <LogIn /> Entrar
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main id="conteudo" className="mx-auto max-w-5xl px-4 py-5 pb-safe-nav lg:py-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur lg:hidden pb-safe"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {PRIMARY.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
                activeProps={{ className: "!text-primary", "aria-current": "page" }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-7 w-12 place-items-center rounded-full",
                        isActive && "bg-accent",
                      )}
                    >
                      <item.icon className="h-5 w-5" aria-hidden />
                    </span>
                    {item.label}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
