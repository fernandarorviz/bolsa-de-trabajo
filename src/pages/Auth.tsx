import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error('Error al iniciar sesión', {
        description: error.message,
      });
      setIsLoading(false);
    } else {
      // Check user role for redirection
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          toast.success('¡Bienvenido!');
          
          if (roleData?.role === 'cliente') {
            navigate('/portal/dashboard');
          } else {
            navigate('/dashboard');
          }
        } else {
            // Fallback
             navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking role:', error);
        navigate('/dashboard');
      }
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nombre = formData.get('nombre') as string;

    const { error } = await signUp(email, password, nombre);
    
    if (error) {
      toast.error('Error al registrarse', {
        description: error.message,
      });
    } else {
      toast.success('Cuenta creada exitosamente', {
        description: 'Contacta al administrador para asignarte un rol.',
      });
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Bolsa de Trabajo</span>
          </div>
          <p className="text-sidebar-foreground/70 text-lg">
            Sistema de Gestión de Reclutamiento
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-sidebar-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Gestión de Candidatos</h3>
              <p className="text-sidebar-foreground/70">
                Cartera visual para seguir cada candidato en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-sidebar-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Vacantes Organizadas</h3>
              <p className="text-sidebar-foreground/70">
                Control total sobre el ciclo de vida de cada vacante
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-sidebar-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Métricas en Tiempo Real</h3>
              <p className="text-sidebar-foreground/70">
                Analítica detallada para optimizar tu proceso de reclutamiento
              </p>
            </div>
          </div>
        </div>

        <p className="text-sidebar-foreground/50 text-sm">
          © 2026 Bolsa de Trabajo. Todos los derechos reservados.
        </p>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">Bolsa de Trabajo</span>
            </div>
            <CardTitle className="text-2xl">Accede a tu cuenta</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Correo electrónico</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Contraseña</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nombre">Nombre completo</Label>
                    <Input
                      id="signup-nombre"
                      name="nombre"
                      type="text"
                      placeholder="Juan Pérez"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Correo electrónico</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      minLength={6}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
