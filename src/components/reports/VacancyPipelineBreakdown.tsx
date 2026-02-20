
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface Stage {
    id: string;
    nombre: string;
    orden: number;
    color: string;
}

interface VacancyData {
    id: string;
    titulo: string;
    cliente: string;
    reclutador: string;
    counts: Record<string, number>;
}

interface VacancyPipelineBreakdownProps {
    data: VacancyData[];
    stages: Stage[];
    loading: boolean;
}

export function VacancyPipelineBreakdown({ data, stages, loading }: VacancyPipelineBreakdownProps) {
  return (
    <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Desglose de Cartera por Vacante</CardTitle>
                <CardDescription>Visualiza cuántos candidatos hay en cada etapa para todas las vacantes activas.</CardDescription>
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Info className="h-5 w-5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p>Usa esta tabla para identificar vacantes con muchos candidatos "Postulados" (sin evaluar) o cuellos de botella en etapas específicas.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <ScrollArea className="w-full whitespace-nowrap">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Vacante / Cliente</TableHead>
                                <TableHead className="min-w-[120px]">Reclutador</TableHead>
                                {stages.map((stage) => (
                                    <TableHead key={stage.id} className="text-center min-w-[100px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <div 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: stage.color }}
                                            />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">{stage.nombre}</span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={stages.length + 3} className="text-center py-10 text-muted-foreground italic">
                                        No hay vacantes activas para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => {
                                    const totalCandidates = Object.values(row.counts).reduce((a, b) => a + b, 0);
                                    return (
                                        <TableRow key={row.id}>
                                            <TableCell className="sticky left-0 bg-background z-10 font-medium">
                                                <div className="flex flex-col">
                                                    <span>{row.titulo}</span>
                                                    <span className="text-[10px] text-muted-foreground">{row.cliente}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{row.reclutador}</TableCell>
                                            {stages.map((stage, idx) => {
                                                const count = row.counts[stage.id] || 0;
                                                const isFirstStage = idx === 0;
                                                return (
                                                    <TableCell key={stage.id} className="text-center">
                                                        {count > 0 ? (
                                                            <Badge 
                                                                variant={isFirstStage ? "destructive" : "secondary"}
                                                                className={cn(
                                                                    "h-6 w-6 rounded-full p-0 flex items-center justify-center mx-auto",
                                                                    !isFirstStage && count > 0 && "bg-primary/10 text-primary border-primary/20",
                                                                    isFirstStage && "animate-pulse-subtle"
                                                                )}
                                                            >
                                                                {count}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground/30">-</span>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                            <TableCell className="text-right font-bold">
                                                {totalCandidates}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            )}
        </CardContent>
    </Card>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
