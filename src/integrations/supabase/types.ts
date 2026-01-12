export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          path: string | null
          ref: string | null
          sid: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          path?: string | null
          ref?: string | null
          sid: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          path?: string | null
          ref?: string | null
          sid?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          confidential_message: string | null
          content: Json | null
          created_at: string
          decision_log: Json | null
          detail_level: Database["public"]["Enums"]["detail_level"]
          featured: boolean | null
          id: string
          media: Json | null
          metrics: Json | null
          published: boolean | null
          related_projects: string[] | null
          sections_config: Json | null
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          confidential_message?: string | null
          content?: Json | null
          created_at?: string
          decision_log?: Json | null
          detail_level?: Database["public"]["Enums"]["detail_level"]
          featured?: boolean | null
          id?: string
          media?: Json | null
          metrics?: Json | null
          published?: boolean | null
          related_projects?: string[] | null
          sections_config?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          confidential_message?: string | null
          content?: Json | null
          created_at?: string
          decision_log?: Json | null
          detail_level?: Database["public"]["Enums"]["detail_level"]
          featured?: boolean | null
          id?: string
          media?: Json | null
          metrics?: Json | null
          published?: boolean | null
          related_projects?: string[] | null
          sections_config?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          admin_user_id: string | null
          bootstrap_token_hash: string | null
          created_at: string
          draft_json: Json | null
          draft_updated_at: string | null
          home_sections: Json
          id: string
          nav_config: Json
          pages: Json
          published_at: string | null
          published_json: Json | null
          published_version: number | null
          seo: Json
          theme: Json
          updated_at: string
        }
        Insert: {
          admin_user_id?: string | null
          bootstrap_token_hash?: string | null
          created_at?: string
          draft_json?: Json | null
          draft_updated_at?: string | null
          home_sections?: Json
          id?: string
          nav_config?: Json
          pages?: Json
          published_at?: string | null
          published_json?: Json | null
          published_version?: number | null
          seo?: Json
          theme?: Json
          updated_at?: string
        }
        Update: {
          admin_user_id?: string | null
          bootstrap_token_hash?: string | null
          created_at?: string
          draft_json?: Json | null
          draft_updated_at?: string | null
          home_sections?: Json
          id?: string
          nav_config?: Json
          pages?: Json
          published_at?: string | null
          published_json?: Json | null
          published_version?: number | null
          seo?: Json
          theme?: Json
          updated_at?: string
        }
        Relationships: []
      }
      writing_categories: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          name: string
          order_index: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      writing_items: {
        Row: {
          category_id: string | null
          created_at: string
          enabled: boolean | null
          featured: boolean | null
          id: string
          language: Database["public"]["Enums"]["language_type"] | null
          order_index: number | null
          platform_label: string | null
          published_at: string | null
          show_why: boolean | null
          title: string
          updated_at: string
          url: string
          why_this_matters: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          enabled?: boolean | null
          featured?: boolean | null
          id?: string
          language?: Database["public"]["Enums"]["language_type"] | null
          order_index?: number | null
          platform_label?: string | null
          published_at?: string | null
          show_why?: boolean | null
          title: string
          updated_at?: string
          url: string
          why_this_matters?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          enabled?: boolean | null
          featured?: boolean | null
          id?: string
          language?: Database["public"]["Enums"]["language_type"] | null
          order_index?: number | null
          platform_label?: string | null
          published_at?: string | null
          show_why?: boolean | null
          title?: string
          updated_at?: string
          url?: string
          why_this_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "writing_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "writing_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_site_settings: {
        Row: {
          created_at: string | null
          home_sections: Json | null
          id: string | null
          nav_config: Json | null
          pages: Json | null
          published_at: string | null
          published_version: number | null
          seo: Json | null
          theme: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          home_sections?: never
          id?: string | null
          nav_config?: never
          pages?: never
          published_at?: string | null
          published_version?: number | null
          seo?: never
          theme?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          home_sections?: never
          id?: string | null
          nav_config?: never
          pages?: never
          published_at?: string | null
          published_version?: number | null
          seo?: never
          theme?: never
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_set_admin: { Args: { token: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      publish_site_settings: { Args: never; Returns: Json }
      save_draft_settings: { Args: { draft_data: Json }; Returns: Json }
    }
    Enums: {
      detail_level: "FULL" | "SUMMARY" | "MINIMAL"
      language_type: "AUTO" | "AR" | "EN"
      project_status: "PUBLIC" | "CONFIDENTIAL" | "CONCEPT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      detail_level: ["FULL", "SUMMARY", "MINIMAL"],
      language_type: ["AUTO", "AR", "EN"],
      project_status: ["PUBLIC", "CONFIDENTIAL", "CONCEPT"],
    },
  },
} as const
