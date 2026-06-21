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
      audio_chunks: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          sequence: number
          session_id: string
          source_channel: string | null
          speaker: string | null
          started_at: string
          status: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          sequence: number
          session_id: string
          source_channel?: string | null
          speaker?: string | null
          started_at: string
          status?: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          sequence?: number
          session_id?: string
          source_channel?: string | null
          speaker?: string | null
          started_at?: string
          status?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_chunks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "capture_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      capture_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          label: string | null
          metadata: Json
          notes_md: string | null
          source: string
          started_at: string
          status: string
          summary: string | null
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          label?: string | null
          metadata?: Json
          notes_md?: string | null
          source?: string
          started_at?: string
          status?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          label?: string | null
          metadata?: Json
          notes_md?: string | null
          source?: string
          started_at?: string
          status?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
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
      device_link_codes: {
        Row: {
          approved_at: string | null
          code: string
          consumed_at: string | null
          created_at: string
          device_label: string | null
          expires_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          code: string
          consumed_at?: string | null
          created_at?: string
          device_label?: string | null
          expires_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          code?: string
          consumed_at?: string | null
          created_at?: string
          device_label?: string | null
          expires_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      extension_tokens: {
        Row: {
          created_at: string
          id: string
          label: string | null
          last_used_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      extraction_feedback: {
        Row: {
          created_at: string
          id: string
          note: string | null
          promise_id: string
          user_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          promise_id: string
          user_id: string
          verdict: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          promise_id?: string
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_feedback_promise_id_fkey"
            columns: ["promise_id"]
            isOneToOne: false
            referencedRelation: "promises"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_connections: {
        Row: {
          connected_at: string
          created_at: string
          email: string
          grant_id: string
          id: string
          last_sync_at: string | null
          provider: string
          scopes: string[]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          created_at?: string
          email: string
          grant_id: string
          id?: string
          last_sync_at?: string | null
          provider?: string
          scopes?: string[]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          created_at?: string
          email?: string
          grant_id?: string
          id?: string
          last_sync_at?: string | null
          provider?: string
          scopes?: string[]
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ingestion_errors: {
        Row: {
          context: Json | null
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      memory_items: {
        Row: {
          created_at: string
          embedding: string | null
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
          embedding?: string | null
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
          embedding?: string | null
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
      muted_sources: {
        Row: {
          created_at: string
          id: string
          label: string | null
          mute_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          mute_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          mute_key?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dedup_key: string
          emailed_at: string | null
          id: string
          kind: string
          promise_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dedup_key: string
          emailed_at?: string | null
          id?: string
          kind: string
          promise_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dedup_key?: string
          emailed_at?: string | null
          id?: string
          kind?: string
          promise_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_promise_id_fkey"
            columns: ["promise_id"]
            isOneToOne: false
            referencedRelation: "promises"
            referencedColumns: ["id"]
          },
        ]
      }
      page_events: {
        Row: {
          country: string | null
          created_at: string
          event_name: string
          id: string
          path: string | null
          properties: Json
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          event_name: string
          id?: string
          path?: string | null
          properties?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          event_name?: string
          id?: string
          path?: string | null
          properties?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: []
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
          capture_session_id: string | null
          channel: string | null
          confidence: number | null
          created_at: string
          draft_reply: string | null
          due_at: string | null
          embedding: string | null
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
          capture_session_id?: string | null
          channel?: string | null
          confidence?: number | null
          created_at?: string
          draft_reply?: string | null
          due_at?: string | null
          embedding?: string | null
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
          capture_session_id?: string | null
          channel?: string | null
          confidence?: number | null
          created_at?: string
          draft_reply?: string | null
          due_at?: string | null
          embedding?: string | null
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
            foreignKeyName: "promises_capture_session_id_fkey"
            columns: ["capture_session_id"]
            isOneToOne: false
            referencedRelation: "capture_sessions"
            referencedColumns: ["id"]
          },
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
      screen_frames: {
        Row: {
          app_name: string | null
          captured_at: string
          created_at: string
          error: string | null
          id: string
          ocr_text: string | null
          sequence: number
          session_id: string
          status: string
          url: string | null
          user_id: string
          vision_summary: string | null
          window_title: string | null
        }
        Insert: {
          app_name?: string | null
          captured_at: string
          created_at?: string
          error?: string | null
          id?: string
          ocr_text?: string | null
          sequence: number
          session_id: string
          status?: string
          url?: string | null
          user_id: string
          vision_summary?: string | null
          window_title?: string | null
        }
        Update: {
          app_name?: string | null
          captured_at?: string
          created_at?: string
          error?: string | null
          id?: string
          ocr_text?: string | null
          sequence?: number
          session_id?: string
          status?: string
          url?: string | null
          user_id?: string
          vision_summary?: string | null
          window_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screen_frames_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "capture_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          invite_email_id: string | null
          invited_at: string | null
          note: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invite_email_id?: string | null
          invited_at?: string | null
          note?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invite_email_id?: string | null
          invited_at?: string | null
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
      approve_device_link: {
        Args: { _code: string; _label: string }
        Returns: undefined
      }
      consume_device_link: {
        Args: { _code: string }
        Returns: {
          status: string
          user_id: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_capture_quota: { Args: { _user_id: string }; Returns: Json }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_memory_items: {
        Args: {
          _user_id: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          id: string
          kind: string
          occurred_at: string
          similarity: number
          snippet: string
          title: string
        }[]
      }
      match_promises: {
        Args: {
          _user_id: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          channel: string
          due_at: string
          evidence_snippet: string
          id: string
          owed_to: string
          similarity: number
          status: Database["public"]["Enums"]["promise_status"]
          summary: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      start_device_link: { Args: { _label: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
      promise_status: ["open", "kept", "missed", "dismissed"],
    },
  },
} as const
