import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { notificationsService } from "@/services/notifications";

interface ReassignCandidateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  candidateUserId?: string | null;
  currentVacancyId: string;
}

export function ReassignCandidateDialog({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidateUserId,
  currentVacancyId,
}: ReassignCandidateDialogProps) {
  const { user, role } = useAuth();
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: vacancies, isLoading } = useQuery({
    queryKey: ["active-vacancies-reassign", role, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("vacantes")
        .select("id, titulo, estado, reclutador_id")
        .eq("estado", "publicada")
        .neq("id", currentVacancyId); // Exclude current vacancy

      if (role === "reclutador" && user?.id) {
        query = query.eq("reclutador_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!role,
  });

  const reassignMutation = useMutation({
    mutationFn: async (targetVacancyId: string) => {
      // 1. Get first stage of target vacancy
      const { data: stages, error: stagesError } = await supabase
        .from("etapas_pipeline")
        .select("id")
        .order("orden", { ascending: true })
        .limit(1);

      if (stagesError) throw stagesError;
      if (!stages || stages.length === 0)
        throw new Error("La vacante destino no tiene etapas configuradas.");

      const firstStageId = stages[0].id;

      // 2. Check if candidate already exists in target vacancy
      const { data: existingApp, error: checkError } = await supabase
        .from("postulaciones")
        .select("id")
        .eq("vacante_id", targetVacancyId)
        .eq("candidato_id", candidateId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingApp)
        throw new Error("El candidato ya está postulado a esta vacante.");

      // 3. Create new application
      const { error: insertError } = await supabase
        .from("postulaciones")
        .insert({
          vacante_id: targetVacancyId,
          candidato_id: candidateId,
          etapa_id: firstStageId,
          fecha_postulacion: new Date().toISOString(),
          fecha_ultima_actualizacion: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // 4. Notify candidate mechanism (simulated via system notification to user/reassigned logic)
      // Since candidates are not users in auth yet (or might be), we notify the system users
      // For now we will notify the recruiter of the new vacancy if it's different from current user

      const targetVacancy = vacancies?.find((v) => v.id === targetVacancyId);
      
      // Notify Candidate (if linked to a user)
      if (candidateUserId) {
          await notificationsService.createNotification({
              user_id: candidateUserId,
              title: "Nueva Vacante Asignada",
              message: `Has sido asignado a la vacante "${targetVacancy?.titulo}". ¡Mucho éxito!`,
              type: "system", // Or 'status_change'
              metadata: {
                  vacante_id: targetVacancyId
              }
          });
      }

      // Notify Target Recruiter (if different from current user)
      if (targetVacancy?.reclutador_id && targetVacancy.reclutador_id !== user?.id) {
         await notificationsService.createNotification({
             user_id: targetVacancy.reclutador_id,
             title: "Candidato Reasignado",
             message: `El candidato ${candidateName} ha sido reasignado a tu vacante "${targetVacancy.titulo}"`,
             type: "system",
             metadata: {
                 candidato_id: candidateId,
                 vacante_id: targetVacancyId
             }
         });
      }
      
      return targetVacancy;
    },
    onSuccess: (targetVacancy) => {
      toast.success(
        `Candidato reasignado exitosamente a "${targetVacancy?.titulo}"`
      );
      onClose();
      setSelectedVacancyId("");
    },
    onError: (error: Error) => {
      toast.error("Error al reasignar", { description: error.message });
    },
  });

  const handleReassign = () => {
    if (!selectedVacancyId) return;
    reassignMutation.mutate(selectedVacancyId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reasignar Candidato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="vacancy">Seleccionar vacante destino</Label>
            <Select
              value={selectedVacancyId}
              onValueChange={setSelectedVacancyId}
            >
              <SelectTrigger id="vacancy">
                <SelectValue placeholder="Selecciona una vacante..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Cargando...
                  </div>
                ) : vacancies?.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No hay vacantes disponibles
                  </div>
                ) : (
                  vacancies?.map((vacancy) => (
                    <SelectItem key={vacancy.id} value={vacancy.id}>
                      {vacancy.titulo}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se creará una nueva postulación para {candidateName} en la vacante seleccionada.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleReassign}
            disabled={!selectedVacancyId || reassignMutation.isPending}
          >
            {reassignMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmar Reasignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
