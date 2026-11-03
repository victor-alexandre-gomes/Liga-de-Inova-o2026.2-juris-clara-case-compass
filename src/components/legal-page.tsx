import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Notice } from "@/components/common";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-6">
      <Logo />
      <main className="mx-auto mt-8 max-w-2xl">
        <h1 className="text-3xl font-semibold text-primary">{title}</h1>
        <Notice tone="warning" className="mt-4">
          Documento-modelo provisório. Deve ser revisado por profissional antes da publicação.
        </Notice>
        <div className="mt-6 space-y-4 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-primary">
          {children}
        </div>
        <Link to="/" className="mt-10 block text-sm text-highlight">
          Voltar ao início
        </Link>
      </main>
    </div>
  );
}
