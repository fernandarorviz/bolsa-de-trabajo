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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos: {
        Row: {
          created_at: string
          cv_url: string | null
          educacion: Json | null
          email: string
          estado_general: string | null
          experiencia: Json | null
          habilidades: string[] | null
          id: string
          linkedin_url: string | null
          nombre: string
          notas: string | null
          perfil_completo: boolean | null
          resumen_profesional: string | null
          telefono: string | null
          ubicacion: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          cv_url?: string | null
          educacion?: Json | null
          email: string
          estado_general?: string | null
          experiencia?: Json | null
          habilidades?: string[] | null
          id?: string
          linkedin_url?: string | null
          nombre: string
          notas?: string | null
          perfil_completo?: boolean | null
          resumen_profesional?: string | null
          telefono?: string | null
          ubicacion?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          cv_url?: string | null
          educacion?: Json | null
          email?: string
          estado_general?: string | null
          experiencia?: Json | null
          habilidades?: string[] | null
          id?: string
          linkedin_url?: string | null
          nombre?: string
          notas?: string | null
          perfil_completo?: boolean | null
          resumen_profesional?: string | null
          telefono?: string | null
          ubicacion?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          cobranding_activo: boolean | null
          comentarios: string | null
          constancia_fiscal_url: string | null
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          cp: string | null
          created_at: string
          descripcion: string | null
          direccion_fiscal: string | null
          id: string
          industria: string | null
          logo_url: string | null
          nombre: string
          razon_social: string | null
          regimen_fiscal: string | null
          rfc: string | null
          sector: string | null
          sitio_web: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cobranding_activo?: boolean | null
          comentarios?: string | null
          constancia_fiscal_url?: string | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          cp?: string | null
          created_at?: string
          descripcion?: string | null
          direccion_fiscal?: string | null
          id?: string
          industria?: string | null
          logo_url?: string | null
          nombre: string
          razon_social?: string | null
          regimen_fiscal?: string | null
          rfc?: string | null
          sector?: string | null
          sitio_web?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cobranding_activo?: boolean | null
          comentarios?: string | null
          constancia_fiscal_url?: string | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          cp?: string | null
          created_at?: string
          descripcion?: string | null
          direccion_fiscal?: string | null
          id?: string
          industria?: string | null
          logo_url?: string | null
          nombre?: string
          razon_social?: string | null
          regimen_fiscal?: string | null
          rfc?: string | null
          sector?: string | null
          sitio_web?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entrevistas: {
        Row: {
          candidato_id: string
          confirmada: boolean | null
          creada_por: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_entrevista"]
          etapa_pipeline_id: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          link_reunion: string | null
          modalidad: Database["public"]["Enums"]["modalidad_entrevista"]
          notas: string | null
          proposed_slots: Json | null
          tipo_entrevista: Database["public"]["Enums"]["tipo_entrevista"]
          ubicacion: string | null
          updated_at: string | null
          vacante_id: string
        }
        Insert: {
          candidato_id: string
          confirmada?: boolean | null
          creada_por?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_entrevista"]
          etapa_pipeline_id: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          link_reunion?: string | null
          modalidad?: Database["public"]["Enums"]["modalidad_entrevista"]
          notas?: string | null
          proposed_slots?: Json | null
          tipo_entrevista: Database["public"]["Enums"]["tipo_entrevista"]
          ubicacion?: string | null
          updated_at?: string | null
          vacante_id: string
        }
        Update: {
          candidato_id?: string
          confirmada?: boolean | null
          creada_por?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_entrevista"]
          etapa_pipeline_id?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          link_reunion?: string | null
          modalidad?: Database["public"]["Enums"]["modalidad_entrevista"]
          notas?: string | null
          proposed_slots?: Json | null
          tipo_entrevista?: Database["public"]["Enums"]["tipo_entrevista"]
          ubicacion?: string | null
          updated_at?: string | null
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrevistas_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrevistas_creada_por_fkey"
            columns: ["creada_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrevistas_etapa_pipeline_id_fkey"
            columns: ["etapa_pipeline_id"]
            isOneToOne: false
            referencedRelation: "etapas_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrevistas_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_pipeline: {
        Row: {
          color: string
          created_at: string
          es_final: boolean
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          color?: string
          created_at?: string
          es_final?: boolean
          id?: string
          nombre: string
          orden: number
        }
        Update: {
          color?: string
          created_at?: string
          es_final?: boolean
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      evaluaciones: {
        Row: {
          archivo_url: string
          candidato_id: string
          created_at: string
          id: string
          nombre: string
          tipo: string
          updated_at: string
          vacante_id: string | null
        }
        Insert: {
          archivo_url: string
          candidato_id: string
          created_at?: string
          id?: string
          nombre: string
          tipo?: string
          updated_at?: string
          vacante_id?: string | null
        }
        Update: {
          archivo_url?: string
          candidato_id?: string
          created_at?: string
          id?: string
          nombre?: string
          tipo?: string
          updated_at?: string
          vacante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      facturacion: {
        Row: {
          cliente_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_factura"]
          fecha_solicitud: string | null
          id: string
          monto_total: number | null
          tipo: Database["public"]["Enums"]["tipo_factura"] | null
          updated_at: string
          url_factura: string | null
          vacante_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_solicitud?: string | null
          id?: string
          monto_total?: number | null
          tipo?: Database["public"]["Enums"]["tipo_factura"] | null
          updated_at?: string
          url_factura?: string | null
          vacante_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_solicitud?: string | null
          id?: string
          monto_total?: number | null
          tipo?: Database["public"]["Enums"]["tipo_factura"] | null
          updated_at?: string
          url_factura?: string | null
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturacion_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_cliente: {
        Row: {
          candidato_id: string
          comentario: string | null
          created_at: string
          decision: string
          id: string
          usuario_cliente_id: string | null
          vacante_id: string
        }
        Insert: {
          candidato_id: string
          comentario?: string | null
          created_at?: string
          decision: string
          id?: string
          usuario_cliente_id?: string | null
          vacante_id: string
        }
        Update: {
          candidato_id?: string
          comentario?: string | null
          created_at?: string
          decision?: string
          id?: string
          usuario_cliente_id?: string | null
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_cliente_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_cliente_usuario_cliente_id_fkey"
            columns: ["usuario_cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_cliente_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_etapas: {
        Row: {
          created_at: string
          etapa_id: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          movido_por_usuario: string | null
          notas: string | null
          postulacion_id: string
        }
        Insert: {
          created_at?: string
          etapa_id: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          movido_por_usuario?: string | null
          notas?: string | null
          postulacion_id: string
        }
        Update: {
          created_at?: string
          etapa_id?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          movido_por_usuario?: string | null
          notas?: string | null
          postulacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_etapas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_etapas_postulacion_id_fkey"
            columns: ["postulacion_id"]
            isOneToOne: false
            referencedRelation: "postulaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pagos: {
        Row: {
          creado_por: string | null
          created_at: string
          facturacion_id: string
          fecha_pago: string
          id: string
          metodo_pago: string | null
          monto: number
          notas: string | null
          tipo: Database["public"]["Enums"]["tipo_pago"]
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          facturacion_id: string
          fecha_pago?: string
          id?: string
          metodo_pago?: string | null
          monto: number
          notas?: string | null
          tipo: Database["public"]["Enums"]["tipo_pago"]
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          facturacion_id?: string
          fecha_pago?: string
          id?: string
          metodo_pago?: string | null
          monto?: number
          notas?: string | null
          tipo?: Database["public"]["Enums"]["tipo_pago"]
        }
        Relationships: [
          {
            foreignKeyName: "pagos_facturacion_id_fkey"
            columns: ["facturacion_id"]
            isOneToOne: false
            referencedRelation: "facturacion"
            referencedColumns: ["id"]
          },
        ]
      }
      postulaciones: {
        Row: {
          candidato_id: string
          created_at: string
          descartado: boolean
          etapa_id: string
          fecha_postulacion: string
          fecha_ultima_actualizacion: string
          ia_compatibility_score: number | null
          ia_match_analysis: string | null
          ia_missing_skills: string[] | null
          id: string
          motivo_descarte: string | null
          notas: string | null
          vacante_id: string
        }
        Insert: {
          candidato_id: string
          created_at?: string
          descartado?: boolean
          etapa_id: string
          fecha_postulacion?: string
          fecha_ultima_actualizacion?: string
          ia_compatibility_score?: number | null
          ia_match_analysis?: string | null
          ia_missing_skills?: string[] | null
          id?: string
          motivo_descarte?: string | null
          notas?: string | null
          vacante_id: string
        }
        Update: {
          candidato_id?: string
          created_at?: string
          descartado?: boolean
          etapa_id?: string
          fecha_postulacion?: string
          fecha_ultima_actualizacion?: string
          ia_compatibility_score?: number | null
          ia_match_analysis?: string | null
          ia_missing_skills?: string[] | null
          id?: string
          motivo_descarte?: string | null
          notas?: string | null
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postulaciones_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postulaciones_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postulaciones_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cliente_id: string | null
          created_at: string
          email: string
          especialidad_niveles:
            | Database["public"]["Enums"]["clasificacion_vacante"][]
            | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cliente_id?: string | null
          created_at?: string
          email: string
          especialidad_niveles?:
            | Database["public"]["Enums"]["clasificacion_vacante"][]
            | null
          id: string
          nombre: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cliente_id?: string | null
          created_at?: string
          email?: string
          especialidad_niveles?:
            | Database["public"]["Enums"]["clasificacion_vacante"][]
            | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cliente_id_fkey"
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
      vacancy_templates: {
        Row: {
          actividades_idiomas: string | null
          anios_experiencia_min: number | null
          area: string | null
          beneficios_adicionales: string | null
          bonos: string | null
          carrera: string | null
          categoria: string | null
          clasificacion:
            | Database["public"]["Enums"]["clasificacion_vacante"]
            | null
          cliente_id: string | null
          competencias_clave: string | null
          conocimientos_tecnicos: string | null
          created_at: string
          descripcion: string | null
          descripcion_prestaciones: string | null
          disponibilidad_viaje: boolean | null
          estatus_carrera: string | null
          experiencia_requerida: string | null
          genero: string | null
          habilidades_tecnicas: string | null
          herramientas_trabajo: string | null
          id: string
          idiomas_requeridos: string | null
          moneda_salario: string | null
          nivel_educativo_min: string | null
          nombre_plantilla: string
          periodo_pago: string | null
          posiciones: number | null
          preguntas_knockout: Json | null
          prestaciones: string | null
          prioridad: Database["public"]["Enums"]["prioridad_vacante"] | null
          rango_edad_max: number | null
          rango_edad_min: number | null
          reclutador_id: string | null
          requiere_anticipo: boolean | null
          salario_max: number | null
          salario_mensual_bruto: number | null
          salario_min: number | null
          subcategoria: string | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"] | null
          titulo: string | null
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          actividades_idiomas?: string | null
          anios_experiencia_min?: number | null
          area?: string | null
          beneficios_adicionales?: string | null
          bonos?: string | null
          carrera?: string | null
          categoria?: string | null
          clasificacion?:
            | Database["public"]["Enums"]["clasificacion_vacante"]
            | null
          cliente_id?: string | null
          competencias_clave?: string | null
          conocimientos_tecnicos?: string | null
          created_at?: string
          descripcion?: string | null
          descripcion_prestaciones?: string | null
          disponibilidad_viaje?: boolean | null
          estatus_carrera?: string | null
          experiencia_requerida?: string | null
          genero?: string | null
          habilidades_tecnicas?: string | null
          herramientas_trabajo?: string | null
          id?: string
          idiomas_requeridos?: string | null
          moneda_salario?: string | null
          nivel_educativo_min?: string | null
          nombre_plantilla: string
          periodo_pago?: string | null
          posiciones?: number | null
          preguntas_knockout?: Json | null
          prestaciones?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_vacante"] | null
          rango_edad_max?: number | null
          rango_edad_min?: number | null
          reclutador_id?: string | null
          requiere_anticipo?: boolean | null
          salario_max?: number | null
          salario_mensual_bruto?: number | null
          salario_min?: number | null
          subcategoria?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"] | null
          titulo?: string | null
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          actividades_idiomas?: string | null
          anios_experiencia_min?: number | null
          area?: string | null
          beneficios_adicionales?: string | null
          bonos?: string | null
          carrera?: string | null
          categoria?: string | null
          clasificacion?:
            | Database["public"]["Enums"]["clasificacion_vacante"]
            | null
          cliente_id?: string | null
          competencias_clave?: string | null
          conocimientos_tecnicos?: string | null
          created_at?: string
          descripcion?: string | null
          descripcion_prestaciones?: string | null
          disponibilidad_viaje?: boolean | null
          estatus_carrera?: string | null
          experiencia_requerida?: string | null
          genero?: string | null
          habilidades_tecnicas?: string | null
          herramientas_trabajo?: string | null
          id?: string
          idiomas_requeridos?: string | null
          moneda_salario?: string | null
          nivel_educativo_min?: string | null
          nombre_plantilla?: string
          periodo_pago?: string | null
          posiciones?: number | null
          preguntas_knockout?: Json | null
          prestaciones?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_vacante"] | null
          rango_edad_max?: number | null
          rango_edad_min?: number | null
          reclutador_id?: string | null
          requiere_anticipo?: boolean | null
          salario_max?: number | null
          salario_mensual_bruto?: number | null
          salario_min?: number | null
          subcategoria?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"] | null
          titulo?: string | null
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancy_templates_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      vacantes: {
        Row: {
          actividades_idiomas: string | null
          anios_experiencia_min: number | null
          area: string | null
          beneficios_adicionales: string | null
          bonos: string | null
          candidato_contratado_id: string | null
          carrera: string | null
          categoria: string | null
          clasificacion:
            | Database["public"]["Enums"]["clasificacion_vacante"]
            | null
          cliente_id: string | null
          competencias_clave: string | null
          conocimientos_tecnicos: string | null
          created_at: string
          descripcion: string | null
          descripcion_prestaciones: string | null
          disponibilidad_viaje: boolean | null
          ejecutivo_id: string | null
          estado: Database["public"]["Enums"]["estado_vacante"]
          estatus_carrera: string | null
          experiencia_requerida: string | null
          fecha_cierre: string | null
          fecha_publicacion: string | null
          genero: string | null
          habilidades_tecnicas: string | null
          herramientas_trabajo: string | null
          id: string
          idiomas_requeridos: string | null
          moneda_salario: string | null
          nivel_educativo_min: string | null
          periodo_pago: string | null
          posiciones: number | null
          preguntas_knockout: Json | null
          prestaciones: string | null
          prioridad: Database["public"]["Enums"]["prioridad_vacante"]
          rango_edad_max: number | null
          rango_edad_min: number | null
          reclutador_id: string | null
          requiere_anticipo: boolean | null
          salario_max: number | null
          salario_mensual_bruto: number | null
          salario_min: number | null
          subcategoria: string | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          titulo: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          actividades_idiomas?: string | null
          anios_experiencia_min?: number | null
          area?: string | null
          beneficios_adicionales?: string | null
          bonos?: string | null
          candidato_contratado_id?: string | null
          carrera?: string | null
          categoria?: string | null
          clasificacion?:
            | Database["public"]["Enums"]["clasificacion_vacante"]
            | null
          cliente_id?: string | null
          competencias_clave?: string | null
          conocimientos_tecnicos?: string | null
          created_at?: string
          descripcion?: string | null
          descripcion_prestaciones?: string | null
          disponibilidad_viaje?: boolean | null
          ejecutivo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_vacante"]
          estatus_carrera?: string | null
          experiencia_requerida?: string | null
          fecha_cierre?: string | null
          fecha_publicacion?: string | null
          genero?: string | null
          habilidades_tecnicas?: string | null
          herramientas_trabajo?: string | null
          id?: string
          idiomas_requeridos?: string | null
          moneda_salario?: string | null
          nivel_educativo_min?: string | null
          periodo_pago?: string | null
          posiciones?: number | null
          preguntas_knockout?: Json | null
          prestaciones?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_vacante"]
          rango_edad_max?: number | null
          rango_edad_min?: number | null
          reclutador_id?: string | null
          requiere_anticipo?: boolean | null
          salario_max?: number | null
          salario_mensual_bruto?: number | null
          salario_min?: number | null
          subcategoria?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          titulo: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          actividades_idiomas?: string | null
          anios_experiencia_min?: number | null
          area?: string | null
          beneficios_adicionales?: string | null
          bonos?: string | null
          candidato_contratado_id?: string | null
          carrera?: string | null
          categoria?: string | null
          clasificacion?:
            | Database["public"]["Enums"]["clasificacion_vacante"]
            | null
          cliente_id?: string | null
          competencias_clave?: string | null
          conocimientos_tecnicos?: string | null
          created_at?: string
          descripcion?: string | null
          descripcion_prestaciones?: string | null
          disponibilidad_viaje?: boolean | null
          ejecutivo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_vacante"]
          estatus_carrera?: string | null
          experiencia_requerida?: string | null
          fecha_cierre?: string | null
          fecha_publicacion?: string | null
          genero?: string | null
          habilidades_tecnicas?: string | null
          herramientas_trabajo?: string | null
          id?: string
          idiomas_requeridos?: string | null
          moneda_salario?: string | null
          nivel_educativo_min?: string | null
          periodo_pago?: string | null
          posiciones?: number | null
          preguntas_knockout?: Json | null
          prestaciones?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_vacante"]
          rango_edad_max?: number | null
          rango_edad_min?: number | null
          reclutador_id?: string | null
          requiere_anticipo?: boolean | null
          salario_max?: number | null
          salario_mensual_bruto?: number | null
          salario_min?: number | null
          subcategoria?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          titulo?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_candidato_contratado"
            columns: ["candidato_contratado_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacantes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacantes_ejecutivo_id_fkey"
            columns: ["ejecutivo_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacantes_reclutador_id_fkey"
            columns: ["reclutador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_client_user: {
        Args: {
          cliente_id: string
          email: string
          nombre: string
          password: string
        }
        Returns: Json
      }
      get_client_metrics: {
        Args: never
        Returns: {
          candidatos_totales: number
          cliente_nombre: string
          vacantes_activas: number
          vacantes_totales: number
        }[]
      }
      get_dashboard_kpis:
        | {
            Args: {
              p_cliente_id?: string
              p_end_date?: string
              p_reclutador_id?: string
              p_start_date?: string
            }
            Returns: Database["public"]["CompositeTypes"]["dashboard_kpis"]
            SetofOptions: {
              from: "*"
              to: "dashboard_kpis"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_clasificacion?: string
              p_cliente_id?: string
              p_end_date?: string
              p_reclutador_id?: string
              p_start_date?: string
            }
            Returns: Database["public"]["CompositeTypes"]["dashboard_kpis"]
            SetofOptions: {
              from: "*"
              to: "dashboard_kpis"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      get_pipeline_metrics:
        | {
            Args: { p_vacante_id?: string }
            Returns: {
              color: string
              count: number
              etapa_nombre: string
              orden: number
            }[]
          }
        | {
            Args: { p_clasificacion?: string; p_vacante_id?: string }
            Returns: {
              color: string
              count: number
              etapa_nombre: string
              orden: number
            }[]
          }
      get_pipeline_velocity: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_vacante_id?: string
        }
        Returns: {
          etapa_nombre: string
          etapa_orden: number
          promedio_dias: number
          total_candidatos: number
        }[]
      }
      get_recruiter_metrics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          reclutador_nombre: string
          tasa_exito: number
          tiempo_promedio_cierre: number
          vacantes_asignadas: number
          vacantes_cerradas: number
        }[]
      }
      get_rejection_reasons: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          count: number
          motivo: string
          percentage: number
        }[]
      }
      get_time_to_discard_metrics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          descartes_rapidos_count: number
          promedio_dias_descarte: number
          total_descartados: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_vacancies_by_classification: {
        Args: { p_cliente_id?: string; p_reclutador_id?: string }
        Returns: {
          clasificacion: string
          count: number
        }[]
      }
      get_vacancy_metrics:
        | {
            Args: { p_periodo?: string }
            Returns: {
              cerradas: number
              nuevas: number
              periodo: string
            }[]
          }
        | {
            Args: { p_clasificacion?: string; p_periodo?: string }
            Returns: {
              cerradas: number
              nuevas: number
              periodo: string
            }[]
          }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registrar_postulacion: {
        Args: {
          p_cv_url?: string
          p_email: string
          p_linkedin_url?: string
          p_nombre: string
          p_telefono?: string
          p_ubicacion?: string
          p_vacante_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "coordinador" | "reclutador" | "ejecutivo" | "cliente"
      clasificacion_vacante:
        | "operativa"
        | "administrativa"
        | "gerencial"
        | "directiva"
      estado_entrevista:
        | "programada"
        | "reprogramada"
        | "realizada"
        | "cancelada"
      estado_factura:
        | "pendiente"
        | "solicitada"
        | "facturada"
        | "pagada"
        | "cancelada"
      estado_vacante:
        | "borrador"
        | "publicada"
        | "pausada"
        | "archivada"
        | "cerrada"
        | "pendiente_pago"
      modalidad_entrevista: "presencial" | "online"
      prioridad_vacante: "baja" | "media" | "alta" | "urgente"
      tipo_contrato:
        | "tiempo_completo"
        | "medio_tiempo"
        | "temporal"
        | "proyecto"
        | "freelance"
      tipo_entrevista: "interna" | "cliente" | "tecnica" | "seguimiento"
      tipo_factura: "anticipo" | "cierre"
      tipo_pago: "anticipo" | "liquidación"
    }
    CompositeTypes: {
      dashboard_kpis: {
        total_vacantes_activas: number | null
        total_vacantes_cerradas: number | null
        tiempo_promedio_cobertura: number | null
        tasa_rechazo_promedio: number | null
        candidatos_por_vacante: number | null
      }
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
      app_role: ["admin", "coordinador", "reclutador", "ejecutivo", "cliente"],
      clasificacion_vacante: [
        "operativa",
        "administrativa",
        "gerencial",
        "directiva",
      ],
      estado_entrevista: [
        "programada",
        "reprogramada",
        "realizada",
        "cancelada",
      ],
      estado_factura: [
        "pendiente",
        "solicitada",
        "facturada",
        "pagada",
        "cancelada",
      ],
      estado_vacante: [
        "borrador",
        "publicada",
        "pausada",
        "archivada",
        "cerrada",
        "pendiente_pago",
      ],
      modalidad_entrevista: ["presencial", "online"],
      prioridad_vacante: ["baja", "media", "alta", "urgente"],
      tipo_contrato: [
        "tiempo_completo",
        "medio_tiempo",
        "temporal",
        "proyecto",
        "freelance",
      ],
      tipo_entrevista: ["interna", "cliente", "tecnica", "seguimiento"],
      tipo_factura: ["anticipo", "cierre"],
      tipo_pago: ["anticipo", "liquidación"],
    },
  },
} as const
