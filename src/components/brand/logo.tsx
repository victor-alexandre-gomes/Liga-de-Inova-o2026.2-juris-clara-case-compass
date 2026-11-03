import { Scale } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2 rounded-lg", className)}
      aria-label={`${BRAND.name} — página inicial`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Scale className="h-5 w-5" aria-hidden />
      </span>
      {!compact && (
        <span className="font-serif text-xl font-semibold text-primary">{BRAND.name}</span>
      )}
    </Link>
  );
}
