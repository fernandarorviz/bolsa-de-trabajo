
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { HiringMatrix } from "@/components/reports/HiringMatrix";
import { ClientParetoTable } from "@/components/reports/ClientParetoTable";
import { analyticsService } from "@/services/analytics";
import { Button } from "@/components/ui/button";
import { Download, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function HiringClientReport() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{id: string, nombre: string}[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [hiringMetrics, setHiringMetrics] = useState<{clientMatrix: any[], pareto: any[]}>({ 
    clientMatrix: [], 
    pareto: [] 
  });

  const fetchFilterOptions = async () => {
    try {
        const { data: clientsData, error } = await supabase
            .from('clientes')
            .select('id, nombre')
            .order('nombre');
        if (error) throw error;
        setClients(clientsData || []);
    } catch (error) {
        console.error("Error loading filters:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getHiringMetrics(selectedYear);
      setHiringMetrics({
        clientMatrix: data.clientMatrix,
        pareto: data.pareto
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchData();
  }, [selectedYear]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up pb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Contrataciones por Cliente</h2>
            <p className="text-muted-foreground">
              Análisis mensual y distribución Pareto de contrataciones
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Select 
                value={selectedYear.toString()} 
                onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
                <SelectTrigger className="w-[120px] bg-background">
                    <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>

                </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.info("Exportando...")}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <HiringMatrix 
                  data={hiringMetrics.clientMatrix} 
                  year={selectedYear} 
                  loading={loading} 
                  title="CONTRATACIONES POR CLIENTE"
                  firstColumnLabel="CLIENTE"
                />
            </div>
            <div className="lg:col-span-1">
                <ClientParetoTable data={hiringMetrics.pareto} year={selectedYear} loading={loading} />
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
