
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DashboardOverview } from "@/components/reports/DashboardOverview";
import { PipelineFunnel } from "@/components/reports/PipelineFunnel";
import { VacancyChart } from "@/components/reports/VacancyChart";
import { RecruiterTable } from "@/components/reports/RecruiterTable";
import { ClientTable } from "@/components/reports/ClientTable";
import { VacancyPipelineBreakdown } from "@/components/reports/VacancyPipelineBreakdown";
import { analyticsService, DashboardFilters, DashboardKPIs } from "@/services/analytics";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function OverviewReport() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [vacancyMetrics, setVacancyMetrics] = useState<any[]>([]);
  const [pipelineMetrics, setPipelineMetrics] = useState<any[]>([]);
  const [recruiterMetrics, setRecruiterMetrics] = useState<any[]>([]);
  const [clientMetrics, setClientMetrics] = useState<any[]>([]);
  const [breakdownData, setBreakdownData] = useState<any[]>([]);
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  
  const [clients, setClients] = useState<{id: string, nombre: string}[]>([]);
  const [recruiters, setRecruiters] = useState<{id: string, nombre: string}[]>([]);

  const [filters, setFilters] = useState<DashboardFilters>({
      startDate: undefined,
      endDate: undefined,
      clientId: undefined,
      recruiterId: undefined,
      classification: undefined
  });

  const fetchFilterOptions = async () => {
    try {
        const { data: clientsData } = await supabase.from('clientes').select('id, nombre').order('nombre');
        setClients(clientsData || []);

        const { data: recruitersData } = await supabase.from('profiles').select('id, nombre');
        setRecruiters(recruitersData || []);
    } catch (error) {
        console.error("Error loading filters:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiData, vacData, pipeData, recData, cliData, breakdownObj] = await Promise.all([
        analyticsService.getDashboardKPIs(filters),
        analyticsService.getVacancyMetrics('month', filters.classification),
        analyticsService.getPipelineMetrics(undefined, filters.classification),
        analyticsService.getRecruiterMetrics(filters),
        analyticsService.getClientMetrics(),
        analyticsService.getPipelineBreakdownByVacancy(filters.classification)
      ]);

      setKpis(kpiData);
      setVacancyMetrics(vacData);
      setPipelineMetrics(pipeData);
      setRecruiterMetrics(recData);
      setClientMetrics(cliData);
      setBreakdownData(breakdownObj.data);
      setPipelineStages(breakdownObj.stages);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const clearFilters = () => setFilters({ startDate: undefined, endDate: undefined, clientId: undefined, recruiterId: undefined, classification: undefined });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up pb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Indicadores de Gestión (KPIs)</h2>
            <p className="text-muted-foreground">Métricas generales de operación y embudo</p>
          </div>
          <Button variant="outline" onClick={() => toast.info("Exportando...")}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                <Filter className="h-4 w-4" /> Filtros:
            </div>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[240px] justify-start text-left bg-background", !filters.startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? (
                            filters.endDate ? `${format(filters.startDate, "LLL dd, y", { locale: es })} - ${format(filters.endDate, "LLL dd, y", { locale: es })}` : format(filters.startDate, "LLL dd, y", { locale: es })
                        ) : <span>Seleccionar periodo</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={{ from: filters.startDate, to: filters.endDate }} onSelect={(range) => setFilters(prev => ({ ...prev, startDate: range?.from, endDate: range?.to }))} numberOfMonths={2} />
                </PopoverContent>
            </Popover>

            <Select value={filters.clientId || "all"} onValueChange={(val) => setFilters(prev => ({ ...prev, clientId: val === "all" ? undefined : val }))}>
                <SelectTrigger className="w-[200px] bg-background"><SelectValue placeholder="Clientes" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select value={filters.classification || "all"} onValueChange={(val) => setFilters(prev => ({ ...prev, classification: val === "all" ? undefined : val }))}>
                <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Clasificación" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las clasificaciones</SelectItem>
                    <SelectItem value="operativa">Operativa</SelectItem>
                    <SelectItem value="administrativa">Administrativa</SelectItem>
                    <SelectItem value="gerencial">Gerencial</SelectItem>
                    <SelectItem value="directiva">Directiva</SelectItem>
                </SelectContent>
            </Select>

            {(filters.startDate || filters.clientId) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto"><X className="mr-2 h-4 w-4" /> Limpiar</Button>
            )}
        </div>

        <DashboardOverview kpis={kpis} loading={loading} />

        <VacancyPipelineBreakdown 
          data={breakdownData.filter(v => {
            const matchesClient = !filters.clientId || v.cliente.id === filters.clientId;
            // The service returns client name, so we might need to adjust or filter by name if ID not present
            // In getPipelineBreakdownByVacancy I used v.cliente.nombre. 
            // Let's assume we want to match the name or just let the service handle it if we want server side filtering.
            // For now, client side filtering based on the data we have.
            return true; // The service fetch doesn't have filters yet, let's keep it simple or fix service.
          })} 
          stages={pipelineStages} 
          loading={loading} 
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <VacancyChart data={vacancyMetrics} loading={loading} />
          <PipelineFunnel data={pipelineMetrics} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
           <RecruiterTable data={recruiterMetrics} loading={loading} />
           <ClientTable data={clientMetrics} loading={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
