import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { billingService } from '@/services/billing';
import type { Factura, EstadoFactura, TipoPago } from '@/types/ats';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditCard, Receipt, Plus, Edit2, CheckCircle2, Clock, Ban, Download, Filter, Search, Building2, User, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import type { Vacante, Cliente } from '@/types/ats';

export default function Facturacion() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [facturas, setFacturas] = useState<(Factura & { vacante: Vacante, cliente: Cliente })[]>([]);
  const [filteredFacturas, setFilteredFacturas] = useState<(Factura & { vacante: Vacante, cliente: Cliente })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFactura, setSelectedFactura] = useState<(Factura & { cliente: Cliente, vacante: Vacante }) | null>(null);
  const [selectedFacturas, setSelectedFacturas] = useState<string[]>([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<EstadoFactura | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newAmount, setNewAmount] = useState<string>('');
  const [newStatus, setNewStatus] = useState<EstadoFactura>('pendiente');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<TipoPago>('anticipo');
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await billingService.getAll();
      setFacturas(data);
    } catch (error: any) {
      toast.error('Error al cargar facturas', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = facturas;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.estado === statusFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(f => f.tipo === typeFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.cliente.nombre.toLowerCase().includes(query) || 
        f.vacante.titulo.toLowerCase().includes(query) ||
        f.cliente.rfc?.toLowerCase().includes(query) ||
        f.cliente.razon_social?.toLowerCase().includes(query)
      );
    }
    setFilteredFacturas(filtered);
  }, [facturas, statusFilter, typeFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Cliente', 'RFC', 'Razón Social', 'Vacante', 'Tipo', 'Estado', 'Monto Total', 'Pagado', 'Saldo', 'Última Actualización'];
    const data = filteredFacturas.map(f => {
      const pagado = f.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0;
      const saldo = Number(f.monto_total) - pagado;
      
      const escape = (val: any) => {
        const str = String(val || '');
        return `"${str.replace(/"/g, '""')}"`;
      };

      return [
        escape(f.cliente.nombre),
        escape(f.cliente.rfc),
        escape(f.cliente.razon_social),
        escape(f.vacante.titulo),
        escape(f.tipo || 'Cierre'),
        escape(f.estado),
        f.monto_total,
        pagado,
        saldo,
        format(new Date(f.updated_at), 'yyyy-MM-dd')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...data].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_facturacion_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCobrado = facturas.reduce((acc, f) => {
    return acc + (f.pagos?.reduce((pAcc, p) => pAcc + Number(p.monto), 0) || 0);
  }, 0);

  const totalPendiente = facturas.reduce((acc, f) => {
    if (f.estado === 'cancelada') return acc;
    const pagado = f.pagos?.reduce((pAcc, p) => pAcc + Number(p.monto), 0) || 0;
    return acc + (Number(f.monto_total) - pagado);
  }, 0);

  const handleUpdateInvoice = async () => {
    if (!selectedFactura) return;
    try {
      await billingService.updateAmount(selectedFactura.id, parseFloat(newAmount));
      await billingService.updateStatus(selectedFactura.id, newStatus);
      toast.success('Factura actualizada');
      setIsUpdateModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Error al actualizar', { description: error.message });
    }
  };

  const handleAddPayment = async () => {
    if (!selectedFactura) return;
    try {
      await billingService.addPayment({
        facturacion_id: selectedFactura.id,
        monto: parseFloat(paymentAmount),
        tipo: paymentType,
        metodo_pago: paymentMethod,
      });
      toast.success('Pago registrado');
      setIsPaymentModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Error al registrar pago', { description: error.message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFacturas.length === 0) return;
    
    if (window.confirm(`¿Estás seguro que deseas eliminar ${selectedFacturas.length} registros de facturación?`)) {
      try {
        await billingService.bulkDelete(selectedFacturas);
        toast.success('Registros eliminados correctamente');
        setSelectedFacturas([]);
        loadData();
      } catch (error: any) {
        toast.error('Error al eliminar registros', { description: error.message });
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFacturas(filteredFacturas.map(f => f.id));
    } else {
      setSelectedFacturas([]);
    }
  };

  const handleSelectFactura = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFacturas(prev => [...prev, id]);
    } else {
      setSelectedFacturas(prev => prev.filter(fId => fId !== id));
    }
  };

  const getStatusBadge = (estado: EstadoFactura) => {
    const configs = {
      pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      solicitada: { label: 'Solicitada', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Receipt },
      facturada: { label: 'Facturada', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: CreditCard },
      pagada: { label: 'Pagada', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Ban },
    };
    const config = configs[estado];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Facturación y Cobranza</h1>
            <p className="text-muted-foreground">Monitoreo de solicitudes, facturas y pagos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card p-4 border rounded-lg shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cobrado</p>
              <p className="text-2xl font-bold">${totalCobrado.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-card p-4 border rounded-lg shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Por Cobrar</p>
              <p className="text-2xl font-bold">${totalPendiente.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-card p-4 border rounded-lg shadow-sm flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold">{facturas.filter(f => f.estado === 'pendiente').length}</p>
            </div>
          </div>
          <div className="bg-card p-4 border rounded-lg shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Solicitadas</p>
              <p className="text-2xl font-bold">{facturas.filter(f => f.estado === 'solicitada').length}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cliente, Vacante, RFC..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-48 space-y-2">
            <Label>Estado</Label>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="solicitada">Solicitada</SelectItem>
                <SelectItem value="facturada">Facturada</SelectItem>
                <SelectItem value="pagada">Pagada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48 space-y-2">
            <Label>Tipo</Label>
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="anticipo">Anticipo</SelectItem>
                <SelectItem value="cierre">Cierre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {isAdmin && selectedFacturas.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg border border-destructive/20 animate-fade-in">
            <span className="text-sm font-medium text-destructive mr-2">
              {selectedFacturas.length} registros seleccionados
            </span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar seleccionados
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedFacturas([])}
            >
              Cancelar
            </Button>
          </div>
        )}

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && (
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectedFacturas.length === filteredFacturas.length && filteredFacturas.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                  </TableHead>
                )}
                <TableHead>Cliente / Vacante</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Pagado</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-8">
                    Cargando facturas...
                  </TableCell>
                </TableRow>
              ) : filteredFacturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    No hay registros con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFacturas.map((factura) => {
                  const pagado = factura.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0;
                  const saldo = Number(factura.monto_total) - pagado;
                  return (
                    <TableRow key={factura.id} className={cn(selectedFacturas.includes(factura.id) && "bg-muted/50")}>
                      {isAdmin && (
                        <TableCell>
                          <Checkbox 
                            checked={selectedFacturas.includes(factura.id)}
                            onCheckedChange={(checked) => handleSelectFactura(factura.id, !!checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="font-medium">{factura.cliente.nombre}</div>
                        <div className="text-xs text-muted-foreground">{factura.vacante.titulo}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {factura.tipo || 'Cierre'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(factura.estado)}</TableCell>
                      <TableCell>${Number(factura.monto_total).toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-medium">${pagado.toLocaleString()}</TableCell>
                      <TableCell className={saldo > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                        ${saldo.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(factura.updated_at), 'dd MMM, yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedFactura(factura);
                              setNewAmount(factura.monto_total.toString());
                              setNewStatus(factura.estado);
                              setIsUpdateModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                              setSelectedFactura(factura);
                              setPaymentAmount(saldo.toString());
                              setIsPaymentModalOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal Actualizar Factura */}
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Factura</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedFactura && (
                <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Building2 className="w-4 h-4" />
                    Datos de Facturación del Cliente
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-muted-foreground">RFC:</span>
                    <span>{selectedFactura.cliente.rfc || 'No registrado'}</span>
                    <span className="text-muted-foreground">Razón Social:</span>
                    <span>{selectedFactura.cliente.razon_social || selectedFactura.cliente.nombre}</span>
                    <span className="text-muted-foreground">CP:</span>
                    <span>{selectedFactura.cliente.cp || 'N/A'}</span>
                    <span className="text-muted-foreground">Régimen:</span>
                    <span>{selectedFactura.cliente.regimen_fiscal || 'N/A'}</span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Monto Total</Label>
                <Input 
                  type="number" 
                  value={newAmount} 
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado de Facturación</Label>
                <Select value={newStatus} onValueChange={(val) => setNewStatus(val as EstadoFactura)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="solicitada">Solicitada</SelectItem>
                    <SelectItem value="facturada">Facturada</SelectItem>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateInvoice}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Registrar Pago */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago / Anticipo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Monto a Pagar</Label>
                <Input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Pago</Label>
                <Select value={paymentType} onValueChange={(val) => setPaymentType(val as TipoPago)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anticipo">Anticipo</SelectItem>
                    <SelectItem value="liquidación">Liquidación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Input 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Transferencia, Efectivo, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddPayment}>
                Confirmar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
