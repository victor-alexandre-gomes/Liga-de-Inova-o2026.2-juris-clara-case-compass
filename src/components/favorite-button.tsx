import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function FavoriteButton({
  kind,
  refSlug,
  label,
}: {
  kind: string;
  refSlug: string;
  label: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["fav", kind, refSlug, user?.id];
  const { data: fav } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("favorites")
          .select("id")
          .eq("kind", kind)
          .eq("ref_slug", refSlug)
          .maybeSingle()
      ).data,
  });
  if (!user) return null;
  return (
    <Button
      variant="outline"
      aria-pressed={!!fav}
      onClick={async () => {
        const { error } = fav
          ? await supabase.from("favorites").delete().eq("id", fav.id)
          : await supabase
              .from("favorites")
              .insert({ user_id: user.id, kind, ref_slug: refSlug, label });
        if (error) return void toast.error("Não foi possível atualizar o favorito.");
        toast.success(fav ? "Removido dos favoritos" : "Salvo nos favoritos");
        qc.invalidateQueries({ queryKey: key });
        qc.invalidateQueries({ queryKey: ["favorites"] });
      }}
    >
      <Star className={fav ? "fill-current text-highlight" : ""} /> {fav ? "Favorito" : "Favoritar"}
    </Button>
  );
}
