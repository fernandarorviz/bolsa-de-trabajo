export type AppRole = 'admin' | 'coordinador' | 'reclutador' | 'ejecutivo' | 'cliente';
export type EstadoVacante = 'borrador' | 'pendiente_pago' | 'publicada' | 'pausada' | 'archivada' | 'cerrada';
export type TipoFactura = 'anticipo' | 'cierre';
export type TipoContrato = 'tiempo_completo' | 'medio_tiempo' | 'temporal' | 'proyecto' | 'freelance';
export type PrioridadVacante = 'baja' | 'media' | 'alta' | 'urgente';
export type TipoPreguntaKnockout = 'booleano' | 'numerico';
export type ReglaPreguntaKnockout = 'si' | 'no' | 'minimo' | 'maximo' | 'exacto';
export type ClasificacionVacante = 'operativa' | 'administrativa' | 'gerencial' | 'directiva';

export interface KnockoutQuestion {
  id: string;
  pregunta: string;
  tipo: TipoPreguntaKnockout;
  regla: ReglaPreguntaKnockout;
  valor_referencia?: number | string;
}

export interface Profile {
  id: string;
  email: string;
  nombre: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  cliente_id?: string | null;
  especialidad_niveles?: ClasificacionVacante[] | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  industria: string | null;
  contacto_nombre: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  rfc?: string | null;
  razon_social?: string | null;
  direccion_fiscal?: string | null;
  regimen_fiscal?: string | null;
  cp?: string | null;
  constancia_fiscal_url?: string | null;
  sector?: string | null;
  sitio_web?: string | null;
  descripcion?: string | null;
  comentarios?: string | null;
  logo_url?: string | null;
  cobranding_activo?: boolean;
  profiles_count?: number;
}

export interface EtapaPipeline {
  id: string;
  nombre: string;
  orden: number;
  color: string;
  es_final: boolean;
  created_at: string;
}

export interface Vacante {
  id: string;
  titulo: string;
  descripcion: string | null;
  cliente_id: string | null;
  ubicacion: string | null;
  area: string | null;
  tipo_contrato: TipoContrato;
  estado: EstadoVacante;
  prioridad: PrioridadVacante;
  salario_min: number | null;
  salario_max: number | null;
  reclutador_id: string | null;
  ejecutivo_id: string | null;
  fecha_publicacion: string | null;
  fecha_cierre: string | null;
  candidato_contratado_id: string | null;
  requiere_anticipo: boolean;
  competencias_clave?: string | null;
  anios_experiencia_min?: number | null;
  nivel_educativo_min?: string | null;
  posiciones?: number;
  rango_edad_min?: number | null;
  rango_edad_max?: number | null;
  genero?: 'masculino' | 'femenino' | 'indistinto' | null;
  disponibilidad_viaje?: boolean;
  categoria?: string | null;
  subcategoria?: string | null;
  clasificacion?: ClasificacionVacante | null;
  idiomas_requeridos?: string | null;
  actividades_idiomas?: string | null;
  conocimientos_tecnicos?: string | null;
  experiencia_requerida?: string | null;
  habilidades_tecnicas?: string | null;
  estatus_carrera?: string | null;
  carrera?: string | null;
  salario_mensual_bruto?: number | null;
  moneda_salario?: 'MXN' | 'USD' | 'EUR' | 'CAD' | null;
  periodo_pago?: 'semanal' | 'quincenal' | 'mensual' | null;
  prestaciones?: string | null;
  descripcion_prestaciones?: string | null;
  beneficios_adicionales?: string | null;
  bonos?: string | null;
  herramientas_trabajo?: string | null;
  preguntas_knockout?: KnockoutQuestion[] | null;
  created_at: string;
  updated_at: string;
  // Relations
  cliente?: Cliente | null;
  reclutador?: Profile | null;
  ejecutivo?: Profile | null;
  postulaciones?: { count: number }[];
}

export interface Candidato {
  id: string;
  user_id?: string | null;
  nombre: string;
  email: string;
  telefono: string | null;
  ubicacion: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  resumen_profesional?: string | null;
  experiencia?: any[] | null; // Tipar mejor si es posible, por ahora array
  educacion?: any[] | null;
  habilidades?: string[] | null;
  estado_general: string | null;
  notas: string | null;
  perfil_completo: boolean;
  created_at: string;
  updated_at: string;
}

export interface VacancyTemplate {
  id: string;
  nombre_plantilla: string;
  reclutador_id: string | null;
  cliente_id: string | null;
  created_at: string;
  updated_at: string;
  titulo: string | null;
  descripcion: string | null;
  ubicacion: string | null;
  area: string | null;
  tipo_contrato: TipoContrato | null;
  prioridad: PrioridadVacante | null;
  clasificacion: ClasificacionVacante | null;
  salario_min: number | null;
  salario_max: number | null;
  requiere_anticipo: boolean;
  posiciones: number;
  rango_edad_min: number | null;
  rango_edad_max: number | null;
  genero: 'masculino' | 'femenino' | 'indistinto' | null;
  disponibilidad_viaje: boolean;
  categoria: string | null;
  subcategoria: string | null;
  nivel_educativo_min: string | null;
  carrera: string | null;
  estatus_carrera: string | null;
  anios_experiencia_min: number | null;
  idiomas_requeridos: string | null;
  actividades_idiomas: string | null;
  conocimientos_tecnicos: string | null;
  experiencia_requerida: string | null;
  habilidades_tecnicas: string | null;
  competencias_clave: string | null;
  salario_mensual_bruto: number | null;
  moneda_salario: 'MXN' | 'USD' | 'EUR' | 'CAD' | null;
  periodo_pago: 'semanal' | 'quincenal' | 'mensual' | null;
  prestaciones: string | null;
  descripcion_prestaciones: string | null;
  beneficios_adicionales: string | null;
  bonos: string | null;
  herramientas_trabajo: string | null;
  preguntas_knockout: KnockoutQuestion[] | null;
}

