import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Link as LinkIcon, FileText, Plus, X as XIcon, Trash2, Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { interviewsService } from '@/services/interviews';
import type { Entrevista, EntrevistaFormData, TipoEntrevista, ModalidadEntrevista } from '@/types/ats';
import { toast } from 'sonner';

const interviewSchema = z.object({
  vacante_id: z.string().min(1, 'La vacante es requerida'),
  candidato_id: z.string().min(1, 'El candidato es requerido'),
  etapa_pipeline_id: z.string().min(1, 'La etapa es requerida'),
  tipo_entrevista: z.enum(['interna', 'cliente', 'tecnica', 'seguimiento'] as const),
  modalidad: z.enum(['presencial', 'online'] as const),
  // Make these optional/union based on mode effectively
  fecha_inicio: z.string().optional(),
  hora_inicio: z.string().optional(),
  duracion: z.number().min(15, 'Mínimo 15 minutos'),
  link_reunion: z.string().optional(),
  ubicacion: z.string().optional(),
  notas: z.string().optional(),
  mode: z.enum(['schedule', 'propose']),
  proposed_slots: z.array(z.object({
    fecha: z.string(),
    hora: z.string(),
  })).optional(),
}).refine((data) => {
    if (data.mode === 'schedule') {
        return !!data.fecha_inicio && !!data.hora_inicio;
    }
    if (data.mode === 'propose') {
        return data.proposed_slots && data.proposed_slots.length > 0;
    }
    return true;
}, {
    message: "Requerido",
    path: ["fecha_inicio"] // Crude error mapping
});

interface InterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postulacion: {
    vacante_id: string;
    candidato_id: string;
    etapa_id: string;
    candidato: { nombre: string; email: string };
  };
  onSuccess: () => void;
  interviewToEdit?: Entrevista;
  isClient?: boolean;
}

