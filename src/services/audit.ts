import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  user?: {
    nombre: string | null;
    email: string | null;
  } | null;
}

export const auditService = {
  getAuditLogs: async (filters?: {
    tableName?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:profiles(nombre, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.tableName && filters.tableName !== 'all') {
      query = query.eq('table_name', filters.tableName);
    }
    if (filters?.userId && filters.userId !== 'all') {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.action && filters.action !== 'all') {
      query = query.eq('action', filters.action);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data, error } = await query.limit(100);
    if (error) throw error;
    return data as AuditLog[];
  }
};
