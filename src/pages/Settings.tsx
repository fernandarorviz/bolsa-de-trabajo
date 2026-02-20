import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, Typography, Form, Input, Button, message, Tabs, Alert, Space } from 'antd';
import { LockOutlined, MailOutlined, SafetyCertificateOutlined, SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleUpdateEmail = async (values: any) => {
    if (values.email === user?.email) {
      message.info('Ingresa un correo electrónico diferente al actual');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: values.email });
      if (error) throw error;
      message.success('Se ha enviado un enlace de confirmación a tu nuevo correo electrónico');
    } catch (error: any) {
      console.error('Error updating email:', error);
      message.error('Error al actualizar el correo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (values: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      message.success('Contraseña actualizada correctamente');
      form.resetFields(['password', 'confirmPassword']);
    } catch (error: any) {
      console.error('Error updating password:', error);
      message.error('Error al actualizar la contraseña: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'account',
      label: <span className="flex items-center gap-2"><MailOutlined /> Cuenta</span>,
      children: (
        <div className="py-4">
          <Card bordered={false} title="Cambiar Correo Electrónico" className="max-w-md">
            <Form
              layout="vertical"
              initialValues={{ email: user?.email }}
              onFinish={handleUpdateEmail}
            >
              <Form.Item
                name="email"
                label="Nuevo Correo Electrónico"
                rules={[
                  { required: true, message: 'Por favor ingresa tu correo' },
                  { type: 'email', message: 'Ingresa un correo válido' }
                ]}
              >
                <Input prefix={<MailOutlined className="text-muted-foreground" />} placeholder="nuevo@correo.com" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Actualizar Correo
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )
    },
    {
      key: 'security',
      label: <span className="flex items-center gap-2"><LockOutlined /> Seguridad</span>,
      children: (
        <div className="py-4">
          <Card bordered={false} title="Actualizar Contraseña" className="max-w-md">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdatePassword}
            >
              <Form.Item
                name="password"
                label="Nueva Contraseña"
                rules={[
                  { required: true, message: 'Por favor ingresa tu nueva contraseña' },
                  { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-muted-foreground" />} placeholder="••••••••" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirmar Contraseña"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Por favor confirma tu contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Las contraseñas no coinciden'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-muted-foreground" />} placeholder="••••••••" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Actualizar Contraseña
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Title level={2}>Configuración</Title>
          <Text type="secondary">Administra tus credenciales de acceso y seguridad de la cuenta</Text>
        </div>

        <Alert
          message="Seguridad de la cuenta"
          description="Te recomendamos utilizar una contraseña única y compleja. Si cambias tu correo electrónico, deberás confirmar el cambio a través de un enlace enviado a tu nueva dirección."
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          className="bg-primary/5 border-primary/20"
        />

        <Tabs 
          defaultActiveKey="account" 
          items={tabItems} 
          className="bg-white p-6 rounded-lg shadow-sm"
        />
      </div>
    </DashboardLayout>
  );
}
