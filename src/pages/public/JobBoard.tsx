import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layout/PublicLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Clock, Search, Filter } from 'lucide-react';
import { Vacante } from '@/types/ats';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ArrowUpDown } from 'lucide-react';
import { JobStats } from '@/components/jobs/JobStats';

export default function JobBoard() {
  const navigate = useNavigate();
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState('newest');
  const [filters, setFilters] = useState({
    search: '',
    ubicacion: 'todas',
    tipo: 'todos',
    area: 'todas'
  });

  const [stats, setStats] = useState<{
    by_location: Record<string, number>;
    by_area: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    fetchVacantes();
    fetchStats();
  }, [filters, currentPage, pageSize, orderBy]);

  const fetchStats = async () => {
    try {
      // @ts-ignore
      const { data, error } = await supabase.rpc('get_vacancy_stats');
      if (error) throw error;
      setStats(data as any);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVacantes = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('vacantes')
        .select(`
          *,
          cliente:clientes(nombre, logo_url, cobranding_activo)
        `, { count: 'exact' })
        .eq('estado', 'publicada');

      if (filters.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`);
      }

      if (filters.ubicacion !== 'todas') {
        query = query.ilike('ubicacion', `%${filters.ubicacion}%`);
      }

      if (filters.tipo !== 'todos') {
        query = query.eq('tipo_contrato', filters.tipo as any);
      }

      if (filters.area !== 'todas') {
        query = query.eq('area', filters.area);
      }

      // Apply sorting
      switch (orderBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'salary_high':
          query = query.order('salario_max', { ascending: false });
          break;
        case 'salary_low':
          query = query.order('salario_min', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error, count } = await query
        .range(from, to);

      if (error) throw error;
      setVacantes(data as unknown as Vacante[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching vacantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVacantes = vacantes; // Now handled by server-side query

  // Extract unique values for filters
  const uniqueLocations = Array.from(new Set(vacantes.map(v => v.ubicacion).filter(Boolean)));
  const uniqueAreas = Array.from(new Set(vacantes.map(v => v.area).filter(Boolean)));

  const formatCurrency = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Salario a convenir';
    if (min && !max) return `Desde $${min.toLocaleString()}`;
    if (!min && max) return `Hasta $${max.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  return (
    <PublicLayout>
      <div className="space-y-8">
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Únete a nuestro equipo</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Descubre oportunidades que impulsarán tu carrera profesional.
          </p>
        </div>

        {stats && (
          <JobStats 
            stats={stats}
            selectedLocation={filters.ubicacion}
            selectedArea={filters.area}
            onFilterChange={(type, value) => {
              setFilters(prev => ({ ...prev, [type]: value }));
              setCurrentPage(1);
            }}
          />
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4 md:space-y-0 md:flex md:gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-gray-700">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Cargo, palabras clave..." 
                className="pl-9"
                value={filters.search}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, search: e.target.value }));
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-medium text-gray-700">Ubicación</label>
            <Select 
                value={filters.ubicacion} 
                onValueChange={(val) => {
                  setFilters(prev => ({ ...prev, ubicacion: val }));
                  setCurrentPage(1);
                }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {uniqueLocations.map(loc => (
                  <SelectItem key={loc} value={loc as string}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-medium text-gray-700">Área</label>
             <Select 
                value={filters.area} 
                onValueChange={(val) => {
                  setFilters(prev => ({ ...prev, area: val }));
                  setCurrentPage(1);
                }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {uniqueAreas.map(area => (
                  <SelectItem key={area} value={area as string}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-medium text-gray-700">Ordenar por</label>
            <Select 
                value={orderBy} 
                onValueChange={(val) => {
                  setOrderBy(val);
                  setCurrentPage(1);
                }}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="Ordenar" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguas</SelectItem>
                <SelectItem value="salary_high">Mayor salario</SelectItem>
                <SelectItem value="salary_low">Menor salario</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
                ))}
             </div>
        ) : filteredVacantes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No se encontraron vacantes</h3>
                <p className="text-gray-500">Intenta ajustar tus filtros de búsqueda.</p>
                <Button 
                    variant="link" 
                    onClick={() => {
                        setFilters({ search: '', ubicacion: 'todas', tipo: 'todos', area: 'todas' });
                        setCurrentPage(1);
                    }}
                    className="mt-2"
                >
                    Limpiar filtros
                </Button>
            </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVacantes.map((vacante) => (
              <Card key={vacante.id} className="hover:shadow-md transition-shadow cursor-pointer flex flex-col" onClick={() => navigate(`/empleos/${vacante.id}`)}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                         {vacante.cliente?.cobranding_activo && vacante.cliente?.logo_url ? (
                            <img 
                              src={vacante.cliente.logo_url} 
                              alt={vacante.cliente.nombre} 
                              className="h-10 w-10 object-contain rounded-md bg-white border border-gray-100 p-1"
                            />
                         ) : null}
                         <CardTitle className="text-xl font-bold text-primary line-clamp-2">
                            {vacante.titulo}
                         </CardTitle>
                      </div>
                    </div>
                    {vacante.prioridad === 'urgente' && (
                        <Badge variant="destructive" className="shrink-0">Urgente</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="font-normal">
                        {vacante.cliente?.nombre || 'Empresa Confidencial'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{vacante.ubicacion || 'Remoto'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Briefcase className="w-4 h-4" />
                    <span>{vacante.area || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(vacante.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="pt-2 text-sm font-medium text-green-600">
                    {formatCurrency(vacante.salario_min, vacante.salario_max)}
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <Button className="w-full">Ver Vacante</Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Mostrar {Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)} de {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Por página:</span>
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.ceil(totalCount / pageSize) }).map((_, i) => {
                  const pageNumber = i + 1;
                  // Only show current, first, last, and neighbors
                  if (
                    pageNumber === 1 || 
                    pageNumber === Math.ceil(totalCount / pageSize) || 
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink 
                          isActive={currentPage === pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (
                    pageNumber === currentPage - 2 || 
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                    className={currentPage === Math.ceil(totalCount / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
        )}
      </div>
    </PublicLayout>
  );
}
