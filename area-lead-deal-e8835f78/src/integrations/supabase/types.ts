export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          value?: Json | null
        }
        Relationships: []
      }
      community_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      lead_progress_logs: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          provider_id: string | null
          stage_msg: string | null
          status: Database["public"]["Enums"]["log_status"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          provider_id?: string | null
          stage_msg?: string | null
          status?: Database["public"]["Enums"]["log_status"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          provider_id?: string | null
          stage_msg?: string | null
          status?: Database["public"]["Enums"]["log_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_progress_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_progress_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          amount: number | null
          category_id: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string | null
          id: string
          images: string[] | null
          location_lat: number | null
          location_long: number | null
          status: string | null
          sub_category_id: string | null
          title: string | null
          lead_code: string | null
          service_type: string | null
          location_address: string | null
          customer_name: string | null
          customer_phone: string
          notes: string | null
          special_instructions: string | null
          proof_url: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amount?: number | null
          category_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location_lat?: number | null
          location_long?: number | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          sub_category_id?: string | null
          title?: string | null
          lead_code?: string | null
          location_address?: string | null
          customer_name?: string | null
          customer_phone?: string
          notes?: string | null
          special_instructions?: string | null
          proof_url?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amount?: number | null
          category_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location_lat?: number | null
          location_long?: number | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          sub_category_id?: string | null
          title?: string | null
          lead_code?: string | null
          location_address?: string | null
          customer_name?: string | null
          customer_phone?: string
          notes?: string | null
          special_instructions?: string | null
          proof_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          category_id: string | null
          created_at: string | null
          credit_balance: number | null
          email: string | null
          id: string
          location_lat: number | null
          location_long: number | null
          phone: string | null
          profile_image: string | null
          name: string | null
          service_type: string | null
          is_subscribed: boolean | null
          subscription_expires_at: string | null
          is_suspended: boolean | null
          is_approved: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          sub_category_id: string | null
          updated_at: string | null
          user_name: string | null
        }
        Insert: {
          bio?: string | null
          category_id?: string | null
          created_at?: string | null
          credit_balance?: number | null
          email?: string | null
          id: string
          location_lat?: number | null
          location_long?: number | null
          phone?: string | null
          profile_image?: string | null
          name?: string | null
          service_type?: string | null
          is_subscribed?: boolean | null
          subscription_expires_at?: string | null
          is_suspended?: boolean | null
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          sub_category_id?: string | null
          updated_at?: string | null
          user_name?: string | null
        }
        Update: {
          bio?: string | null
          category_id?: string | null
          created_at?: string | null
          credit_balance?: number | null
          email?: string | null
          id?: string
          location_lat?: number | null
          location_long?: number | null
          phone?: string | null
          profile_image?: string | null
          name?: string | null
          service_type?: string | null
          is_subscribed?: boolean | null
          subscription_expires_at?: string | null
          is_suspended?: boolean | null
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          sub_category_id?: string | null
          updated_at?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_sub_category"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          rated_user_id: string | null
          rating: number
          rater_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          rated_user_id?: string | null
          rating: number
          rater_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          rated_user_id?: string | null
          rating?: number
          rater_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      sub_categories: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          end_date: string | null
          id: string
          payment_id: string | null
          provider_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_id?: string | null
          provider_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_id?: string | null
          provider_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          group_id: string | null
          id: string
          new_msg: string | null
          personal_data: Json | null
          sender_phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          whatsapp_msg_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          new_msg?: string | null
          personal_data?: Json | null
          sender_phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp_msg_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          new_msg?: string | null
          personal_data?: Json | null
          sender_phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp_msg_id?: string | null
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
      lead_status: "open" | "in_progress" | "completed" | "cancelled" | "claimed" | "rejected" | "pending"
      log_status: "fulfill" | "pending" | "rejected"
      subscription_status: "active" | "expired" | "pending"
      user_role: "admin" | "user" | "provider"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      lead_status: ["open", "in_progress", "completed", "cancelled", "claimed", "rejected"],
      log_status: ["fulfill", "pending", "rejected"],
      subscription_status: ["active", "expired", "pending"],
      user_role: ["admin", "user", "provider"],
    },
  },
} as const

