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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      confirmed_foods: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          fats: number | null
          fiber: number | null
          food_name: string
          id: string
          protein: number | null
          quantity: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fats?: number | null
          fiber?: number | null
          food_name: string
          id?: string
          protein?: number | null
          quantity: string
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fats?: number | null
          fiber?: number | null
          food_name?: string
          id?: string
          protein?: number | null
          quantity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmed_foods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stats: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          date: string
          id: string
          updated_at: string | null
          user_id: string
          weekly_goal: string | null
          weight: number | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          date: string
          id?: string
          updated_at?: string | null
          user_id: string
          weekly_goal?: string | null
          weight?: number | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          date?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          weekly_goal?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      excluded_foods: {
        Row: {
          created_at: string
          food_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          date: string
          fats: number | null
          fiber: number | null
          food_name: string
          id: string
          is_confirmed: boolean | null
          is_recipe: boolean | null
          is_supplement: boolean | null
          meal_type: string
          protein: number | null
          quantity: string
          recipe_id: string | null
          supplement_id: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          date: string
          fats?: number | null
          fiber?: number | null
          food_name: string
          id?: string
          is_confirmed?: boolean | null
          is_recipe?: boolean | null
          is_supplement?: boolean | null
          meal_type: string
          protein?: number | null
          quantity: string
          recipe_id?: string | null
          supplement_id?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          date?: string
          fats?: number | null
          fiber?: number | null
          food_name?: string
          id?: string
          is_confirmed?: boolean | null
          is_recipe?: boolean | null
          is_supplement?: boolean | null
          meal_type?: string
          protein?: number | null
          quantity?: string
          recipe_id?: string | null
          supplement_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string | null
          id: string
          ingredients: Json
          recipe_name: string
          total_calories: number | null
          total_carbs: number | null
          total_fats: number | null
          total_fiber: number | null
          total_protein: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredients: Json
          recipe_name: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredients?: Json
          recipe_name?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          base_tdee: number
          carbs_percentage: number
          created_at: string | null
          fats_percentage: number
          fiber_per_1000_cal: number
          id: string
          protein_per_lb: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_tdee?: number
          carbs_percentage?: number
          created_at?: string | null
          fats_percentage?: number
          fiber_per_1000_cal?: number
          id?: string
          protein_per_lb?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_tdee?: number
          carbs_percentage?: number
          created_at?: string | null
          fats_percentage?: number
          fiber_per_1000_cal?: number
          id?: string
          protein_per_lb?: number
          updated_at?: string | null
          user_id?: string
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
