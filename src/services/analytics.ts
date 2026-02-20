
import { supabase } from "@/integrations/supabase/client";

export interface DashboardFilters {
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
  recruiterId?: string;
  classification?: string;
}

export interface DashboardKPIs {
  total_vacantes_activas: number;
  total_vacantes_cerradas: number;
  tiempo_promedio_cobertura: number;
  tasa_rechazo_promedio: number;
  candidatos_por_vacante: number;
}

export const analyticsService = {
  async getDashboardKPIs(filters: DashboardFilters) {
    const { data, error } = await supabase.rpc('get_dashboard_kpis' as any, {
      p_start_date: filters.startDate?.toISOString(),
      p_end_date: filters.endDate?.toISOString(),
      p_cliente_id: filters.clientId || null,
      p_reclutador_id: filters.recruiterId || null,
      p_clasificacion: filters.classification || null
    });

    if (error) throw error;
    return data as unknown as DashboardKPIs;
  },

  async getVacancyMetrics(period: 'week' | 'month' | 'year' = 'month', classification?: string) {
    const { data, error } = await supabase.rpc('get_vacancy_metrics' as any, {
      p_periodo: period,
      p_clasificacion: classification || null
    });

    if (error) throw error;
    return data as { periodo: string; nuevas: number; cerradas: number }[];
  },

  async getPipelineMetrics(vacanteId?: string, classification?: string) {
    const { data, error } = await supabase.rpc('get_pipeline_metrics' as any, {
      p_vacante_id: vacanteId || null,
      p_clasificacion: classification || null
    });

    if (error) throw error;
    return data as { etapa_nombre: string; color: string; count: number; orden: number }[];
  },

  async getRecruiterMetrics(filters: DashboardFilters) {
    const { data, error } = await supabase.rpc('get_recruiter_metrics' as any, {
      p_start_date: filters.startDate?.toISOString(),
      p_end_date: filters.endDate?.toISOString()
    });

    if (error) throw error;
    return data as {
      reclutador_nombre: string;
      vacantes_asignadas: number;
      vacantes_cerradas: number;
      tiempo_promedio: number;
      tasa_exito: number;
    }[];
  },

  async getClientMetrics() {
    const { data, error } = await supabase.rpc('get_client_metrics' as any);

    if (error) throw error;
    return data as {
      cliente_nombre: string;
      vacantes_totales: number;
      vacantes_activas: number;
      candidatos_totales: number;
    }[];
  },

  async getHiringMetrics(year: number) {
    // 1. Get "Contratado" stage ID
    const { data: stageData, error: stageError } = await supabase
      .from('etapas_pipeline')
      .select('id')
      .eq('nombre', 'Contratado')
      .single();

    if (stageError) {
      console.error("Error finding 'Contratado' stage:", stageError);
      return { clientMatrix: [], recruiterMatrix: [], pareto: [] };
    }

    // 2. Get hirings for the year
    const startOfYear = new Date(year, 0, 1).toISOString();
    const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString();

    const { data: hirings, error: hiringsError } = await supabase
      .from('postulaciones')
      .select(`
        fecha_ultima_actualizacion,
        vacante:vacantes (
          cliente:clientes (
            id,
            nombre
          ),
          reclutador:profiles!vacantes_reclutador_id_fkey (
            id,
            nombre
          )
        )
      `)
      .eq('etapa_id', stageData.id)
      .gte('fecha_ultima_actualizacion', startOfYear)
      .lte('fecha_ultima_actualizacion', endOfYear);

    if (hiringsError) throw hiringsError;

    // 3. Process Data for Clients
    const clientStats = new Map<string, {
      id: string;
      name: string;
      months: number[];
      total: number;
    }>();

    // 4. Process Data for Recruiters
    const recruiterStats = new Map<string, {
      id: string;
      name: string;
      months: number[];
      total: number;
    }>();

    hirings?.forEach((hiring: any) => {
      const client = hiring.vacante?.cliente;
      const recruiter = hiring.vacante?.reclutador;
      const date = new Date(hiring.fecha_ultima_actualizacion);
      const month = date.getMonth(); // 0-11

      // Client logic
      if (client) {
        if (!clientStats.has(client.id)) {
          clientStats.set(client.id, {
            id: client.id,
            name: client.nombre,
            months: new Array(12).fill(0),
            total: 0
          });
        }
        const stats = clientStats.get(client.id)!;
        stats.months[month]++;
        stats.total++;
      }

      // Recruiter logic
      const recruiterId = recruiter?.id || 'unassigned';
      const recruiterName = recruiter?.nombre || 'Sin Asignar';

      if (!recruiterStats.has(recruiterId)) {
        recruiterStats.set(recruiterId, {
          id: recruiterId,
          name: recruiterName,
          months: new Array(12).fill(0),
          total: 0
        });
      }
      const rStats = recruiterStats.get(recruiterId)!;
      rStats.months[month]++;
      rStats.total++;
    });

    const clientMatrix = Array.from(clientStats.values()).sort((a, b) => b.total - a.total);
    const recruiterMatrix = Array.from(recruiterStats.values()).sort((a, b) => b.total - a.total);

    // 5. Calculate Pareto (80/20) based on clients
    const totalHirings = clientMatrix.reduce((sum, client) => sum + client.total, 0);
    let cumulativeCount = 0;

    const pareto = clientMatrix.map(client => {
      cumulativeCount += client.total;
      return {
        id: client.id,
        name: client.name,
        count: client.total,
        percentage: totalHirings > 0 ? (client.total / totalHirings) * 100 : 0,
        cumulativePercentage: totalHirings > 0 ? (cumulativeCount / totalHirings) * 100 : 0
      };
    });

    return { clientMatrix, recruiterMatrix, pareto };
  },

  async getPipelineBreakdownByVacancy(classification?: string) {
    // 1. Get all active vacancies with basic info
    let query = supabase
      .from('vacantes')
      .select(`
        id,
        titulo,
        estado,
        cliente:clientes(nombre),
        reclutador:profiles!vacantes_reclutador_id_fkey(nombre)
      `)
      .in('estado', ['publicada', 'pausada', 'pendiente_pago']);

    if (classification) {
      query = query.eq('clasificacion', classification as any);
    }

    const { data: vacancies, error: vacError } = await query.order('created_at', { ascending: false });

    if (vacError) throw vacError;

    // 2. Get all pipeline stages to know the columns
    const { data: stages, error: stagesError } = await supabase
      .from('etapas_pipeline')
      .select('id, nombre, orden, color')
      .order('orden');

    if (stagesError) throw stagesError;

    // 3. Get all active postulations for these vacancies
    const vacancyIds = vacancies.map(v => v.id);
    if (vacancyIds.length === 0) return { data: [], stages: stages };

    const { data: postulations, error: postError } = await supabase
      .from('postulaciones')
      .select('vacante_id, etapa_id')
      .in('vacante_id', vacancyIds)
      .eq('descartado', false);

    if (postError) throw postError;

    // 4. Aggregate data
    const breakdown = vacancies.map(v => {
      const counts: Record<string, number> = {};
      stages.forEach(s => {
        counts[s.id] = postulations.filter(p => p.vacante_id === v.id && p.etapa_id === s.id).length;
      });

      return {
        id: v.id,
        titulo: v.titulo,
        cliente: (v.cliente as any)?.nombre || 'N/A',
        reclutador: (v.reclutador as any)?.nombre || 'N/A',
        counts
      };
    });

    return {
      data: breakdown,
      stages
    };
  }
};
