import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  Linkedin,
  Briefcase,
  GraduationCap,
  Wrench,
  History,
  ExternalLink,
  ShieldAlert,
  MessageCircle,
  BrainCircuit,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Candidato, Postulacion, Vacante, EtapaPipeline } from '@/types/ats'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { PDFViewerDialog } from './PDFViewerDialog'

interface CandidateProfileDrawerProps {
  candidateId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PostulacionConVacante = Postulacion & {
  vacantes: Pick<Vacante, 'titulo'>
  etapas_pipeline: Pick<EtapaPipeline, 'nombre' | 'color'>
}

export function CandidateProfileDrawer({
  candidateId,
  open,
  onOpenChange,
}: CandidateProfileDrawerProps) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const { data: candidate, isLoading: loadingCandidate } = useQuery({
    queryKey: ['candidate-full', candidateId],
    queryFn: async () => {
      if (!candidateId) return null
      const { data, error } = await supabase
        .from('candidatos')
        .select('*')
        .eq('id', candidateId)
        .single()
      if (error) throw error
      return data as Candidato
    },
    enabled: !!candidateId && open,
  })

  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ['candidate-applications', candidateId],
    queryFn: async () => {
      if (!candidateId) return []
      const { data, error } = await supabase
        .from('postulaciones')
        .select(`
          *,
          vacantes (titulo),
          etapas_pipeline (nombre, color)
        `)
        .eq('candidato_id', candidateId)
        .order('fecha_postulacion', { ascending: false })
      if (error) throw error
      return data as PostulacionConVacante[]
    },
    enabled: !!candidateId && open,
  })

  if (!candidateId) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left border-b pb-6 mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
              {candidate?.nombre?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              {candidate?.nombre}
              <div className="flex items-center gap-3 mt-1 font-normal text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {candidate?.email}
                </span>
                {candidate?.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {candidate.telefono}
                    <a
                      href={`https://wa.me/${candidate.telefono.replace(/\D/g, '').length === 10 ? '52' : ''}${candidate.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 p-1 rounded-full hover:bg-green-100 text-green-600 transition-colors"
                      title="Contactar por WhatsApp"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </span>
                )}
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {loadingCandidate ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Status Alert */}
            {!candidate?.perfil_completo && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900 border-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <AlertTitle className="font-bold">Perfil Incompleto</AlertTitle>
                <AlertDescription className="text-amber-800 text-xs mt-1">
                  Este prospecto aún no cuenta con la información mínima requerida:
                  <ul className="list-disc list-inside mt-1">
                    {!candidate?.nombre && <li>Nombre</li>}
                    {!candidate?.telefono && <li>Teléfono</li>}
                    {!candidate?.ubicacion && <li>Ubicación</li>}
                    {!candidate?.cv_url && <li>Currículum Vitae</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {/* Quick Actions & Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ubicación</p>
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {candidate?.ubicacion || 'No especificada'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {candidate?.cv_url && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => {
                        if (candidate.cv_url?.toLowerCase().endsWith('.pdf')) {
                          setPdfViewerOpen(true)
                        } else {
                          window.open(candidate.cv_url, '_blank', 'noopener,noreferrer')
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Currículum
                      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                    </Button>
                    <PDFViewerDialog 
                      isOpen={pdfViewerOpen}
                      onOpenChange={setPdfViewerOpen}
                      pdfUrl={candidate.cv_url}
                      candidateName={candidate.nombre}
                    />
                  </>
                )}
                {candidate?.linkedin_url && (
                  <Button variant="outline" size="sm" asChild className="w-full justify-start">
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-2 text-blue-600" />
                      LinkedIn
                      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Resume Summary */}
            {candidate?.resumen_profesional && (
              <section className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                  <FileText className="w-4 h-4" />
                  Resumen Profesional
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {candidate.resumen_profesional}
                </p>
              </section>
            )}

            {/* Experience */}
            <section className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                <Briefcase className="w-4 h-4" />
                Experiencia Laboral
              </h3>
              {Array.isArray(candidate?.experiencia) && (candidate.experiencia as any[]).length > 0 ? (
                <div className="space-y-6">
                  {(candidate.experiencia as any[]).map((exp, i) => (
                    <div key={i} className="relative pl-6 border-l-2 border-muted last:border-0 pb-2">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                      <p className="font-medium text-sm">{exp.cargo}</p>
                      <p className="text-sm text-primary">{exp.empresa}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exp.fecha_inicio} - {exp.actual ? 'Presente' : exp.fecha_fin}
                      </p>
                      {exp.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2">{exp.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No se ha registrado experiencia laboral.</p>
              )}
            </section>

            {/* Education */}
            <section className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                <GraduationCap className="w-4 h-4" />
                Educación
              </h3>
              {Array.isArray(candidate?.educacion) && (candidate.educacion as any[]).length > 0 ? (
                <div className="space-y-4">
                  {(candidate.educacion as any[]).map((edu, i) => (
                    <div key={i} className="space-y-1">
                      <p className="font-medium text-sm">{edu.titulo}</p>
                      <p className="text-sm">{edu.institucion}</p>
                      <p className="text-xs text-muted-foreground">
                        {edu.fecha_fin ? `Finalizado en ${edu.fecha_fin}` : 'En curso'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No se ha registrado educación.</p>
              )}
            </section>

            {/* Skills */}
            {candidate?.habilidades && candidate.habilidades.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                  <Wrench className="w-4 h-4" />
                  Habilidades
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.habilidades.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Application History */}
            <section className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                <History className="w-4 h-4" />
                Historial de Postulaciones
              </h3>
              {loadingApps ? (
                <div className="flex justify-center p-4">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : applications && applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">{app.vacantes?.titulo}</p>
                        <Badge 
                          style={{ 
                            backgroundColor: app.descartado ? '#ef4444' : app.etapas_pipeline?.color,
                            color: 'white'
                          }}
                          className="text-[10px]"
                        >
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">
                          Postulado el {format(new Date(app.fecha_postulacion), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                        {app.ia_compatibility_score !== undefined && app.ia_compatibility_score !== null && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] h-5",
                              app.ia_compatibility_score >= 80 ? "bg-green-50 text-green-700 border-green-200" :
                              app.ia_compatibility_score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            )}
                          >
                            <BrainCircuit className="w-3 h-3 mr-1" />
                            {app.ia_compatibility_score}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Este candidato no tiene postulaciones registradas.</p>
              )}
            </section>

            {/* Internal Notes */}
            {candidate?.notas && (
              <section className="space-y-3 pt-6 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground">Notas Internas</h3>
                <div className="bg-muted/50 p-4 rounded-lg text-sm italic">
                  {candidate.notas}
                </div>
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
