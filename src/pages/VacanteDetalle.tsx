import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  Archive,
  CheckCircle2,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Briefcase,
  Clock,
  TrendingUp,
  Wrench,
  GraduationCap,
  Copy,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import type { EstadoVacante, PrioridadVacante, TipoContrato } from '@/types/ats';
import { ShareJob } from '@/components/vacancies/ShareJob';

export default function VacanteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: vacante, isLoading } = useQuery({
    queryKey: ['vacante', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacantes')
        .select(`
          *,
          clientes (id, nombre, industria)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;

      // Manually fetch related profiles if they exist since FKs might be missing in types
      const vacanteWithProfiles = { ...data } as any;

      if (data.reclutador_id) {
        const { data: reclutador } = await supabase
          .from('profiles')
          .select('nombre, email, avatar_url')
          .eq('id', data.reclutador_id)
          .single();
        vacanteWithProfiles.reclutador = reclutador;
      }

      if (data.ejecutivo_id) {
        const { data: ejecutivo } = await supabase
          .from('profiles')
          .select('nombre, email, avatar_url')
          .eq('id', data.ejecutivo_id)
          .single();
        vacanteWithProfiles.ejecutivo = ejecutivo;
      }

      return vacanteWithProfiles;
    },
    enabled: !!id,
  });

  const { data: postulacionesCount } = useQuery({
    queryKey: ['vacante-postulaciones', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('postulaciones')
        .select('*', { count: 'exact', head: true })
        .eq('vacante_id', id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const updateEstadoMutation = useMutation({
    mutationFn: async (estado: EstadoVacante) => {
      const updates: Record<string, unknown> = { estado };
      if (estado === 'publicada') {
        updates.fecha_publicacion = new Date().toISOString();
      } else if (estado === 'cerrada') {
        updates.fecha_cierre = new Date().toISOString();
      }
      const { error } = await supabase
        .from('vacantes')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacante', id] });
      toast.success('Estado actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar', { description: error.message });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!vacante) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vacante no encontrada</p>
          <Button asChild className="mt-4">
            <Link to="/vacantes">Volver a vacantes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getEstadoBadge = (estado: EstadoVacante) => {
    const config: Record<EstadoVacante, { label: string; className: string }> = {
      borrador: { label: 'Borrador', className: 'status-borrador' },
      pendiente_pago: { label: 'Pendiente de Pago', className: 'status-pausada' },
      publicada: { label: 'Publicada', className: 'status-publicada' },
      pausada: { label: 'Pausada', className: 'status-pausada' },
      archivada: { label: 'Archivada', className: 'status-archivada' },
      cerrada: { label: 'Cerrada', className: 'status-cerrada' },
    };
    return config[estado];
  };

  const getPrioridadBadge = (prioridad: PrioridadVacante) => {
    const config: Record<PrioridadVacante, { label: string; className: string }> = {
      baja: { label: 'Baja', className: 'priority-baja' },
      media: { label: 'Media', className: 'priority-media' },
      alta: { label: 'Alta', className: 'priority-alta' },
      urgente: { label: 'Urgente', className: 'priority-urgente' },
    };
    return config[prioridad];
  };

  const getTipoContratoLabel = (tipo: TipoContrato) => {
    const labels: Record<TipoContrato, string> = {
      tiempo_completo: 'Tiempo Completo',
      medio_tiempo: 'Medio Tiempo',
      temporal: 'Temporal',
      proyecto: 'Por Proyecto',
      freelance: 'Freelance',
    };
    return labels[tipo];
  };

  const estadoBadge = getEstadoBadge(vacante.estado as EstadoVacante);
  const prioridadBadge = getPrioridadBadge(vacante.prioridad as PrioridadVacante);
  const cliente = vacante.clientes as { id: string; nombre: string; industria: string | null } | null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vacantes')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-3xl font-bold">{vacante.titulo}</h1>
                <Badge variant="outline" className={estadoBadge.className}>
                  {estadoBadge.label}
                </Badge>
                <Badge variant="outline" className={prioridadBadge.className}>
                  {prioridadBadge.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                {cliente && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {cliente.nombre}
                  </span>
                )}
                {vacante.ubicacion && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {vacante.ubicacion}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Creada {new Date(vacante.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {vacante.estado === 'borrador' && (
              <Button onClick={() => updateEstadoMutation.mutate('publicada')}>
                <Play className="w-4 h-4 mr-2" />
                Publicar
              </Button>
            )}
            {vacante.estado === 'publicada' && (
              <Button variant="outline" onClick={() => updateEstadoMutation.mutate('pausada')}>
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}
            {vacante.estado === 'pausada' && (
              <Button onClick={() => updateEstadoMutation.mutate('publicada')}>
                <Play className="w-4 h-4 mr-2" />
                Reanudar
              </Button>
            )}
            {(vacante.estado === 'publicada' || vacante.estado === 'pausada') && (
              <Button variant="outline" onClick={() => updateEstadoMutation.mutate('cerrada')}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
            )}
            <Button variant="outline" onClick={() => updateEstadoMutation.mutate('archivada')}>
              <Archive className="w-4 h-4 mr-2" />
              Archivar
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/vacantes/${id}/editar`}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/vacantes/nueva?from=${id}`}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/vacantes/${id}/pipeline`}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Cartera
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Candidatos</p>
                  <p className="text-2xl font-bold">{postulacionesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Días Abierta</p>
                  <p className="text-2xl font-bold">
                    {Math.floor((Date.now() - new Date(vacante.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rango Salarial</p>
                  <p className="text-lg font-bold">
                    {vacante.salario_min || vacante.salario_max ? (
                      `$${vacante.salario_min?.toLocaleString() || '?'} - $${vacante.salario_max?.toLocaleString() || '?'}`
                    ) : (
                      'No especificado'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posiciones</p>
                  <p className="text-2xl font-bold">{vacante.posiciones || 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                {vacante.descripcion ? (
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: vacante.descripcion }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">Sin descripción</p>
                )}
              </CardContent>
            </Card>

            {vacante.preguntas_knockout && (vacante.preguntas_knockout as any[]).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Preguntas Knockout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(vacante.preguntas_knockout as any[]).map((q, i) => (
                      <div key={i} className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                        <p className="font-semibold mb-2">{q.pregunta}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-white text-xs">
                            {q.tipo === 'booleano' ? 'Sí/No' : 'Numérico'}
                          </Badge>
                          <span className="text-muted-foreground">Regla:</span>
                          <Badge className="bg-orange-200 text-orange-900 border-orange-300 hover:bg-orange-300">
                            {q.tipo === 'booleano' 
                              ? (q.regla === 'si' ? 'Debe ser Sí' : 'Debe ser No')
                              : `${q.regla === 'minimo' ? 'Mínimo' : q.regla === 'maximo' ? 'Máximo' : 'Exacto'}: ${q.valor_referencia}`
                            }
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(vacante.experiencia_requerida || vacante.conocimientos_tecnicos || vacante.habilidades_tecnicas || vacante.idiomas_requeridos || vacante.actividades_idiomas) && (
              <Card>
                <CardHeader>
                  <CardTitle>Requisitos y Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {vacante.experiencia_requerida && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Experiencia Requerida</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.experiencia_requerida }} />
                    </div>
                  )}
                  {vacante.conocimientos_tecnicos && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Conocimientos Técnicos</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.conocimientos_tecnicos }} />
                    </div>
                  )}
                  {vacante.habilidades_tecnicas && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Habilidades Técnicas</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.habilidades_tecnicas }} />
                    </div>
                  )}
                  {vacante.idiomas_requeridos && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Idiomas</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.idiomas_requeridos }} />
                      {vacante.actividades_idiomas && (
                        <div className="mt-2 pl-4 border-l-2 border-primary/20">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Actividades en el idioma:</p>
                          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.actividades_idiomas }} />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(vacante.descripcion_prestaciones || vacante.beneficios_adicionales || vacante.bonos || vacante.herramientas_trabajo) && (
              <Card>
                <CardHeader>
                  <CardTitle>Prestaciones y Beneficios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {vacante.descripcion_prestaciones && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Detalle de Prestaciones</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.descripcion_prestaciones }} />
                    </div>
                  )}
                  {vacante.beneficios_adicionales && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Beneficios Adicionales</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.beneficios_adicionales }} />
                    </div>
                  )}
                  {vacante.bonos && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Bonos</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.bonos }} />
                    </div>
                  )}
                  {vacante.herramientas_trabajo && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Herramientas de Trabajo</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: vacante.herramientas_trabajo }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {vacante.estado === 'publicada' && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <ShareJob jobId={id!} jobTitle={vacante.titulo} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
                  <p className="font-medium">{getTipoContratoLabel(vacante.tipo_contrato as TipoContrato)}</p>
                </div>
                {vacante.area && (
                  <div>
                    <p className="text-sm text-muted-foreground">Área</p>
                    <p className="font-medium">{vacante.area}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Número de posiciones</p>
                  <p className="font-medium">{vacante.posiciones || 1}</p>
                </div>
                {vacante.fecha_publicacion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Publicación</p>
                    <p className="font-medium">
                      {new Date(vacante.fecha_publicacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
                {vacante.fecha_cierre && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Cierre</p>
                    <p className="font-medium">
                      {new Date(vacante.fecha_cierre).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
                {vacante.anios_experiencia_min !== undefined && vacante.anios_experiencia_min !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Experiencia Mínima</p>
                    <p className="font-medium">{vacante.anios_experiencia_min} años</p>
                  </div>
                )}
                {vacante.nivel_educativo_min && (
                  <div>
                    <p className="text-sm text-muted-foreground">Educación Mínima</p>
                    <p className="font-medium">{vacante.nivel_educativo_min}</p>
                  </div>
                )}
                {(vacante.rango_edad_min || vacante.rango_edad_max) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Rango de Edad</p>
                    <p className="font-medium">
                      {vacante.rango_edad_min || 18} - {vacante.rango_edad_max || 85} años
                    </p>
                  </div>
                )}
                {vacante.genero && (
                  <div>
                    <p className="text-sm text-muted-foreground">Género</p>
                    <p className="font-medium capitalize">{vacante.genero}</p>
                  </div>
                )}
                {vacante.disponibilidad_viaje !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Disponibilidad para Viajar</p>
                    <p className="font-medium">{vacante.disponibilidad_viaje ? 'Sí' : 'No'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {vacante.competencias_clave && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    Competencias Clave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: vacante.competencias_clave }}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Asignación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vacante.reclutador_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reclutador</p>
                    <p className="font-medium">{vacante.reclutador?.nombre || 'Asignado'}</p>
                  </div>
                )}
                {/* El campo ejecutivo_id se oculta temporalmente por solicitud del usuario */}
                {!vacante.reclutador_id && !vacante.ejecutivo_id && (
                  <p className="text-muted-foreground text-sm italic">Sin asignaciones</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
