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
      app_settings: {
        Row: {
          accent_color: string
          app_name: string
          company_name: string
          content_strings: Json
          font_family: string
          id: string
          logo_url: string | null
          primary_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          app_name?: string
          company_name?: string
          content_strings?: Json
          font_family?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          app_name?: string
          company_name?: string
          content_strings?: Json
          font_family?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          nivel_acompanamiento:
            | Database["public"]["Enums"]["nivel_acompanamiento_enum"]
            | null
          notas: string | null
          numero_cotizacion: string | null
          objetivos_propuesta: Json
          plan: string | null
          plan_plataforma_id: string | null
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
          nivel_acompanamiento?:
            | Database["public"]["Enums"]["nivel_acompanamiento_enum"]
            | null
          notas?: string | null
          numero_cotizacion?: string | null
          objetivos_propuesta?: Json
          plan?: string | null
          plan_plataforma_id?: string | null
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
          nivel_acompanamiento?:
            | Database["public"]["Enums"]["nivel_acompanamiento_enum"]
            | null
          notas?: string | null
          numero_cotizacion?: string | null
          objetivos_propuesta?: Json
          plan?: string | null
          plan_plataforma_id?: string | null
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
          {
            foreignKeyName: "cliente_cotizaciones_plan_plataforma_id_fkey"
            columns: ["plan_plataforma_id"]
            isOneToOne: false
            referencedRelation: "planes"
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
          acceso_interpretacion: boolean
          activo: boolean
          ciudad: string | null
          cliente_user_id: string | null
          codigo_postal: string | null
          consultor_id: string | null
          created_at: string
          creditos_ia_extra: number
          creditos_ia_reset_fecha: string
          creditos_ia_usados: number
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
          acceso_interpretacion?: boolean
          activo?: boolean
          ciudad?: string | null
          cliente_user_id?: string | null
          codigo_postal?: string | null
          consultor_id?: string | null
          created_at?: string
          creditos_ia_extra?: number
          creditos_ia_reset_fecha?: string
          creditos_ia_usados?: number
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
          acceso_interpretacion?: boolean
          activo?: boolean
          ciudad?: string | null
          cliente_user_id?: string | null
          codigo_postal?: string | null
          consultor_id?: string | null
          created_at?: string
          creditos_ia_extra?: number
          creditos_ia_reset_fecha?: string
          creditos_ia_usados?: number
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
      empresa_invitaciones: {
        Row: {
          cliente_id: string
          created_at: string
          email: string
          estado: string
          expira_at: string
          id: string
          invitado_por: string | null
          removido_at: string | null
          removido_por: string | null
          rol_empresa: string
          token: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          email: string
          estado?: string
          expira_at?: string
          id?: string
          invitado_por?: string | null
          removido_at?: string | null
          removido_por?: string | null
          rol_empresa: string
          token?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          email?: string
          estado?: string
          expira_at?: string
          id?: string
          invitado_por?: string | null
          removido_at?: string | null
          removido_por?: string | null
          rol_empresa?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_invitaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_plan: {
        Row: {
          activo: boolean
          created_at: string
          empresa_id: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          licencias_adicionales: number
          plan_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          empresa_id: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          licencias_adicionales?: number
          plan_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          empresa_id?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          licencias_adicionales?: number
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_plan_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_plan_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_usuario_modulos: {
        Row: {
          cliente_id: string
          modulo_slug: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          modulo_slug: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          modulo_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuario_modulos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_usuarios: {
        Row: {
          area_id: string | null
          cliente_id: string
          created_at: string
          id: string
          invitado_por: string | null
          rol_empresa: string
          user_id: string
        }
        Insert: {
          area_id?: string | null
          cliente_id: string
          created_at?: string
          id?: string
          invitado_por?: string | null
          rol_empresa: string
          user_id: string
        }
        Update: {
          area_id?: string | null
          cliente_id?: string
          created_at?: string
          id?: string
          invitado_por?: string | null
          rol_empresa?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eu_area_cliente_fk"
            columns: ["cliente_id", "area_id"]
            isOneToOne: false
            referencedRelation: "manual_areas"
            referencedColumns: ["cliente_id", "id"]
          },
          {
            foreignKeyName: "eu_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "manual_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      lee_historial_versiones: {
        Row: {
          capitulo_numero: number
          created_at: string
          etiqueta: string | null
          id: string
          origen: string
          programa_id: string
          sesion_id: string | null
          snapshot: Json
        }
        Insert: {
          capitulo_numero: number
          created_at?: string
          etiqueta?: string | null
          id?: string
          origen: string
          programa_id: string
          sesion_id?: string | null
          snapshot?: Json
        }
        Update: {
          capitulo_numero?: number
          created_at?: string
          etiqueta?: string | null
          id?: string
          origen?: string
          programa_id?: string
          sesion_id?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lee_historial_versiones_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "lee_programas"
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
      lee_workbook_html: {
        Row: {
          capitulo_numero: number
          completado: boolean
          created_at: string
          id: string
          programa_id: string
          respuestas: Json
          updated_at: string
        }
        Insert: {
          capitulo_numero: number
          completado?: boolean
          created_at?: string
          id?: string
          programa_id: string
          respuestas?: Json
          updated_at?: string
        }
        Update: {
          capitulo_numero?: number
          completado?: boolean
          created_at?: string
          id?: string
          programa_id?: string
          respuestas?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lee_workbook_html_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "lee_programas"
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
      manual_areas: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          nombre: string
          orden?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "manual_areas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_funciones_cargos: {
        Row: {
          aceptacion_cargo: string | null
          aceptacion_fecha: string | null
          aceptacion_nombre: string | null
          aceptacion_texto: string | null
          aprobado_por: string | null
          area: string
          area_id: string
          cargo: string
          cliente_id: string
          codigo: string | null
          competencias_blandas: Json | null
          competencias_tecnicas: Json | null
          condiciones: Json | null
          consultor_id: string | null
          created_at: string | null
          elaborado_por: string | null
          estado: string | null
          fecha_elaboracion: string | null
          fecha_revision: string | null
          funciones: Json | null
          id: string
          jefe_inmediato: string | null
          kpis: Json | null
          objetivo: string | null
          plan_carrera: string | null
          relaciones_externas: Json | null
          relaciones_internas: Json | null
          requisitos: Json | null
          resultados_esperados: Json
          revisado_por: string | null
          supervisa_a: Json | null
          updated_at: string | null
          vacante: boolean | null
          version: string | null
        }
        Insert: {
          aceptacion_cargo?: string | null
          aceptacion_fecha?: string | null
          aceptacion_nombre?: string | null
          aceptacion_texto?: string | null
          aprobado_por?: string | null
          area: string
          area_id: string
          cargo: string
          cliente_id: string
          codigo?: string | null
          competencias_blandas?: Json | null
          competencias_tecnicas?: Json | null
          condiciones?: Json | null
          consultor_id?: string | null
          created_at?: string | null
          elaborado_por?: string | null
          estado?: string | null
          fecha_elaboracion?: string | null
          fecha_revision?: string | null
          funciones?: Json | null
          id?: string
          jefe_inmediato?: string | null
          kpis?: Json | null
          objetivo?: string | null
          plan_carrera?: string | null
          relaciones_externas?: Json | null
          relaciones_internas?: Json | null
          requisitos?: Json | null
          resultados_esperados?: Json
          revisado_por?: string | null
          supervisa_a?: Json | null
          updated_at?: string | null
          vacante?: boolean | null
          version?: string | null
        }
        Update: {
          aceptacion_cargo?: string | null
          aceptacion_fecha?: string | null
          aceptacion_nombre?: string | null
          aceptacion_texto?: string | null
          aprobado_por?: string | null
          area?: string
          area_id?: string
          cargo?: string
          cliente_id?: string
          codigo?: string | null
          competencias_blandas?: Json | null
          competencias_tecnicas?: Json | null
          condiciones?: Json | null
          consultor_id?: string | null
          created_at?: string | null
          elaborado_por?: string | null
          estado?: string | null
          fecha_elaboracion?: string | null
          fecha_revision?: string | null
          funciones?: Json | null
          id?: string
          jefe_inmediato?: string | null
          kpis?: Json | null
          objetivo?: string | null
          plan_carrera?: string | null
          relaciones_externas?: Json | null
          relaciones_internas?: Json | null
          requisitos?: Json | null
          resultados_esperados?: Json
          revisado_por?: string | null
          supervisa_a?: Json | null
          updated_at?: string | null
          vacante?: boolean | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_funciones_cargos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_funciones_cargos_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mf_cargos_area_cliente_fk"
            columns: ["cliente_id", "area_id"]
            isOneToOne: false
            referencedRelation: "manual_areas"
            referencedColumns: ["cliente_id", "id"]
          },
          {
            foreignKeyName: "mf_cargos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "manual_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_funciones_config: {
        Row: {
          cliente_id: string
          logo_url: string | null
          nombre_empresa: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          logo_url?: string | null
          nombre_empresa?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          logo_url?: string | null
          nombre_empresa?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_funciones_config_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_funciones_evaluaciones: {
        Row: {
          cargo_data_hash: string | null
          cargo_id: string
          competencias_evaluadas: Json | null
          consultor_id: string | null
          created_at: string | null
          evaluador: string | null
          fecha_evaluacion: string | null
          firmas: Json
          id: string
          indice_global: number | null
          nombre_evaluado: string | null
          observacion_general: string | null
          plan_desarrollo: Json | null
          proxima_revision: string | null
          requisitos_evaluados: Json
          semaforo: string | null
        }
        Insert: {
          cargo_data_hash?: string | null
          cargo_id: string
          competencias_evaluadas?: Json | null
          consultor_id?: string | null
          created_at?: string | null
          evaluador?: string | null
          fecha_evaluacion?: string | null
          firmas?: Json
          id?: string
          indice_global?: number | null
          nombre_evaluado?: string | null
          observacion_general?: string | null
          plan_desarrollo?: Json | null
          proxima_revision?: string | null
          requisitos_evaluados?: Json
          semaforo?: string | null
        }
        Update: {
          cargo_data_hash?: string | null
          cargo_id?: string
          competencias_evaluadas?: Json | null
          consultor_id?: string | null
          created_at?: string | null
          evaluador?: string | null
          fecha_evaluacion?: string | null
          firmas?: Json
          id?: string
          indice_global?: number | null
          nombre_evaluado?: string | null
          observacion_general?: string | null
          plan_desarrollo?: Json | null
          proxima_revision?: string | null
          requisitos_evaluados?: Json
          semaforo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_funciones_evaluaciones_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "manual_funciones_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_funciones_evaluaciones_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_funciones_evaluaciones_desempeno: {
        Row: {
          cargo_id: string
          comp_scores: Json
          cond_scores: Json
          consultor_id: string | null
          created_at: string
          evaluador: string | null
          fecha_evaluacion: string
          fecha_firma: string | null
          firma_rrhh: string | null
          firmas: Json | null
          id: string
          kpi_scores: Json
          nombre_evaluado: string | null
          objetivos: Json
          observacion_evaluado: string | null
          observacion_evaluador: string | null
          observacion_rrhh: string | null
          periodo: string | null
          plan_mejora: Json
          score_total: number | null
          semaforo: string | null
        }
        Insert: {
          cargo_id: string
          comp_scores?: Json
          cond_scores?: Json
          consultor_id?: string | null
          created_at?: string
          evaluador?: string | null
          fecha_evaluacion?: string
          fecha_firma?: string | null
          firma_rrhh?: string | null
          firmas?: Json | null
          id?: string
          kpi_scores?: Json
          nombre_evaluado?: string | null
          objetivos?: Json
          observacion_evaluado?: string | null
          observacion_evaluador?: string | null
          observacion_rrhh?: string | null
          periodo?: string | null
          plan_mejora?: Json
          score_total?: number | null
          semaforo?: string | null
        }
        Update: {
          cargo_id?: string
          comp_scores?: Json
          cond_scores?: Json
          consultor_id?: string | null
          created_at?: string
          evaluador?: string | null
          fecha_evaluacion?: string
          fecha_firma?: string | null
          firma_rrhh?: string | null
          firmas?: Json | null
          id?: string
          kpi_scores?: Json
          nombre_evaluado?: string | null
          objetivos?: Json
          observacion_evaluado?: string | null
          observacion_evaluador?: string | null
          observacion_rrhh?: string | null
          periodo?: string | null
          plan_mejora?: Json
          score_total?: number | null
          semaforo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_funciones_evaluaciones_desempeno_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "manual_funciones_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_funciones_evaluaciones_desempeno_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_plantilla_areas: {
        Row: {
          created_at: string
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          orden?: number
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      manual_plantilla_cargos: {
        Row: {
          aprobado_por: string | null
          cargo: string
          codigo: string | null
          competencias_blandas: Json
          competencias_tecnicas: Json
          condiciones: Json
          created_at: string
          elaborado_por: string | null
          estado: string
          fecha_elaboracion: string | null
          fecha_revision: string | null
          funciones: Json
          id: string
          jefe_inmediato: string | null
          kpis: Json
          objetivo: string | null
          plan_carrera: string | null
          plantilla_area_id: string
          relaciones_externas: Json
          relaciones_internas: Json
          requisitos: Json
          resultados_esperados: Json
          supervisa_a: Json
          vacante: boolean
          version: string
        }
        Insert: {
          aprobado_por?: string | null
          cargo: string
          codigo?: string | null
          competencias_blandas?: Json
          competencias_tecnicas?: Json
          condiciones?: Json
          created_at?: string
          elaborado_por?: string | null
          estado?: string
          fecha_elaboracion?: string | null
          fecha_revision?: string | null
          funciones?: Json
          id?: string
          jefe_inmediato?: string | null
          kpis?: Json
          objetivo?: string | null
          plan_carrera?: string | null
          plantilla_area_id: string
          relaciones_externas?: Json
          relaciones_internas?: Json
          requisitos?: Json
          resultados_esperados?: Json
          supervisa_a?: Json
          vacante?: boolean
          version?: string
        }
        Update: {
          aprobado_por?: string | null
          cargo?: string
          codigo?: string | null
          competencias_blandas?: Json
          competencias_tecnicas?: Json
          condiciones?: Json
          created_at?: string
          elaborado_por?: string | null
          estado?: string
          fecha_elaboracion?: string | null
          fecha_revision?: string | null
          funciones?: Json
          id?: string
          jefe_inmediato?: string | null
          kpis?: Json
          objetivo?: string | null
          plan_carrera?: string | null
          plantilla_area_id?: string
          relaciones_externas?: Json
          relaciones_internas?: Json
          requisitos?: Json
          resultados_esperados?: Json
          supervisa_a?: Json
          vacante?: boolean
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_plantilla_cargos_plantilla_area_id_fkey"
            columns: ["plantilla_area_id"]
            isOneToOne: false
            referencedRelation: "manual_plantilla_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_sesiones: {
        Row: {
          cliente_id: string | null
          completada: boolean | null
          consultor_id: string | null
          created_at: string | null
          empresa: Json | null
          id: string
          modulos: Json | null
          nombre_sesion: string
          reporte_config: Json | null
          score_total: number | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          completada?: boolean | null
          consultor_id?: string | null
          created_at?: string | null
          empresa?: Json | null
          id?: string
          modulos?: Json | null
          nombre_sesion?: string
          reporte_config?: Json | null
          score_total?: number | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          completada?: boolean | null
          consultor_id?: string | null
          created_at?: string | null
          empresa?: Json | null
          id?: string
          modulos?: Json | null
          nombre_sesion?: string
          reporte_config?: Json | null
          score_total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_sesiones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_sesiones_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permisos_usuario_modulo: {
        Row: {
          alcance_area_id: string | null
          alcance_tipo: string
          cliente_id: string
          created_at: string
          id: string
          modulo: string
          puede_editar: boolean
          puede_ver: boolean
          user_id: string
        }
        Insert: {
          alcance_area_id?: string | null
          alcance_tipo: string
          cliente_id: string
          created_at?: string
          id?: string
          modulo: string
          puede_editar?: boolean
          puede_ver?: boolean
          user_id: string
        }
        Update: {
          alcance_area_id?: string | null
          alcance_tipo?: string
          cliente_id?: string
          created_at?: string
          id?: string
          modulo?: string
          puede_editar?: boolean
          puede_ver?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permisos_usuario_modulo_alcance_area_id_fkey"
            columns: ["alcance_area_id"]
            isOneToOne: false
            referencedRelation: "manual_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permisos_usuario_modulo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_modulos: {
        Row: {
          activo: boolean
          modulo_slug: string
          plan_id: string
        }
        Insert: {
          activo?: boolean
          modulo_slug: string
          plan_id: string
        }
        Update: {
          activo?: boolean
          modulo_slug?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_modulos_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["id"]
          },
        ]
      }
      planes: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          num_licencias: number
          precio: number | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          num_licencias?: number
          precio?: number | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          num_licencias?: number
          precio?: number | null
        }
        Relationships: []
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
          comentario_consultor: string | null
          completada: boolean
          consultor_id: string | null
          created_at: string
          datos_financieros: Json | null
          estado_revision: string
          id: string
          idf_score: number | null
          idf_scores: Json | null
          ime_score: number | null
          ivee_score: number | null
          ivee_scores: Json | null
          nombre_sesion: string | null
          revisado_en: string | null
          revisado_por: string | null
          scores: Json
          updated_at: string
        }
        Insert: {
          analisis_ia?: Json
          cliente_id: string
          cof_score?: number | null
          cof_scores?: Json | null
          comentario_consultor?: string | null
          completada?: boolean
          consultor_id?: string | null
          created_at?: string
          datos_financieros?: Json | null
          estado_revision?: string
          id?: string
          idf_score?: number | null
          idf_scores?: Json | null
          ime_score?: number | null
          ivee_score?: number | null
          ivee_scores?: Json | null
          nombre_sesion?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          scores?: Json
          updated_at?: string
        }
        Update: {
          analisis_ia?: Json
          cliente_id?: string
          cof_score?: number | null
          cof_scores?: Json | null
          comentario_consultor?: string | null
          completada?: boolean
          consultor_id?: string | null
          created_at?: string
          datos_financieros?: Json | null
          estado_revision?: string
          id?: string
          idf_score?: number | null
          idf_scores?: Json | null
          ime_score?: number | null
          ivee_score?: number | null
          ivee_scores?: Json | null
          nombre_sesion?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
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
      clonar_plantilla_manual_funciones: {
        Args: { p_cliente_id: string }
        Returns: undefined
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_compartido_by_token: {
        Args: { _token: string }
        Returns: {
          cliente_id: string
          contenido_id: string
          created_at: string
          destinatarios_nombres: Json
          estado: string
          expira_en: string
          id: string
          incluir_compromisos: boolean
          incluir_kpis: boolean
          mensaje: string
          nombre_empresa: string
          pdf_url: string
          tipo_contenido: string
          titulo: string
          vistas: number
        }[]
      }
      has_modulo_permission: {
        Args: { _cargo_id: string; _modulo: string; _necesita_editar?: boolean }
        Returns: boolean
      }
      has_pum_edit: {
        Args: { _area_id: string; _cliente_id: string; _modulo: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_dueno_de_cliente: { Args: { _cliente_id: string }; Returns: boolean }
      registrar_vista_compartido: {
        Args: { _ip?: string; _token: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "consultor" | "cliente" | "participante"
      nivel_acompanamiento_enum:
        | "autogestionado"
        | "guiado"
        | "acompanado"
        | "advisory"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      nivel_acompanamiento_enum: [
        "autogestionado",
        "guiado",
        "acompanado",
        "advisory",
      ],
      plan_nivel: ["esencial", "avanzado", "corporativo"],
    },
  },
} as const
