
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VacancyChartProps {
    data: { periodo_label: string; nuevas: number; cerradas: number }[];
    loading: boolean;
}

export function VacancyChart({ data, loading }: VacancyChartProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Vacantes</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Histórico de Vacantes</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="periodo_label" 
                            tick={{ fontSize: 12 }} 
                            tickLine={false} 
                            axisLine={false}
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                        <Bar name="Nuevas" dataKey="nuevas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar name="Cerradas" dataKey="cerradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