export function InterviewModal({ open, onOpenChange, postulacion, onSuccess, interviewToEdit, isClient }: InterviewModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof interviewSchema>>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      vacante_id: postulacion.vacante_id,
      candidato_id: postulacion.candidato_id,
      etapa_pipeline_id: postulacion.etapa_id,
      notas: '',
      mode: 'schedule',
      proposed_slots: [{ fecha: format(new Date(), 'yyyy-MM-dd'), hora: '10:00' }],
      tipo_entrevista: isClient ? 'cliente' : 'interna',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "proposed_slots" as any, // Type cast for dynamic field
  });

  useEffect(() => {
    if (interviewToEdit) {
      const isProposal = interviewToEdit.estado === 'propuesta';
      const start = new Date(interviewToEdit.fecha_inicio);
      const end = new Date(interviewToEdit.fecha_fin);
      const duration = isProposal ? 30 : (end.getTime() - start.getTime()) / (1000 * 60);

      // Parse slots if any
      const slots = interviewToEdit.proposed_slots?.map(s => ({
          fecha: format(new Date(s.start), 'yyyy-MM-dd'),
          hora: format(new Date(s.start), 'HH:mm')
      })) || [{ fecha: format(new Date(), 'yyyy-MM-dd'), hora: '10:00' }];

      form.reset({
        vacante_id: interviewToEdit.vacante_id,
        candidato_id: interviewToEdit.candidato_id,
        etapa_pipeline_id: interviewToEdit.etapa_pipeline_id,
        tipo_entrevista: interviewToEdit.tipo_entrevista,
        modalidad: interviewToEdit.modalidad,
        fecha_inicio: format(start, 'yyyy-MM-dd'),
        hora_inicio: format(start, 'HH:mm'),
        duracion: duration,
        link_reunion: interviewToEdit.link_reunion || '',
        ubicacion: interviewToEdit.ubicacion || '',
        notas: interviewToEdit.notas || '',
        mode: isProposal ? 'propose' : 'schedule',
        proposed_slots: slots,
      });
    } else {
        form.reset({
            vacante_id: postulacion.vacante_id,
            candidato_id: postulacion.candidato_id,
            etapa_pipeline_id: postulacion.etapa_id,
            notas: '',
            mode: 'schedule',
            proposed_slots: [{ fecha: format(new Date(), 'yyyy-MM-dd'), hora: '10:00' }],
            tipo_entrevista: isClient ? 'cliente' : 'interna'
        });
    }
  }, [interviewToEdit, postulacion, open, form, isClient]);

  const onSubmit = async (values: z.infer<typeof interviewSchema>) => {
    setLoading(true);
    try {
      let payload: EntrevistaFormData;

      if (values.mode === 'schedule') {
          const startDateTime = new Date(`${values.fecha_inicio}T${values.hora_inicio}`);
          const endDateTime = new Date(startDateTime.getTime() + values.duracion * 60000);
          
          payload = {
            vacante_id: values.vacante_id,
            candidato_id: values.candidato_id,
            etapa_pipeline_id: values.etapa_pipeline_id,
            tipo_entrevista: values.tipo_entrevista,
            modalidad: values.modalidad,
            fecha_inicio: startDateTime,
            fecha_fin: endDateTime,
            link_reunion: values.link_reunion,
            ubicacion: values.ubicacion,
            notas: values.notas,
          };
      } else {
          // Proposal mode
          // We still need a valid date for DB constraint/not null, pick the first slot
           const firstSlot = values.proposed_slots?.[0];
           if (!firstSlot) return; 

           const startDateTime = new Date(`${firstSlot.fecha}T${firstSlot.hora}`);
           const endDateTime = new Date(startDateTime.getTime() + values.duracion * 60000);

           const slots = values.proposed_slots?.map(s => {
               const start = new Date(`${s.fecha}T${s.hora}`);
               const end = new Date(start.getTime() + values.duracion * 60000);
               return { start, end };
           });

           payload = {
            vacante_id: values.vacante_id,
            candidato_id: values.candidato_id,
            etapa_pipeline_id: values.etapa_pipeline_id,
            tipo_entrevista: values.tipo_entrevista,
            modalidad: values.modalidad,
            fecha_inicio: startDateTime, // Placeholder, will be proposal status
            fecha_fin: endDateTime,
            link_reunion: values.link_reunion,
            ubicacion: values.ubicacion,
            notas: values.notas,
            proposed_slots: slots
          };
      }

      // If creating in propose mode, we might need to manually set status if the service doesn't infer it.
      // But typically we should handle status in the service or just let it be. 
      // Actually the DB defaults to something but we constrained it.
      // Wait, the service just inserts. We need to tell the DB to use 'propuesta'.
      // The `Entrevista` type has `estado` but `EntrevistaFormData` doesn't explicitly ask for it usually.
      // We might need to adjust the service or payload.
      // Let's assume for now we act as if we are creating an interview.
      // Ideally we'd pass 'estado' to the service. For now, let's rely on the fact that if proposed_slots is present, we might want to flag it?
      // No, let's update service to accept optional status or infer it.
      // Update: I didn't update service to accept status. I should update service quickly to allow passing status or infer it if proposed_slots.length > 0
      
      // Let's modify the payload sent to service to implicitly handle this by adding a status field to the insert if needed. 
      // But `EntrevistaFormData` doesn't have `estado`.
      // I'll cast it for now in the service call inside this file? No, better to update the service.
      // Actually, I can just modify the service call here if I cast it.
      
      if (interviewToEdit) {
        // If editing, we preserve ID.
        // If switching from proposal to schedule, we should clear status to scheduled?
        // The service update keeps what we pass.
        // If mode is propose, we want status = 'propuesta'.
        const updatePayload = {
            ...payload,
            estado: values.mode === 'propose' ? 'propuesta' : 'programada'
        } as any; // Cast to bypass strict type if needed, or update types.
        
        await interviewsService.update(interviewToEdit.id, updatePayload);
        toast.success('Entrevista actualizada');
      } else {
        // Create
        const createPayload = {
            ...payload,
            estado: values.mode === 'propose' ? 'propuesta' : 'programada'
        } as any;
        await interviewsService.create(createPayload);
        toast.success(values.mode === 'propose' ? 'Propuesta enviada' : 'Entrevista programada');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar la entrevista');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!interviewToEdit) return;
    
    const reason = window.prompt('Opcional: Motivo de la cancelación');
    if (reason === null) return; // User clicked Cancel in prompt

    setLoading(true);
    try {
      await interviewsService.cancel(interviewToEdit.id, reason);
      toast.success('Entrevista cancelada y notificaciones enviadas');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al cancelar la entrevista');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!interviewToEdit) return;

    if (window.confirm('¿Estás seguro que deseas eliminar permanentemente esta entrevista? Esta acción no se puede deshacer.')) {
      setLoading(true);
      try {
        await interviewsService.delete(interviewToEdit.id);
        toast.success('Entrevista eliminada permanentemente');
        onSuccess();
        onOpenChange(false);
      } catch (error) {
        console.error(error);
        toast.error('Error al eliminar la entrevista');
      } finally {
        setLoading(false);
      }
    }
  };

  const mode = form.watch('mode');
  const modalidad = form.watch('modalidad');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{interviewToEdit ? 'Editar Entrevista' : 'Agendar Entrevista'}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Candidato: {postulacion.candidato.nombre}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <Tabs value={mode} onValueChange={(v) => form.setValue('mode', v as 'schedule' | 'propose')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="schedule">Agendar Definitive</TabsTrigger>
                    <TabsTrigger value="propose">Proponer Opciones</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_entrevista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isClient}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="interna">Interna</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="tecnica">Técnica</SelectItem>
                        <SelectItem value="seguimiento">Seguimiento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modalidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione modalidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="presencial">Presencial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
                control={form.control}
                name="duracion"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Duración (minutos)</FormLabel>
                    <FormControl>
                    <Input type="number" min="15" step="15" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            {mode === 'schedule' ? (
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="fecha_inicio"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Fecha</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-9" {...field} />
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="hora_inicio"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Hora</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="time" className="pl-9" {...field} />
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
            ) : (
                <div className="space-y-3 border p-3 rounded-md bg-muted/20">
                    <div className="flex items-center justify-between">
                        <FormLabel>Opciones de Horario (Máx 3)</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ fecha: format(new Date(), 'yyyy-MM-dd'), hora: '10:00' })}
                            disabled={fields.length >= 3}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar
                        </Button>
                    </div>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 animate-fade-in">
                            <FormField
                                control={form.control}
                                name={`proposed_slots.${index}.fecha`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        {index === 0 && <FormLabel className="text-xs">Fecha</FormLabel>}
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`proposed_slots.${index}.hora`}
                                render={({ field }) => (
                                    <FormItem className="w-32">
                                        {index === 0 && <FormLabel className="text-xs">Hora</FormLabel>}
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mb-0.5"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                            >
                                <XIcon className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <FormMessage>{form.formState.errors.proposed_slots?.message}</FormMessage>
                </div>
            )}

            {modalidad === 'online' ? (
              <FormField
                control={form.control}
                name="link_reunion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link de Reunión</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="https://meet.google.com/..." className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
               <FormField
                control={form.control}
                name="ubicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Sala de juntas 1..." className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles adicionales..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              {interviewToEdit && (
                <div className="flex flex-1 gap-2">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                  {interviewToEdit.estado !== 'cancelada' && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Cancelar Entrevista
                    </Button>
                  )}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {interviewToEdit ? 'Cerrar' : 'Cancelar'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : interviewToEdit ? 'Actualizar' : mode === 'propose' ? 'Enviar Propuesta' : 'Agendar'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
