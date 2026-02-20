import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientAuth() {
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
      toast.success('¡Bienvenido al Portal de Clientes!');
      navigate('/portal/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nombre = formData.get('nombre') as string;

    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          nombre,
          role: 'cliente'
        },
      },
    });
    
    if (error) {
      toast.error('Error al registrarse', {
        description: error.message,
      });
    } else {
      toast.success('Cuenta de cliente creada exitosamente', {
        description: 'Bienvenido. Ya puedes acceder a tu panel de control.',
      });
      navigate('/portal/dashboard');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left side - Branding / Info */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-900 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold italic tracking-tight">Bolsa de Trabajo <span className="text-indigo-400 font-normal">Business</span></span>
          </div>
          <h1 className="text-4xl font-extrabold mb-6 leading-tight">
            Gestione sus vacantes con eficiencia y claridad
          </h1>
          <p className="text-indigo-100 text-lg max-w-md opacity-90">
            Acceda a su portal corporativo para publicar vacantes, revisar candidatos y dar seguimiento a sus procesos de reclutamiento.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Panel de Control</h3>
              <p className="text-indigo-200/70 text-sm">Visualice el estado de todas sus posiciones activas</p>
            </div>
          </div>
        </div>
        
        <div className="text-indigo-400 text-sm">
          © 2026 Bolsa de Trabajo Business Solutions.
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white border-t-4 border-indigo-500">
          <CardHeader className="text-center pb-2">
            <div className="md:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-900 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-indigo-900 italic">Bolsa de Trabajo Business</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Portal de Clientes</CardTitle>
            <CardDescription className="text-slate-500">
              Gestione el talento de su organización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Registrarse</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-700">Correo corporativo</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="nombre@empresa.com"
                      className="border-slate-200 focus:ring-indigo-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="signin-password">Contraseña</Label>
                      <button type="button" className="text-xs text-indigo-600 hover:underline">¿Olvidó su contraseña?</button>
                    </div>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="border-slate-200 focus:ring-indigo-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6" disabled={isLoading}>
                    {isLoading ? 'Accediendo...' : 'Entrar al Portal'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nombre">Nombre de contacto</Label>
                    <Input
                      id="signup-nombre"
                      name="nombre"
                      type="text"
                      placeholder="Ej. María García"
                      className="border-slate-200 focus:ring-indigo-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Correo corporativo</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="nombre@empresa.com"
                      className="border-slate-200 focus:ring-indigo-500"
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
                      className="border-slate-200 focus:ring-indigo-500"
                      minLength={6}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6" disabled={isLoading}>
                    {isLoading ? 'Creando cuenta...' : 'Registrar Empresa'}
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
