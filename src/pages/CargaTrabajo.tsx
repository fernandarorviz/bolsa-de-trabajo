import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  UserPlus, 
  ArrowRightLeft, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Clock,
  User as UserIcon,
  Eye
} from 'lucide-react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { ReassignVacancyDialog } from '@/components/vacancies/ReassignVacancyDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function CargaTrabajo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<{ id: string, titulo: string, reclutador_id?: string | null } | null>(null);
  const [openRecruiters, setOpenRecruiters] = useState<string[]>([]);

  // 1. Fetch Recruiters and their workload
  const { data: workloadData, isLoading: loadingWorkload } = useQuery({
    queryKey: ['recruiter-workload'],
    queryFn: async () => {
      // Get all recruiters
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'reclutador');
      
      if (roleError) throw roleError;
      
      const userIds = roleData.map(r => r.user_id);
      if (userIds.length === 0) return [];

      // Get recruiter profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, email')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      // Get active vacancies for these recruiters
      const { data: vacancies, error: vacanciesError } = await supabase
        .from('vacantes')
        .select(`
          id, 
          titulo, 
          estado, 
          prioridad, 
          created_at, 
          reclutador_id,
          postulaciones (count)
        `)
        .in('reclutador_id', userIds)
        .in('estado', ['publicada', 'pausada', 'pendiente_pago']);

      if (vacanciesError) throw vacanciesError;

      // Map vacancies to recruiters
      return profiles.map(p => {
        const myVacancies = vacancies.filter(v => v.reclutador_id === p.id);
        const totalCandidates = myVacancies.reduce((acc, curr) => acc + (curr.postulaciones[0]?.count || 0), 0);
        
        return {
          ...p,
          vacancies: myVacancies,
          activeCount: myVacancies.length,
          candidateCount: totalCandidates
        };
      }).sort((a, b) => b.activeCount - a.activeCount);
    }
  });

  // 2. Fetch Unassigned Vacancies
  const { data: unassignedVacancies, isLoading: loadingUnassigned } = useQuery({
    queryKey: ['unassigned-vacancies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacantes')
        .select(`
          id, 
          titulo, 
          estado, 
          prioridad, 
          created_at,
          postulaciones (count)
        `)
        .is('reclutador_id', null)
        .in('estado', ['publicada', 'pausada', 'borrador', 'pendiente_pago']);
      
      if (error) throw error;
      return data;
    }
  });

  const toggleRecruiter = (id: string) => {
    setOpenRecruiters(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenReassign = (v: any) => {
    setSelectedVacancy({ id: v.id, titulo: v.titulo, reclutador_id: v.reclutador_id });
    setReassignOpen(true);
  };

  const getDaysOpen = (date: string) => {
    return differenceInDays(new Date(), new Date(date));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-destructive text-destructive-foreground';
      case 'alta': return 'bg-orange-500 text-white';
      case 'media': return 'bg-blue-500 text-white';
      case 'baja': return 'bg-slate-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  if (loadingWorkload || loadingUnassigned) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Carga de Trabajo</h1>
            <p className="text-muted-foreground mt-1">
              Distribución de vacantes y candidatos entre reclutadores
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Workload View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Total Vacantes Activas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {workloadData?.reduce((acc, curr) => acc + curr.activeCount, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Candidatos en Proceso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {workloadData?.reduce((acc, curr) => acc + curr.candidateCount, 0) || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Equipo de Reclutamiento
              </h2>
              
              <div className="space-y-3">
                {workloadData?.map((recruiter) => (
                  <Card key={recruiter.id} className="overflow-hidden border-l-4 border-l-primary">
                    <Collapsible
                      open={openRecruiters.includes(recruiter.id)}
                      onOpenChange={() => toggleRecruiter(recruiter.id)}
                    >
                      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {recruiter.nombre.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{recruiter.nombre}</h3>
                            <p className="text-xs text-muted-foreground">{recruiter.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{recruiter.activeCount}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Vacantes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{recruiter.candidateCount}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Candidatos</p>
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-2">
                              {openRecruiters.includes(recruiter.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-1 border-t bg-muted/30">
                          {recruiter.vacancies.length === 0 ? (
                            <p className="text-sm text-center py-4 text-muted-foreground italic">
                              Sin vacantes activas asignadas actualmente.
                            </p>
                          ) : (
                            <div className="space-y-2 mt-2">
                              {recruiter.vacancies.map((v) => (
                                <div key={v.id} className="flex items-center justify-between bg-background p-2 px-3 rounded-md border text-sm shadow-sm">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span 
                                        className="font-medium underline-offset-4 hover:underline cursor-pointer" 
                                        onClick={() => navigate(`/vacantes/${v.id}`)}
                                      >
                                        {v.titulo}
                                      </span>
                                      <Badge variant="outline" className={cn("text-[10px] px-1.5 h-4 capitalize", getPriorityColor(v.prioridad))}>
                                        {v.prioridad}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Abierta hace {getDaysOpen(v.created_at)} días
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {v.postulaciones[0]?.count || 0} candidatos
                                      </span>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-xs gap-1"
                                    onClick={() => handleOpenReassign(v)}
                                  >
                                    <ArrowRightLeft className="w-3 h-3 text-primary" />
                                    Reasignar
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Unassigned & High Load Alerts */}
          <div className="space-y-6">
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                  <AlertCircle className="w-5 h-5" />
                  Vacantes sin Asignar
                </CardTitle>
                <CardDescription className="text-orange-600">
                  Requieren atención inmediata para iniciar el proceso
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unassignedVacancies?.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-green-600 font-medium">Todas las vacantes están asignadas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unassignedVacancies?.map((v) => (
                      <div key={v.id} className="p-3 bg-white border border-orange-200 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm line-clamp-1">{v.titulo}</h4>
                          <Badge className={cn("text-[9px] h-4", getPriorityColor(v.prioridad))}>
                            {v.prioridad}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {getDaysOpen(v.created_at)} días
                          </span>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-7 text-[10px] px-2 gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200"
                            onClick={() => handleOpenReassign(v)}
                          >
                            <UserPlus className="w-3 h-3" />
                            Asignar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Consejos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 text-muted-foreground">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                  <p>Manten una carga equilibrada para asegurar la calidad de los cierres.</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                  <p>Observa el número de candidatos activos, ya que implican mayor carga operativa de entrevistas.</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                  <p>Reasigna vacantes estancadas (más de 30 días) para darles un nuevo impulso.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedVacancy && (
          <ReassignVacancyDialog
            open={reassignOpen}
            onOpenChange={setReassignOpen}
            vacancyId={selectedVacancy.id}
            vacancyTitle={selectedVacancy.titulo}
            currentRecruiterId={selectedVacancy.reclutador_id}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
