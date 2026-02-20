import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, MapPin, Briefcase, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { interviewsService } from '@/services/interviews';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Entrevista } from '@/types/ats';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProposal, setSelectedProposal] = useState<Entrevista | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: candidateData } = useQuery({
      queryKey: ['candidate-profile', user?.id],
      enabled: !!user,
      queryFn: async () => {
          const { data } = await supabase.from('candidatos').select('id').eq('user_id', user?.id).maybeSingle();
          return data;
      }
  });

  const { data: applicationsResponse, isLoading, error } = useQuery({
    queryKey: ['my-applications', candidateData?.id, currentPage, pageSize],
    enabled: !!candidateData?.id,
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      // Fetch postulaciones with count
      const { data, count, error } = await supabase
        .from('postulaciones')
        .select(`
          id,
          created_at,
          estado_general: descartado, 
          vacante: vacantes (
            id,
            titulo,
            ubicacion,
            tipo_contrato,
            estado
          ),
          etapa: etapas_pipeline (
            nombre,
            color
          )
        `, { count: 'exact' })
        .eq('candidato_id', candidateData.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, total: count || 0 };
    },
  });

  const applications = applicationsResponse?.data;
  const totalApplications = applicationsResponse?.total || 0;
  const totalPages = Math.ceil(totalApplications / pageSize);

  const { data: interviews } = useQuery({
      queryKey: ['my-interviews', candidateData?.id],
      enabled: !!candidateData?.id,
      queryFn: async () => {
          return await interviewsService.getByCandidate(candidateData.id);
      }
  });

  const confirmSlotMutation = useMutation({
      mutationFn: async ({ id, slot }: { id: string, slot: { start: string, end: string } }) => {
          await interviewsService.confirmSlot(id, slot);
      },
      onSuccess: () => {
          toast.success('Entrevista confirmada exitosamente');
          setSelectedProposal(null);
          queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      },
      onError: () => {
          toast.error('Error al confirmar la entrevista');
      }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error al cargar postulaciones. Intenta nuevamente.
      </div>
    );
  }

  // Filter for proposals
  const proposals = interviews?.filter(i => i.estado === 'propuesta') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Postulaciones</h1>
        <p className="text-muted-foreground">
          Historial de vacantes a las que has aplicado.
        </p>
      </div>

      {/* Proposals Section */}
      {proposals.length > 0 && (
          <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Acciones Requeridas
              </h2>
              <div className="grid gap-4 mb-8">
                  {proposals.map(proposal => (
                      <Card key={proposal.id} className="border-amber-200 bg-amber-50">
                          <CardHeader className="pb-2">
                              <CardTitle className="text-base font-medium">Propuesta de Entrevista: {proposal.vacante?.titulo}</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <p className="text-sm text-gray-600 mb-4">
                                  El reclutador te ha propuesto las siguientes fechas para una entrevista. Por favor selecciona una.
                              </p>
                              <Button onClick={() => setSelectedProposal(proposal)}>
                                  Ver Opciones
                              </Button>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {!applications || applications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tienes postulaciones activas</h3>
            <p className="text-muted-foreground mb-6">
              Explora nuestras vacantes y encuentra tu próximo empleo.
            </p>
            <Link 
              to="/empleos" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Ver vacantes disponibles
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app: any) => {
             // Logic to determine status display
             const isDiscarded = app.estado_general === true; // 'descartado' column
             const statusLabel = isDiscarded 
                ? 'No seleccionado' 
                : (app.vacante?.estado === 'cerrada' ? 'Vacante Cerrada' : app.etapa?.nombre);
             
             // Simple color mapping
             const statusColor = isDiscarded 
                ? 'bg-red-100 text-red-700 hover:bg-red-100'
                : (app.vacante?.estado === 'cerrada' 
                     ? 'bg-gray-100 text-gray-700' 
                     : 'bg-blue-100 text-blue-700 hover:bg-blue-100'); // Use stage color if available normally

             return (
              <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <h3 className="text-lg font-semibold text-primary">
                           {app.vacante?.titulo || 'Vacante no disponible'}
                         </h3>
                         <Badge variant="outline" className={statusColor}>
                           {statusLabel}
                         </Badge>
                       </div>
                       
                       <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                         <div className="flex items-center gap-1">
                           <MapPin className="w-4 h-4" />
                           {app.vacante?.ubicacion || 'Remoto'}
                         </div>
                         <div className="flex items-center gap-1">
                           <Briefcase className="w-4 h-4" />
                           {app.vacante?.tipo_contrato?.replace('_', ' ')}
                         </div>
                         <div className="flex items-center gap-1">
                           <Calendar className="w-4 h-4" />
                           Aplicado el {new Date(app.created_at).toLocaleDateString()}
                         </div>
                       </div>
                    </div>

                    <div className="flex items-center">
                      <Button variant="outline" asChild>
                         <Link to={`/empleos/${app.vacante?.id}`}>
                           Ver Vacante
                         </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
             );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalApplications > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-4 px-2">
          <div className="flex items-center gap-2 order-2 md:order-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Mostrar:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              de {totalApplications} resultados
            </span>
          </div>

          {totalPages > 1 && (
            <div className="order-1 md:order-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="gap-1 pl-2.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Anterior</span>
                    </Button>
                  </PaginationItem>
                  
                  <div className="flex items-center px-4 text-sm font-medium">
                    Página {currentPage} de {totalPages}
                  </div>

                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="gap-1 pr-2.5"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* Selection Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Selecciona un Horario</DialogTitle>
                  <DialogDescription>
                      Confirma la fecha que mejor te convenga para la entrevista.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                  {selectedProposal?.proposed_slots?.map((slot, idx) => (
                      <Button
                          key={idx}
                          variant="outline"
                          className="h-auto py-4 justify-start"
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
  );
}
