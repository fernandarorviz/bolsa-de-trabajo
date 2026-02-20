import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, Row, Col, Skeleton, Typography, Space, Statistic } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const { Text } = Typography;

export default function ClientStatsDashboard() {
  const { data: clientMetrics, isLoading } = useQuery({
    queryKey: ['client-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_client_metrics');
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }} className="animate-fade-in">
       <Card title="Top Clientes por Volumen" variant="borderless" className="shadow-sm">
          <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                   data={clientMetrics || []}
                   layout="vertical"
                   margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                   <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                   <XAxis type="number" hide />
                   <YAxis dataKey="cliente_nombre" type="category" width={120} axisLine={false} tickLine={false} />
                   <RechartsTooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     cursor={{fill: 'transparent'}}
                   />
                   <Legend />
                   <Bar dataKey="vacantes_totales" name="Total Vacantes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                   <Bar dataKey="vacantes_activas" name="Vacantes Activas" fill="#22c55e" radius={[0, 4, 4, 0]} />
                   <Bar dataKey="candidatos_totales" name="Candidatos" fill="#faad14" radius={[0, 4, 4, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
       </Card>

       <Row gutter={[16, 16]}>
          {clientMetrics?.map((client: any) => (
             <Col xs={24} sm={12} lg={8} key={client.cliente_nombre}>
                <Card 
                  title={<Text strong className="truncate">{client.cliente_nombre}</Text>} 
                  className="hover:shadow-md transition-shadow" 
                  variant="borderless"
                >
                   <Space orientation="vertical" style={{ width: '100%' }}>
                      <div className="flex justify-between">
                         <Text type="secondary" className="text-xs">Vacantes Totales</Text>
                         <Text strong>{client.vacantes_totales}</Text>
                      </div>
                      <div className="flex justify-between">
                         <Text type="secondary" className="text-xs">Activas</Text>
                         <Text strong style={{ color: '#52c41a' }}>{client.vacantes_activas}</Text>
                      </div>
                      <div className="flex justify-between">
                         <Text type="secondary" className="text-xs">Candidatos</Text>
                         <Text strong style={{ color: '#faad14' }}>{client.candidatos_totales}</Text>
                      </div>
                   </Space>
                </Card>
             </Col>
          ))}
       </Row>
    </Space>
  );
}

function DashboardSkeleton() {
   return (
      <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
         <Card variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
         <Row gutter={[16, 16]}>
            {[1, 2, 3].map(i => (
              <Col span={8} key={i}>
                <Card variant="borderless"><Skeleton active /></Card>
              </Col>
            ))}
         </Row>
      </Space>
   )
}
