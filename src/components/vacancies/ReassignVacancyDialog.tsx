import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ReassignVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyTitle: string;
  currentRecruiterId?: string | null;
}

export function ReassignVacancyDialog({
  open,
  onOpenChange,
  vacancyId,
  vacancyTitle,
  currentRecruiterId,
}: ReassignVacancyDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>(currentRecruiterId || "");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { data: recruiters, isLoading: loadingRecruiters } = useQuery({
    queryKey: ['usuarios', 'reclutador'],
    queryFn: async () => {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'reclutador');
      
      if (roleError) throw roleError;
      
      const userIds = roleData.map(r => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, email')
        .in('id', userIds)
        .order('nombre');
      
      if (profilesError) throw profilesError;
      return profilesData;
    },
  });

  const reassignMutation = useMutation({
    mutationFn: async (reclutadorId: string) => {
      const { error } = await supabase
        .from('vacantes')
        .update({ reclutador_id: reclutadorId })
        .eq('id', vacancyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacantes'] });
      queryClient.invalidateQueries({ queryKey: ['recruiter-workload'] });
      toast.success('Vacante reasignada exitosamente');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Error al reasignar vacante', {
        description: error.message,
      });
    },
  });

  const handleReassign = () => {
    if (!selectedRecruiterId) {
      toast.error('Debes seleccionar un reclutador');
      return;
    }
    reassignMutation.mutate(selectedRecruiterId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reasignar Vacante</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Vacante</Label>
            <p className="font-semibold text-sm">{vacancyTitle}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reclutador">Nuevo Reclutador</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between"
                  disabled={loadingRecruiters}
                >
                  {selectedRecruiterId
                    ? recruiters?.find((u) => u.id === selectedRecruiterId)?.nombre
                    : "Seleccionar reclutador..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar reclutador..." />
                  <CommandList>
                    <CommandEmpty>No se encontró ningún reclutador.</CommandEmpty>
                    <CommandGroup>
                      {recruiters?.map((usuario) => (
                        <CommandItem
                          key={usuario.id}
                          value={usuario.nombre}
                          onSelect={() => {
                            setSelectedRecruiterId(usuario.id);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRecruiterId === usuario.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {usuario.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleReassign} 
            disabled={reassignMutation.isPending || !selectedRecruiterId}
          >
            {reassignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Reasignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
