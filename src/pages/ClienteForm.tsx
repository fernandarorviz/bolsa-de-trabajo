import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  Upload,
  X,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Cliente } from '@/types/ats';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function ClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: '',
    industria: '',
    sector: '',
    sitio_web: '',
    descripcion: '',
    comentarios: '',
    contacto_nombre: '',
    contacto_email: '',
    contacto_telefono: '',
    cobranding_activo: false,
    activo: true,
  });

  // Fetch client data if editing
  useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      if (!id) return null;
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        toast.error('Error al cargar cliente');
        navigate('/clientes');
        return null;
      }
      
      setFormData(data);
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
      setLoading(false);
      return data;
    },
    enabled: !!id,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRichTextChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo_url: null }));
  };

  const saveMutation = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      
      const dataToSave = { ...formData };
      
      // Remove properties that shouldn't be sent to update/insert
      if ('id' in dataToSave) delete (dataToSave as any).id;
      if ('created_at' in dataToSave) delete (dataToSave as any).created_at;
      if ('updated_at' in dataToSave) delete (dataToSave as any).updated_at;
      if ('profiles' in dataToSave) delete (dataToSave as any).profiles;
      if ('profiles_count' in dataToSave) delete (dataToSave as any).profiles_count;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${dataToSave.nombre?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('client-logos')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('client-logos')
          .getPublicUrl(filePath);
          
        dataToSave.logo_url = publicUrl;
      }

      if (id) {
        const { error } = await supabase
          .from('clientes')
          .update(dataToSave)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert(dataToSave as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(id ? 'Cliente actualizado' : 'Cliente creado');
      navigate('/clientes');
    },
    onError: (error: Error) => {
      toast.error('Error', { description: error.message });
    },
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              {id ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {id ? 'Modifica los datos del cliente' : 'Registra un nuevo cliente en la plataforma'}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={saveMutation.mutate} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-6 border-b pb-6">
                <h3 className="text-lg font-medium">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre || ''}
                      onChange={handleInputChange}
                      required
                      disabled={saveMutation.isPending}
                      placeholder="Ej. Acme Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industria">Industria</Label>
                    <Input
                      id="industria"
                      name="industria"
                      value={formData.industria || ''}
                      onChange={handleInputChange}
                      placeholder="Ej. Tecnología"
                      disabled={saveMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Sector</Label>
                    <Input
                      id="sector"
                      name="sector"
                      value={formData.sector || ''}
                      onChange={handleInputChange}
                      placeholder="Ej. Desarrollo de Software"
                      disabled={saveMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sitio_web">Sitio Web</Label>
                    <Input
                      id="sitio_web"
                      name="sitio_web"
                      value={formData.sitio_web || ''}
                      onChange={handleInputChange}
                      placeholder="https://www.ejemplo.com"
                      disabled={saveMutation.isPending}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <div className="bg-white">
                    <ReactQuill
                      theme="snow"
                      value={formData.descripcion || ''}
                      onChange={(value) => handleRichTextChange('descripcion', value)}
                      placeholder="Breve descripción de la empresa y sus actividades..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-b pb-6">
                <h3 className="text-lg font-medium">Identidad Corporativa</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Logo de la Empresa</Label>
                    <div className="flex items-center gap-6 p-4 border rounded-lg bg-slate-50">
                      <Avatar className="w-24 h-24 border-2 border-white shadow-sm">
                        <AvatarImage src={logoPreview || ''} className="object-cover" />
                        <AvatarFallback className="bg-slate-200">
                          <Building2 className="w-10 h-10 text-slate-400" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="relative cursor-pointer"
                            disabled={saveMutation.isPending}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Seleccionar Archivo
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              accept="image/*"
                              onChange={handleLogoChange}
                              disabled={saveMutation.isPending}
                            />
                          </Button>
                          {logoPreview && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeLogo}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={saveMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Se recomienda una imagen cuadrada de al menos 400x400px en formato PNG o JPG.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border">
                    <Switch
                      id="cobranding_activo"
                      checked={formData.cobranding_activo || false}
                      onCheckedChange={(checked) => handleSwitchChange('cobranding_activo', checked)}
                      disabled={saveMutation.isPending}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="cobranding_activo">Activar Co-branding</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite utilizar el logo del cliente en los portales de vacantes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-b pb-6">
                <h3 className="text-lg font-medium">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contacto_nombre">Nombre del Contacto</Label>
                    <Input
                      id="contacto_nombre"
                      name="contacto_nombre"
                      value={formData.contacto_nombre || ''}
                      onChange={handleInputChange}
                      placeholder="Persona de contacto principal"
                      disabled={saveMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contacto_email">Email del Contacto</Label>
                    <Input
                      id="contacto_email"
                      name="contacto_email"
                      type="email"
                      value={formData.contacto_email || ''}
                      onChange={handleInputChange}
                      placeholder="correo@empresa.com"
                      disabled={saveMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contacto_telefono">Teléfono</Label>
                    <Input
                      id="contacto_telefono"
                      name="contacto_telefono"
                      value={formData.contacto_telefono || ''}
                      onChange={handleInputChange}
                      placeholder="+52 (55) 1234 5678"
                      disabled={saveMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Configuración Interna</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comentarios">Comentarios Adicionales</Label>
                    <div className="bg-white">
                      <ReactQuill
                        theme="snow"
                        value={formData.comentarios || ''}
                        onChange={(value) => handleRichTextChange('comentarios', value)}
                        placeholder="Notas internas solo visibles para administradores..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border">
                    <Switch
                      id="activo"
                      checked={formData.activo ?? true}
                      onCheckedChange={(checked) => handleSwitchChange('activo', checked)}
                      disabled={saveMutation.isPending}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="activo">Cliente Activo</Label>
                      <p className="text-sm text-muted-foreground">
                        Desactiva para ocultar este cliente de las listas de selección.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/clientes')}
                  disabled={saveMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="lg" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    id ? 'Guardar Cambios' : 'Crear Cliente'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
