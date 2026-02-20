import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminClient } from '@/integrations/supabase/admin-client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Users, Search, Shield, ShieldCheck, User, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile, AppRole, ClasificacionVacante } from '@/types/ats';

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingSpecialties, setEditingSpecialties] = useState<Profile | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<ClasificacionVacante[]>([]);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles-with-roles'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Merge data
      return (profilesData as Profile[]).map(profile => ({
        ...profile,
        role: rolesData.find(r => r.user_id === profile.id)?.role as AppRole | null
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string, newRole: AppRole }) => {
      // Get existing role to check if we should update or insert
      const { data: existingRole, error: fetchError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingRole) {
        // @ts-ignore - 'cliente' role exists in DB but types not yet regenerated
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // @ts-ignore - 'cliente' role exists in DB but types not yet regenerated
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast.success('Rol actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar rol', { description: error.message });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const nombre = formData.get('nombre') as string;
      const role = formData.get('role') as AppRole;

      // 1. Create user in Auth using adminClient to avoid logout
      const { data: authData, error: authError } = await adminClient.auth.signUp({
        email,
        password,
        options: {
          data: { nombre },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. Assign role
      // @ts-ignore - 'cliente' role exists in DB but types not yet regenerated
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role });

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      setIsDialogOpen(false);
      toast.success('Usuario creado con éxito', {
        description: 'Se ha enviado un correo de confirmación al usuario.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear usuario', { description: error.message });
    },
  });

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createUserMutation.mutate(new FormData(e.currentTarget));
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Deleting from profiles. If there's a cascade, user_roles will be deleted too.
      // Note: This doesn't delete the Auth user, but removes them from the ATS management.
      const { error } = await supabase.from('profiles').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      setSelectedUsers([]);
      toast.success('Usuarios eliminados correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar usuarios', { description: error.message });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredProfiles) {
      setSelectedUsers(filteredProfiles.map(p => p.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, id]);
    } else {
      setSelectedUsers(prev => prev.filter(uId => uId !== id));
    }
  };

  const updateSpecialtiesMutation = useMutation({
    mutationFn: async ({ userId, specialties }: { userId: string, specialties: ClasificacionVacante[] }) => {
      // @ts-ignore
      const { error } = await supabase
        .from('profiles')
        .update({ especialidad_niveles: specialties })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      setEditingSpecialties(null);
      toast.success('Especialidades actualizadas correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar especialidades', { description: error.message });
    },
  });

  const openSpecialtiesDialog = (profile: Profile) => {
    setEditingSpecialties(profile);
    setSelectedSpecialties(profile.especialidad_niveles || []);
  };

  const filteredProfiles = profiles?.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roles: AppRole[] = ['admin', 'coordinador', 'reclutador', 'cliente'];

  const getRoleBadge = (role: AppRole | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-destructive hover:bg-destructive/80"><ShieldCheck className="w-3 h-3 mr-1" /> Admin</Badge>;
      case 'coordinador':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white"><Shield className="w-3 h-3 mr-1" /> Coordinador</Badge>;
      case 'reclutador':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white"><Users className="w-3 h-3 mr-1" /> Reclutador</Badge>;
      case 'ejecutivo':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white"><User className="w-3 h-3 mr-1" /> Ejecutivo</Badge>;
      case 'cliente':
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white"><User className="w-3 h-3 mr-1" /> Cliente</Badge>;
      default:
        return <Badge variant="outline">Sin Rol</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1">
              Administra los roles y permisos de los usuarios registrados
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input id="nombre" name="nombre" placeholder="Ej: Juan Pérez" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="usuario@ejemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña Provisional</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" minLength={6} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol de Usuario</Label>
                  <Select name="role" defaultValue="reclutador">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg border border-destructive/20 animate-fade-in">
            <span className="text-sm font-medium text-destructive mr-2">
              {selectedUsers.length} usuarios seleccionados
            </span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (confirm(`¿Estás seguro que deseas eliminar ${selectedUsers.length} usuarios?`)) {
                  bulkDeleteMutation.mutate(selectedUsers);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar seleccionados
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedUsers([])}
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] px-6">
                      <Checkbox 
                        checked={filteredProfiles && filteredProfiles.length > 0 && selectedUsers.length === filteredProfiles.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol Actual</TableHead>
                    <TableHead>Rol Actual</TableHead>
                    <TableHead>Especialidades</TableHead>
                    <TableHead className="text-right px-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Cargando usuarios...
                      </TableCell>
                    </TableRow>
                  ) : filteredProfiles?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles?.map((profile) => (
                      <TableRow key={profile.id} className={cn(selectedUsers.includes(profile.id) && "bg-muted/50")}>
                        <TableCell className="px-6">
                          <Checkbox 
                            checked={selectedUsers.includes(profile.id)}
                            onCheckedChange={(checked) => handleSelectUser(profile.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{profile.nombre}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>{getRoleBadge(profile.role)}</TableCell>
                        <TableCell>
                          {(profile.role === 'reclutador' || profile.role === 'coordinador') ? (
                            <div className="flex flex-wrap gap-1">
                              {profile.especialidad_niveles?.map((s) => (
                                <Badge key={s} variant="secondary" className="capitalize text-xs">
                                  {s}
                                </Badge>
                              )) || <span className="text-muted-foreground text-sm">Sin especialidades</span>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end items-center gap-2">
                            <Select
                              value={profile.role || ""}
                              onValueChange={(value) => updateRoleMutation.mutate({ userId: profile.id, newRole: value as AppRole })}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Rol" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {(profile.role === 'reclutador' || profile.role === 'coordinador') && (
                              <Button variant="ghost" size="icon" onClick={() => openSpecialtiesDialog(profile)} title="Editar Especialidades">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={!!editingSpecialties} onOpenChange={(open) => !open && setEditingSpecialties(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Especialidades</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona los niveles de vacantes que <strong>{editingSpecialties?.nombre}</strong> puede gestionar.
            </p>
            <div className="space-y-2">
              {(['operativa', 'administrativa', 'gerencial', 'directiva'] as ClasificacionVacante[]).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`spec-${type}`} 
                    checked={selectedSpecialties.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSpecialties([...selectedSpecialties, type]);
                      } else {
                        setSelectedSpecialties(selectedSpecialties.filter(s => s !== type));
                      }
                    }}
                  />
                  <Label htmlFor={`spec-${type}`} className="capitalize cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
             <Button variant="outline" onClick={() => setEditingSpecialties(null)}>
               Cancelar
             </Button>
             <Button 
               onClick={() => {
                 if (editingSpecialties) {
                   updateSpecialtiesMutation.mutate({ 
                     userId: editingSpecialties.id, 
                     specialties: selectedSpecialties 
                   });
                 }
               }}
               disabled={updateSpecialtiesMutation.isPending}
             >
               {updateSpecialtiesMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
