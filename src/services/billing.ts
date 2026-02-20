import { supabase } from '@/integrations/supabase/client';
import type { Factura, Pago, EstadoFactura, TipoPago, Vacante, Cliente } from '@/types/ats';

export const billingService = {
  async getAll() {
    const { data, error } = await (supabase as any)
      .from('facturacion')
      .select(`
        *,
        vacante:vacantes(*),
        cliente:clientes(*),
        pagos(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any) as (Factura & { vacante: Vacante, cliente: Cliente })[];
  },

  async getByClient(clienteId: string) {
    const { data, error } = await (supabase as any)
      .from('facturacion')
      .select(`
        *,
        vacante:vacantes(*),
        pagos(*)
      `)
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any) as Factura[];
  },

  async updateStatus(id: string, estado: EstadoFactura) {
    const { data, error } = await (supabase as any)
      .from('facturacion')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return (data as any) as Factura;
  },

  async updateAmount(id: string, monto: number) {
    const { data, error } = await (supabase as any)
      .from('facturacion')
      .update({ monto_total: monto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return (data as any) as Factura;
  },

  async addPayment(payment: {
    facturacion_id: string;
    monto: number;
    tipo: TipoPago;
    metodo_pago?: string;
    notas?: string;
  }) {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await (supabase as any)
      .from('pagos')
      .insert({
        ...payment,
        creado_por: userData.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return (data as any) as Pago;
  },

  async bulkDelete(ids: string[]) {
    const { error } = await (supabase as any)
      .from('facturacion')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }
};
