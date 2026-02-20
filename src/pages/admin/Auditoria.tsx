import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/audit';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Search, Eye, Filter, User, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Auditoria() {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filters, setFilters] = useState({
    tableName: 'all',
    action: 'all'
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditService.getAuditLogs(filters),
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-green-500 hover:bg-green-600">Creación</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Actualización</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Eliminación</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getTableNameLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      'vacantes': 'Vacantes',
      'candidatos': 'Candidatos',
      'clientes': 'Clientes',
      'postulaciones': 'Postulaciones',
      'profiles': 'Usuarios/Perfiles'
    };
    return labels[tableName] || tableName;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Auditoría de Sistema</h1>
            <p className="text-muted-foreground mt-1">
              Registro detallado de todos los movimientos realizados en la plataforma
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" /> Módulo / Tabla
                </label>
                <Select value={filters.tableName} onValueChange={(v) => setFilters(prev => ({ ...prev, tableName: v }))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos los módulos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los módulos</SelectItem>
                    <SelectItem value="vacantes">Vacantes</SelectItem>
                    <SelectItem value="candidatos">Candidatos</SelectItem>
                    <SelectItem value="clientes">Clientes</SelectItem>
                    <SelectItem value="postulaciones">Postulaciones</SelectItem>
                    <SelectItem value="profiles">Usuarios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Tipo de Acción
                </label>
                <Select value={filters.action} onValueChange={(v) => setFilters(prev => ({ ...prev, action: v }))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todas las acciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    <SelectItem value="INSERT">Creación</SelectItem>
                    <SelectItem value="UPDATE">Actualización</SelectItem>
                    <SelectItem value="DELETE">Eliminación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Fecha y Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead className="text-right px-6">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Cargando registros...
                      </TableCell>
                    </TableRow>
                  ) : !logs || logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron registros de auditoría
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="px-6">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{log.user?.nombre || 'Sistema'}</span>
                            <span className="text-xs text-muted-foreground">{log.user?.email || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getTableNameLabel(log.table_name)}</TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="text-right px-6">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sidebar-primary" />
                Detalles del Movimiento
              </DialogTitle>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-muted-foreground font-medium">Fecha:</p>
                    <p>{format(new Date(selectedLog.created_at), "PPP p", { locale: es })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Usuario:</p>
                    <p>{selectedLog.user?.nombre || 'Sistema'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Módulo:</p>
                    <p>{getTableNameLabel(selectedLog.table_name)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">ID Registro:</p>
                    <p className="font-mono text-[10px] truncate">{selectedLog.record_id}</p>
                  </div>
                </div>

                {selectedLog.action === 'UPDATE' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Datos Anteriores</h4>
                        <pre className="text-[10px] bg-red-50 p-3 rounded border border-red-100 overflow-x-auto max-h-60">
                          {JSON.stringify(selectedLog.old_data, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Datos Nuevos</h4>
                        <pre className="text-[10px] bg-green-50 p-3 rounded border border-green-100 overflow-x-auto max-h-60">
                          {JSON.stringify(selectedLog.new_data, null, 2)}
                        </pre>
                      </div>
                   </div>
                )}

                {(selectedLog.action === 'INSERT' || selectedLog.action === 'DELETE') && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      {selectedLog.action === 'INSERT' ? 'Datos Creados' : 'Datos Eliminados'}
                    </h4>
                    <pre className="text-[10px] bg-slate-50 p-3 rounded border overflow-x-auto max-h-60">
                      {JSON.stringify(selectedLog.action === 'INSERT' ? selectedLog.new_data : selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
