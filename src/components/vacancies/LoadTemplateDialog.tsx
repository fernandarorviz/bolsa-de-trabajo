
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Copy, Loader2, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VacancyTemplate } from "@/types/ats";

interface LoadTemplateDialogProps {
  onSelectTemplate: (template: VacancyTemplate) => void;
}

export function LoadTemplateDialog({ onSelectTemplate }: LoadTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["plantillas", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("vacancy_templates")
        .select(`
          *,
          clientes!vacancy_templates_cliente_id_fkey (
            nombre
          )
        `)
        .order("nombre_plantilla");

      if (searchTerm) {
        query = query.ilike("nombre_plantilla", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Use 'any' to bypass strict type check for joined table that might not be in the type definition yet
      return data as any[];
    },
    enabled: open,
  });

  const handleSelect = (template: VacancyTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Copy className="h-4 w-4" />
          Cargar Plantilla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cargar Plantilla</DialogTitle>
        </DialogHeader>
        
        <div className="relative mt-2 mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plantilla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates?.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              No se encontraron plantillas.
            </div>
          ) : (
            <div className="space-y-2">
              {templates?.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSelect(template)}
                >
                  <div>
                    <h4 className="font-medium text-sm">{template.nombre_plantilla}</h4>
                    <div className="flex flex-col gap-0.5">
                      {template.clientes?.nombre && (
                        <p className="text-xs font-semibold text-primary/80">
                          {template.clientes.nombre}
                        </p>
                      )}
                      {template.titulo && (
                        <p className="text-xs text-muted-foreground">{template.titulo}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
