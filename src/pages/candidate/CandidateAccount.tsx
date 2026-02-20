import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function CandidateAccount() {
  const { user } = useAuth();
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail === user?.email) {
      toast.info('Ingresa un correo electrónico diferente al actual');
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Se ha enviado un enlace de confirmación a tu nuevo correo electrónico');
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast.error('Error al actualizar el correo', { description: error.message });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Contraseña actualizada correctamente');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error('Error al actualizar la contraseña', { description: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Cuenta</h1>
        <p className="text-muted-foreground">
          Administra tus credenciales de acceso y seguridad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Update Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Correo Electrónico
            </CardTitle>
            <CardDescription>
              Cambia la dirección de correo electrónico vinculada a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Nuevo Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nuevo@correo.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={emailLoading}>
                {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Correo
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Update Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta segura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={passwordLoading}>
                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security Tip */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div className="space-y-1">
              <h4 className="font-semibold text-primary">Seguridad de la cuenta</h4>
              <p className="text-sm text-muted-foreground">
                Te recomendamos utilizar una contraseña única y compleja. Si cambias tu correo electrónico, 
                deberás confirmar el cambio a través de un enlace enviado a tu nueva dirección.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
