import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Select, Button, Tabs, Space, Typography } from 'antd';
import { PlusOutlined, ExportOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import ExecutiveDashboard from './dashboards/ExecutiveDashboard';
import OperationalDashboard from './dashboards/OperationalDashboard';
import PipelineDashboard from './dashboards/PipelineDashboard';
import ClientStatsDashboard from './dashboards/ClientStatsDashboard';
import RecruiterStatsDashboard from './dashboards/RecruiterStatsDashboard';
import QualityDashboard from './dashboards/QualityDashboard';
import { subDays, startOfMonth, startOfYear } from 'date-fns';

const { Title } = Typography;

export default function Dashboard() {
  const { profile, role } = useAuth();
  
  // Determine Default Tab based on Role
  const getDefaultTab = () => {
    if (role === 'admin' || role === 'ejecutivo') return 'executive';
    if (role === 'reclutador') return 'operational';
    return 'executive';
  };

  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for Global Filters
  const [period, setPeriod] = useState('month');
  const [clientId, setClientId] = useState<string>('all');
  const [clasificacion, setClasificacion] = useState<string>('all');
  
  // Tab handling with URL sync
  const currentTab = searchParams.get('tab') || getDefaultTab();

  const handleTabChange = (value: string) => {
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), tab: value });
  };

  // Calculate Date Ranges based on period
  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return { from: subDays(now, 7), to: now };
      case 'month':
        return { from: startOfMonth(now), to: now };
      case 'quarter':
        return { from: subDays(now, 90), to: now };
      case 'year':
        return { from: startOfYear(now), to: now };
      default:
        return { from: undefined, to: undefined };
    }
  };

  const filters = {
    dateRange: getDateRange(),
    clientId: clientId === 'all' ? null : clientId,
    clasificacion: clasificacion === 'all' ? null : clasificacion
  };


  // Fetch Clients for Filter
  const { data: clients } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  const tabItems = [
    ...(role === 'admin' || role === 'ejecutivo' || role === 'coordinador' 
      ? [{ key: 'executive', label: 'Ejecutivo', children: <ExecutiveDashboard filters={filters} /> }] 
      : []),
    { key: 'operational', label: 'Operativo', children: <OperationalDashboard filters={filters} /> },
    { key: 'pipeline', label: 'Cartera', children: <PipelineDashboard /> },
    ...(role === 'admin' || role === 'coordinador' ? [
      { key: 'clients', label: 'Clientes', children: <ClientStatsDashboard /> },
      { key: 'recruiters', label: 'Reclutadores', children: <RecruiterStatsDashboard /> },
      { key: 'quality', label: 'Calidad', children: <QualityDashboard /> }
    ] : [])
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b pb-6">
          <Space wrap size="middle" className="grow">
            {/* Client Filter */}
            <Select 
              value={clientId} 
              onChange={setClientId}
              className="w-full md:w-[220px]"
              placeholder="Todos los clientes"
            >
              <Select.Option value="all">Todos los clientes</Select.Option>
              {clients?.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.nombre}</Select.Option>
              ))}
            </Select>

            {/* Classification Filter */}
            <Select
              value={clasificacion}
              onChange={setClasificacion}
              className="w-full md:w-[180px]"
              placeholder="Clasificación"
            >
              <Select.Option value="all">Todas las clasificaciones</Select.Option>
              <Select.Option value="operativa">Operativa</Select.Option>
              <Select.Option value="administrativa">Administrativa</Select.Option>
              <Select.Option value="gerencial">Gerencial</Select.Option>
              <Select.Option value="directiva">Directiva</Select.Option>
            </Select>

            {/* Period Filter */}
            <Select 
              value={period} 
              onChange={setPeriod}
              className="w-full md:w-[180px]"
              placeholder="Periodo"
            >
              <Select.Option value="week">Últimos 7 días</Select.Option>
              <Select.Option value="month">Este Mes</Select.Option>
              <Select.Option value="quarter">Último Trimestre</Select.Option>
              <Select.Option value="year">Este Año</Select.Option>
            </Select>
          </Space>
          
          <Space>
            <Button icon={<ExportOutlined />} href="/empleos" target="_blank">
              Ver Bolsa
            </Button>
            <Link to="/vacantes/nueva">
              <Button type="primary" icon={<PlusOutlined />}>
                Nueva Vacante
              </Button>
            </Link>
          </Space>
        </div>

        {/* Dashboard Tabs */}
        <Tabs 
          activeKey={currentTab} 
          onChange={handleTabChange} 
          items={tabItems}
          className="antd-dashboard-tabs"
        />
      </div>
    </DashboardLayout>
  );
}
