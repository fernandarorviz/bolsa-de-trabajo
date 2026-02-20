import { Profile } from './ats';

export type DecisionCliente = 'aprobado' | 'rechazado';

export interface FeedbackCliente {
  id: string;
  vacante_id: string;
  candidato_id: string;
  decision: DecisionCliente;
  comentario: string | null;
  created_at: string;
  usuario_cliente_id: string;
  // Relations
  usuario_cliente?: Profile;
}

export interface FeedbackClienteFormData {
  vacante_id: string;
  candidato_id: string;
  decision: DecisionCliente;
  comentario: string;
}

export interface Evaluacion {
  id: string;
  candidato_id: string;
  vacante_id: string | null;
  nombre: string;
  archivo_url: string;
  tipo: string;
  created_at: string;
}
