import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { DecisionCliente } from '@/types/client-portal';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacanteId: string;
  candidatoId: string;
  candidatoNombre: string;
  decision: DecisionCliente;
  onSuccess?: () => void;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  vacanteId,
  candidatoId,
  candidatoNombre,
  decision,
  onSuccess,
}: FeedbackDialogProps) {
  const [comentario, setComentario] = useState('');
  const queryClient = useQueryClient();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setComentario('');
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Fetch vacancy details to find the recruiter
      const { data: vacante, error: vacanteError } = await supabase
        .from('vacantes')
        .select('titulo, reclutador_id, ejecutivo_id')
        .eq('id', vacanteId)
        .single();
      
      if (vacanteError) throw vacanteError;

      // 2. Insert feedback
      // @ts-ignore
      const { error: feedbackError } = await supabase
        .from('feedback_cliente')
        .insert({
          vacante_id: vacanteId,
          candidato_id: candidatoId,
          decision,
          comentario,
        });

      if (feedbackError) throw feedbackError;

      // 3. Automated actions based on decision
      if (decision === 'rechazado') {
        const { error: rejectError } = await supabase
          .from('postulaciones')
          .update({ 
            descartado: true,
            motivo_descarte: 'Rechazado por cliente',
            notas: comentario ? `Comentario cliente: ${comentario}` : 'Rechazado desde el portal del cliente'
          })
          .eq('vacante_id', vacanteId)
          .eq('candidato_id', candidatoId);
        
        if (rejectError) throw rejectError;
      }

      // 4. Create notification for recruiter (or executive if recruiter is null)
      const targetUserId = vacante.reclutador_id || vacante.ejecutivo_id;
      if (targetUserId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            title: `Feedback de Cliente: ${decision === 'aprobado' ? 'Aprobado' : 'Rechazado'}`,
            message: `El cliente ha ${decision === 'aprobado' ? 'aprobado' : 'rechazado'} a ${candidatoNombre} para la vacante ${vacante.titulo}.`,
            type: 'status_change',
            metadata: {
                vacante_id: vacanteId,
                candidato_id: candidatoId,
                decision
            }
          });
      }
    },
    onSuccess: () => {
      toast.success('Feedback registrado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['client-candidatos', vacanteId] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Error al registrar feedback', {
        description: error.message,
      });
    },
  });

  const isAprobar = decision === 'aprobado';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {isAprobar ? (
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            )}
            <DialogTitle>
              {isAprobar ? 'Aprobar Candidato' : 'Rechazar Candidato'}
            </DialogTitle>
          </div>
          <DialogDescription>
            Estás por {isAprobar ? 'aprobar' : 'rechazar'} a <span className="font-semibold text-gray-900">{candidatoNombre}</span>.
            {isAprobar
              ? ' Esto notificará al reclutador para proceder con la siguiente etapa.'
              : ' El candidato será marcado como descartado por cliente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comentario">
              Comentarios (Opcional)
            </Label>
            <Textarea
              id="comentario"
              placeholder={isAprobar ? "Ej: Me gustaría entrevistarlo el próximo martes..." : "Ej: No cumple con la experiencia requerida en..."}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
            >
                Cancelar
            </Button>
            <Button
                className={isAprobar ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
            >
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar {isAprobar ? 'Aprobación' : 'Rechazo'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
