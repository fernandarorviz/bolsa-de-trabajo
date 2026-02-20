import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Linkedin,
  LayoutGrid,
  List,
  User as UserIcon,
  Download,
  ShieldCheck,
  ShieldAlert,
  MessageCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Candidato } from '@/types/ats';
import { CandidateProfileDrawer } from '@/components/candidates/CandidateProfileDrawer';
import { Badge } from '@/components/ui/badge';
import { PDFViewerDialog } from '@/components/candidates/PDFViewerDialog';
import { BulkCandidateImport } from '@/components/candidates/BulkCandidateImport';

export default function Candidatos() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'candidates' | 'prospects'>('candidates');
  const itemsPerPage = 10;
  const [selectedCandidatos, setSelectedCandidatos] = useState<string[]>([]);
  
  const [cvSource, setCvSource] = useState<'url' | 'file'>('url');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCandidato, setEditingCandidato] = useState<Candidato | null>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [activeCandidateName, setActiveCandidateName] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [smartImportData, setSmartImportData] = useState<any>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['candidatos', searchTerm, locationFilter, currentPage, activeTab],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('candidatos')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (activeTab === 'candidates') {
        query = query.eq('perfil_completo', true);
      } else {
        query = query.eq('perfil_completo', false);
      }

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (locationFilter) {
        query = query.ilike('ubicacion', `%${locationFilter}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      return { 
        candidatos: data as Candidato[], 
        count: count || 0 
      };
    },
  });

  const candidatos = data?.candidatos || [];
  const totalCount = data?.count || 0;

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      let cv_url = formData.get('cv_url') as string || null;

      if (cvSource === 'file' && cvFile) {
        if (cvFile.size > 10 * 1024 * 1024) {
          throw new Error('El archivo no debe pesar más de 10 MB');
        }

        const fileExt = cvFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `cvs/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('cvs')
          .upload(filePath, cvFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(filePath);

        cv_url = publicUrl;
      }

      const data = {
        nombre: formData.get('nombre') as string,
        email: formData.get('email') as string,
        telefono: formData.get('telefono') as string || null,
        ubicacion: formData.get('ubicacion') as string || null,
        cv_url: cv_url,
        linkedin_url: formData.get('linkedin_url') as string || null,
        notas: formData.get('notas') as string || null,
      };

      if (editingCandidato) {
        const { error } = await supabase
          .from('candidatos')
          .update(data)
          .eq('id', editingCandidato.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('candidatos').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos'] });
      setDialogOpen(false);
      setEditingCandidato(null);
      setCvFile(null);
      setCvSource('url');
      toast.success(editingCandidato ? 'Candidato actualizado' : 'Candidato creado');
    },
    onError: (error: Error) => {
      toast.error('Error', { description: error.message });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('candidatos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos'] });
      toast.success('Candidato eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar', { description: error.message });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('candidatos').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidatos'] });
      setSelectedCandidatos([]);
      toast.success('Candidatos eliminados correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar candidatos', { description: error.message });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidatos(candidatos.map(c => c.id));
    } else {
      setSelectedCandidatos([]);
    }
  };

  const handleSelectCandidato = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidatos(prev => [...prev, id]);
    } else {
      setSelectedCandidatos(prev => prev.filter(cId => cId !== id));
    }
  };

  const handleSmartImport = async () => {
    if (!cvFile) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    setIsParsing(true);
    try {
      // 1. Upload to temporary storage or the regular one
      const fileExt = cvFile.name.split('.').pop();
      const fileName = `temp_${crypto.randomUUID()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, cvFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(fileName);

      // 2. Call Edge Function
      const { data: parsedData, error: functionError } = await supabase.functions.invoke('process-cv', {
        body: { fileUrl: publicUrl, fileName: cvFile.name }
      });

      if (functionError) throw functionError;

      if (parsedData) {
        setSmartImportData(parsedData);
        toast.success('CV procesado con éxito');
        // Pre-poblar el formulario (si los campos están en el DOM)
        // Como estamos usando formularios no controlados con FormData en saveMutation, 
        // necesitamos setear los valores manualmente o usar estados para los inputs.
        // Dado el código actual de Candidatos.tsx, usa defaultValue={editingCandidato?.nombre}.
        // Vamos a cambiar esos inputs para que acepten los datos del smart import.
      }
    } catch (error: any) {
      console.error('Error in smart import:', error);
      toast.error('Error al procesar el CV', { description: error.message });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Si es un nuevo candidato (no editando) y tenemos smart import, 
    // podemos querer enviar la invitación.
    const isNew = !editingCandidato;
    const email = formData.get('email') as string;
    const nombre = formData.get('nombre') as string;

    await saveMutation.mutateAsync(formData);

    if (isNew && email) {
      // Intentar enviar invitación
      try {
        const inviteLink = `${window.location.origin}/candidate/auth?email=${encodeURIComponent(email)}`;
        await supabase.functions.invoke('send-invite', {
          body: { email, nombre, inviteLink }
        });
        toast.success('Invitación enviada al candidato');
      } catch (inviteError) {
        console.error('Error sending invite:', inviteError);
      }
    }
  };

  const openEdit = (candidato: Candidato) => {
    setEditingCandidato(candidato);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCandidato(null);
    setSmartImportData(null);
    setCvFile(null);
  };

  const openProfile = (id: string) => {
    setSelectedCandidateId(id);
    setProfileDrawerOpen(true);
  };

  const openPdfViewer = (url: string, name: string) => {
    setActivePdfUrl(url);
    setActiveCandidateName(name);
    setPdfViewerOpen(true);
  };

  const handleExport = async () => {
    try {
      let query = supabase
        .from('candidatos')
        .select('nombre, email, telefono, ubicacion, created_at')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (activeTab === 'candidates') {
        query = query.eq('perfil_completo', true);
      } else {
        query = query.eq('perfil_completo', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      // Create CSV content
      const headers = ['Nombre', 'Email', 'Teléfono', 'Ubicación', 'Fecha Registro'];
      const csvContent = [
        headers.join(','),
        ...data.map(c => [
          `"${c.nombre}"`,
          `"${c.email}"`,
          `"${c.telefono || ''}"`,
          `"${c.ubicacion || ''}"`,
          `"${new Date(c.created_at).toLocaleDateString()}"`
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `candidatos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Lista de candidatos exportada');
    } catch (error: any) {
      toast.error('Error al exportar', { description: error.message });
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginatedCandidatos = candidatos;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Candidatos</h1>
            <p className="text-muted-foreground mt-1">
              Base de talentos disponibles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} title="Ver Perfil" className="mr-2">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={() => setBulkImportOpen(true)} className="mr-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Carga Masiva
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
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              if (!open) closeDialog();
              else setDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Candidato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingCandidato ? 'Editar Candidato' : 'Nuevo Candidato'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        key={smartImportData?.nombre || editingCandidato?.id}
                        defaultValue={smartImportData?.nombre || editingCandidato?.nombre}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        key={smartImportData?.email || editingCandidato?.id}
                        defaultValue={smartImportData?.email || editingCandidato?.email}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        key={smartImportData?.telefono || editingCandidato?.id}
                        defaultValue={smartImportData?.telefono || editingCandidato?.telefono || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ubicacion">Ubicación</Label>
                      <Input
                        id="ubicacion"
                        name="ubicacion"
                        key={smartImportData?.ubicacion || editingCandidato?.id}
                        defaultValue={smartImportData?.ubicacion || editingCandidato?.ubicacion || ''}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cv_url">Currículum Vitae</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={cvSource === 'url' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setCvSource('url')}
                          className="h-7 text-xs"
                        >
                          Link URL
                        </Button>
                        <Button
                          type="button"
                          variant={cvSource === 'file' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setCvSource('file')}
                          className="h-7 text-xs"
                        >
                          Subir Archivo
                        </Button>
                      </div>
                    </div>
                    
                    {cvSource === 'url' ? (
                      <Input
                        id="cv_url"
                        name="cv_url"
                        type="url"
                        placeholder="https://..."
                        defaultValue={editingCandidato?.cv_url || ''}
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="cv_file"
                            name="cv_file"
                            type="file"
                            className="flex-1"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  toast.error('El archivo es demasiado grande (máximo 10MB)');
                                  e.target.value = '';
                                  setCvFile(null);
                                } else {
                                  setCvFile(file);
                                }
                              }
                            }}
                          />
                          {!editingCandidato && cvFile && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              disabled={isParsing}
                              onClick={handleSmartImport}
                              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                              {isParsing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4 mr-2" />
                              )}
                              Extraer con IA
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PDF, Word (Máx 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                      name="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      key={smartImportData?.linkedin_url || editingCandidato?.id}
                      defaultValue={smartImportData?.linkedin_url || editingCandidato?.linkedin_url || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      name="notas"
                      rows={3}
                      defaultValue={smartImportData?.resumen_profesional || editingCandidato?.notas || ''}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por ubicación..."
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs 
          defaultValue="candidates" 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value as 'candidates' | 'prospects');
            setCurrentPage(1);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="candidates">Candidatos Completos</TabsTrigger>
            <TabsTrigger value="prospects">Prospectos / Pre-selección</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isAdmin && selectedCandidatos.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-2 bg-destructive/10 rounded-lg border border-destructive/20 animate-fade-in">
                <span className="text-sm font-medium text-destructive mr-2">
                  {selectedCandidatos.length} candidatos seleccionados
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm(`¿Estás seguro que deseas eliminar ${selectedCandidatos.length} candidatos?`)) {
                      bulkDeleteMutation.mutate(selectedCandidatos);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar seleccionados
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCandidatos([])}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {totalCount === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay candidatos</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || locationFilter
                      ? 'No se encontraron candidatos con ese criterio'
                      : 'Agrega tu primer candidato a la base de talentos'}
                  </p>
                </CardContent>
              </Card>
            ) : viewType === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidatos.map((candidato) => (
              <Card key={candidato.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {candidato.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{candidato.nombre}</h3>
                          {candidato.perfil_completo ? (
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{candidato.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openProfile(candidato.id)}>
                          <UserIcon className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(candidato)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(candidato.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {candidato.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {candidato.telefono}
                        <a
                          href={`https://wa.me/${candidato.telefono.replace(/\D/g, '').length === 10 ? '52' : ''}${candidato.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-full hover:bg-green-100 text-green-600 transition-colors"
                          title="Contactar por WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                    {candidato.ubicacion && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {candidato.ubicacion}
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-2">
                      {candidato.cv_url && (
                        <button
                          onClick={() => {
                            if (candidato.cv_url?.toLowerCase().endsWith('.pdf')) {
                              openPdfViewer(candidato.cv_url, candidato.nombre);
                            } else {
                              window.open(candidato.cv_url, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          CV
                        </button>
                      )}
                      {candidato.linkedin_url && (
                        <a
                          href={candidato.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
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
                        checked={selectedCandidatos.length === candidatos.length && candidatos.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
                  )}
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidatos.map((candidato) => (
                  <TableRow key={candidato.id} className={cn(selectedCandidatos.includes(candidato.id) && "bg-muted/50")}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedCandidatos.includes(candidato.id)}
                          onCheckedChange={(checked) => handleSelectCandidato(candidato.id, !!checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {candidato.nombre.charAt(0).toUpperCase()}
                        </div>
                        {candidato.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      {candidato.perfil_completo ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Completo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Prospecto
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{candidato.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {candidato.telefono || '-'}
                        {candidato.telefono && (
                          <a
                            href={`https://wa.me/${candidato.telefono.replace(/\D/g, '').length === 10 ? '52' : ''}${candidato.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-full hover:bg-green-100 text-green-600 transition-colors"
                            title="Contactar por WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{candidato.ubicacion || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {candidato.cv_url && (
                          <button 
                            onClick={() => {
                              if (candidato.cv_url?.toLowerCase().endsWith('.pdf')) {
                                openPdfViewer(candidato.cv_url, candidato.nombre);
                              } else {
                                window.open(candidato.cv_url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            title="CV"
                          >
                            <FileText className="w-4 h-4 text-primary" />
                          </button>
                        )}
                        {candidato.linkedin_url && (
                          <a href={candidato.linkedin_url} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                            <Linkedin className="w-4 h-4 text-primary" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openProfile(candidato.id)}>
                            <UserIcon className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(candidato)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(candidato.id)}
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
        <CandidateProfileDrawer 
          candidateId={selectedCandidateId}
          open={profileDrawerOpen}
          onOpenChange={setProfileDrawerOpen}
        />
        <PDFViewerDialog 
          isOpen={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          pdfUrl={activePdfUrl}
          candidateName={activeCandidateName}
        />
        <BulkCandidateImport 
          open={bulkImportOpen}
          onOpenChange={setBulkImportOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['candidatos'] })}
        />
      </div>
    </DashboardLayout>
  );
}
