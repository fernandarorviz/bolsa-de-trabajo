
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecruiterMetrics {
    reclutador_nombre: string;
    vacantes_asignadas: number;
    vacantes_cerradas: number;
    tiempo_promedio: number;
    tasa_exito: number;
}

interface RecruiterTableProps {
    data: RecruiterMetrics[];
    loading: boolean;
}

export function RecruiterTable({ data, loading }: RecruiterTableProps) {
  return (
    <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
            <CardTitle>Rendimiento de Reclutadores</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reclutador</TableHead>
                            <TableHead className="text-center">Asignadas</TableHead>
                            <TableHead className="text-center">Cerradas</TableHead>
                            <TableHead className="text-center">Tasa Éxito</TableHead>
                            <TableHead className="text-right">Tiempo Promedio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.reclutador_nombre}>
                                <TableCell className="font-medium">{row.reclutador_nombre}</TableCell>
                                <TableCell className="text-center">{row.vacantes_asignadas}</TableCell>
                                <TableCell className="text-center">{row.vacantes_cerradas}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={row.tasa_exito > 70 ? "default" : "secondary"}>
                                        {row.tasa_exito}%
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{row.tiempo_promedio ? `${row.tiempo_promedio} días` : '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
    </Card>
  );
}
