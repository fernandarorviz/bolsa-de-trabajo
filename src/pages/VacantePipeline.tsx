import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Trash2, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  FileText,
  ChevronRight,
  X,
  User,
  MessageSquare,
  MessageCircle,
  BrainCircuit,
  AlertCircle,
  Clock,
  History as HistoryIcon,
  ChevronLeft,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ReassignCandidateDialog } from '@/components/candidates/ReassignCandidateDialog';
import type { EtapaPipeline, Postulacion, Candidato, Entrevista } from '@/types/ats';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InterviewModal } from '@/components/interviews/InterviewModal';
import { interviewsService } from '@/services/interviews';
import { notificationsService } from '@/services/notifications';
import { CalendarClock } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFViewerDialog } from '@/components/candidates/PDFViewerDialog';

interface SortableCandidateCardProps {
  postulacion: Postulacion & { candidato: Candidato };
  etapas: EtapaPipeline[];
  onClick: () => void;
  onMover: (etapaId: string) => void;
  onScheduleInfo: () => void;
  activeInterview?: Entrevista;
}

const getDaysInStage = (lastUpdate: string) => {
  const start = new Date(lastUpdate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getTimeInStageColor = (days: number) => {
  if (days < 3) return "text-green-600 bg-green-50 border-green-200";
  if (days < 7) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
};

function SortableCandidateCard({ postulacion, etapas, onClick, onMover, onScheduleInfo, activeInterview }: SortableCandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: postulacion.id,
    data: {
      type: 'Postulacion',
      postulacion,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
      <Card
        className={cn(
          "kanban-card cursor-pointer shadow-kanban hover:shadow-kanban-hover",
          postulacion.descartado && "opacity-60 bg-muted/50 border-destructive/20"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {postulacion.candidato?.nombre}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {postulacion.candidato?.email}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  {etapas
                  .filter(e => e.id !== postulacion.etapa_id)
                  .map((targetEtapa) => (
                    <DropdownMenuItem
                      key={targetEtapa.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMover(targetEtapa.id);
                      }}
                    >
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Mover a {targetEtapa.nombre}
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onScheduleInfo();
                  }}
                >
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Agendar Entrevista
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {postulacion.candidato?.ubicacion && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {postulacion.candidato.ubicacion}
              </span>
            )}
            {postulacion.feedback_cliente && postulacion.feedback_cliente.length > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-medium" title="Feedback de cliente disponible">
                <MessageSquare className="w-3 h-3" />
                Feedback
              </span>
            )}
            {activeInterview && (
               <span className="flex items-center gap-1 text-primary font-medium" title={`Entrevista: ${new Date(activeInterview.fecha_inicio).toLocaleDateString()} ${new Date(activeInterview.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}>
                <CalendarClock className="w-3 h-3" />
                {new Date(activeInterview.fecha_inicio).toLocaleDateString()}
              </span>
            )}
            {postulacion.ia_compatibility_score !== undefined && postulacion.ia_compatibility_score !== null && (
              <Badge 
                variant="outline" 
                className={cn(
                  "ml-auto text-[10px] h-5",
                  postulacion.ia_compatibility_score >= 80 ? "bg-green-50 text-green-700 border-green-200" :
                  postulacion.ia_compatibility_score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-red-50 text-red-700 border-red-200"
                )}
              >
                <BrainCircuit className="w-3 h-3 mr-1" />
                {postulacion.ia_compatibility_score}%
              </Badge>
            )}
            {postulacion.fecha_ultima_actualizacion && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 transition-colors",
                  getTimeInStageColor(getDaysInStage(postulacion.fecha_ultima_actualizacion))
                )}
                title={`Lleva ${getDaysInStage(postulacion.fecha_ultima_actualizacion)} días en esta etapa`}
              >
                <Clock className="w-3 h-3 mr-1" />
                {getDaysInStage(postulacion.fecha_ultima_actualizacion)}d
              </Badge>
            )}
            {postulacion.descartado && (
              <Badge variant="destructive" className="h-5 text-[10px]">
                Descartado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DroppableColumn({ 
  etapa, 
  postulaciones, 
  onCandidateClick, 
  etapas, 
  onMover,
  onSchedule,
  interviews
}: { 
  etapa: EtapaPipeline; 
  postulaciones: (Postulacion & { candidato: Candidato })[]; 
  onCandidateClick: (p: Postulacion & { candidato: Candidato }) => void;
  etapas: EtapaPipeline[];
  onMover: (pid: string, eid: string) => void;
  onSchedule: (p: Postulacion & { candidato: Candidato }) => void;
  interviews: Entrevista[];
}) {
  const { setNodeRef } = useDroppable({
    id: etapa.id,
    data: {
        type: 'Etapa',
        etapa
    }
  });

  return (
    <div ref={setNodeRef} className="h-full flex flex-col min-h-[150px]">
       <SortableContext 
          items={postulaciones.map(p => p.id)} 
          strategy={verticalListSortingStrategy}
        >
          {postulaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-transparent hover:border-muted rounded-lg transition-colors">
              Arrastra candidatos aquí
            </div>
          ) : (
            postulaciones.map((postulacion) => (
              <SortableCandidateCard
                key={postulacion.id}
                postulacion={postulacion}
                etapas={etapas}
                onClick={() => onCandidateClick(postulacion)}
                onMover={(etapaId) => onMover(postulacion.id, etapaId)}
                onScheduleInfo={() => onSchedule(postulacion)}
                activeInterview={interviews.find(i => i.candidato_id === postulacion.candidato_id && ['programada', 'reprogramada'].includes(i.estado))}
              />
            ))
          )}
        </SortableContext>
    </div>
  );
}

export default function VacantePipeline() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostulacion, setSelectedPostulacion] = useState<(Postulacion & { candidato: Candidato }) | null>(null);
  const [postulacionToReassign, setPostulacionToReassign] = useState<(Postulacion & { candidato: Candidato }) | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [addCandidatoOpen, setAddCandidatoOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [candidateForInterview, setCandidateForInterview] = useState<{
    vacante_id: string;
    candidato_id: string;
    etapa_id: string;
    candidato: { nombre: string; email: string };
  } | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState('');
  const [postulacionToDiscard, setPostulacionToDiscard] = useState<string | null>(null);
  const [discardedListOpen, setDiscardedListOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: vacante } = useQuery({
    queryKey: ['vacante-basic', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacantes')
        .select('id, titulo, estado')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: etapas } = useQuery({
    queryKey: ['etapas-pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etapas_pipeline')
        .select('*')
        .order('orden');
      if (error) throw error;
      return data as EtapaPipeline[];
    },
  });

  const { data: postulaciones, isLoading } = useQuery({
    queryKey: ['pipeline-postulaciones', id],
    queryFn: async () => {
      const { data: posData, error: posError } = await supabase
        .from('postulaciones')
        .select(`
          *,
          candidatos (*)
        `)
        .eq('vacante_id', id)
        .order('fecha_postulacion', { ascending: false });
      
      if (posError) throw posError;

      const { data: fbData, error: fbError } = await supabase
        .from('feedback_cliente')
        .select('*')
        .eq('vacante_id', id);

      if (fbError) throw fbError;

      return posData.map(p => ({
        ...p,
        candidato: p.candidatos as Candidato,
        feedback_cliente: fbData.filter(f => f.candidato_id === p.candidato_id)
      })) as (Postulacion & { candidato: Candidato })[];
    },
    enabled: !!id,
  });

  const { data: interviews, refetch: refetchInterviews } = useQuery({
    queryKey: ['vacante-interviews', id],
    queryFn: async () => {
        if (!id) return [];
        return await interviewsService.getByVacancy(id);
    },
    enabled: !!id
  });

  const { data: candidatosDisponibles } = useQuery({
    queryKey: ['candidatos-disponibles', id],
    queryFn: async () => {
      // Get all candidates not already in this vacancy
      const { data: existingIds } = await supabase
        .from('postulaciones')
        .select('candidato_id')
        .eq('vacante_id', id);

      const excludeIds = existingIds?.map(p => p.candidato_id) || [];

      let query = supabase.from('candidatos').select('*').order('nombre');
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Candidato[];
    },
    enabled: !!id && addCandidatoOpen,
  });

  const moverCandidatoMutation = useMutation({
    mutationFn: async ({ postulacionId, etapaId }: { postulacionId: string; etapaId: string }) => {
      const { error } = await supabase
        .from('postulaciones')
        .update({ etapa_id: etapaId })
        .eq('id', postulacionId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-postulaciones', id] });
      toast.success('Candidato movido');
      
      // Sugerir entrevista si la etapa es de entrevista
      const targetEtapa = etapas?.find(e => e.id === variables.etapaId);
      if (targetEtapa?.nombre.toLowerCase().includes('entrevista')) {
        const postulacion = postulaciones?.find(p => p.id === variables.postulacionId);
        if (postulacion) {
          const hasInterview = interviews?.some(i => 
            i.candidato_id === postulacion.candidato_id && 
            ['programada', 'reprogramada'].includes(i.estado)
          );

          if (!hasInterview) {
            toast('¿Deseas agendar la entrevista ahora?', {
              action: {
                label: 'Agendar',
                onClick: () => {
                  setCandidateForInterview({
                    vacante_id: postulacion.vacante_id,
                    candidato_id: postulacion.candidato_id,
                    etapa_id: variables.etapaId,
                    candidato: postulacion.candidato
                  });
                  setInterviewModalOpen(true);
                },
              },
            });
          }
        }
      }
      
      // Notify Client
      const targetEtapaForNotification = etapas?.find(e => e.id === variables.etapaId);
      const postulacion = postulaciones?.find(p => p.id === variables.postulacionId);
      
      if (postulacion && targetEtapaForNotification && vacante?.id) {
         // We need to fetch the vacancy to get the client_id, but we only have vacante-basic with id, titulo, estado.
         // Let's first try to get client_id from the vacancy details we might need to fetch or if we can get it from the postulation context?
         // Actually, `postulacion` has `vacante_id`. We can fetch the vacancy details to get client_id.
         // Or better, we can assume we need to fetch it to be safe.
         // Wait, `vacante` constant from useQuery at line 302 only selects id, titulo, estado.
         // We need to fetch client_id.

         const notifyClient = async () => {
             try {
                 const { data: vacancyDetails } = await supabase
                    .from('vacantes')
                    .select('titulo, cliente_id')
                    .eq('id', vacante.id)
                    .single();

                 if (vacancyDetails?.cliente_id) {
                     await notificationsService.notifyClientUsers(vacancyDetails.cliente_id, {
                         title: 'Candidato avanzó de etapa',
                         message: `El candidato ${postulacion.candidato?.nombre} ha avanzado a la etapa "${targetEtapaForNotification.nombre}" en la vacante ${vacancyDetails.titulo}`,
                         type: 'status_change',
                         metadata: { 
                             candidato_id: postulacion.candidato_id,
                             vacante_id: vacante.id,
                             etapa_id: variables.etapaId
                         }
                     });
                 }
             } catch (err) {
                 console.error("Error notifying client of stage change:", err);
             }
         };
         notifyClient();
      }

    },
    onError: (error: Error) => {
      toast.error('Error al mover', { description: error.message });
    },
  });

  const agregarCandidatoMutation = useMutation({
    mutationFn: async (candidatoId: string) => {
      const primeraEtapa = etapas?.[0];
      if (!primeraEtapa) throw new Error('No hay etapas configuradas');

      const { error } = await supabase.from('postulaciones').insert({
        vacante_id: id,
        candidato_id: candidatoId,
        etapa_id: primeraEtapa.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-postulaciones', id] });
      queryClient.invalidateQueries({ queryKey: ['candidatos-disponibles', id] });
      setAddCandidatoOpen(false);
      toast.success('Candidato agregado a la cartera');
    },
    onError: (error: Error) => {
      toast.error('Error al agregar', { description: error.message });
    },
  });

  const descartarCandidatoMutation = useMutation({
    mutationFn: async ({ postulacionId, motivo }: { postulacionId: string, motivo: string }) => {
      const { error } = await supabase
        .from('postulaciones')
        .update({ 
          descartado: true,
          motivo_descarte: motivo,
          fecha_ultima_actualizacion: new Date().toISOString()
        })
        .eq('id', postulacionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-postulaciones', id] });
      setSelectedPostulacion(null);
      setDiscardDialogOpen(false);
      setDiscardReason('');
      setPostulacionToDiscard(null);
      toast.success('Candidato descartado');
    },
    onError: (error: Error) => {
      toast.error('Error al descartar', { description: error.message });
    },
  });

  const restaurarCandidatoMutation = useMutation({
    mutationFn: async (postulacionId: string) => {
      const { error } = await supabase
        .from('postulaciones')
        .update({ 
          descartado: false,
          motivo_descarte: null,
          fecha_ultima_actualizacion: new Date().toISOString()
        })
        .eq('id', postulacionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-postulaciones', id] });
      toast.success('Candidato restaurado');
    },
    onError: (error: Error) => {
      toast.error('Error al restaurar', { description: error.message });
    },
  });

  const activePostulaciones = postulaciones?.filter(p => !p.descartado) || [];
  const discardedPostulaciones = postulaciones?.filter(p => p.descartado) || [];

  const getPostulacionesPorEtapa = (etapaId: string) => {
    return activePostulaciones.filter(p => {
      const matchesEtapa = p.etapa_id === etapaId;
      const matchesSearch = searchTerm === '' || 
        p.candidato?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.candidato?.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesEtapa && matchesSearch;
    });
  };

  if (!vacante) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/vacantes/${id}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Cartera: {vacante.titulo}</h1>
              <p className="text-muted-foreground">
                {postulaciones?.length || 0} candidatos en proceso
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar candidato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="flex items-center gap-2 mr-2">
               <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setDiscardedListOpen(true)}
               >
                 <Trash2 className="w-4 h-4" />
                 Ver Descartados ({discardedPostulaciones.length})
               </Button>
            </div>
            <Dialog open={addCandidatoOpen} onOpenChange={setAddCandidatoOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Candidato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Candidato a la Cartera</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {candidatosDisponibles?.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No hay candidatos disponibles</p>
                      <Button asChild className="mt-4" variant="outline">
                        <Link to="/candidatos">Gestionar Candidatos</Link>
                      </Button>
                    </div>
                  ) : (
                    candidatosDisponibles?.map((candidato) => (
                      <div
                        key={candidato.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{candidato.nombre}</p>
                          <p className="text-sm text-muted-foreground">{candidato.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => agregarCandidatoMutation.mutate(candidato.id)}
                          disabled={agregarCandidatoMutation.isPending}
                        >
                          Agregar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pipeline Kanban */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(event) => setActiveId(event.active.id as string)}
          onDragEnd={(event) => {
            const { active, over } = event;
            const activeId = active.id as string;
            const overId = over?.id as string;

            if (!overId) return;

            // Encontrar la postulación activa
            const activePostulacion = postulaciones?.find(p => p.id === activeId);
            if (!activePostulacion) return;

            // Encontrar la etapa de destino
            let targetEtapaId = overId;
            
            // Si "over" es otra postulación, encontrar su etapa
            const overPostulacion = postulaciones?.find(p => p.id === overId);
            if (overPostulacion) {
                targetEtapaId = overPostulacion.etapa_id;
            }

            // Si la etapa de destino es diferente a la actual, mover
            if (activePostulacion.etapa_id !== targetEtapaId) {
                moverCandidatoMutation.mutate({
                    postulacionId: activeId,
                    etapaId: targetEtapaId
                });
            }
            
            setActiveId(null);
          }}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {etapas?.map((etapa) => {
                const postulacionesEtapa = getPostulacionesPorEtapa(etapa.id);
                return (
                  <div
                    key={etapa.id}
                    className="w-80 shrink-0"
                  >
                    <Card className="h-full bg-muted/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: etapa.color }}
                            />
                            <CardTitle className="text-base">{etapa.nombre}</CardTitle>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {postulacionesEtapa.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 kanban-scroll max-h-[calc(100vh-300px)] overflow-y-auto min-h-[200px]">
                        <DroppableColumn 
                            etapa={etapa}
                            postulaciones={postulacionesEtapa}
                            etapas={etapas}
                            onCandidateClick={setSelectedPostulacion}
                            onMover={(pid, eid) => moverCandidatoMutation.mutate({ postulacionId: pid, etapaId: eid })}
                            onSchedule={(postulacion) => {
                                setCandidateForInterview({
                                    vacante_id: postulacion.vacante_id,
                                    candidato_id: postulacion.candidato_id,
                                    etapa_id: postulacion.etapa_id,
                                    candidato: postulacion.candidato
                                });
                                setInterviewModalOpen(true);
                            }}
                            interviews={interviews || []}
                        />
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
          <DragOverlay>
            {activeId ? (
                (() => {
                    const activePostulacion = postulaciones?.find(p => p.id === activeId);
                    if (!activePostulacion) return null;
                    return (
                        <Card className="w-80 shadow-2xl cursor-grabbing rotate-2 opacity-90">
                             <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{activePostulacion.candidato?.nombre}</p>
                                        <p className="text-sm text-muted-foreground truncate">{activePostulacion.candidato?.email}</p>
                                    </div>
                                </div>
                             </CardContent>
                        </Card>
                    );
                })()
            ) : null}
          </DragOverlay>
        </DndContext>

        {selectedPostulacion && (
          <CandidateDrawer
            postulacion={selectedPostulacion}
            etapas={etapas}
            onClose={() => setSelectedPostulacion(null)}
            onMove={(etapaId) => {
              moverCandidatoMutation.mutate({
                postulacionId: selectedPostulacion.id,
                etapaId,
              });
              setSelectedPostulacion(null);
            }}
            onDescartar={() => {
              setPostulacionToDiscard(selectedPostulacion.id);
              setDiscardDialogOpen(true);
            }}
             onRestaurar={() => {
                restaurarCandidatoMutation.mutate(selectedPostulacion.id);
                setSelectedPostulacion(null);
            }}
            onBack={selectedPostulacion.descartado ? () => {
                setSelectedPostulacion(null);
                setDiscardedListOpen(true);
            } : undefined}
            onReassign={() => {
                setPostulacionToReassign(selectedPostulacion);
                setReassignDialogOpen(true);
            }}
          />
        )}

        {postulacionToReassign && (
          <ReassignCandidateDialog
            isOpen={reassignDialogOpen}
            onClose={() => {
                setReassignDialogOpen(false);
                setPostulacionToReassign(null);
            }}
            candidateId={postulacionToReassign.candidato_id}
            candidateName={postulacionToReassign.candidato.nombre}
            candidateUserId={postulacionToReassign.candidato.user_id}
            currentVacancyId={id!}
          />
        )}

        <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Descartar Candidato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Motivo del descarte</Label>
                <Textarea 
                  placeholder="Ej: No cumple con el perfil técnico, Expectativas salariales..."
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDiscardDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  disabled={!discardReason.trim() || descartarCandidatoMutation.isPending}
                  onClick={() => {
                    if (postulacionToDiscard) {
                      descartarCandidatoMutation.mutate({ 
                        postulacionId: postulacionToDiscard, 
                        motivo: discardReason 
                      });
                    }
                  }}
                >
                  Confirmar Descarte
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Descartar Candidato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Motivo del descarte</Label>
                <Textarea 
                  placeholder="Ej: No cumple con el perfil técnico, Expectativas salariales..."
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDiscardDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  disabled={!discardReason.trim() || descartarCandidatoMutation.isPending}
                  onClick={() => {
                    if (postulacionToDiscard) {
                      descartarCandidatoMutation.mutate({ 
                        postulacionId: postulacionToDiscard, 
                        motivo: discardReason 
                      });
                    }
                  }}
                >
                  Confirmar Descarte
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {discardedListOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDiscardedListOpen(false)}
            />
            <div className="relative w-full max-w-md bg-background h-full overflow-y-auto animate-slide-in-right shadow-xl">
               <div className="p-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Candidatos Descartados</h2>
                    <Button variant="ghost" size="icon" onClick={() => setDiscardedListOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                 </div>

                 <div className="space-y-4">
                  {discardedPostulaciones.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No hay candidatos descartados</p>
                    </div>
                  ) : (
                    discardedPostulaciones.map((postulacion) => (
                      <div 
                        key={postulacion.id} 
                        className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
                        onClick={() => {
                            setSelectedPostulacion(postulacion);
                            setDiscardedListOpen(false);
                        }}
                      >
                        <div className="flex justify-between items-start">
                           <div>
                              <h4 className="font-semibold group-hover:text-primary transition-colors">{postulacion.candidato?.nombre}</h4>
                              <p className="text-sm text-muted-foreground">{postulacion.candidato?.email}</p>
                           </div>
                           <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setPostulacionToReassign(postulacion);
                                  setReassignDialogOpen(true);
                              }}
                              title="Reasignar a otra vacante"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  restaurarCandidatoMutation.mutate(postulacion.id);
                              }}
                              disabled={restaurarCandidatoMutation.isPending}
                              title="Restaurar al pipeline"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                           </div>
                        </div>
                        
                        <div className="space-y-1.5 pt-2 border-t border-muted-foreground/10">
                           <div className="text-sm">
                              <span className="font-medium text-destructive text-xs uppercase tracking-wide">Motivo:</span>
                              <p className="text-sm italic text-muted-foreground mt-0.5">
                                "{postulacion.motivo_descarte || 'Sin motivo especificado'}"
                              </p>
                           </div>
                           <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                             <span className="flex items-center gap-1">
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: etapas?.find(e => e.id === postulacion.etapa_id)?.color || '#94a3b8' }} />
                               {etapas?.find(e => e.id === postulacion.etapa_id)?.nombre}
                             </span>
                             <span className="flex items-center gap-1">
                               <Clock className="w-3 h-3" />
                               {new Date(postulacion.fecha_ultima_actualizacion).toLocaleDateString()}
                             </span>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
               </div>
            </div>
          </div>
        )}

        {candidateForInterview && (
            <InterviewModal
                open={interviewModalOpen}
                onOpenChange={(open) => {
                    setInterviewModalOpen(open);
                    if (!open) setCandidateForInterview(null);
                }}
                postulacion={candidateForInterview}
                onSuccess={() => {
                    setInterviewModalOpen(false);
                    setCandidateForInterview(null);
                    refetchInterviews();
                }}
            />
        )}
      </div>
    </DashboardLayout>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ... (rest of imports)

// ... (CandidateDrawer component definition)

function CandidateDrawer({
  postulacion,
  etapas,
  onClose,
  onMove,
  onDescartar,
  onRestaurar,
  onBack,
  onReassign,
}: {
  postulacion: Postulacion & { candidato: Candidato };
  etapas: EtapaPipeline[] | undefined;
  onClose: () => void;
  onMove: (etapaId: string) => void;
  onDescartar: () => void;
  onRestaurar?: () => void;
  onBack?: () => void;
  onReassign?: () => void;
}) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const { data: historial } = useQuery({
    queryKey: ['historial-etapas', postulacion.id],
    queryFn: async () => {
      const { data: historialData, error } = await supabase
        .from('historial_etapas')
        .select(`
          *,
          etapa:etapas_pipeline(*)
        `)
        .eq('postulacion_id', postulacion.id)
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;

      // Extract unique user IDs
      const userIds = [...new Set(historialData.map(h => h.movido_por_usuario).filter(Boolean))];
      
      // Fetch profiles
      let profilesMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nombre')
          .in('id', userIds);
          
        if (profiles) {
          profilesMap = profiles.reduce((acc, profile) => ({
            ...acc,
            [profile.id]: profile.nombre
          }), {});
        }
      }

      // Map profiles to history items
      return historialData.map(item => ({
        ...item,
        responsable_nombre: item.movido_por_usuario ? profilesMap[item.movido_por_usuario] : 'Sistema'
      }));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-background h-full overflow-y-auto animate-slide-in-right shadow-xl">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Detalle del Candidato</h2>
            <div className="flex items-center gap-1">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} title="Volver al listado">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {postulacion.candidato?.nombre}
              </h3>
              <p className="text-muted-foreground">
                {postulacion.candidato?.estado_general || 'Activo'}
              </p>
            </div>
          </div>

          <Tabs defaultValue="detalles" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
              <TabsTrigger value="ia" className="relative">
                IA
                {postulacion.ia_compatibility_score !== undefined && postulacion.ia_compatibility_score !== null && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="feedback" className="relative">
                Feedback
                {postulacion.feedback_cliente && postulacion.feedback_cliente.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detalles" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{postulacion.candidato?.email}</span>
                </div>
                {postulacion.candidato?.telefono && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{postulacion.candidato.telefono}</span>
                    <a
                      href={`https://wa.me/${postulacion.candidato.telefono.replace(/\D/g, '').length === 10 ? '52' : ''}${postulacion.candidato.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 p-1 rounded-full hover:bg-green-100 text-green-600 transition-colors"
                      title="Contactar por WhatsApp"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                {postulacion.candidato?.ubicacion && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{postulacion.candidato.ubicacion}</span>
                  </div>
                )}
                {postulacion.candidato?.cv_url && (
                  <>
                    <button
                      onClick={() => {
                        if (postulacion.candidato.cv_url?.toLowerCase().endsWith('.pdf')) {
                           setPdfViewerOpen(true);
                        } else {
                          window.open(postulacion.candidato.cv_url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="flex items-center gap-3 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Ver CV
                    </button>
                    <PDFViewerDialog 
                      isOpen={pdfViewerOpen}
                      onOpenChange={setPdfViewerOpen}
                      pdfUrl={postulacion.candidato.cv_url}
                      candidateName={postulacion.candidato.nombre}
                    />
                  </>
                )}
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">Etapa Actual</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: etapas?.find(e => e.id === postulacion.etapa_id)?.color,
                    }}
                  />
                  <span className="font-medium">
                    {etapas?.find(e => e.id === postulacion.etapa_id)?.nombre}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">Mover a otra etapa</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {etapas
                    ?.filter(e => e.id !== postulacion.etapa_id)
                    .map((etapa) => (
                      <Button
                        key={etapa.id}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => onMove(etapa.id)}
                      >
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: etapa.color }}
                        />
                        {etapa.nombre}
                      </Button>
                    ))}
                </div>
              </div>

              {postulacion.descartado && (
                  <div className="pt-4 border-t">
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 mb-4">
                          <p className="font-semibold flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Candidato Descartado
                          </p>
                          {postulacion.motivo_descarte && (
                              <p className="text-sm mt-1 italic opacity-90">
                                  "{postulacion.motivo_descarte}"
                              </p>
                          )}
                      </div>
                  </div>
              )}

              <div className="pt-4 border-t space-y-3">
                {postulacion.descartado ? (
                    <>
                    <Button
                        variant="default" 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={onRestaurar}
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar Candidato
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onReassign}
                    >
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Reasignar a otra vacante
                    </Button>
                    </>
                ) : (
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={onDescartar}
                    >
                        Descartar Candidato
                    </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ia" className="space-y-6 mt-4">
              {postulacion.ia_compatibility_score !== undefined && postulacion.ia_compatibility_score !== null ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">Compatibilidad</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-2xl font-bold",
                        postulacion.ia_compatibility_score >= 80 ? "text-green-600" :
                        postulacion.ia_compatibility_score >= 50 ? "text-amber-600" :
                        "text-red-600"
                      )}>
                        {postulacion.ia_compatibility_score}%
                      </span>
                    </div>
                  </div>

                  {postulacion.ia_match_analysis && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Análisis Detallado</Label>
                      <div className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg border italic">
                        "{postulacion.ia_match_analysis}"
                      </div>
                    </div>
                  )}

                  {postulacion.ia_missing_skills && postulacion.ia_missing_skills.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        Brechas Detectadas (Gaps)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {postulacion.ia_missing_skills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <BrainCircuit className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sin análisis de IA</h3>
                    <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                      Esta postulación aún no ha sido analizada por el motor de inteligencia artificial.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Solicitar Análisis (Próximamente)
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="feedback" className="mt-4 space-y-4">
              <Label className="mb-2 block">Feedback del Cliente</Label>
              {!postulacion.feedback_cliente || postulacion.feedback_cliente.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No hay feedback de cliente aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {postulacion.feedback_cliente.map((f: any) => (
                    <div key={f.id} className="p-4 border rounded-lg bg-muted/10 relative overflow-hidden group">
                       <div className={`absolute top-0 left-0 w-1 h-full ${f.decision === 'aprobado' ? 'bg-green-500' : 'bg-red-500'}`} />
                       <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={f.decision === 'aprobado' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}>
                            {f.decision.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground italic">
                            {new Date(f.created_at).toLocaleDateString()}
                          </span>
                       </div>
                       {f.comentario ? (
                         <p className="text-sm text-gray-700 italic border-l-2 border-muted pl-3 py-1">
                           "{f.comentario}"
                         </p>
                       ) : (
                         <p className="text-xs text-muted-foreground italic">Sin comentarios adicionales</p>
                       )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="historial" className="mt-4">
              <Label className="mb-6 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Historial de Movimientos</Label>
              <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-muted before:to-transparent">
                {historial?.map((item, index) => {
                  const etapa = (item as any).etapa as EtapaPipeline;
                  const responsable = (item as any).responsable_nombre || 'Sistema';
                  const isLast = index === 0;

                  return (
                    <div key={item.id} className="relative group">
                      <div 
                        className={cn(
                          "absolute -left-[20px] top-1 w-4 h-4 rounded-full border-2 border-background z-10 transition-transform group-hover:scale-110",
                          isLast ? "animate-pulse" : ""
                        )}
                        style={{ backgroundColor: etapa?.color || '#cbd5e1' }}
                      />
                      <div className={cn(
                        "flex flex-col gap-2 p-3 rounded-lg border transition-all hover:shadow-md",
                        isLast ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"
                      )}>
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" style={{ backgroundColor: `${etapa?.color}20`, color: etapa?.color }} className="border-none font-semibold">
                                {etapa?.nombre || 'Etapa desconocida'}
                            </Badge>
                            <span className="text-[10px] font-medium text-muted-foreground">
                                {new Date(item.fecha_inicio).toLocaleDateString()}
                            </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            Actualizado por: <span className="font-semibold text-foreground">{responsable}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(item.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {item.fecha_fin && (
                            <p className="text-[11px] font-medium text-primary mt-1">
                              Duración: {Math.max(1, Math.ceil((new Date(item.fecha_fin).getTime() - new Date(item.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24)))} {Math.ceil((new Date(item.fecha_fin).getTime() - new Date(item.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24)) === 1 ? 'día' : 'días'}
                            </p>
                          )}
                        </div>
                        {item.notas && (
                           <p className="text-xs italic text-muted-foreground bg-background/50 p-2 rounded border-l-2 border-primary/30 mt-1">
                             "{item.notas}"
                           </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {historial?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                    <HistoryIcon className="w-8 h-8 opacity-20" />
                    <p className="text-sm italic">No hay historial disponible</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

