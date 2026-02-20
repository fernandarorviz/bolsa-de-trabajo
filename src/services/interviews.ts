import { supabase } from '@/integrations/supabase/client';
import type { Entrevista, EntrevistaFormData } from '@/types/ats';
import { notificationsService } from './notifications';

export const interviewsService = {
  async create(data: EntrevistaFormData) {
    const { data: interview, error } = await (supabase
      .from('entrevistas' as any)
      .insert({
        ...data,
        fecha_inicio: data.fecha_inicio.toISOString(),
        fecha_fin: data.fecha_fin.toISOString(),
        proposed_slots: data.proposed_slots?.map(slot => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString()
        }))
      })
      .select() as any);

    if (error) throw error;

    // Notify Candidate if proposal
    if (data.proposed_slots && data.proposed_slots.length > 0) {
      try {
        const { data: candidate } = await (supabase
          .from('candidatos' as any)
          .select('user_id, nombre')
          .eq('id', data.candidato_id)
          .single() as any);

        if (candidate?.user_id) {
          const { data: vacancy } = await (supabase
            .from('vacantes' as any)
            .select('titulo')
            .eq('id', data.vacante_id)
            .single() as any);

          await notificationsService.createNotification({
            user_id: candidate.user_id,
            title: 'Nueva propuesta de entrevista',
            message: `Te han propuesto horarios para una entrevista para la vacante: ${vacancy?.titulo || 'Sin título'}`,
            type: 'interview_proposal',
            metadata: { interview_id: interview[0].id }
          });
        }
      } catch (err) {
        console.error("Error sending notification:", err);
      }
    } else {
      // If it's a direct scheduling (not a proposal), notify the client
      try {
        const { data: vacancy } = await (supabase
          .from('vacantes' as any)
          .select('titulo, cliente_id')
          .eq('id', data.vacante_id)
          .single() as any);

        if (vacancy?.cliente_id) {
          const { data: candidate } = await (supabase
            .from('candidatos' as any)
            .select('nombre')
            .eq('id', data.candidato_id)
            .single() as any);

          await notificationsService.notifyClientUsers(vacancy.cliente_id, {
            title: 'Nueva entrevista agendada',
            message: `Se ha agendado una entrevista con ${candidate?.nombre || 'un candidato'} para la vacante ${vacancy.titulo}`,
            type: 'interview_confirmed',
            metadata: { interview_id: interview[0].id }
          });
        }
      } catch (err) {
        console.error("Error sending client notification:", err);
      }
    }
  },

  async update(id: string, data: Partial<EntrevistaFormData>) {
    const updateData: any = { ...data };
    if (data.fecha_inicio) updateData.fecha_inicio = data.fecha_inicio.toISOString();
    if (data.fecha_fin) updateData.fecha_fin = data.fecha_fin.toISOString();
    if (data.proposed_slots) {
      updateData.proposed_slots = data.proposed_slots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString()
      }));
    }

    const { error } = await (supabase
      .from('entrevistas' as any)
      .update(updateData)
      .eq('id', id) as any);

    if (error) throw error;
  },

  async getByVacancy(vacancyId: string) {
    const { data, error } = await (supabase
      .from('entrevistas' as any)
      .select(`
        *,
        vacante:vacantes(titulo),
        candidato:candidatos(nombre, email),
        etapa:etapas_pipeline(nombre, color),
        creador:profiles(nombre)
      `)
      .eq('vacante_id', vacancyId)
      .order('fecha_inicio', { ascending: true }) as any);

    if (error) throw error;
    return data as Entrevista[];
  },

  async getByCandidate(candidateId: string) {
    const { data, error } = await (supabase
      .from('entrevistas' as any)
      .select(`
        *,
        vacante:vacantes(titulo),
        etapa:etapas_pipeline(nombre, color),
        creador:profiles(nombre)
      `)
      .eq('candidato_id', candidateId)
      .order('fecha_inicio', { ascending: false }) as any);

    if (error) throw error;
    return data as Entrevista[];
  },

  async confirmInterview(id: string, confirmed: boolean) {
    // 1. Fetch interview details first
    const { data: interview, error: fetchError } = await (supabase
      .from('entrevistas' as any)
      .select('*, vacante:vacantes(titulo, reclutador_id, cliente_id), candidato:candidatos(nombre)')
      .eq('id', id)
      .single() as any);

    if (fetchError) throw fetchError;

    // 2. Update status
    const { error } = await (supabase
      .from('entrevistas' as any)
      .update({ confirmada: confirmed })
      .eq('id', id) as any);

    if (error) throw error;

    // 3. Send Notifications
    const action = confirmed ? 'confirmado' : 'rechazado';
    const type = confirmed ? 'interview_confirmed' : 'interview_cancelled'; // Rejection is effectively a cancellation/issue

    // Notify Recruiter
    if (interview?.vacante?.reclutador_id) {
      try {
        await notificationsService.createNotification({
          user_id: interview.vacante.reclutador_id,
          title: `Entrevista ${confirmed ? 'Confirmada' : 'Rechazada'}`,
          message: `El candidato ${interview.candidato?.nombre || ''} ha ${action} la entrevista para la vacante: ${interview.vacante.titulo}`,
          type: type,
          metadata: { interview_id: id }
        });
      } catch (err) {
        console.error("Error sending notification:", err);
      }
    }

    // Notify Client
    if (interview?.vacante?.cliente_id) {
      try {
        await notificationsService.notifyClientUsers(interview.vacante.cliente_id, {
          title: `Entrevista ${confirmed ? 'Confirmada' : 'Rechazada'}`,
          message: `El candidato ${interview.candidato?.nombre || ''} ha ${action} la entrevista para la vacante: ${interview.vacante.titulo}`,
          type: type,
          metadata: { interview_id: id }
        });
      } catch (err) {
        console.error("Error sending client notification:", err);
      }
    }
  },

  async cancel(id: string, reason?: string) {
    // 1. Fetch interview details to know who to notify
    const { data: interview, error: fetchError } = await (supabase
      .from('entrevistas' as any)
      .select(`
        *,
        vacante:vacantes(titulo, reclutador_id, cliente_id),
        candidato:candidatos(nombre, user_id)
      `)
      .eq('id', id)
      .single() as any);

    if (fetchError) throw fetchError;

    // 2. Perform the cancellation
    const { error: cancelError } = await (supabase
      .from('entrevistas' as any)
      .update({
        estado: 'cancelada',
        notas: reason ? `[Cancelada] ${reason}` : undefined
      })
      .eq('id', id) as any);

    if (cancelError) throw cancelError;

    // 3. Send notifications
    const notifications = [];

    // Notify Candidate
    if (interview.candidato?.user_id) {
      notifications.push(notificationsService.createNotification({
        user_id: interview.candidato.user_id,
        title: 'Entrevista cancelada',
        message: `Tu entrevista para la vacante ${interview.vacante?.titulo || ''} ha sido cancelada.`,
        type: 'interview_cancelled',
        metadata: { interview_id: id }
      }));
    }

    // Notify Recruiter
    if (interview.vacante?.reclutador_id) {
      notifications.push(notificationsService.createNotification({
        user_id: interview.vacante.reclutador_id,
        title: 'Entrevista cancelada',
        message: `La entrevista de ${interview.candidato?.nombre || 'un candidato'} para la vacante ${interview.vacante.titulo} ha sido cancelada.`,
        type: 'interview_cancelled',
        metadata: { interview_id: id }
      }));
    }

    // Notify Client
    if (interview.vacante?.cliente_id) {
      notifications.push(notificationsService.notifyClientUsers(interview.vacante.cliente_id, {
        title: 'Entrevista cancelada',
        message: `La entrevista de ${interview.candidato?.nombre || 'un candidato'} para la vacante ${interview.vacante.titulo} ha sido cancelada.`,
        type: 'interview_cancelled',
        metadata: { interview_id: id }
      }));
    }

    if (notifications.length > 0) {
      try {
        await Promise.all(notifications);
      } catch (err) {
        console.error("Error sending cancellation notifications:", err);
      }
    }
  },

  async delete(id: string) {
    const { error } = await (supabase
      .from('entrevistas' as any)
      .delete()
      .eq('id', id) as any);

    if (error) throw error;
  },

  async markAsCompleted(id: string, notes?: string) {
    const { error } = await (supabase
      .from('entrevistas' as any)
      .update({
        estado: 'realizada',
        notas: notes
      })
      .eq('id', id) as any);

    if (error) throw error;
  },

  async confirmSlot(id: string, slot: { start: string; end: string }) {
    const { data: interview, error: fetchError } = await (supabase
      .from('entrevistas' as any)
      .select('*, vacante:vacantes(titulo, reclutador_id, cliente_id), candidato:candidatos(nombre)')
      .eq('id', id)
      .single() as any);

    if (fetchError) throw fetchError;

    const { error } = await (supabase
      .from('entrevistas' as any)
      .update({
        estado: 'programada',
        fecha_inicio: slot.start,
        fecha_fin: slot.end,
        proposed_slots: []
      })
      .eq('id', id) as any);

    if (error) throw error;

    // Notify Recruiter
    if (interview?.vacante?.reclutador_id) {
      try {
        await notificationsService.createNotification({
          user_id: interview.vacante.reclutador_id,
          title: 'Entrevista confirmada',
          message: `El candidato ${interview.candidato?.nombre || ''} ha confirmado el horario para la vacante: ${interview.vacante.titulo}`,
          type: 'interview_confirmed',
          metadata: { interview_id: id }
        });
      } catch (err) {
        console.error("Error sending notification:", err);
      }
    }

    // Notify Client
    if (interview?.vacante?.cliente_id) {
      try {
        await notificationsService.notifyClientUsers(interview.vacante.cliente_id, {
          title: 'Entrevista confirmada',
          message: `El candidato ${interview.candidato?.nombre || ''} ha confirmado el horario para la vacante: ${interview.vacante.titulo}`,
          type: 'interview_confirmed',
          metadata: { interview_id: id }
        });
      } catch (err) {
        console.error("Error sending client notification:", err);
      }
    }
  }
};
