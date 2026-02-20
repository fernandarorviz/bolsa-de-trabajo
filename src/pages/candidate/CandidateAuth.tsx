import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CandidateAuth() {
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
      toast.success('¡Bienvenido!');
      // Redirección manejada por AuthContext o useEffect en App, 
      // pero forzamos navegación a perfil si es necesario
      navigate('/candidato/perfil');
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nombre = formData.get('nombre') as string;

    // Aquí podríamos pasar { role: 'candidato' } si modificamos signUp para aceptar metadata
    // Por ahora, asumimos que el trigger link_candidate_on_signup manejará la asignación si no mandamos metadata,
    // o el usuario tendrá que ser 'candidato' por defecto en alguna lógica.
    // VERIFICAR: El plan decía "Sets { role: 'candidato' } on signup".
    // Necesitamos asegurarnos que signUp soporte esto o hacerlo manualmente.
    // AuthContext.tsx actual: signUp(email, password, nombre) -> options: { data: { nombre } }
    
    // Si queremos enviar role, necesitamos modificar AuthContext o usar supabase directo aquí.
    // Usaremos supabase directo para este caso especial o asumiremos que el backend lo maneja.
    // Dado que AuthContext es una abstracción, lo ideal sería extenderla, pero por simplicidad
    // y para no romper otros flujos, podemos usar el cliente supabase importado si es necesario.
    // PERO: AuthContext usa `supabase` de `@/integrations/supabase/client`.
    
    // Vamos a intentar usar signUp del context y confiar en que el Trigger asignará rol
    // O mejor, modificar AuthContext para aceptar metadata extra es lo más limpio.
    // SIN EMBARGO, para no tocar AuthContext ahora mismo, usaremos el signUp existente.
    // EL TRIGGER link_candidate_on_signup BUSCA `raw_user_meta_data->>'role' = 'candidato'`.
    // Si no lo enviamos, el trigger no creará el candidato automáticamente si no existe por email.
    
    // DECISIÓN: Modificaré AuthContext después para soportar metadata genérico.
    // Por ahora, en este archivo, importaré supabase y haré el signUp manual para asegurar el rol.
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          nombre,
          role: 'candidato'
        },
      },
    });
    
    if (error) {
      toast.error('Error al registrarse', {
        description: error.message,
      });
    } else {
      toast.success('Cuenta creada exitosamente', {
        description: 'Bienvenido a Bolsa de Trabajo. Completa tu perfil.',
      });
      navigate('/candidato/perfil');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Branding / Info */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Bolsa de Trabajo</span>
          </div>
          <h1 className="text-4xl font-bold mb-6">
            Impulsa tu carrera profesional
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Crea tu perfil, aplica a vacantes exclusivas y da seguimiento a tus procesos de selección en un solo lugar.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Perfil Profesional</h3>
              <p className="text-blue-200 text-sm">Destaca tus habilidades y experiencia</p>
            </div>
          </div>
          
          {/* Add more features/benefits here */}
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="md:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-900">Bolsa de Trabajo</span>
            </div>
            <CardTitle className="text-2xl">Portal de Candidatos</CardTitle>
            <CardDescription>
              Accede para gestionar tus postulaciones
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
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
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
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
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
