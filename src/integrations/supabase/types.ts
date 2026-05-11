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
      cliente_actividades: {
        Row: {
          adjunto_url: string | null
          analisis_ia: string | null
          analisis_ia_fecha: string | null
          cliente_id: string
          consultor_id: string | null
          contacto_id: string | null
          created_at: string
          descripcion: string | null
          duracion_minutos: number | null
          es_sesion_consultoria: boolean
          etapa_programa: string | null
          fecha: string
          fecha_proxima_accion: string | null
          herramientas: Json | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          justificacion_semaforo: string | null
          logros: Json | null
          mensaje_cliente: string | null
          modalidad: string | null
          numero_sesion: number | null
          objetivo: string | null
          participantes: Json | null
          programa: string | null
          proxima_accion: string | null
          proxima_fecha: string | null
          proxima_temas: Json | null
          reporte_pdf_url: string | null
          resultado: string | null
          semaforo: string | null
          temas: Json | null
          tipo: string
          titulo: string
        }
        Insert: {
          adjunto_url?: string | null
          analisis_ia?: string | null
          analisis_ia_fecha?: string | null
          cliente_id: string
          consultor_id?: string | null
          contacto_id?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          es_sesion_consultoria?: boolean
          etapa_programa?: string | null
          fecha?: string
          fecha_proxima_accion?: string | null
          herramientas?: Json | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          justificacion_semaforo?: string | null
          logros?: Json | null
          mensaje_cliente?: string | null
          modalidad?: string | null
          numero_sesion?: number | null
          objetivo?: string | null
          participantes?: Json | null
          programa?: string | null
          proxima_accion?: string | null
          proxima_fecha?: string | null
          proxima_temas?: Json | null
          reporte_pdf_url?: string | null
          resultado?: string | null
          semaforo?: string | null
          temas?: Json | null
          tipo: string
          titulo: string
        }
        Update: {
          adjunto_url?: string | null
          analisis_ia?: string | null
          analisis_ia_fecha?: string | null
          cliente_id?: string
          consultor_id?: string | null
          contacto_id?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          es_sesion_consultoria?: boolean
          etapa_programa?: string | null
          fecha?: string
          fecha_proxima_accion?: string | null
          herramientas?: Json | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          justificacion_semaforo?: string | null
          logros?: Json | null
          mensaje_cliente?: string | null
          modalidad?: string | null
          numero_sesion?: number | null
          objetivo?: string | null
          participantes?: Json | null
          programa?: string | null
          proxima_accion?: string | null
          proxima_fecha?: string | null
          proxima_temas?: Json | null
          reporte_pdf_url?: string | null
          resultado?: string | null
          semaforo?: string | null
          temas?: Json | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_actividades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_actividades_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "cliente_contactos"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_compartidos: {
        Row: {
          canales: Json
          cliente_id: string
          compromiso_id: string | null
          consultor_id: string | null
          contenido_id: string | null
          contenido_ids: Json
          crear_compromiso_lectura: boolean
          created_at: string
          destinatarios: Json
          estado: string
          expira_en: string | null
          id: string
          incluir_compromisos: boolean
          incluir_kpis: boolean
          incluir_pdf: boolean
          ip_ultima_vista: string | null
          mensaje: string | null
          pdf_url: string | null
          primera_vista: string | null
          share_token: string | null
          tipo_contenido: string
          titulo: string
          ultima_vista: string | null
          updated_at: string
          vistas: number
        }
        Insert: {
          canales?: Json
          cliente_id: string
          compromiso_id?: string | null
          consultor_id?: string | null
          contenido_id?: string | null
          contenido_ids?: Json
          crear_compromiso_lectura?: boolean
          created_at?: string
          destinatarios?: Json
          estado?: string
          expira_en?: string | null
          id?: string
          incluir_compromisos?: boolean
          incluir_kpis?: boolean
          incluir_pdf?: boolean
          ip_ultima_vista?: string | null
          mensaje?: string | null
          pdf_url?: string | null
          primera_vista?: string | null
          share_token?: string | null
          tipo_contenido: string
          titulo: string
          ultima_vista?: string | null
          updated_at?: string
          vistas?: number
        }
        Update: {
          canales?: Json
          cliente_id?: string
          compromiso_id?: string | null
          consultor_id?: string | null
          contenido_id?: string | null
          contenido_ids?: Json
          crear_compromiso_lectura?: boolean
          created_at?: string
          destinatarios?: Json
          estado?: string
          expira_en?: string | null
          id?: string
          incluir_compromisos?: boolean
          incluir_kpis?: boolean
          incluir_pdf?: boolean
          ip_ultima_vista?: string | null
          mensaje?: string | null
          pdf_url?: string | null
          primera_vista?: string | null
          share_token?: string | null
          tipo_contenido?: string
          titulo?: string
          ultima_vista?: string | null
          updated_at?: string
          vistas?: number
        }
        Relationships: []
      }
      cliente_compromisos: {
        Row: {
          actividad_id: string | null
          cliente_id: string
          created_at: string
          descripcion: string
          estado: string
          fecha_limite: string | null
          id: string
          origen: string
          responsable: string | null
          updated_at: string
        }
        Insert: {
          actividad_id?: string | null
          cliente_id: string
          created_at?: string
          descripcion: string
          estado?: string
          fecha_limite?: string | null
          id?: string
          origen?: string
          responsable?: string | null
          updated_at?: string
        }
        Update: {
          actividad_id?: string | null
          cliente_id?: string
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_limite?: string | null
          id?: string
          origen?: string
          responsable?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cliente_contactos: {
        Row: {
          activo: boolean
          apellido: string
          area: string | null
          cargo: string | null
          celular: string | null
          ciudad: string | null
          cliente_id: string
          created_at: string
          direccion: string | null
          email: string | null
          email_secundario: string | null
          es_contacto_principal: boolean
          es_decisor: boolean
          extension: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          linkedin_url: string | null
          nombre: string
          notas: string | null
          telefono_oficina: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido: string
          area?: string | null
          cargo?: string | null
          celular?: string | null
          ciudad?: string | null
          cliente_id: string
          created_at?: string
          direccion?: string | null
          email?: string | null
          email_secundario?: string | null
          es_contacto_principal?: boolean
          es_decisor?: boolean
          extension?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          linkedin_url?: string | null
          nombre: string
          notas?: string | null
          telefono_oficina?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido?: string
          area?: string | null
          cargo?: string | null
          celular?: string | null
          ciudad?: string | null
          cliente_id?: string
          created_at?: string
          direccion?: string | null
          email?: string | null
          email_secundario?: string | null
          es_contacto_principal?: boolean
          es_decisor?: boolean
          extension?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          linkedin_url?: string | null
          nombre?: string
          notas?: string | null
          telefono_oficina?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_contactos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_cotizaciones: {
        Row: {
          cliente_id: string
          condiciones: string | null
          consultor_id: string | null
          contacto_id: string | null
          created_at: string
          descripcion: string | null
          descuento_porcentaje: number
          descuento_valor: number
          diagnostico_resumen: string | null
          entregables: Json
          estado: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          ime_estimado: string | null
          justificacion_programa: string | null
          moneda: string
          notas: string | null
          numero_cotizacion: string | null
          objetivos_propuesta: Json
          plan: string | null
          servicios: Json
          subtotal: number
          titulo: string
          total: number
          updated_at: string
          validez_dias: number
        }
        Insert: {
          cliente_id: string
          condiciones?: string | null
          consultor_id?: string | null
          contacto_id?: string | null
          created_at?: string
          descripcion?: string | null
          descuento_porcentaje?: number
          descuento_valor?: number
          diagnostico_resumen?: string | null
          entregables?: Json
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          ime_estimado?: string | null
          justificacion_programa?: string | null
          moneda?: string
          notas?: string | null
          numero_cotizacion?: string | null
          objetivos_propuesta?: Json
          plan?: string | null
          servicios?: Json
          subtotal?: number
          titulo: string
          total?: number
          updated_at?: string
          validez_dias?: number
        }
        Update: {
          cliente_id?: string
          condiciones?: string | null
          consultor_id?: string | null
          contacto_id?: string | null
          created_at?: string
          descripcion?: string | null
          descuento_porcentaje?: number
          descuento_valor?: number
          diagnostico_resumen?: string | null
          entregables?: Json
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          ime_estimado?: string | null
          justificacion_programa?: string | null
          moneda?: string
          notas?: string | null
          numero_cotizacion?: string | null
          objetivos_propuesta?: Json
          plan?: string | null
          servicios?: Json
          subtotal?: number
          titulo?: string
          total?: number
          updated_at?: string
          validez_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "cliente_cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_cotizaciones_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "cliente_contactos"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_kpis: {
        Row: {
          actividad_id: string | null
          categoria: string
          cliente_id: string
          created_at: string
          fecha_medicion: string
          formula: string | null
          id: string
          nombre: string
          observacion: string | null
          semaforo: string
          unidad: string | null
          updated_at: string
          valor_actual: number | null
          valor_meta: number | null
        }
        Insert: {
          actividad_id?: string | null
          categoria: string
          cliente_id: string
          created_at?: string
          fecha_medicion?: string
          formula?: string | null
          id?: string
          nombre: string
          observacion?: string | null
          semaforo?: string
          unidad?: string | null
          updated_at?: string
          valor_actual?: number | null
          valor_meta?: number | null
        }
        Update: {
          actividad_id?: string | null
          categoria?: string
          cliente_id?: string
          created_at?: string
          fecha_medicion?: string
          formula?: string | null
          id?: string
          nombre?: string
          observacion?: string | null
          semaforo?: string
          unidad?: string | null
          updated_at?: string
          valor_actual?: number | null
          valor_meta?: number | null
        }
        Relationships: []
      }
      cliente_onboarding: {
        Row: {
          analisis_ia: string | null
          cliente_id: string
          completado: boolean
          consultor_id: string | null
          created_at: string
          fecha_completado: string | null
          id: string
          paso_actual: number
          paso1_empresa: Json
          paso2_lider: Json
          paso3_contexto: Json
          paso4_expectativas: Json
          paso5_acuerdo: Json
          updated_at: string
        }
        Insert: {
          analisis_ia?: string | null
          cliente_id: string
          completado?: boolean
          consultor_id?: string | null
          created_at?: string
          fecha_completado?: string | null
          id?: string
          paso_actual?: number
          paso1_empresa?: Json
          paso2_lider?: Json
          paso3_contexto?: Json
          paso4_expectativas?: Json
          paso5_acuerdo?: Json
          updated_at?: string
        }
        Update: {
          analisis_ia?: string | null
          cliente_id?: string
          completado?: boolean
          consultor_id?: string | null
          created_at?: string
          fecha_completado?: string | null
          id?: string
          paso_actual?: number
          paso1_empresa?: Json
          paso2_lider?: Json
          paso3_contexto?: Json
          paso4_expectativas?: Json
          paso5_acuerdo?: Json
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          ciudad: string | null
          cliente_user_id: string | null
          codigo_postal: string | null
          consultor_id: string | null
          created_at: string
          descripcion: string | null
          direccion: string | null
          estado: string | null
          facturacion_anual: number | null
          fecha_inicio_relacion: string | null
          id: string
          linkedin_empresa: string | null
          logo_url: string | null
          moneda: string | null
          nombre_comercial: string | null
          nombre_empresa: string
          notas_internas: string | null
          num_empleados: number | null
          origen: string | null
          pais: string | null
          plan_licencia: string
          sector: string | null
          subsector: string | null
          tamano: string | null
          updated_at: string
          web: string | null
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          cliente_user_id?: string | null
          codigo_postal?: string | null
          consultor_id?: string | null
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          estado?: string | null
          facturacion_anual?: number | null
          fecha_inicio_relacion?: string | null
          id?: string
          linkedin_empresa?: string | null
          logo_url?: string | null
          moneda?: string | null
          nombre_comercial?: string | null
          nombre_empresa: string
          notas_internas?: string | null
          num_empleados?: number | null
          origen?: string | null
          pais?: string | null
          plan_licencia?: string
          sector?: string | null
          subsector?: string | null
          tamano?: string | null
          updated_at?: string
          web?: string | null
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          cliente_user_id?: string | null
          codigo_postal?: string | null
          consultor_id?: string | null
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          estado?: string | null
          facturacion_anual?: number | null
          fecha_inicio_relacion?: string | null
          id?: string
          linkedin_empresa?: string | null
          logo_url?: string | null
          moneda?: string | null
          nombre_comercial?: string | null
          nombre_empresa?: string
          notas_internas?: string | null
          num_empleados?: number | null
          origen?: string | null
          pais?: string | null
          plan_licencia?: string
          sector?: string | null
          subsector?: string | null
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
      registrar_vista_compartido: {
        Args: { _ip?: string; _token: string }
        Returns: undefined
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
