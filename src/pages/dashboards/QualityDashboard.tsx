import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, Row, Col, Skeleton, Typography, Space, Statistic, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const { Text } = Typography;
const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96'];

export default function QualityDashboard() {
  
  // 1. Rejection Reasons
  const { data: rejectionReasons, isLoading: loadingReasons } = useQuery({
    queryKey: ['quality-rejection-reasons'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rejection_reasons');
      if (error) {
         console.warn("RPC get_rejection_reasons missing?", error);
         return [];
      };
      return data;
    }
  });

  // 2. Discard Efficiency
  const { data: discardMetrics, isLoading: loadingDiscard } = useQuery({
    queryKey: ['quality-discard-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_time_to_discard_metrics');
      if (error) {
         console.warn("RPC get_time_to_discard_metrics missing?", error);
         return null;
      };
      const result = data as { promedio_dias_descarte: number; descartes_rapidos_count: number; total_descartados: number }[] | null;
      return result && result[0] ? result[0] : null;
    }
  });

  if (loadingReasons || loadingDiscard) {
    return <QualitySkeleton />;
  }

  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }} className="animate-fade-in">
       
       {/* Metrics Cards */}
       <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card variant="borderless" className="shadow-sm">
               <Statistic
                  title="Tiempo Promedio para Descarte"
                  value={discardMetrics?.promedio_dias_descarte || 0}
                  suffix="días"
               />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card variant="borderless" className="shadow-sm">
               <Statistic
                  title={
                    <Space>
                      Rechazos Rápidos (&lt; 3 días)
                      <Tooltip title="Eficiencia de filtrado temprano">
                        <InfoCircleOutlined size={12} style={{ color: '#8c8c8c' }} />
                      </Tooltip>
                    </Space>
                  }
                  value={discardMetrics?.descartes_rapidos_count || 0}
                  styles={{ content: { color: '#52c41a' } }}
               />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card variant="borderless" className="shadow-sm">
               <Statistic
                  title="Total Descartados"
                  value={discardMetrics?.total_descartados || 0}
                  styles={{ content: { color: '#ff4d4f' } }}
               />
            </Card>
          </Col>
       </Row>

       <Row gutter={[24, 24]}>
          {/* Rejection Reasons Pie Chart */}
          <Col xs={24} lg={12}>
            <Card title="Motivos de Descarte (Pareto)" variant="borderless" className="shadow-sm">
               <div className="h-[400px] w-full">
                 {rejectionReasons && rejectionReasons.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                            data={rejectionReasons}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#1890ff"
                            dataKey="count"
                            nameKey="motivo"
                          >
                            {rejectionReasons.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No hay datos suficientes de descartes.
                    </div>
                 )}
               </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Distribución de Motivos" variant="borderless" className="shadow-sm">
               <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart 
                        data={rejectionReasons || []}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                     >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="motivo" type="category" width={150} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" name="Cantidad" fill="#1890ff" radius={[0, 4, 4, 0]}>
                           {rejectionReasons?.map((entry: any, index: number) => (
                              <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </Card>
          </Col>
       </Row>
    </Space>
  );
}

function QualitySkeleton() {
   return (
      <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
         <Row gutter={[16, 16]}>
            {[1, 2, 3].map(i => (
              <Col span={8} key={i}>
                <Card variant="borderless"><Skeleton active /></Card>
              </Col>
            ))}
         </Row>
         <Row gutter={[24, 24]}>
            <Col span={12}><Card variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card></Col>
            <Col span={12}><Card variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card></Col>
         </Row>
      </Space>
   )
}
