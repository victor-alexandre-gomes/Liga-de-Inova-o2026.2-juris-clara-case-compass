import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LawyerDirectoryRow = {
  user_id: string;
  display_name: string;
  description: string;
  practice_areas: string[];
  city: string;
  contact_email: string;
  is_published: boolean;
  updated_at: string;
};

type PublicLawyerDirectoryRow = Omit<LawyerDirectoryRow, "is_published">;

type DirectoryDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Views"> & {
    Tables: Database["public"]["Tables"] & {
      lawyer_directory: {
        Row: LawyerDirectoryRow;
        Insert: Partial<Omit<LawyerDirectoryRow, "user_id">> & {
          user_id: string;
          display_name: string;
        };
        Update: Partial<LawyerDirectoryRow>;
        Relationships: [];
      };
    };
    Views: {
      lawyer_directory_public: {
        Row: PublicLawyerDirectoryRow;
        Relationships: [];
      };
    };
  };
};

export const lawyerDirectorySupabase = supabase as unknown as SupabaseClient<DirectoryDatabase>;
