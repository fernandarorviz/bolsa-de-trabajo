import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isToday as isDateToday,
  startOfDay,
  endOfDay,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, FilterX, Search, CalendarDays, ListOrdered, CalendarRange, Video, MapPin } from 'lucide-react';
import type { Entrevista, TipoEntrevista } from '@/types/ats';
import { InterviewModal } from '@/components/interviews/InterviewModal';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'month' | 'week' | 'agenda';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [selectedInterview, setSelectedInterview] = useState<Entrevista | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter state
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [vacanteFilter, setVacanteFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<TipoEntrevista | 'all'>('all');

  // Fetch filters data
  const { data: clientes } = useQuery({
    queryKey: ['clientes-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  const { data: vacantes } = useQuery({
    queryKey: ['vacantes-filter', clienteFilter],
    queryFn: async () => {
      let query = supabase
        .from('vacantes')
        .select('id, titulo, cliente_id')
        .order('titulo');
      
      if (clienteFilter !== 'all') {
        query = query.eq('cliente_id', clienteFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Dynamic date range based on view
  const { startDate, endDate } = useMemo(() => {
    if (view === 'month') {
        return {
            startDate: startOfWeek(startOfMonth(currentDate)),
            endDate: endOfWeek(endOfMonth(currentDate))
        };
    } else if (view === 'week') {
        return {
            startDate: startOfWeek(currentDate),
            endDate: endOfWeek(currentDate)
        };
    } else { // Agenda view: current month and next month
        return {
            startDate: startOfDay(currentDate),
            endDate: endOfMonth(addMonths(currentDate, 1))
        };
    }
  }, [currentDate, view]);

  const { data: interviews, refetch, isLoading } = useQuery({
    queryKey: ['calendar-interviews', startDate, endDate, clienteFilter, vacanteFilter, tipoFilter],
    queryFn: async () => {
      let query = supabase
        .from('entrevistas')
        .select(`
          *,
          vacante:vacantes!inner(titulo, cliente_id),
          candidato:candidatos(nombre, email),
          etapa:etapas_pipeline(nombre, color),
          creador:profiles(nombre)
        `)
        .gte('fecha_inicio', startDate.toISOString())
        .lte('fecha_inicio', endDate.toISOString());

      if (vacanteFilter !== 'all') {
        query = query.eq('vacante_id', vacanteFilter);
      } else if (clienteFilter !== 'all') {
        query = query.eq('vacante.cliente_id', clienteFilter);
      }

      if (tipoFilter !== 'all') {
        query = query.eq('tipo_entrevista', tipoFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any as Entrevista[];
    },
  });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const previous = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const today = () => setCurrentDate(new Date());

  const getInterviewsForDay = (day: Date) => {
    return interviews?.filter(i => isSameDay(new Date(i.fecha_inicio), day)) || [];
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'programada': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'reprogramada': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'realizada': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'cancelada': return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
      case 'propuesta': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const clearFilters = () => {
    setClienteFilter('all');
    setVacanteFilter('all');
    setTipoFilter('all');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Agenda de Entrevistas</h1>
            <p className="text-muted-foreground text-lg">
              Optimiza tu tiempo y coordina con precisión
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
             <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)} className="bg-muted/40 p-1 rounded-xl">
                <TabsList className="bg-transparent border-none">
                    <TabsTrigger value="month" className="rounded-lg data-[state=active]:shadow-sm">
                        <CalendarRange className="w-4 h-4 mr-2" />
                        Mes
                    </TabsTrigger>
                    <TabsTrigger value="week" className="rounded-lg data-[state=active]:shadow-sm">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Semana
                    </TabsTrigger>
                    <TabsTrigger value="agenda" className="rounded-lg data-[state=active]:shadow-sm">
                        <ListOrdered className="w-4 h-4 mr-2" />
                        Lista
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 bg-background p-1 rounded-xl border shadow-sm">
                <Button variant="ghost" size="sm" onClick={today} className="font-semibold text-[10px] uppercase tracking-wider px-3 h-8">
                Hoy
                </Button>
                <div className="h-4 w-px bg-border" />
                <Button variant="ghost" size="icon" onClick={previous} className="h-8 w-8 rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-2 font-bold text-xs min-w-[140px] text-center whitespace-nowrap">
                    {view === 'week' 
                        ? `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM')}`.toUpperCase()
                        : format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()
                    }
                </div>
                <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8 rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,auto] gap-4 items-center">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
                    <Search className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Filtrar por</span>
                </div>
                
                <Select value={clienteFilter} onValueChange={(v) => {
                    setClienteFilter(v);
                    setVacanteFilter('all');
                }}>
                    <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl bg-background shadow-sm border-muted-foreground/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-muted-foreground/10">
                        <SelectItem value="all" className="font-medium">Todos los clientes</SelectItem>
                        {clientes?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={vacanteFilter} onValueChange={setVacanteFilter}>
                    <SelectTrigger className="w-full sm:w-[240px] h-10 rounded-xl bg-background shadow-sm border-muted-foreground/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Vacante" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-muted-foreground/10">
                        <SelectItem value="all" className="font-medium">Todas las vacantes</SelectItem>
                        {vacantes?.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.titulo}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoEntrevista | 'all')}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl bg-background shadow-sm border-muted-foreground/10 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-muted-foreground/10">
                        <SelectItem value="all" className="font-medium">Todos los tipos</SelectItem>
                        <SelectItem value="interna">Interna</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="tecnica">Técnica</SelectItem>
                        <SelectItem value="seguimiento">Seguimiento</SelectItem>
                    </SelectContent>
                </Select>

                {(clienteFilter !== 'all' || vacanteFilter !== 'all' || tipoFilter !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-4 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all">
                        <FilterX className="w-4 h-4 mr-2" />
                        Limpiar filtros
                    </Button>
                )}
            </div>
            
            <div className="hidden xl:flex items-center gap-4 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400" /> Programada
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-400" /> Propuesta
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" /> Realizada
                </div>
            </div>
        </div>

        {/* Content Views */}
        {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
                 <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        ) : (
            <>
                {view === 'month' && (
                    <Card className="overflow-hidden border-none shadow-premium rounded-2xl bg-background/50 backdrop-blur-sm">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-7 bg-muted/30 border-b">
                                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                                    <div key={day} className="py-4 text-center text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80 border-r last:border-r-0 border-muted-foreground/5">
                                        <span className="hidden sm:inline">{day}</span>
                                        <span className="sm:hidden">{day.substring(0, 3)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 auto-rows-[minmax(140px,auto)]">
                                {days.map((day) => {
                                    const dayInterviews = getInterviewsForDay(day);
                                    const isToday = isSameDay(day, new Date());
                                    const isCurrentMonth = isSameMonth(day, currentDate);

                                    return (
                                        <div 
                                            key={day.toISOString()} 
                                            className={`
                                                min-h-[140px] p-3 border-b border-r last:border-r-0 transition-all duration-300
                                                ${!isCurrentMonth ? 'bg-muted/10 opacity-40' : 'bg-background hover:bg-muted/5'}
                                                ${isToday ? 'bg-primary/5 ring-[0.5px] ring-inset ring-primary/20 z-10' : ''}
                                            `}
                                        >
                                            <div className={`flex items-center justify-end mb-3 ${isToday ? 'font-black text-primary scale-110 origin-right' : 'font-medium text-muted-foreground/60'}`}>
                                                <span className={`text-sm ${isToday ? 'bg-primary text-white w-7 h-7 flex items-center justify-center rounded-full shadow-lg shadow-primary/30' : ''}`}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {dayInterviews.map((interview) => (
                                                    <InterviewItem key={interview.id} interview={interview} onClick={() => {
                                                        setSelectedInterview(interview);
                                                        setIsModalOpen(true);
                                                    }} styles={getStatusStyles(interview.estado)} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {view === 'week' && (
                     <Card className="overflow-hidden border-none shadow-premium rounded-2xl bg-background/50 backdrop-blur-sm">
                        <CardContent className="p-0">
                             <div className="grid grid-cols-7 auto-rows-fr h-full">
                                {days.map((day) => {
                                    const dayInterviews = getInterviewsForDay(day);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <div key={day.toISOString()} className={`flex flex-col border-r last:border-r-0 min-h-[600px] ${isToday ? 'bg-primary/5' : ''}`}>
                                            <div className="p-4 border-b bg-muted/20 text-center space-y-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                    {format(day, 'EEEE', { locale: es })}
                                                </div>
                                                <div className={`text-xl font-black ${isToday ? 'text-primary' : ''}`}>
                                                    {format(day, 'd')}
                                                </div>
                                            </div>
                                            <div className="flex-1 p-3 space-y-3">
                                                {dayInterviews.length > 0 ? (
                                                     dayInterviews.map((interview) => (
                                                        <div 
                                                            key={interview.id} 
                                                            className={`p-4 rounded-xl border-2 shadow-sm cursor-pointer transition-all hover:translate-y-[-2px] ${getStatusStyles(interview.estado)}`}
                                                            onClick={() => {
                                                                setSelectedInterview(interview);
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span className="text-xs font-black">
                                                                    {format(new Date(interview.fecha_inicio), 'HH:mm')}
                                                                </span>
                                                            </div>
                                                            <div className="font-black text-sm uppercase leading-tight mb-2">
                                                                {interview.candidato?.nombre}
                                                            </div>
                                                            <div className="flex flex-col gap-1 text-[10px] font-medium opacity-80">
                                                                <div className="flex items-center gap-1.5">
                                                                    {interview.modalidad === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                                                    {interview.modalidad === 'online' ? 'Link disponible' : interview.ubicacion || 'Oficina'}
                                                                </div>
                                                                <div className="truncate italic">
                                                                    {interview.vacante?.titulo}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex items-center justify-center opacity-10">
                                                        <Clock className="w-12 h-12" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                        </CardContent>
                     </Card>
                )}

                {view === 'agenda' && (
                    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
                        {days.map(day => {
                            const dayInterviews = getInterviewsForDay(day);
                            if (dayInterviews.length === 0) return null;

                            return (
                                <div key={day.toISOString()} className="relative pl-8 sm:pl-12 border-l-2 border-muted pb-8 last:pb-0">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background ${isDateToday(day) ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`} />
                                    
                                    <div className="mb-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                                            {format(day, 'EEEE d', { locale: es })} DE {format(day, 'MMMM', { locale: es }).toUpperCase()}
                                        </h3>
                                        {isDateToday(day) && <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Hoy</Badge>}
                                    </div>

                                    <div className="grid gap-3">
                                        {dayInterviews.map((interview) => (
                                            <Card 
                                                key={interview.id} 
                                                className="group border-none shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden rounded-2xl"
                                                onClick={() => {
                                                    setSelectedInterview(interview);
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                <div className="flex items-stretch h-24">
                                                    <div className={`w-2 ${getStatusStyles(interview.estado).split(' ')[0]}`} />
                                                    <CardContent className="flex-1 flex items-center gap-6 p-4">
                                                        <div className="flex flex-col items-center justify-center min-w-[70px] border-r pr-6">
                                                            <Clock className="w-4 h-4 text-muted-foreground mb-1" />
                                                            <span className="text-sm font-black text-foreground">
                                                                {format(new Date(interview.fecha_inicio), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-black text-base uppercase truncate tracking-tight">{interview.candidato?.nombre}</h4>
                                                                <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter ${getStatusStyles(interview.estado)}`}>
                                                                    {interview.estado}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-4">
                                                                <span className="font-semibold">{interview.vacante?.titulo}</span>
                                                                <span className="opacity-60">•</span>
                                                                <span className="flex items-center gap-1">
                                                                    {interview.modalidad === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                                                    {interview.tipo_entrevista}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                                                            <Button size="sm" variant="secondary" className="rounded-xl">Detalles</Button>
                                                        </div>
                                                    </CardContent>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {interviews?.length === 0 && (
                            <div className="text-center py-24 text-muted-foreground">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="text-xl font-medium">No hay entrevistas programadas para este periodo</p>
                                <p className="text-sm opacity-60 mt-2">Prueba ajustando los filtros o cambiando la fecha</p>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}

        {selectedInterview && isModalOpen && (
            <InterviewModal
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setSelectedInterview(null);
                }}
                postulacion={{
                    vacante_id: selectedInterview.vacante_id,
                    candidato_id: selectedInterview.candidato_id,
                    etapa_id: selectedInterview.etapa_pipeline_id,
                    candidato: { 
                        nombre: selectedInterview.candidato?.nombre || '',
                        email: selectedInterview.candidato?.email || ''
                    }
                }}
                interviewToEdit={selectedInterview}
                onSuccess={() => {
                    refetch();
                    setIsModalOpen(false);
                    setSelectedInterview(null);
                }}
            />
        )}
      </div>
    </DashboardLayout>
  );
}

function InterviewItem({ interview, onClick, styles }: { interview: Entrevista, onClick: () => void, styles: string }) {
    return (
        <div 
            className={`
                text-[10px] sm:text-[11px] p-2.5 rounded-xl border shadow-sm cursor-pointer 
                active:scale-95 hover:shadow-md transition-all duration-200
                ${styles}
            `}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                    <Clock className="w-3 h-3 opacity-70" />
                    {format(new Date(interview.fecha_inicio), 'HH:mm')}
                </div>
            </div>
            <div className="truncate font-black uppercase leading-tight tracking-tight mb-0.5">
                {interview.candidato?.nombre || 'Candidato'}
            </div>
            <div className="truncate text-[9px] font-medium opacity-60 italic">
                {interview.vacante?.titulo}
            </div>
        </div>
    );
}
