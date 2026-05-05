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
      clientes: {
        Row: {
          activo: boolean
          ciudad: string | null
          cliente_user_id: string | null
          consultor_id: string | null
          created_at: string
          id: string
          nombre_empresa: string
          pais: string | null
          plan_licencia: string
          sector: string | null
          tamano: string | null
          updated_at: string
          web: string | null
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          cliente_user_id?: string | null
          consultor_id?: string | null
          created_at?: string
          id?: string
          nombre_empresa: string
          pais?: string | null
          plan_licencia?: string
          sector?: string | null
          tamano?: string | null
          updated_at?: string
          web?: string | null
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          cliente_user_id?: string | null
          consultor_id?: string | null
          created_at?: string
          id?: string
          nombre_empresa?: string
          pais?: string | null
          plan_licencia?: string
          sector?: string | null
          tamano?: string | null
          updated_at?: string
          web?: string | null
        }
        Relationships: []
      }
      coaching_sesiones: {
        Row: {
          cliente_id: string
          completada: boolean
          consultor_id: string | null
          created_at: string
          datos: Json
          etapa: string | null
          herramienta_id: string | null
          id: string
        }
        Insert: {
          cliente_id: string
          completada?: boolean
          consultor_id?: string | null
          created_at?: string
          datos?: Json
          etapa?: string | null
          herramienta_id?: string | null
          id?: string
        }
        Update: {
          cliente_id?: string
          completada?: boolean
          consultor_id?: string | null
          created_at?: string
          datos?: Json
          etapa?: string | null
          herramienta_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sesiones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      lee_programas: {
        Row: {
          capitulos_desbloqueados: number[]
          cliente_id: string
          created_at: string
          facilitador_id: string | null
          id: string
        }
        Insert: {
          capitulos_desbloqueados?: number[]
          cliente_id: string
          created_at?: string
          facilitador_id?: string | null
          id?: string
        }
        Update: {
          capitulos_desbloqueados?: number[]
          cliente_id?: string
          created_at?: string
          facilitador_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lee_programas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      lee_workbooks: {
        Row: {
          capitulo_numero: number
          completado: boolean
          created_at: string
          id: string
          participante_id: string | null
          programa_id: string
          respuestas: Json
          sesion_numero: number
          updated_at: string
        }
        Insert: {
          capitulo_numero: number
          completado?: boolean
          created_at?: string
          id?: string
          participante_id?: string | null
          programa_id: string
          respuestas?: Json
          sesion_numero: number
          updated_at?: string
        }
        Update: {
          capitulo_numero?: number
          completado?: boolean
          created_at?: string
          id?: string
          participante_id?: string | null
          programa_id?: string
          respuestas?: Json
          sesion_numero?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lee_workbooks_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "lee_programas"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_estrategicos: {
        Row: {
          cliente_id: string
          consultor_id: string | null
          created_at: string
          herramientas_avanzadas: Json | null
          herramientas_corporativas: Json | null
          id: string
          nivel: Database["public"]["Enums"]["plan_nivel"]
          sec01: Json | null
          sec02: Json | null
          sec03: Json | null
          sec04: Json | null
          sec05: Json | null
          sec06: Json | null
          sec07: Json | null
          sec08: Json | null
          sec09: Json | null
          sec10_esg: Json | null
          sec11_alianzas: Json | null
          sec12_innovacion: Json | null
          sec13: Json | null
          sec14: Json | null
          sec15: Json | null
          sec16: Json | null
          sec17_cmi: Json | null
          sec18_ejecucion: Json | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          consultor_id?: string | null
          created_at?: string
          herramientas_avanzadas?: Json | null
          herramientas_corporativas?: Json | null
          id?: string
          nivel?: Database["public"]["Enums"]["plan_nivel"]
          sec01?: Json | null
          sec02?: Json | null
          sec03?: Json | null
          sec04?: Json | null
          sec05?: Json | null
          sec06?: Json | null
          sec07?: Json | null
          sec08?: Json | null
          sec09?: Json | null
          sec10_esg?: Json | null
          sec11_alianzas?: Json | null
          sec12_innovacion?: Json | null
          sec13?: Json | null
          sec14?: Json | null
          sec15?: Json | null
          sec16?: Json | null
          sec17_cmi?: Json | null
          sec18_ejecucion?: Json | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          consultor_id?: string | null
          created_at?: string
          herramientas_avanzadas?: Json | null
          herramientas_corporativas?: Json | null
          id?: string
          nivel?: Database["public"]["Enums"]["plan_nivel"]
          sec01?: Json | null
          sec02?: Json | null
          sec03?: Json | null
          sec04?: Json | null
          sec05?: Json | null
          sec06?: Json | null
          sec07?: Json | null
          sec08?: Json | null
          sec09?: Json | null
          sec10_esg?: Json | null
          sec11_alianzas?: Json | null
          sec12_innovacion?: Json | null
          sec13?: Json | null
          sec14?: Json | null
          sec15?: Json | null
          sec16?: Json | null
          sec17_cmi?: Json | null
          sec18_ejecucion?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_estrategicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      side_sesiones: {
        Row: {
          analisis_ia: Json
          cliente_id: string
          cof_score: number | null
          cof_scores: Json | null
          completada: boolean
          consultor_id: string | null
          created_at: string
          datos_financieros: Json | null
          id: string
          idf_score: number | null
          idf_scores: Json | null
          ime_score: number | null
          ivee_score: number | null
          ivee_scores: Json | null
          nombre_sesion: string | null
          scores: Json
          updated_at: string
        }
        Insert: {
          analisis_ia?: Json
          cliente_id: string
          cof_score?: number | null
          cof_scores?: Json | null
          completada?: boolean
          consultor_id?: string | null
          created_at?: string
          datos_financieros?: Json | null
          id?: string
          idf_score?: number | null
          idf_scores?: Json | null
          ime_score?: number | null
          ivee_score?: number | null
          ivee_scores?: Json | null
          nombre_sesion?: string | null
          scores?: Json
          updated_at?: string
        }
        Update: {
          analisis_ia?: Json
          cliente_id?: string
          cof_score?: number | null
          cof_scores?: Json | null
          completada?: boolean
          consultor_id?: string | null
          created_at?: string
          datos_financieros?: Json | null
          id?: string
          idf_score?: number | null
          idf_scores?: Json | null
          ime_score?: number | null
          ivee_score?: number | null
          ivee_scores?: Json | null
          nombre_sesion?: string | null
          scores?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_sesiones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_cliente: { Args: { _cliente_id: string }; Returns: boolean }
      current_user_role: {
        Args: never
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
      app_role: "admin" | "consultor" | "cliente" | "participante"
      plan_nivel: "esencial" | "avanzado" | "corporativo"
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
      app_role: ["admin", "consultor", "cliente", "participante"],
      plan_nivel: ["esencial", "avanzado", "corporativo"],
    },
  },
} as const
