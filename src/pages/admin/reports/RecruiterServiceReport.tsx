
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { HiringMatrix } from "@/components/reports/HiringMatrix";
import { analyticsService } from "@/services/analytics";
import { Button } from "@/components/ui/button";
import { Download, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function RecruiterServiceReport() {
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState<{id: string, nombre: string}[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<any[]>([]);

  const fetchFilterOptions = async () => {
    try {
        const { data: recruitersData, error } = await supabase
            .from('profiles')
            .select('id, nombre');
        if (error) throw error;
        setRecruiters(recruitersData || []);
    } catch (error) {
        console.error("Error loading filters:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const hiringData = await analyticsService.getHiringMetrics(selectedYear);
      setData(hiringData.recruiterMatrix);
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
            <h2 className="text-3xl font-bold tracking-tight">Servicios por Analista</h2>
            <p className="text-muted-foreground">
              Desglose mensual de contrataciones por reclutador
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

        <HiringMatrix 
          data={data} 
          year={selectedYear} 
          loading={loading} 
          title="SERVICIOS POR ANALISTA"
          firstColumnLabel="RECLUTADOR"
        />
      </div>
    </DashboardLayout>
  );
}
