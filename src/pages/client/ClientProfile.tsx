import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClientLayout from '@/components/layout/ClientLayout';
import { UserCircle, Mail, Calendar, Building, Globe, Info } from 'lucide-react';
import type { Cliente } from '@/types/ats';

export default function ClientProfile() {
  const { profile } = useAuth();

  const { data: cliente, isLoading: loadingCliente } = useQuery({
    queryKey: ['client-company', profile?.cliente_id],
    queryFn: async () => {
      if (!profile?.cliente_id) return null;
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', profile.cliente_id)
        .single();
      if (error) throw error;
      return data as Cliente;
    },
    enabled: !!profile?.cliente_id,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-500">Información de tu cuenta de usuario y empresa</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Detalles de tu cuenta de acceso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {profile?.nombre ? getInitials(profile.nombre) : 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{profile?.nombre}</h3>
                    <p className="text-sm text-muted-foreground">Perfil de Cliente</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      Email
                    </label>
                    <p className="text-sm border-b border-transparent pb-1">{profile?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Miembro desde
                    </label>
                    <p className="text-sm">{new Date(profile?.created_at || '').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Datos de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCliente ? (
                  <div className="flex justify-center p-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : cliente ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Razón Social</label>
                        <p className="text-sm font-medium">{cliente.razon_social || cliente.nombre}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Sector / Industria</label>
                        <p className="text-sm font-medium">{cliente.sector || cliente.industria || 'No especificado'}</p>
                      </div>
                      {cliente.rfc && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">RFC</label>
                          <p className="text-sm font-medium">{cliente.rfc}</p>
                        </div>
                      )}
                      {cliente.sitio_web && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Sitio Web
                          </label>
                          <a href={cliente.sitio_web} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                            {cliente.sitio_web}
                          </a>
                        </div>
                      )}
                    </div>

                    {cliente.descripcion && (
                      <div className="space-y-2 pt-4 border-t border-gray-100">
                        <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                          <Info className="w-3.5 h-3.5" /> Acerca de la Empresa
                        </label>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{ __html: cliente.descripcion }}
                        />
                      </div>
                    )}

                    {cliente.comentarios && (
                      <div className="space-y-2 pt-4 border-t border-gray-100">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Comentarios Adicionales</label>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 italic"
                          dangerouslySetInnerHTML={{ __html: cliente.comentarios }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No se encontró información de la empresa.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
