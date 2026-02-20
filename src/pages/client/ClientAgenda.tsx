import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientLayout from '@/components/layout/ClientLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Video, AlertCircle, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { interviewsService } from '@/services/interviews';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Entrevista } from '@/types/ats';

export default function ClientAgenda() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProposal, setSelectedProposal] = useState<Entrevista | null>(null);

  const { data: entrevistas, isLoading } = useQuery({
    queryKey: ['client-agenda', profile?.id],
    queryFn: async () => {
        // Step 1: Get vacantes IDs for this client
        let vacantesQuery = supabase.from('vacantes').select('id');
        
        // @ts-ignore
        if (profile?.cliente_id) {
             // @ts-ignore
            vacantesQuery = vacantesQuery.eq('cliente_id', profile.cliente_id);
        } else {
            return []; // Demo fallback
        }

        const { data: vacantes } = await vacantesQuery;
        if (!vacantes?.length) return [];

        const vacanteIds = vacantes.map(v => v.id);

        // Step 2: Get interviews for these vacancies
        const { data, error } = await (supabase
            .from('entrevistas' as any)
            .select(`
                *,
                vacante:vacantes(titulo),
                candidato:candidatos(nombre)
            `)
            .in('vacante_id', vacanteIds)
            .eq('tipo_entrevista', 'cliente')
            .order('fecha_inicio', { ascending: true }) as any);

        if (error) throw error;
        return (data || []) as Entrevista[];
    },
    enabled: !!profile?.id,
  });

  const confirmSlotMutation = useMutation({
      mutationFn: async ({ id, slot }: { id: string, slot: { start: string, end: string } }) => {
          await interviewsService.confirmSlot(id, slot);
      },
      onSuccess: () => {
          toast.success('Entrevista confirmada exitosamente');
          setSelectedProposal(null);
          queryClient.invalidateQueries({ queryKey: ['client-agenda'] });
      },
      onError: () => {
          toast.error('Error al confirmar la entrevista');
      }
  });

  const handleCancel = async (id: string) => {
    const reason = window.prompt('Opcional: Motivo de la cancelación');
    if (reason === null) return;

    try {
      await interviewsService.cancel(id, reason);
      toast.success('Entrevista cancelada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['client-agenda'] });
    } catch (error) {
      console.error(error);
      toast.error('Error al cancelar la entrevista');
    }
  };

  // Filter proposals and scheduled
  const proposals = entrevistas?.filter(e => e.estado === 'propuesta') || [];
  const scheduled = entrevistas?.filter(e => e.estado !== 'propuesta') || [];

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda de Entrevistas</h1>
          <p className="text-gray-500">Gestiona tus entrevistas y propuestas.</p>
        </div>

        {/* Pending Proposals */}
        {proposals.length > 0 && (
            <div className="animate-fade-in">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-700">
                    <AlertCircle className="w-5 h-5" />
                    Propuestas Pendientes ({proposals.length})
                </h2>
                <div className="grid gap-4 mb-8">
                    {proposals.map(proposal => (
                        <Card key={proposal.id} className="border-amber-200 bg-amber-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                                Acción Requerida
                                            </Badge>
                                            <span className="font-medium text-gray-900">
                                                {proposal.candidato?.nombre}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Para vacante: <span className="font-medium">{proposal.vacante?.titulo}</span>
                                        </p>
                                    </div>
                                    <Button onClick={() => setSelectedProposal(proposal)} className="bg-amber-600 hover:bg-amber-700 text-white">
                                        Seleccionar Horario
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        <h2 className="text-lg font-semibold mb-3">Próximas Entrevistas</h2>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scheduled.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mb-4 text-gray-300" />
              <p>No tienes entrevistas próximas agendadas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scheduled.map((entrevista) => (
              <Card key={entrevista.id} className="hover:shadow-md transition-shadow duration-200 border-none shadow-sm bg-white overflow-hidden group">
                <CardContent className="p-0 flex h-full">
                  <div className="w-2 bg-primary group-hover:w-3 transition-all duration-300" />
                  <div className="p-6 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-[10px] font-bold">
                            {entrevista.tipo_entrevista === 'cliente' ? 'Entrevista con Cliente' : 'Entrevista'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                             • {entrevista.vacante?.titulo}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-lg text-gray-900 mb-4">
                        {entrevista.candidato?.nombre}
                      </h3>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {format(new Date(entrevista.fecha_inicio), "EEEE d 'de' MMMM", { locale: es })}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {format(new Date(entrevista.fecha_inicio), "HH:mm", { locale: es })} - {format(new Date(entrevista.fecha_fin), "HH:mm", { locale: es })}
                        </div>
                        <div className="flex items-center gap-2">
                            {entrevista.modalidad === 'online' ? (
                                <>
                                    <Video className="w-4 h-4 text-gray-400" />
                                    <span>Online {entrevista.link_reunion && '(Link disponible)'}</span>
                                </>
                            ) : (
                                <>
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{entrevista.ubicacion || 'Presencial'}</span>
                                </>
                            )}
                        </div>
                      </div>
                    </div>

                    {entrevista.estado !== 'cancelada' && (
                      <div className="shrink-0 flex flex-col gap-2">
                        {entrevista.link_reunion && (
                            <a 
                                href={entrevista.link_reunion} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Video className="w-4 h-4 mr-2" />
                                Unirse a Reunión
                            </a>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 self-end"
                          onClick={() => handleCancel(entrevista.id)}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Cancelar Cita
                        </Button>
                      </div>
                    )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Selection Modal */}
        <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Selecciona un Horario</DialogTitle>
                    <DialogDescription>
                        Confirma la fecha para la entrevista con {selectedProposal?.candidato?.nombre}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                    {selectedProposal?.proposed_slots?.map((slot, idx) => (
                        <Button
                            key={idx}
                            variant="outline"
                            className="h-auto py-4 justify-start hover:border-primary hover:bg-primary/5"
                            onClick={() => confirmSlotMutation.mutate({ 
                                id: selectedProposal.id, 
                                slot 
                            })}
                            disabled={confirmSlotMutation.isPending}
                        >
                            <Calendar className="w-4 h-4 mr-3 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold">
                                    {format(new Date(slot.start), "EEEE d 'de' MMMM", { locale: es })}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {format(new Date(slot.start), "HH:mm")} - {format(new Date(slot.end), "HH:mm")}
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  );
}
