
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardKPIs } from "@/services/analytics";
import { Briefcase, CheckCircle, Clock, Users, XCircle } from "lucide-react";

interface DashboardOverviewProps {
  kpis: DashboardKPIs | null;
  loading: boolean;
}

export function DashboardOverview({ kpis, loading }: DashboardOverviewProps) {
  if (loading || !kpis) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium h-4 bg-gray-200 rounded w-1/2"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vacantes Activas</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.total_vacantes_activas}</div>
          <p className="text-xs text-muted-foreground">En proceso actualmente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vacantes Cerradas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.total_vacantes_cerradas}</div>
          <p className="text-xs text-muted-foreground">Total histórico</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.tiempo_promedio_cobertura || 0} dias</div>
          <p className="text-xs text-muted-foreground">De apertura a cierre</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Rechazo</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(kpis.tasa_rechazo_promedio || 0)}%</div>
          <p className="text-xs text-muted-foreground">Candidatos descartados</p>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Candidatos / Vacante</CardTitle>
          <Users className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(kpis.candidatos_por_vacante || 0)}</div>
          <p className="text-xs text-muted-foreground">Promedio de postulaciones</p>
        </CardContent>
      </Card>
    </div>
  );
}
