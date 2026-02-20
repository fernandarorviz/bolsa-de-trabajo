import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Plantillas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: plantillas, isLoading } = useQuery({
    queryKey: ['plantillas', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('vacancy_templates')
        .select(`
          *,
          clientes!vacancy_templates_cliente_id_fkey (
            nombre
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('nombre_plantilla', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vacancy_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      toast.success('Plantilla eliminada correctamente');
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar la plantilla', {
        description: error.message,
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Plantillas de Vacantes</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus plantillas predefinidas para agilizar la creación de vacantes
            </p>
          </div>
          <Button asChild>
            <Link to="/plantillas/nueva">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !plantillas || plantillas.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Copy className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay plantillas</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera plantilla para comenzar
                </p>
                <Button asChild>
                  <Link to="/plantillas/nueva">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Plantilla
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Título del Puesto</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plantillas.map((plantilla) => (
                    <TableRow key={plantilla.id}>
                      <TableCell className="font-medium">
                        {plantilla.nombre_plantilla}
                      </TableCell>
                      <TableCell>
                        {plantilla.clientes?.nombre || '-'}
                      </TableCell>
                      <TableCell>{plantilla.titulo}</TableCell>
                      <TableCell>{plantilla.area || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(plantilla.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/plantillas/${plantilla.id}/editar`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(plantilla.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la plantilla.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
