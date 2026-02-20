
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PipelineFunnelProps {
  data: { etapa_nombre: string; count: number; color: string }[];
  loading: boolean;
}

export function PipelineFunnel({ data, loading }: PipelineFunnelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel de Conversión</CardTitle>
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
        <CardTitle>Funnel de Conversión</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" hide />
            <YAxis 
                type="category" 
                dataKey="etapa_nombre" 
                width={100} 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
            />
            <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
                dataKey="count" 
                fill="#3b82f6" 
                radius={[0, 4, 4, 0]} 
                barSize={30}
                background={{ fill: '#f3f4f6' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
