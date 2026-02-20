import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  ubicacion: z.string().optional(),
  linkedin_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

interface ApplicationFormProps {
  vacanteId: string;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export default function ApplicationForm({ vacanteId, onSuccess }: ApplicationFormProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      ubicacion: '',
      linkedin_url: '',
    },
  });

  useEffect(() => {
    if (user) {
      checkProfileAndApplication();
    }
  }, [user, vacanteId]);

  const checkProfileAndApplication = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      // 1. Get candidate profile
      const { data: candidate, error: candidateError } = await supabase
        .from('candidatos')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (candidateError) throw candidateError;

      if (candidate) {
        setHasExistingProfile(true);
        form.reset({
          nombre: candidate.nombre || '',
          email: candidate.email || '',
          telefono: candidate.telefono || '',
          ubicacion: candidate.ubicacion || '',
          linkedin_url: candidate.linkedin_url || '',
        });

        // 2. Check for existing application
        const { data: application, error: appError } = await supabase
          .from('postulaciones')
          .select('id')
          .eq('vacante_id', vacanteId)
          .eq('candidato_id', candidate.id)
          .maybeSingle();

        if (appError) throw appError;

        if (application) {
          setAlreadyApplied(true);
        }
      } else {
        // Pre-fill from user metadata if no candidate record yet
        form.setValue('nombre', user.user_metadata?.nombre || '');
        form.setValue('email', user.email || '');
      }
    } catch (error) {
      console.error('Error checking profile/application:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('El archivo es demasiado grande (máximo 5MB)');
        e.target.value = '';
        setFile(null);
        return;
      }
      
      if (!ALLOWED_TYPES.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|doc|docx)$/i)) {
        toast.error('Solo se permiten archivos PDF o Word');
        e.target.value = '';
        setFile(null);
        return;
      }
    }
    
    setFile(selectedFile);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!file && !hasExistingProfile) {
      toast.error('Por favor adjunta tu CV');
      return;
    }

    setSubmitting(true);
    try {
      let finalCvUrl = null;

      // 1. Upload CV if a new one is provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${values.email.replace(/@/g, '_at_')}_${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Error al subir el CV. Intenta nuevamente.');
        }

        const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(filePath);
        finalCvUrl = publicUrl;
      }

      // 2. Submit Application via RPC
      const { data, error } = await supabase.rpc('registrar_postulacion', {
        p_vacante_id: vacanteId,
        p_nombre: values.nombre,
        p_email: values.email,
        p_telefono: values.telefono || null,
        p_ubicacion: values.ubicacion || null,
        p_cv_url: finalCvUrl, // If null, the RPC keeps existing CV for existing candidate
        p_linkedin_url: values.linkedin_url || null
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; postulacion_id?: string };

      if (result.success) {
        toast.success(result.message);
        form.reset();
        setFile(null);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message);
      }

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Error al enviar la postulación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground text-center">
            Cargando tu información...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (alreadyApplied) {
    return (
      <Card className="border-green-100 bg-green-50/50">
        <CardContent className="py-8 flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">¡Ya te has postulado!</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Ya recibimos tu postulación para esta vacante. Puedes ver el estado en tu panel de control.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/candidate/applications'}>
            Ver mis postulaciones
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Postúlate a esta vacante</CardTitle>
        {hasExistingProfile && (
          <p className="text-xs text-muted-foreground">
            Hemos cargado tus datos automáticamente. Revisa que todo esté correcto.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan@ejemplo.com" {...field} disabled={hasExistingProfile} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+52 55..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ubicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad / Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="CDMX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Curriculum Vitae (PDF) {hasExistingProfile ? '' : '*'}</FormLabel>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {hasExistingProfile && !file && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Se usará tu CV actual si no subes uno nuevo.
                  </p>
                )}
              </div>
              {file && <p className="text-xs text-green-600">Archivo seleccionado: {file.name}</p>}
              <p className="text-[10px] text-muted-foreground">Máximo 5MB. PDF, DOC o DOCX.</p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Postulación'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
