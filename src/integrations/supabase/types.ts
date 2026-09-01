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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          farm_id: string | null
          id: string
          is_read: boolean
          kind: string
          message: string
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_id?: string | null
          id?: string
          is_read?: boolean
          kind: string
          message: string
          severity?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          message?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      case_validations: {
        Row: {
          ai_label: string | null
          case_kind: string
          created_at: string
          detection_id: string
          expert_label: string | null
          farmer_id: string
          id: string
          notes: string | null
          officer_id: string
          response_minutes: number
          status: string
        }
        Insert: {
          ai_label?: string | null
          case_kind: string
          created_at?: string
          detection_id: string
          expert_label?: string | null
          farmer_id: string
          id?: string
          notes?: string | null
          officer_id: string
          response_minutes?: number
          status: string
        }
        Update: {
          ai_label?: string | null
          case_kind?: string
          created_at?: string
          detection_id?: string
          expert_label?: string | null
          farmer_id?: string
          id?: string
          notes?: string | null
          officer_id?: string
          response_minutes?: number
          status?: string
        }
        Relationships: []
      }
      crop_profiles: {
        Row: {
          created_at: string
          crop_name: string
          farm_id: string
          growth_stage: string
          id: string
          sowing_date: string
          updated_at: string
          user_id: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          farm_id: string
          growth_stage?: string
          id?: string
          sowing_date?: string
          updated_at?: string
          user_id: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          farm_id?: string
          growth_stage?: string
          id?: string
          sowing_date?: string
          updated_at?: string
          user_id?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_profiles_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: true
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      detections: {
        Row: {
          brown_ratio: number
          confidence: number
          created_at: string
          description: string | null
          disease_name: string | null
          farm_id: string | null
          green_ratio: number
          id: string
          image_path: string | null
          label: string
          severity: string | null
          source: string
          treatment: string | null
          user_id: string
          yellow_ratio: number
        }
        Insert: {
          brown_ratio?: number
          confidence: number
          created_at?: string
          description?: string | null
          disease_name?: string | null
          farm_id?: string | null
          green_ratio?: number
          id?: string
          image_path?: string | null
          label: string
          severity?: string | null
          source?: string
          treatment?: string | null
          user_id: string
          yellow_ratio?: number
        }
        Update: {
          brown_ratio?: number
          confidence?: number
          created_at?: string
          description?: string | null
          disease_name?: string | null
          farm_id?: string | null
          green_ratio?: number
          id?: string
          image_path?: string | null
          label?: string
          severity?: string | null
          source?: string
          treatment?: string | null
          user_id?: string
          yellow_ratio?: number
        }
        Relationships: [
          {
            foreignKeyName: "detections_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          moisture_threshold: number
          name: string
          share_surveillance: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          moisture_threshold?: number
          name: string
          share_surveillance?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          moisture_threshold?: number
          name?: string
          share_surveillance?: boolean
          user_id?: string
        }
        Relationships: []
      }
      pest_detections: {
        Row: {
          confidence: number
          created_at: string
          crop_stage: string
          damage_ratio: number
          description: string | null
          farm_id: string | null
          id: string
          image_path: string | null
          infestation_severity: string
          ipm_action: string
          pest_name: string
          source: string
          texture_variance: number
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          crop_stage?: string
          damage_ratio?: number
          description?: string | null
          farm_id?: string | null
          id?: string
          image_path?: string | null
          infestation_severity?: string
          ipm_action?: string
          pest_name: string
          source?: string
          texture_variance?: number
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          crop_stage?: string
          damage_ratio?: number
          description?: string | null
          farm_id?: string | null
          id?: string
          image_path?: string | null
          infestation_severity?: string
          ipm_action?: string
          pest_name?: string
          source?: string
          texture_variance?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pest_detections_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      pest_trap_logs: {
        Row: {
          count: number
          created_at: string
          farm_id: string | null
          id: string
          location: string | null
          logged_on: string
          notes: string | null
          pest_type: string
          trap_type: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          farm_id?: string | null
          id?: string
          location?: string | null
          logged_on?: string
          notes?: string | null
          pest_type: string
          trap_type?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          farm_id?: string | null
          id?: string
          location?: string | null
          logged_on?: string
          notes?: string | null
          pest_type?: string
          trap_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pest_trap_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          confidence: number
          created_at: string
          farm_id: string | null
          id: string
          label: string
          moisture: number
          moisture_category: string
          recommendation: string
          status: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          farm_id?: string | null
          id?: string
          label: string
          moisture: number
          moisture_category: string
          recommendation: string
          status: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          farm_id?: string | null
          id?: string
          label?: string
          moisture?: number
          moisture_category?: string
          recommendation?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          language?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      weather_readings: {
        Row: {
          farm_id: string | null
          humidity: number
          id: string
          precipitation: number
          rain_next_24h: number
          recorded_at: string
          summary: string | null
          temperature: number
          user_id: string
          wind_speed: number
        }
        Insert: {
          farm_id?: string | null
          humidity: number
          id?: string
          precipitation?: number
          rain_next_24h?: number
          recorded_at?: string
          summary?: string | null
          temperature: number
          user_id: string
          wind_speed?: number
        }
        Update: {
          farm_id?: string | null
          humidity?: number
          id?: string
          precipitation?: number
          rain_next_24h?: number
          recorded_at?: string
          summary?: string | null
          temperature?: number
          user_id?: string
          wind_speed?: number
        }
        Relationships: [
          {
            foreignKeyName: "weather_readings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "farmer" | "officer" | "admin"
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
      app_role: ["farmer", "officer", "admin"],
    },
  },
} as const
