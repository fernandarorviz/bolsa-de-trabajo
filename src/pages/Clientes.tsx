import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  User,
  LayoutGrid,
  List,
  FileBarChart,
  DollarSign,
  Users,
  Download,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Cliente, Factura } from '@/types/ats';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { billingService } from '@/services/billing';
import { usersService } from '@/services/users';

export default function Clientes() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  
  // Account Status Sheet
  const [accountStatusOpen, setAccountStatusOpen] = useState(false);
  const [selectedClientForBilling, setSelectedClientForBilling] = useState<Cliente | null>(null);
  const [clientInvoices, setClientInvoices] = useState<Factura[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  // Manage Users Dialog
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [selectedClientForUser, setSelectedClientForUser] = useState<Cliente | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');

  const [creatingUser, setCreatingUser] = useState(false);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [loadingExistingUsers, setLoadingExistingUsers] = useState(false);

  const handleOpenCreateUser = async (cliente: Cliente) => {
    setSelectedClientForUser(cliente);
    setNewUserEmail(cliente.contacto_email || '');
    setNewUserName(cliente.contacto_nombre || '');
    setCreateUserOpen(true);
    
    // Fetch existing users
    setLoadingExistingUsers(true);
    try {
      const users = await usersService.getUsersByClient(cliente.id);
      setExistingUsers(users);
    } catch (error: any) {
      toast.error('Error al cargar usuarios', { description: error.message });
    } finally {
      setLoadingExistingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForUser) return;
    
    setCreatingUser(true);
    try {
      await usersService.createClientUser(newUserEmail, newUserPassword, newUserName, selectedClientForUser.id);
      toast.success('Usuario creado correctamente', {
        description: 'El cliente ahora puede acceder al portal.'
      });
      setCreateUserOpen(false);
      setNewUserPassword(''); // Reset sensitive data
      // Refresh user count
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    } catch (error: any) {
      toast.error('Error al crear usuario', { description: error.message });
    } finally {
      setCreatingUser(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', searchTerm, industryFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('clientes')
        .select('*, profiles(count)', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,contacto_email.ilike.%${searchTerm}%`);
      }

      if (industryFilter) {
        query = query.ilike('industria', `%${industryFilter}%`);
      }

      const { data, error, count } = await query
        .order('nombre')
        .range(from, to);

      if (error) throw error;
      
      // Transform response to handle count
      const transformedData = data.map((cliente: any) => ({
        ...cliente,
        profiles_count: cliente.profiles?.[0]?.count || 0
      }));

      return { clientes: transformedData as Cliente[], count: count || 0 };
    },
  });

  const clientes = data?.clientes || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleExport = async () => {
    try {
      let query = (supabase as any)
        .from('clientes')
        .select('nombre, industria, sector, sitio_web, contacto_nombre, contacto_email, contacto_telefono, activo')
        .order('nombre');

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,contacto_email.ilike.%${searchTerm}%`);
      }

      if (industryFilter) {
        query = query.ilike('industria', `%${industryFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const headers = ['Nombre', 'Industria', 'Sector', 'Sitio Web', 'Contacto', 'Email', 'Teléfono', 'Estado'];
      const csvContent = [
        headers.join(','),
        ...data.map(c => [
          `"${c.nombre}"`,
          `"${c.industria || ''}"`,
          `"${c.sector || ''}"`,
          `"${c.sitio_web || ''}"`,
          `"${c.contacto_nombre || ''}"`,
          `"${c.contacto_email || ''}"`,
          `"${c.contacto_telefono || ''}"`,
          `"${c.activo ? 'Activo' : 'Inactivo'}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Lista de clientes exportada');
    } catch (error: any) {
      toast.error('Error al exportar', { description: error.message });
    }
  };


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar', { description: error.message });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('clientes').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setSelectedClientes([]);
      toast.success('Clientes eliminados correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar clientes', { description: error.message });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientes(clientes.map(c => c.id));
    } else {
      setSelectedClientes([]);
    }
  };

  const handleSelectCliente = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedClientes(prev => [...prev, id]);
    } else {
      setSelectedClientes(prev => prev.filter(cId => cId !== id));
    }
  };

  const openEdit = (cliente: Cliente) => {
    navigate(`/clientes/${cliente.id}/editar`);
  };

  const handleOpenAccountStatus = async (cliente: Cliente) => {
    setSelectedClientForBilling(cliente);
    setAccountStatusOpen(true);
    setLoadingInvoices(true);
    try {
      const invoices = await billingService.getByClient(cliente.id);
      setClientInvoices(invoices);
    } catch (error: any) {
      toast.error('Error al cargar facturas', { description: error.message });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Empresas que contratan a través de nosotros
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <div className="flex items-center border rounded-lg bg-background p-1 mr-2">
              <Button
                variant={viewType === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('table')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4 mr-2" />
                Tabla
              </Button>
              <Button
                variant={viewType === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('grid')}
                className="h-8 px-3"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Grid
              </Button>
            </div>
            <Button onClick={() => navigate('/clientes/nuevo')}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por industria..."
                  value={industryFilter}
                  onChange={(e) => {
                    setIndustryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isAdmin && selectedClientes.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-2 bg-destructive/10 rounded-lg border border-destructive/20 animate-fade-in">
                <span className="text-sm font-medium text-destructive mr-2">
                  {selectedClientes.length} clientes seleccionados
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm(`¿Estás seguro que deseas eliminar ${selectedClientes.length} clientes?`)) {
                      bulkDeleteMutation.mutate(selectedClientes);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar seleccionados
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedClientes([])}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {totalCount === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay clientes</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || industryFilter
                      ? 'No se encontraron clientes con ese criterio'
                      : 'Agrega tu primer cliente'}
                  </p>
                </CardContent>
              </Card>
            ) : viewType === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clientes.map((cliente) => (
              <Card key={cliente.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center overflow-hidden">
                        {cliente.logo_url ? (
                          <img src={cliente.logo_url} alt={cliente.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-accent" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{cliente.nombre}</h3>
                          {cliente.profiles_count !== undefined && cliente.profiles_count > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {cliente.profiles_count} {cliente.profiles_count === 1 ? 'usuario' : 'usuarios'}
                            </Badge>
                          )}
                        </div>
                        {cliente.industria && (
                          <p className="text-sm text-muted-foreground">{cliente.industria}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(cliente)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenAccountStatus(cliente)}>
                          <FileBarChart className="w-4 h-4 mr-2" />
                          Estado de Cuenta
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(cliente.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenCreateUser(cliente)}>
                          <Users className="w-4 h-4 mr-2" />
                          {cliente.profiles_count && cliente.profiles_count > 0 ? 'Gestionar Usuarios' : 'Crear Usuario'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {(cliente.contacto_nombre || cliente.contacto_email || cliente.contacto_telefono) && (
                    <div className="mt-4 pt-4 border-t space-y-2 text-sm text-muted-foreground">
                      {cliente.contacto_nombre && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {cliente.contacto_nombre}
                        </div>
                      )}
                      {cliente.contacto_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {cliente.contacto_email}
                        </div>
                      )}
                      {cliente.contacto_telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {cliente.contacto_telefono}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={selectedClientes.length === clientes.length && clientes.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
                  )}
                  <TableHead>Empresa</TableHead>
                  <TableHead>Industria</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className={cn(selectedClientes.includes(cliente.id) && "bg-muted/50")}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedClientes.includes(cliente.id)}
                          onCheckedChange={(checked) => handleSelectCliente(cliente.id, !!checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center overflow-hidden">
                          {cliente.logo_url ? (
                            <img src={cliente.logo_url} alt={cliente.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-4 h-4 text-accent" />
                          )}
                        </div>
                        {cliente.nombre}
                        {cliente.profiles_count !== undefined && cliente.profiles_count > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            {cliente.profiles_count}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{cliente.industria || '-'}</TableCell>
                    <TableCell>{cliente.contacto_nombre || '-'}</TableCell>
                    <TableCell>{cliente.contacto_email || '-'}</TableCell>
                    <TableCell>
                      {cliente.activo ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(cliente)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenAccountStatus(cliente)}>
                            <FileBarChart className="w-4 h-4 mr-2" />
                            Estado de Cuenta
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(cliente.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenCreateUser(cliente)}>
                            <Users className="w-4 h-4 mr-2" />
                            {cliente.profiles_count && cliente.profiles_count > 0 ? 'Gestionar Usuarios' : 'Crear Usuario'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </DashboardLayout>
    <Sheet open={accountStatusOpen} onOpenChange={setAccountStatusOpen}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Estado de Cuenta: {selectedClientForBilling?.nombre}</SheetTitle>
          <SheetDescription>
            Historial de facturación y cobranza para este cliente.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {loadingInvoices ? (
            <div className="py-12 text-center text-muted-foreground">Cargando datos...</div>
          ) : clientInvoices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Este cliente no tiene registros de facturación.
            </div>
          ) : (
            <div className="space-y-4">
              {clientInvoices.map((inv) => {
                const pagado = inv.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0;
                const saldo = Number(inv.monto_total) - pagado;
                return (
                  <Card key={inv.id} className="overflow-hidden">
                    <CardHeader className="p-4 bg-muted/30">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span>{(inv as any).vacante?.titulo || 'Vacante'}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {inv.estado}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground">Monto Total</p>
                          <p className="font-bold">${Number(inv.monto_total).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pagado</p>
                          <p className="font-bold text-green-600">${pagado.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Saldo</p>
                          <p className={`font-bold ${saldo > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            ${saldo.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Solicitud</p>
                          <p className="font-medium">
                            {inv.fecha_solicitud 
                              ? new Date(inv.fecha_solicitud).toLocaleDateString()
                              : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
    
    <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuarios de {selectedClientForUser?.nombre}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Existing Users List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios Actuales
            </h4>
            {loadingExistingUsers ? (
              <div className="text-sm text-center py-4 bg-muted/30 rounded-lg">Cargando...</div>
            ) : existingUsers.length === 0 ? (
              <div className="text-sm text-center py-4 bg-muted/30 rounded-lg text-muted-foreground">
                No hay usuarios registrados para este cliente.
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {existingUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg bg-card shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {user.nombre?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{user.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New User Form */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Crear Nuevo Acceso</h4>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="userName" className="text-xs">Nombre Completo</Label>
                <Input
                  id="userName"
                  size={32}
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="h-9"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="userEmail" className="text-xs">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    className="h-9"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="userPassword" className="text-xs">Contraseña</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="********"
                    className="h-9"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={creatingUser}>
                {creatingUser ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
