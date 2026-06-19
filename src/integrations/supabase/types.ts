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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          kind: string
          started_at: string
          stats: Json | null
          user_id: string | null
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          kind: string
          started_at?: string
          stats?: Json | null
          user_id?: string | null
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          started_at?: string
          stats?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      connections: {
        Row: {
          access_token: string | null
          created_at: string
          google_email: string | null
          id: string
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          scopes: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          google_email?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          scopes?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          google_email?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          scopes?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          occurred_at: string
          snippet: string | null
          source_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          occurred_at?: string
          snippet?: string | null
          source_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          occurred_at?: string
          snippet?: string | null
          source_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      promises: {
        Row: {
          channel: string | null
          confidence: number | null
          created_at: string
          draft_reply: string | null
          due_at: string | null
          evidence_snippet: string | null
          id: string
          last_nudged_at: string | null
          owed_to: string | null
          resolved_at: string | null
          source_id: string | null
          status: Database["public"]["Enums"]["promise_status"]
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string | null
          confidence?: number | null
          created_at?: string
          draft_reply?: string | null
          due_at?: string | null
          evidence_snippet?: string | null
          id?: string
          last_nudged_at?: string | null
          owed_to?: string | null
          resolved_at?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["promise_status"]
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string | null
          confidence?: number | null
          created_at?: string
          draft_reply?: string | null
          due_at?: string | null
          evidence_snippet?: string | null
          id?: string
          last_nudged_at?: string | null
          owed_to?: string | null
          resolved_at?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["promise_status"]
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promises_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      reliability_snapshots: {
        Row: {
          created_at: string
          id: string
          kept: number
          missed: number
          open_count: number
          score: number
          snapshot_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kept?: number
          missed?: number
          open_count?: number
          score: number
          snapshot_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kept?: number
          missed?: number
          open_count?: number
          score?: number
          snapshot_date?: string
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          body: string | null
          created_at: string
          external_id: string
          id: string
          kind: string
          occurred_at: string | null
          participants: string[] | null
          processed_at: string | null
          raw: Json | null
          subject: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          external_id: string
          id?: string
          kind: string
          occurred_at?: string | null
          participants?: string[] | null
          processed_at?: string | null
          raw?: Json | null
          subject?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          external_id?: string
          id?: string
          kind?: string
          occurred_at?: string | null
          participants?: string[] | null
          processed_at?: string | null
          raw?: Json | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          note: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          note?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      promise_status: "open" | "kept" | "missed" | "dismissed"
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
      promise_status: ["open", "kept", "missed", "dismissed"],
    },
  },
} as const
