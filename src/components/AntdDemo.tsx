import React from 'react';
import { Button, Card, Col, Row, Statistic, Table, Tag, Space, Typography, ConfigProvider, theme } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const AntdDemo: React.FC = () => {
  const dataSource = [
    {
      key: '1',
      name: 'Juan Pérez',
      role: 'Desarrollador Senior',
      status: 'Entrevista',
      date: '2026-02-06',
    },
    {
      key: '2',
      name: 'María García',
      role: 'Diseñadora UX',
      status: 'Seleccionado',
      date: '2026-02-05',
    },
    {
      key: '3',
      name: 'Carlos Rodríguez',
      role: 'Project Manager',
      status: 'Descartado',
      date: '2026-02-04',
    },
  ];

  const columns = [
    {
      title: 'Candidato',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Space><UserOutlined /><Text strong>{text}</Text></Space>,
    },
    {
      title: 'Puesto',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = status === 'Seleccionado' ? 'green' : status === 'Entrevista' ? 'blue' : 'volcano';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Acción',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">Ver perfil</Button>
          <Button type="link">Contactar</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
        <Row gutter={16}>
          <Col span={24}>
            <Title level={2}>Ant Design 6.2.3 Demo</Title>
            <Text type="secondary">Esta es una demostración de los componentes de Ant Design integrados en la plataforma.</Text>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Card variant="borderless">
              <Statistic
                title="Vacantes Activas"
                value={12}
                precision={0}
                styles={{ content: { color: '#3f8600' } }}
                prefix={<ArrowUpOutlined />}
                suffix=""
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card variant="borderless">
              <Statistic
                title="Candidatos Nuevos"
                value={45}
                precision={0}
                styles={{ content: { color: '#cf1322' } }}
                prefix={<ArrowDownOutlined />}
                suffix=""
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card variant="borderless">
              <Statistic
                title="Entrevistas hoy"
                value={5}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Candidatos Recientes" extra={<Button type="primary">Ver todos</Button>}>
          <Table dataSource={dataSource} columns={columns} pagination={false} />
        </Card>

        <Card title="Próximos Pasos">
          <Space>
            <Button type="primary" icon={<FileTextOutlined />}>Nueva Vacante</Button>
            <Button>Configuración</Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default AntdDemo;
