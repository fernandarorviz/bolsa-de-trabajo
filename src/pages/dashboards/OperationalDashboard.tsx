import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Badge, 
  Button, 
  List, 
  Typography, 
  Timeline, 
  Skeleton, 
  Space,
  Flex
} from 'antd';
import { 
  ProjectOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

interface DashboardFilters {
  dateRange: { from: Date | undefined; to: Date | undefined };
  clientId: string | null;
  clasificacion: string | null;
}

interface OperationalDashboardProps {
  filters: DashboardFilters;
}

export default function OperationalDashboard({ filters }: OperationalDashboardProps) {
  const { profile } = useAuth();

  // 1. Fetch My KPIs
  const { data: myKpis, isLoading: loadingKpis } = useQuery({
    queryKey: ['my-kpis', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase.rpc('get_dashboard_kpis', {
        p_reclutador_id: profile.id,
        p_clasificacion: filters.clasificacion
      });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // 2. Fetch My Active Vacancies (Kanban-like summary)
  const { data: myVacancies, isLoading: loadingVacancies } = useQuery({
    queryKey: ['my-vacancies', profile?.id, filters.clasificacion],
    queryFn: async () => {
      if (!profile?.id) return [];
      let query = supabase
        .from('vacantes')
        .select(`
          id, 
          titulo, 
          prioridad, 
          estado,
          created_at,
          postulaciones (count)
        `)
        .eq('reclutador_id', profile.id)
        .eq('estado', 'publicada');
      
      if (filters.clasificacion) {
        query = query.eq('clasificacion', filters.clasificacion as any);
      }

      const { data, error } = await query.order('prioridad', { ascending: false }); // Urgent first
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // 3. Fetch Upcoming Interviews
  const { data: upcomingInterviews, isLoading: loadingInterviews } = useQuery({
    queryKey: ['my-interviews', profile?.id],
    queryFn: async () => {
       if (!profile?.id) return [];
       const { data, error } = await supabase
         .from('entrevistas')
         .select(`
           id,
           fecha_inicio,
           tipo_entrevista,
           candidato:candidatos(nombre),
           vacante:vacantes(titulo)
         `)
         .gte('fecha_inicio', new Date().toISOString())
         .order('fecha_inicio', { ascending: true })
         .limit(5); // Next 5 interviews

       if (error) {
         console.warn("Could not fetch interviews", error);
         return [];
       }
       return data;
    },
    enabled: !!profile?.id
  });


  if (loadingKpis || loadingVacancies || loadingInterviews) {
    return <OperationalSkeleton />;
  }

  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }} className="animate-fade-in">
       {/* Personal Welcome & KPIs */}
       <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card variant="borderless" className="h-full shadow-sm" style={{ background: '#f0f7ff' }}>
              <Statistic
                title="Mis Vacantes Activas"
                value={myKpis?.total_vacantes_activas || 0}
                prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>

          <Col xs={24} md={18}>
            <Card title="Resumen de Actividad" variant="borderless" className="shadow-sm">
               <Row gutter={16}>
                 <Col span={8}>
                    <Statistic 
                      title="Candidatos en Proceso" 
                      value={Math.round((myKpis?.candidatos_por_vacante || 0) * (myKpis?.total_vacantes_activas || 0))} 
                    />
                 </Col>
                 <Col span={8}>
                    <Statistic 
                      title="Vacantes Cerradas" 
                      value={myKpis?.total_vacantes_cerradas || 0} 
                      styles={{ content: { color: '#52c41a' } }}
                    />
                 </Col>
                 <Col span={8}>
                    <Statistic 
                      title="Tiempo Promedio" 
                      value={myKpis?.tiempo_promedio_cobertura || 0} 
                      suffix="días"
                    />
                 </Col>
               </Row>
            </Card>
          </Col>
       </Row>

       <Row gutter={[24, 24]}>
          {/* Priority Vacancies List */}
          <Col xs={24} lg={16}>
            <Card 
              title={<Space><ProjectOutlined /> Mis Prioridades</Space>} 
              variant="borderless" 
              className="shadow-sm"
              extra={<Link to="/vacantes"><Button type="link">Ver todas</Button></Link>}
              styles={{ body: { padding: '0 24px' } }}
            >
              <div style={{ height: 400, overflowY: 'auto' }} className="py-4">
                {myVacancies && myVacancies.length > 0 ? (
                  myVacancies.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-4 border-b last:border-0">
                      <Flex vertical gap={4}>
                        <Space>
                          <Text strong>{v.titulo}</Text>
                          {v.prioridad === 'urgente' && <Badge status="error" text="Urgente" />}
                        </Space>
                        <Space size="middle">
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {new Date(v.created_at).toLocaleDateString()}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <UserOutlined style={{ marginRight: 4 }} />
                            {v.postulaciones[0]?.count || 0} candidatos
                          </Text>
                        </Space>
                      </Flex>
                      <Link to={`/vacantes/${v.id}`}>
                        <Button size="small">Gestionar</Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <Text type="secondary">No tienes vacantes activas asignadas.</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          {/* Upcoming Interviews / Schedule */}
          <Col xs={24} lg={8}>
            <Card 
              title={<Space><CalendarOutlined /> Próximas Entrevistas</Space>} 
              variant="borderless" 
              className="shadow-sm"
            >
              <div style={{ height: 400, overflowY: 'auto', padding: '12px 4px' }}>
                {upcomingInterviews?.length === 0 ? (
                   <div style={{ textAlign: 'center', paddingTop: 60 }}>
                      <Text type="secondary">No hay entrevistas próximas.</Text>
                      <br />
                      <Link to="/agenda">
                        <Button type="link">Ir a la agenda</Button>
                      </Link>
                   </div>
                ) : (
                  <Timeline
                    mode="start"
                    items={upcomingInterviews?.map((ent) => ({
                      title: new Date(ent.fecha_inicio).toLocaleString([], {hour: '2-digit', minute:'2-digit'}),
                      content: (
                        <div>
                          <Text strong>{ent.candidato?.nombre || 'Candidato'}</Text>
                          <div style={{ fontSize: 12 }}>{ent.vacante?.titulo}</div>
                          <Badge count={ent.tipo_entrevista} style={{ backgroundColor: '#f0f0f0', color: '#666', marginTop: 4 }} />
                        </div>
                      ),
                      color: '#1890ff',
                    }))}
                  />
                )}
              </div>
            </Card>
          </Col>
       </Row>
    </Space>
  );
}

function OperationalSkeleton() {
  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
       <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card variant="borderless"><Skeleton active avatar /></Card>
          </Col>
          <Col xs={24} md={18}>
            <Card variant="borderless"><Skeleton active /></Card>
          </Col>
       </Row>
       <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card variant="borderless"><Skeleton active paragraph={{ rows: 8 }} /></Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card variant="borderless"><Skeleton active paragraph={{ rows: 8 }} /></Card>
          </Col>
       </Row>
    </Space>
  )
}
