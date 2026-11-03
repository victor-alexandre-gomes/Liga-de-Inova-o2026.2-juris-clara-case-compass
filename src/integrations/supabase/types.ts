export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          created_at: string;
          entity: string | null;
          entity_id: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      cases: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          label: string;
          ref_slug: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          label: string;
          ref_slug: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          label?: string;
          ref_slug?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      glossary_terms: {
        Row: {
          created_at: string;
          definition: string;
          example: string | null;
          id: string;
          related_refs: string[];
          slug: string;
          term: string;
        };
        Insert: {
          created_at?: string;
          definition: string;
          example?: string | null;
          id?: string;
          related_refs?: string[];
          slug: string;
          term: string;
        };
        Update: {
          created_at?: string;
          definition?: string;
          example?: string | null;
          id?: string;
          related_refs?: string[];
          slug?: string;
          term?: string;
        };
        Relationships: [];
      };
      norm_articles: {
        Row: {
          article_number: string;
          id: string;
          legal_text: string;
          norm_id: string;
          plain_explanation: string | null;
          position: number;
          source_version: number;
          verified_at: string | null;
        };
        Insert: {
          article_number: string;
          id?: string;
          legal_text: string;
          norm_id: string;
          plain_explanation?: string | null;
          position?: number;
          source_version?: number;
          verified_at?: string | null;
        };
        Update: {
          article_number?: string;
          id?: string;
          legal_text?: string;
          norm_id?: string;
          plain_explanation?: string | null;
          position?: number;
          source_version?: number;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "norm_articles_norm_id_fkey";
            columns: ["norm_id"];
            isOneToOne: false;
            referencedRelation: "norms";
            referencedColumns: ["id"];
          },
        ];
      };
      norm_updates: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          norm_id: string;
          source_consulted: string | null;
          version: number | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          norm_id: string;
          source_consulted?: string | null;
          version?: number | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          norm_id?: string;
          source_consulted?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "norm_updates_norm_id_fkey";
            columns: ["norm_id"];
            isOneToOne: false;
            referencedRelation: "norms";
            referencedColumns: ["id"];
          },
        ];
      };
      norms: {
        Row: {
          category: string;
          content_version: number;
          created_at: string;
          id: string;
          last_verified_at: string | null;
          norm_type: string;
          number: string | null;
          official_name: string;
          official_url: string | null;
          plain_summary: string | null;
          short_name: string;
          signed_on: string | null;
          slug: string;
          source_name: string | null;
          source_type: string;
          text_status: string;
          updated_at: string;
          vigency_status: string;
          year: number | null;
        };
        Insert: {
          category: string;
          content_version?: number;
          created_at?: string;
          id?: string;
          last_verified_at?: string | null;
          norm_type: string;
          number?: string | null;
          official_name: string;
          official_url?: string | null;
          plain_summary?: string | null;
          short_name: string;
          signed_on?: string | null;
          slug: string;
          source_name?: string | null;
          source_type?: string;
          text_status?: string;
          updated_at?: string;
          vigency_status?: string;
          year?: number | null;
        };
        Update: {
          category?: string;
          content_version?: number;
          created_at?: string;
          id?: string;
          last_verified_at?: string | null;
          norm_type?: string;
          number?: string | null;
          official_name?: string;
          official_url?: string | null;
          plain_summary?: string | null;
          short_name?: string;
          signed_on?: string | null;
          slug?: string;
          source_name?: string | null;
          source_type?: string;
          text_status?: string;
          updated_at?: string;
          vigency_status?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_type: string;
          created_at: string;
          full_name: string | null;
          id: string;
          oab_number: string | null;
          onboarded: boolean;
          updated_at: string;
        };
        Insert: {
          account_type?: string;
          created_at?: string;
          full_name?: string | null;
          id: string;
          oab_number?: string | null;
          onboarded?: boolean;
          updated_at?: string;
        };
        Update: {
          account_type?: string;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          oab_number?: string | null;
          onboarded?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      search_history: {
        Row: {
          created_at: string;
          id: string;
          query: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          query: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          query?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      set_account_type: { Args: { _type: string }; Returns: undefined };
    };
    Enums: {
      app_role: "admin" | "lawyer" | "citizen";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "lawyer", "citizen"],
    },
  },
} as const;
