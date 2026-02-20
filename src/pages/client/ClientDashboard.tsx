import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientLayout from '@/components/layout/ClientLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Calendar, MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EstadoVacante, PrioridadVacante } from '@/types/ats';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ClientDashboard() {
  const { profile } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: vacantesResponse, isLoading } = useQuery({
    queryKey: ['client-vacantes', profile?.id, currentPage, pageSize],
    enabled: !!profile?.id,
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from('vacantes')
        .select(`
          *,
          clientes (id, nombre)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // @ts-ignore
      if (profile?.cliente_id) {
         // @ts-ignore
        query = query.eq('cliente_id', profile.cliente_id);
      } else {
        return { data: [], total: 0 }; 
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], total: count || 0 };
    },
  });

  const vacantes = vacantesResponse?.data;
  const totalVacantes = vacantesResponse?.total || 0;
  const totalPages = Math.ceil(totalVacantes / pageSize);

  const getEstadoBadge = (estado: EstadoVacante) => {
    const config: Record<string, { label: string; className: string }> = {
      borrador: { label: 'Borrador', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200' },
      publicada: { label: 'Activa', className: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' },
      pendiente_pago: { label: 'Pendiente de Pago', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200' },
      pausada: { label: 'Pausada', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200' },
      cerrada: { label: 'Cerrada', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200' },
      archivada: { label: 'Archivada', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200' },
    };
    return config[estado] || config.cerrada;
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Vacantes</h1>
          <p className="text-gray-500">Supervisa el estado de tus procesos de selección activos.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vacantes?.length === 0 ? (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Briefcase className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900">No tienes vacantes activas</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Comunícate con tu ejecutivo de cuenta para abrir una nueva vacante.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {vacantes?.map((vacante) => {
              const badge = getEstadoBadge(vacante.estado as EstadoVacante);
              
              return (
                <Card key={vacante.id} className="hover:shadow-md transition-all duration-200 border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {vacante.titulo}
                          </h3>
                          <Badge variant="outline" className={badge.className}>
                            {badge.label}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                          {vacante.ubicacion && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {vacante.ubicacion}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(vacante.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long', 
                              year: 'numeric'
                            })}
                          </div>
                          {vacante.estado === 'publicada' && vacante.fecha_publicacion && (
                            <div className="flex items-center gap-1.5 text-blue-600">
                              <Clock className="w-4 h-4" />
                              Hace {Math.floor((new Date().getTime() - new Date(vacante.fecha_publicacion).getTime()) / (1000 * 60 * 60 * 24))} días
                            </div>
                          )}
                        </div>
                      </div>

                      <Button asChild className="shrink-0" variant="outline">
                        <Link to={`/portal/vacantes/${vacante.id}`}>
                          Ver Candidatos
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalVacantes > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-4 px-2">
            <div className="flex items-center gap-2 order-2 md:order-1">
              <span className="text-sm text-gray-500 whitespace-nowrap">
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
              <span className="text-sm text-gray-500 whitespace-nowrap">
                de {totalVacantes} vacantes
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
                    
                    <div className="flex items-center px-4 text-sm font-medium text-gray-700">
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
      </div>
    </ClientLayout>
  );
}
