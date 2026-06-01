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
      adoption_artifacts: {
        Row: {
          content_md: string
          id: string
          kind: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_md: string
          id?: string
          kind: string
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content_md?: string
          id?: string
          kind?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoption_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      company_intakes: {
        Row: {
          budget_range: string | null
          business_goals: string | null
          change_mgmt_maturity: number | null
          company_name: string | null
          compliance_requirements: string | null
          created_at: string
          current_ai_maturity: number | null
          data_sensitivity: string | null
          departments: string[] | null
          desired_outcomes: string | null
          employee_count: string | null
          employee_readiness: number | null
          existing_ai_tools: string[] | null
          industry: string | null
          leadership_alignment: number | null
          operational_challenges: string | null
          project_id: string
          raw: Json | null
          timeline: string | null
        }
        Insert: {
          budget_range?: string | null
          business_goals?: string | null
          change_mgmt_maturity?: number | null
          company_name?: string | null
          compliance_requirements?: string | null
          created_at?: string
          current_ai_maturity?: number | null
          data_sensitivity?: string | null
          departments?: string[] | null
          desired_outcomes?: string | null
          employee_count?: string | null
          employee_readiness?: number | null
          existing_ai_tools?: string[] | null
          industry?: string | null
          leadership_alignment?: number | null
          operational_challenges?: string | null
          project_id: string
          raw?: Json | null
          timeline?: string | null
        }
        Update: {
          budget_range?: string | null
          business_goals?: string | null
          change_mgmt_maturity?: number | null
          company_name?: string | null
          compliance_requirements?: string | null
          created_at?: string
          current_ai_maturity?: number | null
          data_sensitivity?: string | null
          departments?: string[] | null
          desired_outcomes?: string | null
          employee_count?: string | null
          employee_readiness?: number | null
          existing_ai_tools?: string[] | null
          industry?: string | null
          leadership_alignment?: number | null
          operational_challenges?: string | null
          project_id?: string
          raw?: Json | null
          timeline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_intakes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_outputs: {
        Row: {
          content: Json
          id: string
          project_id: string
          section: string
          updated_at: string
          version: number
        }
        Insert: {
          content: Json
          id?: string
          project_id: string
          section: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: Json
          id?: string
          project_id?: string
          section?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_outputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_artifacts: {
        Row: {
          content_md: string
          id: string
          kind: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_md: string
          id?: string
          kind: string
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content_md?: string
          id?: string
          kind?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          adoption_score: number | null
          created_at: string
          governance_score: number | null
          health_score: number | null
          id: string
          name: string
          org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          adoption_score?: number | null
          created_at?: string
          governance_score?: number | null
          health_score?: number | null
          id?: string
          name: string
          org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          adoption_score?: number | null
          created_at?: string
          governance_score?: number | null
          health_score?: number | null
          id?: string
          name?: string
          org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          created_at: string
          id: string
          mitigation: string | null
          owner: string | null
          project_id: string
          severity: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          mitigation?: string | null
          owner?: string | null
          project_id: string
          severity?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          mitigation?: string | null
          owner?: string | null
          project_id?: string
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          created_at: string
          dependencies: string | null
          horizon: string
          id: string
          owner: string | null
          position: number | null
          priority: string | null
          project_id: string
          risks: string | null
          success_metric: string | null
          task: string
          timeline: string | null
        }
        Insert: {
          created_at?: string
          dependencies?: string | null
          horizon: string
          id?: string
          owner?: string | null
          position?: number | null
          priority?: string | null
          project_id: string
          risks?: string | null
          success_metric?: string | null
          task: string
          timeline?: string | null
        }
        Update: {
          created_at?: string
          dependencies?: string | null
          horizon?: string
          id?: string
          owner?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string
          risks?: string | null
          success_metric?: string | null
          task?: string
          timeline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transformation_scores: {
        Row: {
          category: string
          explanation: string | null
          id: string
          next_action: string | null
          project_id: string
          rating: string | null
          recommendation: string | null
          risk_level: string | null
          score: number
        }
        Insert: {
          category: string
          explanation?: string | null
          id?: string
          next_action?: string | null
          project_id: string
          rating?: string | null
          recommendation?: string | null
          risk_level?: string | null
          score: number
        }
        Update: {
          category?: string
          explanation?: string | null
          id?: string
          next_action?: string | null
          project_id?: string
          rating?: string | null
          recommendation?: string | null
          risk_level?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "transformation_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      use_cases: {
        Row: {
          ai_opportunity: string | null
          business_problem: string | null
          complexity: string | null
          created_at: string
          department: string | null
          expected_impact: string | null
          id: string
          name: string
          project_id: string
          quadrant: string | null
          recommended_owner: string | null
          required_data: string | null
          required_tools: string | null
          risk_level: string | null
          success_metric: string | null
          timeline: string | null
        }
        Insert: {
          ai_opportunity?: string | null
          business_problem?: string | null
          complexity?: string | null
          created_at?: string
          department?: string | null
          expected_impact?: string | null
          id?: string
          name: string
          project_id: string
          quadrant?: string | null
          recommended_owner?: string | null
          required_data?: string | null
          required_tools?: string | null
          risk_level?: string | null
          success_metric?: string | null
          timeline?: string | null
        }
        Update: {
          ai_opportunity?: string | null
          business_problem?: string | null
          complexity?: string | null
          created_at?: string
          department?: string | null
          expected_impact?: string | null
          id?: string
          name?: string
          project_id?: string
          quadrant?: string | null
          recommended_owner?: string | null
          required_data?: string | null
          required_tools?: string | null
          risk_level?: string | null
          success_metric?: string | null
          timeline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "use_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_org: { Args: { _org_id: string }; Returns: boolean }
      owns_project: { Args: { _project_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
