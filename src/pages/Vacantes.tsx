import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
  Play,
  Pause,
  Trash2,
  Building2,
  MapPin,
  Calendar,
  CalendarIcon,
  Clock,
  Download,
  List,
  LayoutGrid,
  Users,
  Copy,
} from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Vacante as VacanteType } from '@/types/ats'; // Alias because of local Vacante conflicts maybe?
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DateRange } from 'react-day-picker';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import type { EstadoVacante, PrioridadVacante, Vacante } from '@/types/ats';

export default function Vacantes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoVacante | 'all'>('all');
  const [prioridadFilter, setPrioridadFilter] = useState<PrioridadVacante | 'all'>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [tiempoAbiertoFilter, setTiempoAbiertoFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [selectedVacantes, setSelectedVacantes] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['vacantes', searchTerm, estadoFilter, prioridadFilter, clienteFilter, tiempoAbiertoFilter, dateRange, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('vacantes')
        .select(`
          *,
          clientes (id, nombre),
          postulaciones:postulaciones(count)
        `, { count: 'exact' });

      if (searchTerm) {
        query = query.ilike('titulo', `%${searchTerm}%`);
      }

      if (estadoFilter !== 'all') {
        query = query.eq('estado', estadoFilter);
      }

      if (prioridadFilter !== 'all') {
        query = query.eq('prioridad', prioridadFilter);
      }

      if (clienteFilter !== 'all') {
        query = query.eq('cliente_id', clienteFilter);
      }

      if (tiempoAbiertoFilter !== 'all') {
        const now = new Date();
        if (tiempoAbiertoFilter === 'less_7') {
          query = query.gt('fecha_publicacion', subDays(now, 7).toISOString());
        } else if (tiempoAbiertoFilter === '7_30') {
          query = query.lte('fecha_publicacion', subDays(now, 7).toISOString())
                       .gte('fecha_publicacion', subDays(now, 30).toISOString());
        } else if (tiempoAbiertoFilter === 'more_30') {
          query = query.lt('fecha_publicacion', subDays(now, 30).toISOString());
        }
      }

      if (dateRange?.from) {
        query = query.gte('fecha_publicacion', dateRange.from.toISOString());
        if (dateRange.to) {
          query = query.lte('fecha_publicacion', dateRange.to.toISOString());
        }
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { vacantes: data, count: count || 0 };
    },
  });

  const vacantes = data?.vacantes || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
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

  const updateEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoVacante }) => {
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
      queryClient.invalidateQueries({ queryKey: ['vacantes'] });
      toast.success('Estado actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vacantes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacantes'] });
      toast.success('Vacante eliminada');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar', { description: error.message });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('vacantes').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacantes'] });
      setSelectedVacantes([]);
      toast.success('Vacantes eliminadas correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar vacantes', { description: error.message });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVacantes(vacantes.map(v => v.id));
    } else {
      setSelectedVacantes([]);
    }
  };

  const handleSelectVacante = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedVacantes(prev => [...prev, id]);
    } else {
      setSelectedVacantes(prev => prev.filter(vId => vId !== id));
    }
  };

  const handleExport = async () => {
    try {
      let query = supabase
        .from('vacantes')
        .select(`
          titulo,
          estado,
          prioridad,
          ubicacion,
          created_at,
          clientes (nombre)
        `);

      if (searchTerm) {
        query = query.ilike('titulo', `%${searchTerm}%`);
      }
      if (estadoFilter !== 'all') query = query.eq('estado', estadoFilter);
      if (prioridadFilter !== 'all') query = query.eq('prioridad', prioridadFilter);
      if (clienteFilter !== 'all') query = query.eq('cliente_id', clienteFilter);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const headers = ['Título', 'Cliente', 'Estado', 'Prioridad', 'Ubicación', 'Fecha Registro'];
      const csvContent = [
        headers.join(','),
        ...data.map(v => [
          `"${v.titulo}"`,
          `"${(v.clientes as any)?.nombre || ''}"`,
          `"${v.estado}"`,
          `"${v.prioridad}"`,
          `"${v.ubicacion || ''}"`,
          `"${new Date(v.created_at).toLocaleDateString()}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vacantes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Lista de vacantes exportada');
    } catch (error: any) {
      toast.error('Error al exportar', { description: error.message });
    }
  };

  const filteredVacantes = vacantes; // Ya filtrado por el servidor

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
  
  const getTimeOpen = (vacante: any) => {
    const startDate = vacante.fecha_publicacion || vacante.created_at;
    if (!startDate) return 'Desconocido';
    
    const days = differenceInDays(new Date(), new Date(startDate));
    if (days === 0) return 'Abierta hoy';
    if (days === 1) return 'Abierta hace 1 día';
    return `Abierta hace ${days} días`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Vacantes</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona todas las posiciones abiertas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <div className="flex items-center border rounded-lg bg-background p-1">
              <Button
                variant={viewType === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('table')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4 mr-2" />
                Tabla
              </Button>
              <Button
                variant={viewType === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('grid')}
                className="h-8 px-3"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Grid
              </Button>
            </div>
            <Button asChild>
              <Link to="/vacantes/nueva">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Vacante
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar vacantes..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={estadoFilter} 
                  onValueChange={(val) => {
                    setEstadoFilter(val as EstadoVacante | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="publicada">Publicada</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="archivada">Archivada</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={prioridadFilter} 
                  onValueChange={(val) => {
                    setPrioridadFilter(val as PrioridadVacante | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Select 
                  value={clienteFilter} 
                  onValueChange={(val) => {
                    setClienteFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clientes?.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={tiempoAbiertoFilter} 
                  onValueChange={(val) => {
                    setTiempoAbiertoFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Tiempo abierto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier tiempo</SelectItem>
                    <SelectItem value="less_7">Menos de 7 días</SelectItem>
                    <SelectItem value="7_30">7 - 30 días</SelectItem>
                    <SelectItem value="more_30">Más de 30 días</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[240px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "PLL", { locale: es })} -{" "}
                            {format(dateRange.to, "PLL", { locale: es })}
                          </>
                        ) : (
                          format(dateRange.from, "PLL", { locale: es })
                        )
                      ) : (
                        <span>Fecha de publicación</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range);
                        setCurrentPage(1);
                      }}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>

                {(searchTerm || estadoFilter !== 'all' || prioridadFilter !== 'all' || clienteFilter !== 'all' || tiempoAbiertoFilter !== 'all' || dateRange?.from) && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setSearchTerm('');
                      setEstadoFilter('all');
                      setPrioridadFilter('all');
                      setClienteFilter('all');
                      setTiempoAbiertoFilter('all');
                      setDateRange(undefined);
                      setCurrentPage(1);
                    }}
                    className="px-2 lg:px-3"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacantes List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isAdmin && selectedVacantes.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-2 bg-destructive/10 rounded-lg border border-destructive/20 animate-fade-in">
                <span className="text-sm font-medium text-destructive mr-2">
                  {selectedVacantes.length} vacantes seleccionadas
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm(`¿Estás seguro que deseas eliminar ${selectedVacantes.length} vacantes?`)) {
                      bulkDeleteMutation.mutate(selectedVacantes);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar seleccionados
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedVacantes([])}
                >
                  Cancelar
                </Button>
              </div>
            )}
            
            {totalCount === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay vacantes</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || estadoFilter !== 'all' || prioridadFilter !== 'all' || clienteFilter !== 'all' || tiempoAbiertoFilter !== 'all' || dateRange
                      ? 'No se encontraron vacantes con los filtros aplicados'
                      : 'Crea tu primera vacante para comenzar'}
                  </p>
                  {!searchTerm && estadoFilter === 'all' && prioridadFilter === 'all' && clienteFilter === 'all' && tiempoAbiertoFilter === 'all' && !dateRange && (
                    <Button asChild>
                      <Link to="/vacantes/nueva">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Vacante
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewType === 'grid' ? (
          <div className="grid gap-4">
            {vacantes.map((v) => {
              const vacante = v as any; // Cast to bypass Supabase type lag
              const estadoBadge = getEstadoBadge(vacante.estado as EstadoVacante);
              const prioridadBadge = getPrioridadBadge(vacante.prioridad as PrioridadVacante);
              const cliente = vacante.clientes as { id: string; nombre: string } | null;
              
              return (
                <Card key={vacante.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Link 
                              to={`/vacantes/${vacante.id}`}
                              className="font-semibold text-lg hover:text-primary transition-colors"
                            >
                              {vacante.titulo}
                            </Link>
                            <Badge variant="outline" className={estadoBadge.className}>
                              {estadoBadge.label}
                            </Badge>
                            <Badge variant="outline" className={prioridadBadge.className}>
                              {prioridadBadge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
                              {new Date(vacante.created_at).toLocaleDateString('es-ES')}
                            </span>
                            <span className="flex items-center gap-1 font-medium text-primary">
                              <Users className="w-4 h-4" />
                              {(vacante.postulaciones as any)?.[0]?.count || 0} candidatos
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {getTimeOpen(vacante)}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Briefcase className="w-4 h-4" />
                              {vacante.posiciones || 1} {vacante.posiciones === 1 ? 'posición' : 'posiciones'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/vacantes/${vacante.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/vacantes/${vacante.id}/pipeline`}>
                            Cartera
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/vacantes/${vacante.id}/editar`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {vacante.estado === 'borrador' && (
                              <DropdownMenuItem 
                                onClick={() => updateEstadoMutation.mutate({ id: vacante.id, estado: 'publicada' })}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Publicar
                              </DropdownMenuItem>
                            )}
                            {vacante.estado === 'publicada' && (
                              <DropdownMenuItem 
                                onClick={() => updateEstadoMutation.mutate({ id: vacante.id, estado: 'pausada' })}
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                Pausar
                              </DropdownMenuItem>
                            )}
                            {vacante.estado === 'pausada' && (
                              <DropdownMenuItem 
                                onClick={() => updateEstadoMutation.mutate({ id: vacante.id, estado: 'publicada' })}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Reanudar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => updateEstadoMutation.mutate({ id: vacante.id, estado: 'archivada' })}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archivar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => navigate(`/vacantes/nueva?from=${vacante.id}`)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(vacante.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={selectedVacantes.length === vacantes.length && vacantes.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
                  )}
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Candidatos</TableHead>
                  <TableHead>Posiciones</TableHead>
                  <TableHead>Tiempo Abierto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vacantes.map((vacante) => {
                  const estadoBadge = getEstadoBadge(vacante.estado as EstadoVacante);
                  const prioridadBadge = getPrioridadBadge(vacante.prioridad as PrioridadVacante);
                  const cliente = vacante.clientes as { id: string; nombre: string } | null;
                  
                  return (
                    <TableRow key={vacante.id} className={cn(selectedVacantes.includes(vacante.id) && "bg-muted/50")}>
                      {isAdmin && (
                        <TableCell>
                          <Checkbox 
                            checked={selectedVacantes.includes(vacante.id)}
                            onCheckedChange={(checked) => handleSelectVacante(vacante.id, !!checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <Link to={`/vacantes/${vacante.id}`} className="hover:text-primary">
                          {vacante.titulo}
                        </Link>
                      </TableCell>
                      <TableCell>{cliente?.nombre || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoBadge.className}>
                          {estadoBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={prioridadBadge.className}>
                          {prioridadBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{vacante.ubicacion || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {(vacante.postulaciones as any)?.[0]?.count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vacante.posiciones || 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {getTimeOpen(vacante)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(vacante.created_at).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <Button variant="ghost" size="icon" asChild>
                            <Link to={`/vacantes/${vacante.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/vacantes/${vacante.id}/editar`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/vacantes/${vacante.id}/pipeline`)}>
                                <Play className="w-4 h-4 mr-2" />
                                Pipeline
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/vacantes/nueva?from=${vacante.id}`)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
