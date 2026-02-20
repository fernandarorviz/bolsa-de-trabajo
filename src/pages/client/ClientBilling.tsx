import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Save, Loader2, Building } from 'lucide-react';

interface FiscalDataFormData {
  rfc: string;
  razon_social: string;
  direccion_fiscal: string;
  regimen_fiscal: string;
  cp: string;
  constancia_fiscal_url?: string;
}

export default function ClientBilling() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // We need to fetch the client ID associated with this profile
  // Since profile.cliente_id might not be typed yet in AuthContext or Supabase types fully, we cast or fetch safely
  const { data: clientData, isLoading } = useQuery({
    queryKey: ['client-data', profile?.id],
    enabled: !!profile?.cliente_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', profile.cliente_id)
        .single();
      
      if (error) throw error;
      // We cast the data to allow for the new fields that might not be in the generated types yet
      return data as any;
    }
  });

  const { register, handleSubmit, reset } = useForm<FiscalDataFormData>();

  // Initialize form with data
  useEffect(() => {
    if (clientData) {
      reset({
        rfc: clientData.rfc || '',
        razon_social: clientData.razon_social || '',
        direccion_fiscal: clientData.direccion_fiscal || '',
        regimen_fiscal: clientData.regimen_fiscal || '',
        cp: clientData.cp || '',
        constancia_fiscal_url: clientData.constancia_fiscal_url || ''
      });
    }
  }, [clientData, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: FiscalDataFormData) => {
      // @ts-ignore
      if (!profile?.cliente_id) throw new Error("No client ID found");
      
      const { error } = await supabase
        .from('clientes')
        .update({
          rfc: data.rfc,
          razon_social: data.razon_social,
          direccion_fiscal: data.direccion_fiscal,
          regimen_fiscal: data.regimen_fiscal,
          cp: data.cp,
          // We are not handling file upload in this iteration, just text fields
        } as any)
        // @ts-ignore
        .eq('id', profile.cliente_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-data'] });
      toast.success('Datos fiscales actualizados correctamente');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating fiscal data:', error);
      toast.error('Error al actualizar los datos');
    }
  });

  const onSubmit = (data: FiscalDataFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  // If no client associated, show warning
  // @ts-ignore
  if (!profile?.cliente_id) {
    return (
      <ClientLayout>
         <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building className="w-12 h-12 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Sin Datos de Empresa</h2>
            <p className="text-gray-500 max-w-sm mt-2">
              Tu usuario no está asociado a una empresa cliente. Por favor contacta a soporte.
            </p>
         </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Datos Fiscales</h1>
            <p className="text-gray-500">Administra la información de facturación de tu empresa</p>
          </div>
          {!isEditing && (
             <Button onClick={() => setIsEditing(true)}>
                Editar Información
             </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de Facturación</CardTitle>
            <CardDescription>
              Estos datos se utilizarán para generar tus facturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razón Social</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="razon_social"
                      className="pl-9"
                      placeholder="Empresa S.A. de C.V."
                      disabled={!isEditing}
                      {...register('razon_social', { required: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="rfc"
                      className="pl-9"
                      placeholder="XAXX010101000"
                      disabled={!isEditing}
                      {...register('rfc', { required: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="direccion_fiscal">Dirección Fiscal</Label>
                  <Input
                    id="direccion_fiscal"
                    placeholder="Calle, Número, Colonia, Ciudad, Estado"
                    disabled={!isEditing}
                    {...register('direccion_fiscal')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cp">Código Postal</Label>
                  <Input
                    id="cp"
                    placeholder="00000"
                    disabled={!isEditing}
                    {...register('cp')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regimen_fiscal">Régimen Fiscal</Label>
                  <Input
                    id="regimen_fiscal"
                    placeholder="601 - General de Ley Personas Morales"
                    disabled={!isEditing}
                    {...register('regimen_fiscal')}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                        setIsEditing(false);
                        // Reset to original data
                        if (clientData) {
                            reset({
                                rfc: clientData.rfc || '',
                                razon_social: clientData.razon_social || '',
                                direccion_fiscal: clientData.direccion_fiscal || '',
                                regimen_fiscal: clientData.regimen_fiscal || '',
                                cp: clientData.cp || '',
                                constancia_fiscal_url: clientData.constancia_fiscal_url || ''
                            });
                        }
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
