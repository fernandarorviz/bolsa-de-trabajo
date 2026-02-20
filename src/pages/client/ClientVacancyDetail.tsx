import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, FileText, CheckCircle2, XCircle, Calendar, Clock } from 'lucide-react';
import { FeedbackDialog } from '@/components/client/FeedbackDialog';
import type { DecisionCliente } from '@/types/client-portal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, CalendarPlus } from 'lucide-react';
import { PDFViewerDialog } from '@/components/candidates/PDFViewerDialog';
import { InterviewModal } from '@/components/interviews/InterviewModal';

const ALLOWED_STAGES = ['Entrevista Cliente', 'Finalista', 'Oferta', 'Contratado'];

export default function ClientVacancyDetail() {
  const { id } = useParams();
  const [feedbackState, setFeedbackState] = useState<{
    open: boolean;
    candidatoId: string;
    candidatoNombre: string;
    decision: DecisionCliente;
  }>({
    open: false,
    candidatoId: '',
    candidatoNombre: '',
    decision: 'aprobado',
  });
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [activeCandidateName, setActiveCandidateName] = useState<string>("");
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [selectedPostulacion, setSelectedPostulacion] = useState<any>(null);

  // Fetch Vacancy Details
  const { data: vacante, isLoading: loadingVacancy } = useQuery({
    queryKey: ['client-vacante', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacantes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch Candidates in Allowed Stages + Interviews
  const { data: candidatos, isLoading: loadingCandidates, refetch } = useQuery({
    queryKey: ['client-candidatos', id],
    queryFn: async () => {
      // 1. Get stages
      const { data: allowedStages, error: stagesError } = await supabase
        .from('etapas_pipeline')
        .select('id, nombre')
        .in('nombre', ALLOWED_STAGES);
      
      if (stagesError) throw stagesError;
      
      const allowedStageIds = allowedStages.map(s => s.id);
      
      if (allowedStageIds.length === 0) return [];

      // 2. Get postulaciones
      const { data: postulaciones, error } = await supabase
        .from('postulaciones')
        .select(`
          *,
          candidato:candidatos(*),
          etapa:etapas_pipeline(*)
        `)
        .eq('vacante_id', id)
        .in('etapa_id', allowedStageIds)
        .eq('descartado', false);

      if (error) throw error;

      // 3. Enrich with interviews, evaluations, AND feedback
      const enrichPromises = postulaciones.map(async (p) => {
        const [interviewsResult, evaluationsResult, feedbackResult] = await Promise.all([
            supabase
                .from('entrevistas')
                .select('*')
                .eq('candidato_id', p.candidato_id)
                .eq('vacante_id', id)
                .order('fecha_inicio', { ascending: false }),
            supabase
                .from('evaluaciones')
                .select('*')
                .eq('candidato_id', p.candidato_id),
            supabase
                .from('feedback_cliente')
                .select('*')
                .eq('vacante_id', id)
                .eq('candidato_id', p.candidato_id)
                .order('created_at', { ascending: false })
        ]);
        
        return {
            ...p,
            entrevistas: interviewsResult.data || [],
            evaluaciones: evaluationsResult.data || [],
            feedback: feedbackResult.data || []
        };
      });

      return Promise.all(enrichPromises);
    },
    enabled: !!id,
  });

  const handleFeedback = (candidatoId: string, candidatoNombre: string, decision: DecisionCliente) => {
    setFeedbackState({
      open: true,
      candidatoId,
      candidatoNombre,
      decision,
    });
  };

  const openPdfViewer = (url: string, name: string) => {
    setActivePdfUrl(url);
    setActiveCandidateName(name);
    setPdfViewerOpen(true);
  };

  const handleScheduleInterview = (postulacion: any) => {
    setSelectedPostulacion({
        vacante_id: id,
        candidato_id: postulacion.candidato_id,
        etapa_id: postulacion.etapa_id,
        candidato: {
            nombre: postulacion.candidato.nombre,
            email: postulacion.candidato.email
        }
    });
    setInterviewModalOpen(true);
  };

  if (loadingVacancy) {
    return (
      <ClientLayout>
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  if (!vacante) return null;

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/portal/dashboard">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vacante.titulo}</h1>
            <p className="text-gray-500">Candidatos finalistas para revisión</p>
          </div>
        </div>

        {/* Vacancy Details */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Descripción de la Vacante</h3>
                {vacante.descripcion ? (
                  <div 
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: vacante.descripcion }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">Sin descripción</p>
                )}
              </div>
              <div className="md:w-64 space-y-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles Rápido</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">Ubicación</label>
                    <p className="text-sm font-medium text-gray-900">{vacante.ubicacion || 'No especificada'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Presupuesto / Salario</label>
                    <p className="text-sm font-medium text-gray-900">
                      {vacante.salario_min && vacante.salario_max 
                        ? `$${vacante.salario_min.toLocaleString()} - $${vacante.salario_max.toLocaleString()} MXN`
                        : vacante.salario_min 
                        ? `Desde $${vacante.salario_min.toLocaleString()} MXN`
                        : 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Total de posiciones</label>
                    <p className="text-sm font-medium text-gray-900">{vacante.posiciones || 1}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        <div className="grid gap-6">
          {loadingCandidates ? (
            <div className="p-12 text-center text-gray-500">Cargando candidatos...</div>
          ) : candidatos?.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                No hay candidatos en etapa de revisión por el cliente aún.
              </CardContent>
            </Card>
          ) : (
            candidatos?.map((postulacion) => {
                const nextInterview = postulacion.entrevistas?.[0]; // Assuming ordered desc, but actually we want upcoming?
                // Let's filter upcoming
                const upcomingInterview = postulacion.entrevistas?.find(e => new Date(e.fecha_inicio) > new Date());
                const pastInterviews = postulacion.entrevistas?.filter(e => new Date(e.fecha_inicio) <= new Date());

                return (
              <Card key={postulacion.id} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Candidate Info */}
                    <div className="p-6 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
                       <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {postulacion.candidato?.nombre.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{postulacion.candidato?.nombre}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{postulacion.candidato?.ubicacion || 'Sin ubicación'}</p>
                                </div>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                                    {postulacion.etapa?.nombre}
                                </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mt-3">
                                {postulacion.candidato?.cv_url && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 text-xs bg-white"
                                      onClick={() => {
                                        if (postulacion.candidato.cv_url?.toLowerCase().endsWith('.pdf')) {
                                          openPdfViewer(postulacion.candidato.cv_url, postulacion.candidato.nombre);
                                        } else {
                                          window.open(postulacion.candidato.cv_url, '_blank', 'noopener,noreferrer');
                                        }
                                      }}
                                    >
                                        <FileText className="w-3 h-3 mr-1.5" />
                                        Ver CV Completo
                                    </Button>
                                )}
                            </div>

                            {/* Interview Info */}
                            <div className="mt-4 space-y-2">
                                {upcomingInterview && (
                                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-medium">Próxima entrevista:</span>
                                        <span>
                                            {format(new Date(upcomingInterview.fecha_inicio), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                        </span>
                                    </div>
                                )}
                                {pastInterviews && pastInterviews.length > 0 && !upcomingInterview && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>{pastInterviews.length} entrevista(s) realizada(s)</span>
                                    </div>
                                )}
                            </div>

                            {/* Evaluations Info */}
                            {postulacion.evaluaciones && postulacion.evaluaciones.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Evaluaciones Disponibles</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {postulacion.evaluaciones.map((eva: any) => (
                                            <Button 
                                                key={eva.id} 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                                asChild
                                            >
                                                <a href={eva.archivo_url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="w-3.5 h-3.5 mr-1.5" />
                                                    {eva.nombre}
                                                </a>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                       </div>
                    </div>

                    {/* Action Area */}
                    <div className="p-6 w-full md:w-72 bg-gray-50/50 flex flex-col justify-center gap-3">
                        {postulacion.etapa?.nombre === 'Contratado' ? (
                            <div className="text-center space-y-2">
                                <div className="p-2 bg-green-100 rounded-full w-fit mx-auto">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="font-bold text-green-700">¡Candidato Contratado!</p>
                                <p className="text-xs text-gray-500">Este proceso ha finalizado exitosamente.</p>
                            </div>
                        ) : postulacion.etapa?.nombre === 'Finalista' && postulacion.feedback?.some((f: any) => f.decision === 'aprobado') ? (
                            <div className="text-center space-y-2">
                                <div className="p-2 bg-blue-100 rounded-full w-fit mx-auto">
                                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="font-bold text-blue-700">Aprobado por ti</p>
                                <p className="text-xs text-gray-500">El candidato está en proceso final de revisión interna.</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-center text-gray-500 uppercase tracking-wider font-semibold mb-1">
                                    Evaluar Candidato
                                </p>
                                <Button 
                                    className="w-full bg-green-600 hover:bg-green-700 shadow-sm"
                                    onClick={() => handleFeedback(postulacion.candidato!.id, postulacion.candidato!.nombre, 'aprobado')}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Aprobar
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-white"
                                    onClick={() => handleFeedback(postulacion.candidato!.id, postulacion.candidato!.nombre, 'rechazado')}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rechazar
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 bg-white"
                                    onClick={() => handleScheduleInterview(postulacion)}
                                >
                                    <CalendarPlus className="w-4 h-4 mr-2" />
                                    Agendar Entrevista
                                </Button>
                            </>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})
          )}
        </div>

        <FeedbackDialog
            open={feedbackState.open}
            onOpenChange={(open) => setFeedbackState(prev => ({ ...prev, open }))}
            vacanteId={id!}
            candidatoId={feedbackState.candidatoId}
            candidatoNombre={feedbackState.candidatoNombre}
            decision={feedbackState.decision}
            onSuccess={() => refetch()}
        />
        <PDFViewerDialog 
          isOpen={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          pdfUrl={activePdfUrl}
          candidateName={activeCandidateName}
        />
        {selectedPostulacion && (
            <InterviewModal
                open={interviewModalOpen}
                onOpenChange={setInterviewModalOpen}
                postulacion={selectedPostulacion}
                onSuccess={() => refetch()}
                isClient
            />
        )}
      </div>
    </ClientLayout>
  );
}
