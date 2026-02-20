import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, Skeleton, Tooltip, Typography, Space, Row, Col } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

const { Text } = Typography;

export default function PipelineDashboard() {
  
  // 1. Fetch Funnel Metrics (Counts per Stage)
  const { data: funnelData, isLoading: loadingFunnel } = useQuery({
    queryKey: ['pipeline-funnel'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pipeline_metrics');
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch Velocity Metrics (Avg Days per Stage)
  const { data: velocityData, isLoading: loadingVelocity } = useQuery({
    queryKey: ['pipeline-velocity'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pipeline_velocity');
      if (error) {
         console.warn("Error fetching velocity, maybe RPC missing?", error);
         return [];
      }
      return data;
    }
  });

  if (loadingFunnel || loadingVelocity) {
    return <PipelineSkeleton />;
  }

  // Calculate Conversion Rates for Funnel
  const funnelWithRates = funnelData?.map((stage: any, index: number, arr: any[]) => {
    const prevCount = index === 0 ? stage.count : arr[index - 1].count;
    const conversionRate = prevCount > 0 ? ((stage.count / arr[0].count) * 100).toFixed(1) : 0;
    const dropOff = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : 0;
    
    return {
      ...stage,
      conversionRate, // Global conversion relative to start
      dropOff // Step conversion relative to previous
    };
  });

  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }} className="animate-fade-in">
       <Row gutter={[24, 24]}>
          
          {/* Funnel Chart */}
          <Col span={24}>
            <Card 
              title="Cartera de Selección Global" 
              variant="borderless" 
              className="shadow-sm"
              extra={
                <Tooltip title="Visualización del flujo de candidatos a través de las etapas del pipeline.">
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              }
            >
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={funnelWithRates} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    barSize={40}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="etapa_nombre" 
                      type="category" 
                      width={150} 
                      tick={{fontSize: 12}}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip 
                      cursor={{fill: 'transparent'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                              <Text strong style={{ display: 'block', marginBottom: 4 }}>{data.etapa_nombre}</Text>
                              <Text>Candidatos: {data.count}</Text>
                              <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                   {data.conversionRate}% del total inicial
                                </Text>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {funnelWithRates?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#1890ff'} />
                      ))}
                      <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: '#666' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Velocity Chart */}
          <Col span={24}>
            <Card 
              title="Tiempos Promedio por Etapa" 
              variant="borderless" 
              className="shadow-sm"
              extra={
                <Tooltip title="Mide el tiempo desde que un candidato entra a una etapa hasta que pasa a la siguiente o el proceso termina.">
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              }
            >
              <div className="h-[350px] w-full">
                {velocityData && velocityData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={velocityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="etapa_nombre" 
                          tick={{fontSize: 12}} 
                          interval={0} 
                          angle={-15} 
                          textAnchor="end" 
                          height={60}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          label={{ value: 'Días', angle: -90, position: 'insideLeft', style: { fill: '#8c8c8c' } }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip 
                           contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                           formatter={(value: number) => [`${value} días`, 'Promedio']}
                        />
                        <Bar dataKey="promedio_dias" name="Días Promedio" fill="#faad14" radius={[4, 4, 0, 0]} barSize={50} />
                     </BarChart>
                   </ResponsiveContainer>
                ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                      No hay suficientes datos históricos para calcular tiempos.
                   </div>
                )}
              </div>
            </Card>
          </Col>
          
       </Row>
    </Space>
  );
}

function PipelineSkeleton() {
   return (
      <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
         <Card variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
         <Card variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
      </Space>
   )
}
