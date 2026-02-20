import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Upload, FileText, Trash2 } from 'lucide-react';
import { PDFViewerDialog } from '@/components/candidates/PDFViewerDialog';

import type { Candidato } from '@/types/ats';

export default function CandidateProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for form fields
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    ubicacion: '',
    resumen_profesional: '',
    linkedin_url: '',
    habilidades: '' // Comma separated string for UI
  });
  
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCandidateProfile();
    }
  }, [user]);

  const fetchCandidateProfile = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('candidatos')
        .select('*')
        .eq('user_id', user?.id as string)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error fetching profile:', error);
        toast.error('Error al cargar perfil');
        return;
      }

      if (data) {
        const candidate = data as unknown as Candidato;
        setFormData({
          nombre: candidate.nombre || '',
          telefono: candidate.telefono || '',
          ubicacion: candidate.ubicacion || '',
          resumen_profesional: candidate.resumen_profesional || '',
          linkedin_url: candidate.linkedin_url || '',
          habilidades: Array.isArray(candidate.habilidades) ? candidate.habilidades.join(', ') : ''
        });
        setCvUrl(candidate.cv_url);
      } else {
        // If no candidate record exists yet (should be created by trigger, but just in case)
        // We might want to pre-fill from auth meta
        setFormData(prev => ({
          ...prev,
          nombre: user?.user_metadata?.nombre || ''
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploadingCv(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL (or signed URL if private, but we set public bucket for simplicity in reading)
      // Actually our migration said "public: true" for bucket but then restricted by policy?
      // Wait, migration said: VALUES ('cvs', 'cvs', true). So it is public.
      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);

      setCvUrl(publicUrl);
      toast.success('CV subido exitosamente');
    } catch (error: any) {
      toast.error('Error al subir archivo', { description: error.message });
    } finally {
      setUploadingCv(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const habilidadesArray = formData.habilidades
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const isComplete = !!(
        formData.nombre?.trim() &&
        formData.telefono?.trim() &&
        formData.ubicacion?.trim() &&
        cvUrl
      );

      const updateData = {
        nombre: formData.nombre,
        telefono: formData.telefono,
        ubicacion: formData.ubicacion,
        resumen_profesional: formData.resumen_profesional,
        linkedin_url: formData.linkedin_url,
        habilidades: habilidadesArray,
        cv_url: cvUrl,
        perfil_completo: isComplete,
        user_id: user?.id, // Ensure link
        updated_at: new Date().toISOString()
      };

      // Upsert based on user_id? 'candidatos' PK is UUID not user_id. 
      // But we have a unique constraint or we can find by user_id first.
      
      // First check if exists
      const { data: existing } = await supabase
        .from('candidatos')
        .select('id')
        .eq('user_id', user?.id)
        .single();
        
      let error;
      
      if (existing) {
        const { error: updateError } = await supabase
          .from('candidatos')
          .update(updateData)
          .eq('user_id', user?.id);
        error = updateError;
      } else {
        // Insert new (email is required and unique)
        const { error: insertError } = await supabase
          .from('candidatos')
          .insert({
            ...updateData,
            email: user?.email // Required
          });
        error = insertError;
      }

      if (error) throw error;
      
      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar perfil', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil Profesional</h1>
        <p className="text-muted-foreground">
          Mantén tu información actualizada para mejorar tus oportunidades.
        </p>
      </div>

      {!(formData.nombre?.trim() && formData.telefono?.trim() && formData.ubicacion?.trim() && cvUrl) && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Perfil Incompleto</h3>
                <p className="text-sm text-amber-800">
                  Para ser considerado como candidato oficial y aparecer en las búsquedas de los reclutadores, por favor completa los siguientes campos:
                </p>
                <ul className="mt-2 text-sm text-amber-800 list-disc list-inside">
                  {!formData.nombre?.trim() && <li>Nombre completo</li>}
                  {!formData.telefono?.trim() && <li>Teléfono de contacto</li>}
                  {!formData.ubicacion?.trim() && <li>Ubicación (Ciudad, País)</li>}
                  {!cvUrl && <li>Subir tu CV en formato PDF</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {formData.nombre?.trim() && formData.telefono?.trim() && formData.ubicacion?.trim() && cvUrl && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Save className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Perfil Completo</h3>
                <p className="text-sm text-green-800">
                  ¡Excelente! Tu perfil cuenta con toda la información necesaria para ser postulado a vacantes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Tus datos de contacto y presentación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input 
                      id="nombre" 
                      name="nombre" 
                      value={formData.nombre} 
                      onChange={handleInputChange} 
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input 
                      id="telefono" 
                      name="telefono" 
                      value={formData.telefono} 
                      onChange={handleInputChange} 
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input 
                      id="ubicacion" 
                      name="ubicacion" 
                      value={formData.ubicacion} 
                      onChange={handleInputChange} 
                      placeholder="Ciudad, País"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input 
                      id="linkedin_url" 
                      name="linkedin_url" 
                      value={formData.linkedin_url} 
                      onChange={handleInputChange} 
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resumen_profesional">Resumen Profesional</Label>
                  <Textarea 
                    id="resumen_profesional" 
                    name="resumen_profesional" 
                    value={formData.resumen_profesional} 
                    onChange={handleInputChange} 
                    placeholder="Cuéntanos brevemente sobre tu experiencia y objetivos..."
                    className="h-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="habilidades">Habilidades (separadas por coma)</Label>
                  <Input 
                    id="habilidades" 
                    name="habilidades" 
                    value={formData.habilidades} 
                    onChange={handleInputChange} 
                    placeholder="React, Node.js, Ventas, Excel..."
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / CV Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Curriculum Vitae</CardTitle>
              <CardDescription>
                Sube tu CV en formato PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cvUrl ? (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">CV Actual</p>
                      <button 
                        onClick={() => {
                          if (cvUrl?.toLowerCase().endsWith('.pdf')) {
                            setPdfViewerOpen(true);
                          } else {
                            window.open(cvUrl || '', '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Ver archivo
                      </button>
                      <PDFViewerDialog 
                        isOpen={pdfViewerOpen}
                        onOpenChange={setPdfViewerOpen}
                        pdfUrl={cvUrl}
                        candidateName={formData.nombre}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                  No has subido ningún CV
                </div>
              )}

              <div className="relative">
                <Button variant="outline" className="w-full" disabled={uploadingCv}>
                   {uploadingCv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                   {cvUrl ? 'Reemplazar CV' : 'Subir CV'}
                </Button>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={uploadingCv}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Máximo 5MB. PDF o Word (.doc, .docx).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