export interface Postulacion {
  id: string;
  vacante_id: string;
  candidato_id: string;
  etapa_id: string;
  fecha_postulacion: string;
  fecha_ultima_actualizacion: string;
  descartado: boolean;
  motivo_descarte: string | null;
  notas: string | null;
  ia_compatibility_score?: number | null;
  ia_match_analysis?: string | null;
  ia_missing_skills?: string[] | null;
  created_at: string;
  // Relations
  candidato?: Candidato;
  etapa?: EtapaPipeline;
  vacante?: Vacante;
  feedback_cliente?: any[]; // For now, we can refine if needed
}

export interface HistorialEtapa {
  id: string;
  postulacion_id: string;
  etapa_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  movido_por_usuario: string | null;
  notas: string | null;
  created_at: string;
  // Relations
  etapa?: EtapaPipeline;
}

// Metrics types
export interface VacanteMetrics {
  total_candidatos: number;
  candidatos_por_etapa: { etapa: string; count: number; color: string }[];
  tiempo_promedio_por_etapa: { etapa: string; dias: number }[];
  tiempo_total_cobertura: number | null;
  tasa_conversion: number;
}

// Form types
export interface VacanteFormData {
  titulo: string;
  descripcion?: string;
  cliente_id?: string;
  ubicacion?: string;
  area?: string;
  tipo_contrato: TipoContrato;
  prioridad: PrioridadVacante;
  salario_min?: number;
  salario_max?: number;
  reclutador_id?: string;
  ejecutivo_id?: string;
  posiciones?: number;
  rango_edad_min?: number;
  rango_edad_max?: number;
  genero?: 'masculino' | 'femenino' | 'indistinto';
  disponibilidad_viaje?: boolean;
  categoria?: string;
  subcategoria?: string;
  clasificacion?: ClasificacionVacante;
  idiomas_requeridos?: string;
  actividades_idiomas?: string;
  conocimientos_tecnicos?: string;
  experiencia_requerida?: string;
  habilidades_tecnicas?: string;
  estatus_carrera?: string;
  carrera?: string;
  salario_mensual_bruto?: number;
  moneda_salario?: 'MXN' | 'USD' | 'EUR' | 'CAD';
  periodo_pago?: 'semanal' | 'quincenal' | 'mensual';
  prestaciones?: string;
  descripcion_prestaciones?: string;
  beneficios_adicionales?: string;
  bonos?: string;
  herramientas_trabajo?: string;
  preguntas_knockout?: KnockoutQuestion[];
}

export interface CandidatoFormData {
  nombre: string;
  email: string;
  telefono?: string;
  ubicacion?: string;
  cv_url?: string;
  linkedin_url?: string;
  notas?: string;
  perfil_completo?: boolean;
}

// Interview Types
export type TipoEntrevista = 'interna' | 'cliente' | 'tecnica' | 'seguimiento';
export type ModalidadEntrevista = 'presencial' | 'online';
export type EstadoEntrevista = 'programada' | 'reprogramada' | 'realizada' | 'cancelada' | 'propuesta';

export interface Entrevista {
  id: string;
  vacante_id: string;
  candidato_id: string;
  etapa_pipeline_id: string;
  tipo_entrevista: TipoEntrevista;
  modalidad: ModalidadEntrevista;
  fecha_inicio: string;
  fecha_fin: string;
  link_reunion: string | null;
  ubicacion: string | null;
  estado: EstadoEntrevista;
  notas: string | null;
  proposed_slots: { start: string; end: string }[] | null;
  creada_por: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  vacante?: Vacante;
  candidato?: Candidato;
  etapa?: EtapaPipeline;
  creador?: Profile;
}

export interface EntrevistaFormData {
  vacante_id: string;
  candidato_id: string;
  etapa_pipeline_id: string;
  tipo_entrevista: TipoEntrevista;
  modalidad: ModalidadEntrevista;
  fecha_inicio: Date;
  fecha_fin: Date;
  link_reunion?: string;
  ubicacion?: string;
  notas?: string;
  proposed_slots?: { start: Date; end: Date }[];
}

// Notification Types
export type NotificationType = 'interview_proposal' | 'interview_confirmed' | 'interview_cancelled' | 'status_change' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  metadata: any;
}

// Billing Types
export type EstadoFactura = 'pendiente' | 'solicitada' | 'facturada' | 'pagada' | 'cancelada';
export type TipoPago = 'anticipo' | 'liquidación';

export interface Factura {
  id: string;
  vacante_id: string;
  cliente_id: string;
  monto_total: number;
  estado: EstadoFactura;
  tipo: TipoFactura;
  fecha_solicitud: string | null;
  url_factura: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  vacante?: Vacante;
  cliente?: Cliente;
  pagos?: Pago[];
}

export interface Pago {
  id: string;
  facturacion_id: string;
  monto: number;
  tipo: TipoPago;
  fecha_pago: string;
  metodo_pago: string | null;
  notas: string | null;
  creado_por: string | null;
  created_at: string;
}
