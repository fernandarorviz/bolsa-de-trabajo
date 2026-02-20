import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, Row, Col, Skeleton, Space } from 'antd';
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

export default function RecruiterStatsDashboard() {
  const { data: recruiterMetrics, isLoading } = useQuery({
    queryKey: ['recruiter-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recruiter_metrics');
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }} className="animate-fade-in">
       <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="Rendimiento por Reclutador" variant="borderless" className="shadow-sm">
               <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart 
                        data={recruiterMetrics || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                     >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="reclutador_nombre" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend />
                        <Bar dataKey="vacantes_asignadas" name="Asignadas" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="vacantes_cerradas" name="Cerradas" fill="#52c41a" radius={[4, 4, 0, 0]} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Tiempo Promedio de Cierre" variant="borderless" className="shadow-sm">
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart 
                        data={recruiterMetrics || []}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                     >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="reclutador_nombre" type="category" width={100} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="tiempo_promedio_cierre" name="Días Promedio" fill="#fa8c16" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Tasa de Éxito" variant="borderless" className="shadow-sm">
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart 
                        data={recruiterMetrics || []}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                     >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="reclutador_nombre" type="category" width={100} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(val) => [`${val}%`, 'Tasa Éxito']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="tasa_exito" name="Tasa Éxito %" fill="#722ed1" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </Card>
          </Col>
       </Row>
    </Space>
  );
}

function DashboardSkeleton() {
   return (
      <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
         <Card variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
         <Row gutter={[24, 24]}>
            <Col span={12}><Card variant="borderless"><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
            <Col span={12}><Card variant="borderless"><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
         </Row>
      </Space>
   )
}
