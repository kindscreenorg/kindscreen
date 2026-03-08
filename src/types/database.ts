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
      channels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_whitelisted: boolean
          name: string
          thumbnail_url: string | null
          updated_at: string
          youtube_channel_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_whitelisted?: boolean
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          youtube_channel_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_whitelisted?: boolean
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          youtube_channel_id?: string
        }
        Relationships: []
      }
      flags: {
        Row: {
          created_at: string
          id: string
          raised_by: string | null
          reason: string
          resolved_by: string | null
          status: Database["public"]["Enums"]["flag_status"]
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          raised_by?: string | null
          reason: string
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["flag_status"]
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          raised_by?: string | null
          reason?: string
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["flag_status"]
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "reviewers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewers: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          is_moderator: boolean
          is_trusted: boolean
          reputation_score: number
          review_count: number
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean
          is_moderator?: boolean
          is_trusted?: boolean
          reputation_score?: number
          review_count?: number
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          is_moderator?: boolean
          is_trusted?: boolean
          reputation_score?: number
          review_count?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          age_band_suggestion: Database["public"]["Enums"]["age_band"] | null
          created_at: string
          has_adult_themes: boolean
          has_bad_language: boolean
          has_scary: boolean
          has_violence: boolean
          id: string
          rejection_reason: string | null
          reviewer_id: string
          verdict: string
          video_id: string
        }
        Insert: {
          age_band_suggestion?: Database["public"]["Enums"]["age_band"] | null
          created_at?: string
          has_adult_themes?: boolean
          has_bad_language?: boolean
          has_scary?: boolean
          has_violence?: boolean
          id?: string
          rejection_reason?: string | null
          reviewer_id: string
          verdict: string
          video_id: string
        }
        Update: {
          age_band_suggestion?: Database["public"]["Enums"]["age_band"] | null
          created_at?: string
          has_adult_themes?: boolean
          has_bad_language?: boolean
          has_scary?: boolean
          has_violence?: boolean
          id?: string
          rejection_reason?: string | null
          reviewer_id?: string
          verdict?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "reviewers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          age_band: Database["public"]["Enums"]["age_band"] | null
          approval_count: number
          category: Database["public"]["Enums"]["video_category"]
          channel_id: string | null
          created_at: string
          id: string
          language: Database["public"]["Enums"]["video_language"]
          rejection_count: number
          status: Database["public"]["Enums"]["video_status"]
          submitted_by: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_id: string
        }
        Insert: {
          age_band?: Database["public"]["Enums"]["age_band"] | null
          approval_count?: number
          category?: Database["public"]["Enums"]["video_category"]
          channel_id?: string | null
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["video_language"]
          rejection_count?: number
          status?: Database["public"]["Enums"]["video_status"]
          submitted_by?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_id: string
        }
        Update: {
          age_band?: Database["public"]["Enums"]["age_band"] | null
          approval_count?: number
          category?: Database["public"]["Enums"]["video_category"]
          channel_id?: string | null
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["video_language"] | null
          rejection_count?: number
          status?: Database["public"]["Enums"]["video_status"]
          submitted_by?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_moderator: { Args: never; Returns: boolean }
      is_reviewer: { Args: never; Returns: boolean }
      username_available: { Args: { p_username: string }; Returns: boolean }
    }
    Enums: {
      age_band: "3-5" | "6-9" | "10-12"
      flag_status: "open" | "resolved"
      video_category:
        | "educational"
        | "music"
        | "stories"
        | "science"
        | "art"
        | "nature"
        | "sports"
        | "games"
        | "other"
      video_language:
        | "english"
        | "portuguese"
        | "spanish"
        | "french"
        | "german"
        | "japanese"
        | "korean"
        | "other"
      video_status: "pending" | "approved" | "rejected"
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
      age_band: ["3-5", "6-9", "10-12"],
      flag_status: ["open", "resolved"],
      video_category: [
        "educational",
        "music",
        "stories",
        "science",
        "art",
        "nature",
        "sports",
        "games",
        "other",
      ],
      video_language: [
        "english",
        "portuguese",
        "spanish",
        "french",
        "german",
        "japanese",
        "korean",
        "other",
      ] as const,
      video_status: ["pending", "approved", "rejected"],
    },
  },
} as const

