import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layout/PublicLayout';
import ApplicationForm from '@/components/public/ApplicationForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Briefcase, Clock, DollarSign, Building, MessageCircle } from 'lucide-react';
import { Vacante } from '@/types/ats';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareJob } from '@/components/vacancies/ShareJob';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  useEffect(() => {
    if (id) fetchVacante(id);
  }, [id]);

  const fetchVacante = async (vacanteId: string) => {
    try {
      const { data, error } = await supabase
        .from('vacantes')
        .select(`
          *,
          cliente:clientes(nombre, contacto_telefono)
        `)
        .eq('id', vacanteId)
        .eq('estado', 'publicada')
        .single();

      if (error) throw error;
      setVacante(data as unknown as Vacante);
    } catch (error) {
      console.error('Error fetching vacante:', error);
      navigate('/empleos'); // Redirect if not found or error
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Salario a convenir';
    if (min && !max) return `Desde $${min.toLocaleString()}`;
    if (!min && max) return `Hasta $${max.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  const handleWhatsAppContact = () => {
    if (!vacante) return;
    
    // Use client phone if available, otherwise a default could be used
    const rawPhone = vacante.cliente?.contacto_telefono || "525500000000"; // Fallback to a placeholder or generic number
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
    
    const message = encodeURIComponent(`Hola, tengo dudas sobre la vacante de ${vacante.titulo} que vi en el portal.`);
    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto space-y-8">
            <Skeleton className="h-8 w-24" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
      </PublicLayout>
    );
  }

  if (!vacante) return null;

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto">
        <Button 
            variant="ghost" 
            className="mb-6 pl-0 hover:bg-transparent text-gray-500 hover:text-gray-900"
            onClick={() => navigate('/empleos')}
        >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a vacantes
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Job Details */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900">{vacante.titulo}</h1>
                {vacante.prioridad === 'urgente' && (
                    <Badge variant="destructive">Urgente</Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">
                      {(vacante as any).empresa_oculta ? 'Confidencial' : (vacante.cliente?.nombre || 'Confidencial')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{vacante.ubicacion || 'Remoto'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Briefcase className="w-4 h-4" />
                   <span className="capitalize">{vacante.tipo_contrato?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                   <DollarSign className="w-4 h-4" />
                   <span>{formatSalary(vacante.salario_min, vacante.salario_max)}</span>
                </div>
                 <div className="flex items-center gap-2">
                   <Clock className="w-4 h-4" />
                   <span>Publicada el {new Date(vacante.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Descripción del puesto</h3>
              {vacante.descripcion ? (
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: vacante.descripcion }}
                />
              ) : (
                <p className="text-muted-foreground italic">Sin descripción</p>
              )}
            </div>

            <Separator />
            
            <ShareJob jobId={vacante.id} jobTitle={vacante.titulo} />
          </div>

          {/* Right Column: Application Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
                {applicationSuccess ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Briefcase className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-green-900 mb-2">¡Postulación Enviada!</h3>
                        <p className="text-green-700">
                            Hemos recibido tu información correctamente. Te contactaremos pronto si tu perfil se ajusta a lo que buscamos.
                        </p>
                        <Button 
                            className="mt-6 w-full" 
                            variant="outline"
                            onClick={() => navigate('/empleos')}
                        >
                            Ver más vacantes
                        </Button>
                    </div>
                ) : (
                    <ApplicationForm 
                        vacanteId={vacante.id} 
                        onSuccess={() => setApplicationSuccess(true)} 
                    />
                )}

                <Button 
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" 
                  onClick={handleWhatsAppContact}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Dudas sobre la vacante
                </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
