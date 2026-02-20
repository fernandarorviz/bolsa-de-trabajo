import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, Row, Col, Statistic, Skeleton, Typography, Button, Space } from 'antd';
import { 
  ProjectOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  RightOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

const { Text } = Typography;

interface DashboardFilters {
  dateRange: { from: Date | undefined; to: Date | undefined };
  clientId: string | null;
  clasificacion: string | null;
}

interface ExecutiveDashboardProps {
  filters: DashboardFilters;
}

export default function ExecutiveDashboard({ filters }: ExecutiveDashboardProps) {
  // Fetch KPIs
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['executive-kpis', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_kpis' as any, {
        p_start_date: filters.dateRange.from?.toISOString(),
        p_end_date: filters.dateRange.to?.toISOString(),
        p_cliente_id: filters.clientId === 'all' ? null : filters.clientId,
        p_clasificacion: filters.clasificacion
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch Chart Data (Vacancy trends)
  const { data: trendData } = useQuery({
    queryKey: ['vacancy-trends', filters],
    queryFn: async () => {
       const { data, error } = await supabase.rpc('get_vacancy_metrics' as any, {
         p_periodo: 'month',
         p_clasificacion: filters.clasificacion
       });
       if (error) throw error;
       return data;
    }
  });

  // Fetch Funnel Data
  const { data: funnelData } = useQuery({
    queryKey: ['executive-pipeline-funnel', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pipeline_metrics' as any, {
        p_clasificacion: filters.clasificacion
      });
      if (error) throw error;
      return data;
    }
  });

  // Fetch Classification Data
  const { data: classificationData } = useQuery({
    queryKey: ['vacancy-classifications', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vacancies_by_classification' as any, {
        p_cliente_id: filters.clientId === 'all' ? null : filters.clientId
      });
      if (error) throw error;
      return data as unknown as { clasificacion: string; count: number }[];
    }
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const cards = [
    {
      title: "Vacantes Activas",
      value: kpis?.total_vacantes_activas || 0,
      icon: <ProjectOutlined />,
      color: "#3b82f6",
      desc: "En proceso actual"
    },
    {
      title: "Vacantes Cerradas",
      value: kpis?.total_vacantes_cerradas || 0,
      icon: <CheckCircleOutlined />,
      color: "#22c55e",
      desc: "En el periodo seleccionado"
    },
    {
      title: "Tiempo Promedio (Días)",
      value: kpis?.tiempo_promedio_cobertura || 0,
      icon: <ClockCircleOutlined />,
      color: "#f59e0b",
      desc: "Para cerrar una vacante"
    },
    {
      title: "Candidatos / Vacante",
      value: Math.round(kpis?.candidatos_por_vacante || 0),
      icon: <UserOutlined />,
      color: "#8b5cf6",
      desc: "Promedio de postulaciones"
    }
  ];

  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }} className="animate-fade-in">
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        {cards.map((card, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card variant="borderless" className="h-full shadow-sm">
              <Statistic
                title={<Text type="secondary">{card.title}</Text>}
                value={card.value}
                styles={{ content: { fontWeight: 'bold' } }}
                prefix={React.cloneElement(card.icon as React.ReactElement, { style: { color: card.color, marginRight: 8 } })}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {card.desc}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="Tendencia de Vacantes" variant="borderless" className="shadow-sm">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="periodo_label" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="nuevas" name="Nuevas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cerradas" name="Cerradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title="Eficiencia de Cobertura" 
            variant="borderless" 
            className="shadow-sm"
            extra={
              <Link to="/dashboard?tab=pipeline">
                <Button type="link" icon={<RightOutlined />}>Ver más</Button>
              </Link>
            }
          >
            <div className="h-[300px] w-full">
              {funnelData && funnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={funnelData} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    barSize={32}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="etapa_nombre" 
                      type="category" 
                      width={100} 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" name="Candidatos" radius={[0, 4, 4, 0]}>
                      {funnelData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                      ))}
                      <LabelList dataKey="count" position="right" style={{ fontSize: '12px', fill: 'currentColor' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay datos suficientes
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Vacantes por Clasificación" variant="borderless" className="shadow-sm">
            <div className="h-[300px] w-full">
              {classificationData && classificationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classificationData}
                      dataKey="count"
                      nameKey="clasificacion"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {classificationData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#22c55e', '#eab308', '#ef4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay datos
                </div>
              )}
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
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card variant="borderless">
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card variant="borderless">
            <Skeleton.Button active block style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card variant="borderless">
            <Skeleton.Button active block style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card variant="borderless">
            <Skeleton.Button active block style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
