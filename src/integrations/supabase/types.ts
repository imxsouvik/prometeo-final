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
      admin_profiles: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["department_type"]
          email: string
          id: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["admin_status"]
          updated_at: string
          user_id: string
          verification_id_url: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["department_type"]
          email: string
          id?: string
          name: string
          phone: string
          status?: Database["public"]["Enums"]["admin_status"]
          updated_at?: string
          user_id: string
          verification_id_url: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department_type"]
          email?: string
          id?: string
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["admin_status"]
          updated_at?: string
          user_id?: string
          verification_id_url?: string
        }
        Relationships: []
      }
      incident_status_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          incident_id: string
          new_status: Database["public"]["Enums"]["incident_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["incident_status"] | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          incident_id: string
          new_status: Database["public"]["Enums"]["incident_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["incident_status"] | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          new_status?: Database["public"]["Enums"]["incident_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["incident_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_status_logs_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          description: string
          gps_address: string | null
          gps_lat: number
          gps_lng: number
          id: string
          notify_fire_station: boolean
          notify_hospital: boolean
          notify_police: boolean
          report_type: Database["public"]["Enums"]["report_type"]
          reporter_id: string
          reporter_name: string
          reporter_phone: string
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
          video_thumbnail_url: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          description: string
          gps_address?: string | null
          gps_lat: number
          gps_lng: number
          id?: string
          notify_fire_station?: boolean
          notify_hospital?: boolean
          notify_police?: boolean
          report_type: Database["public"]["Enums"]["report_type"]
          reporter_id: string
          reporter_name: string
          reporter_phone: string
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string
          gps_address?: string | null
          gps_lat?: number
          gps_lng?: number
          id?: string
          notify_fire_station?: boolean
          notify_hospital?: boolean
          notify_police?: boolean
          report_type?: Database["public"]["Enums"]["report_type"]
          reporter_id?: string
          reporter_name?: string
          reporter_phone?: string
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      responder_locations: {
        Row: {
          created_at: string
          department: string
          gps_lat: number
          gps_lng: number
          id: string
          incident_id: string
          responder_id: string
          responder_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          gps_lat: number
          gps_lng: number
          id?: string
          incident_id: string
          responder_id: string
          responder_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          gps_lat?: number
          gps_lng?: number
          id?: string
          incident_id?: string
          responder_id?: string
          responder_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responder_locations_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      admin_status: "pending" | "approved" | "rejected" | "suspended"
      app_role: "user" | "admin" | "super_admin"
      department_type: "hospital" | "fire_station" | "police"
      incident_status: "pending" | "seen" | "responding" | "resolved"
      report_type: "medical" | "fire" | "crime" | "accident" | "other"
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
      admin_status: ["pending", "approved", "rejected", "suspended"],
      app_role: ["user", "admin", "super_admin"],
      department_type: ["hospital", "fire_station", "police"],
      incident_status: ["pending", "seen", "responding", "resolved"],
      report_type: ["medical", "fire", "crime", "accident", "other"],
    },
  },
} as const
