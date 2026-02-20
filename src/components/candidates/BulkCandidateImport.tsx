import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BulkCandidateImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'parsing' | 'saving' | 'success' | 'error' | 'duplicate';
  progress: number;
  error?: string;
  candidateData?: any;
}

export function BulkCandidateImport({ open, onOpenChange, onSuccess }: BulkCandidateImportProps) {
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: crypto.randomUUID(),
        file,
        status: 'pending' as const,
        progress: 0,
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const importFile = files[i];
      if (importFile.status === 'success' || importFile.status === 'duplicate') continue;

      try {
        // 1. Upload
        updateFileStatus(importFile.id, 'uploading', 10);
        const fileExt = importFile.file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `cvs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(filePath, importFile.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(filePath);

        // 2. Parse
        updateFileStatus(importFile.id, 'parsing', 40);
        const { data: parsedData, error: parseError } = await supabase.functions.invoke('process-cv', {
          body: { fileUrl: publicUrl, fileName: importFile.file.name }
        });

        if (parseError) throw parseError;
        if (!parsedData || !parsedData.email) throw new Error('No se pudo extraer el email del CV');

        // 3. Save (De-duplication Check)
        updateFileStatus(importFile.id, 'saving', 70);
        
        const { data: existing } = await supabase
          .from('candidatos')
          .select('id')
          .eq('email', parsedData.email)
          .maybeSingle();

        if (existing) {
          updateFileStatus(importFile.id, 'duplicate', 100);
          continue;
        }

        const { error: insertError } = await supabase
          .from('candidatos')
          .insert({
            nombre: parsedData.nombre,
            email: parsedData.email,
            telefono: parsedData.telefono,
            ubicacion: parsedData.ubicacion,
            cv_url: publicUrl,
            resumen_profesional: parsedData.resumen_profesional,
            experiencia: parsedData.experiencia,
            educacion: parsedData.educacion,
            habilidades: parsedData.habilidades,
            perfil_completo: false,
            estado_general: 'activo'
          });

        if (insertError) throw insertError;

        // 4. Send Invite
        try {
          const inviteLink = `${window.location.origin}/candidate/auth?email=${encodeURIComponent(parsedData.email)}`;
          await supabase.functions.invoke('send-invite', {
            body: { email: parsedData.email, nombre: parsedData.nombre, inviteLink }
          });
        } catch (inviteErr) {
          console.error('Error sending invite for', parsedData.email, inviteErr);
        }

        updateFileStatus(importFile.id, 'success', 100);
      } catch (error: any) {
        console.error('Error processing file:', importFile.file.name, error);
        updateFileStatus(importFile.id, 'error', 100, error.message);
      }
    }

    setIsProcessing(false);
    onSuccess();
    toast.success('Proceso de importación finalizado');
  };

  const updateFileStatus = (id: string, status: ImportFile['status'], progress: number, error?: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status, progress, error } : f));
  };

  const getStatusIcon = (status: ImportFile['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'duplicate': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'pending': return <FileText className="w-5 h-5 text-muted-foreground" />;
      default: return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
    }
  };

  const statusLabels = {
    pending: 'Pendiente',
    uploading: 'Subiendo...',
    parsing: 'IA Analizando...',
    saving: 'Guardando...',
    success: 'Completado',
    error: 'Error',
    duplicate: 'Duplicado'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Carga Masiva Inteligente de CVs
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
              "hover:border-primary hover:bg-primary/5 border-muted",
              isProcessing && "pointer-events-none opacity-50"
            )}
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium">Suelta los archivos aquí o haz clic para buscar</p>
            <p className="text-xs text-muted-foreground mt-1">Sube múltiples PDFs del CV de tus candidatos</p>
            <input 
              type="file" 
              multiple 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="font-medium">{files.length} archivos seleccionados</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFiles([])}
                  disabled={isProcessing}
                >
                  Limpiar todo
                </Button>
              </div>
              <div className="border rounded-lg divide-y">
                {files.map((file) => (
                  <div key={file.id} className="p-3 bg-card flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {getStatusIcon(file.status)}
                        <span className="text-sm font-medium truncate max-w-[250px]">{file.file.name}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                          file.status === 'success' ? "bg-green-100 text-green-700" :
                          file.status === 'error' ? "bg-red-100 text-red-700" :
                          file.status === 'duplicate' ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {statusLabels[file.status]}
                        </span>
                      </div>
                      {!isProcessing && file.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => removeFile(file.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {file.status !== 'pending' && file.status !== 'success' && file.status !== 'duplicate' && file.status !== 'error' && (
                      <Progress value={file.progress} className="h-1" />
                    )}
                    {file.error && (
                      <p className="text-[10px] text-destructive italic">{file.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {isProcessing ? 'Procesando...' : 'Cerrar'}
          </Button>
          <Button 
            disabled={files.length === 0 || isProcessing || files.every(f => f.status === 'success' || f.status === 'duplicate')}
            onClick={processFiles}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              'Iniciar Importación'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
