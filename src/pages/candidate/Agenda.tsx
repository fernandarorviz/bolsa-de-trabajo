import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { interviewsService } from '@/services/interviews';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, MapPin, Video, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Agenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch Candidate ID
  const { data: candidateData } = useQuery({
    queryKey: ['candidate-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('candidatos')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();
      return data;
    }
  });

  // 2. Fetch Interviews
  const { data: interviews, isLoading } = useQuery({
    queryKey: ['my-interviews', candidateData?.id],
    enabled: !!candidateData?.id,
    queryFn: async () => {
      // The service already selects * so confirmada should be there
      return await interviewsService.getByCandidate(candidateData.id);
    }
  });

  // 3. Mutation for confirmation
  const confirmMutation = useMutation({
    mutationFn: async ({ id, confirmed }: { id: string, confirmed: boolean }) => {
      await interviewsService.confirmInterview(id, confirmed);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.confirmed ? 'Asistencia confirmada' : 'Asistencia rechazada');
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
    },
    onError: () => {
      toast.error('Error al actualizar la asistencia');
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter interviews to show only relevant ones (not cancelled, not proposals)
  // Proposals are handled in "My Applications" usually, but here we can show scheduled ones.
  // We should show anything that is 'programada' or 'reprogramada' or 'realizada'
  const scheduledInterviews = interviews?.filter(i => 
    ['programada', 'reprogramada', 'realizada'].includes(i.estado)
  ) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Mi Agenda</h1>
        <p className="text-muted-foreground">
          Próximas entrevistas y eventos programados.
        </p>
      </div>

      {scheduledInterviews.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tienes entrevistas programadas</h3>
            <p className="text-muted-foreground">
              Cuando tengas entrevistas confirmadas, aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scheduledInterviews.map((interview: any) => {
            const isOnline = interview.modalidad === 'online';
            const startDate = new Date(interview.fecha_inicio);
            const endDate = new Date(interview.fecha_fin);
            const confirmada = interview.confirmada; // This assumes the column is in the type/response

            return (
              <Card key={interview.id} className="overflow-hidden border-l-4 border-l-primary">
                <CardHeader className="bg-muted/10 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xl text-primary">
                        {interview.vacante?.titulo || 'Entrevista'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={
                          interview.estado === 'realizada' ? 'bg-gray-100' : 'bg-blue-50 text-blue-700'
                        }>
                          {interview.estado.charAt(0).toUpperCase() + interview.estado.slice(1)}
                        </Badge>
                        <Badge variant="secondary">
                          {interview.tipo_entrevista.charAt(0).toUpperCase() + interview.tipo_entrevista.slice(1)}
                        </Badge>
                      </CardDescription>
                    </div>
                    {/* Status Badge for Confirmation */}
                    {confirmada === true && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirmada
                      </Badge>
                    )}
                    {confirmada === false && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" /> Rechazada
                      </Badge>
                    )}
                    {confirmada === null && interview.estado !== 'realizada' && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                        <AlertCircle className="w-3 h-3" /> Pendiente de confirmar
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Fecha</p>
                          <p className="text-sm text-muted-foreground">
                            {format(startDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Horario</p>
                          <p className="text-sm text-muted-foreground">
                            {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        {isOnline ? (
                          <Video className="w-5 h-5 text-muted-foreground mt-0.5" />
                        ) : (
                          <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">Ubicación / Link</p>
                          {isOnline ? (
                             interview.link_reunion ? (
                               <a 
                                 href={interview.link_reunion} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-sm text-primary hover:underline"
                               >
                                 Unirse a la reunión
                               </a>
                             ) : (
                               <p className="text-sm text-muted-foreground">Link pendiente</p>
                             )
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {interview.ubicacion || 'Ubicación pendiente'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Actions */}
                    {confirmada === null && interview.estado !== 'realizada' && (
                      <div className="flex flex-col justify-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed">
                        <p className="text-sm font-medium text-center mb-1">
                          ¿Podrás asistir a esta entrevista?
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => confirmMutation.mutate({ id: interview.id, confirmed: true })}
                            disabled={confirmMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirmar
                          </Button>
                          <Button 
                            variant="destructive"
                            className="w-full"
                            onClick={() => confirmMutation.mutate({ id: interview.id, confirmed: false })}
                            disabled={confirmMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    )}
                    
                     {/* Show message if rejected */}
                    {confirmada === false && (
                       <div className="flex flex-col justify-center items-center gap-2 p-4 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-sm text-red-600 font-medium">Has indicado que no puedes asistir.</p>
                          <p className="text-xs text-muted-foreground text-center">Contacta al reclutador si deseas reprogramar.</p>
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
