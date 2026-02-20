
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientMetrics {
    cliente_nombre: string;
    vacantes_totales: number;
    vacantes_activas: number;
    candidatos_totales: number;
}

interface ClientTableProps {
    data: ClientMetrics[];
    loading: boolean;
}

export function ClientTable({ data, loading }: ClientTableProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
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
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-center">Vacantes</TableHead>
                            <TableHead className="text-center">Activas</TableHead>
                            <TableHead className="text-right">Candidatos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.cliente_nombre}>
                                <TableCell className="font-medium truncate max-w-[120px]" title={row.cliente_nombre}>{row.cliente_nombre}</TableCell>
                                <TableCell className="text-center">{row.vacantes_totales}</TableCell>
                                <TableCell className="text-center">{row.vacantes_activas}</TableCell>
                                <TableCell className="text-right">{row.candidatos_totales}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
    </Card>
  );
}
