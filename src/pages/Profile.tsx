import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, Avatar, Typography, Descriptions, Tag, Space, Button, Modal, Select, message } from 'antd';
import { UserOutlined, MailOutlined, CalendarOutlined, SafetyCertificateOutlined, EditOutlined } from '@ant-design/icons';
import type { ClasificacionVacante } from '@/types/ats';

const { Title, Text } = Typography;

export default function Profile() {
  const { profile, role } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialties, setSpecialties] = useState<ClasificacionVacante[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.id) {
       fetchSpecialties();
    }
  }, [profile?.id]);

  const fetchSpecialties = async () => {
    // @ts-ignore
    const { data, error } = await supabase
      .from('profiles')
      .select('especialidad_niveles')
      .eq('id', profile!.id)
      .single();
    // @ts-ignore
    if (data && data.especialidad_niveles) {
      setSpecialties(data.especialidad_niveles as ClasificacionVacante[]);
    }
  };

  const handleSaveSpecialties = async () => {
     setSaving(true);
     // @ts-ignore
     const { error } = await supabase
       .from('profiles')
       .update({ especialidad_niveles: specialties })
       .eq('id', profile!.id);
     
     if (error) {
       message.error('Error al actualizar especialidades');
     } else {
       message.success('Especialidades actualizadas');
       setIsModalOpen(false);
     }
     setSaving(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'red';
      case 'coordinador': return 'orange';
      case 'reclutador': return 'blue';
      case 'ejecutivo': return 'green';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Title level={2}>Mi Perfil</Title>
            <Text type="secondary">Gestiona tu información personal y de cuenta</Text>
          </div>
        </div>

        <Card bordered={false} className="shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8 p-4">
            <Avatar 
              size={120} 
              icon={<UserOutlined />} 
              src={profile?.avatar_url}
              className="bg-primary shadow-md"
            >
              {profile?.nombre ? getInitials(profile.nombre) : 'U'}
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <Space direction="vertical" size={2}>
                <Title level={3} style={{ margin: 0 }}>{profile?.nombre || 'Usuario'}</Title>
                <Tag color={getRoleColor(role)} className="capitalize font-medium">
                  {role || 'Sin rol'}
                </Tag>
                <Text type="secondary" className="flex items-center justify-center md:justify-start gap-2 mt-2">
                  <MailOutlined /> {profile?.email}
                </Text>
              </Space>
            </div>
          </div>
        </Card>

        <Card title="Información General" bordered={false} className="shadow-sm">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered={false}>
            <Descriptions.Item label={<span className="flex items-center gap-2"><UserOutlined /> Nombre</span>}>
              {profile?.nombre}
            </Descriptions.Item>
            <Descriptions.Item label={<span className="flex items-center gap-2"><MailOutlined /> Correo</span>}>
              {profile?.email}
            </Descriptions.Item>
            <Descriptions.Item label={<span className="flex items-center gap-2"><SafetyCertificateOutlined /> Rol de Acceso</span>}>
              <Tag color={getRoleColor(role)} className="capitalize">
                {role}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="flex items-center gap-2"><CalendarOutlined /> Miembro desde</span>}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {(role === 'reclutador' || role === 'coordinador') && (
          <Card title="Especialidad de Reclutamiento" extra={<Button icon={<EditOutlined />} onClick={() => setIsModalOpen(true)}>Editar</Button>} bordered={false} className="shadow-sm">
            <Space wrap>
              {specialties.length > 0 ? specialties.map(s => <Tag key={s} color="blue" className="capitalize">{s}</Tag>) : <Text type="secondary">Sin especialidades definidas</Text>}
            </Space>
          </Card>
        )}

        <Modal title="Editar Especialidades" open={isModalOpen} onOk={handleSaveSpecialties} onCancel={() => setIsModalOpen(false)} confirmLoading={saving}>
          <div className="space-y-4">
            <Text>Selecciona los niveles de vacantes en los que te especializas:</Text>
            <Select 
                mode="multiple" 
                style={{ width: '100%' }} 
                placeholder="Selecciona niveles" 
                value={specialties} 
                onChange={setSpecialties}
                options={[
                  { value: 'operativa', label: 'Operativa' },
                  { value: 'administrativa', label: 'Administrativa' },
                  { value: 'gerencial', label: 'Gerencial' },
                  { value: 'directiva', label: 'Directiva' },
                ]}
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
