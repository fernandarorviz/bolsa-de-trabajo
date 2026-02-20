import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";

interface PDFViewerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  candidateName?: string;
}

export function PDFViewerDialog({
  isOpen,
  onOpenChange,
  pdfUrl,
  candidateName,
}: PDFViewerDialogProps) {
  if (!pdfUrl) return null;

  // Add toolbar=0 to hide internal PDF viewer toolbar if desired, 
  // though browser support varies.
  const viewerUrl = `${pdfUrl}#toolbar=1`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-xl font-bold truncate pr-8">
            CV: {candidateName || "Candidato"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:flex"
            >
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir en pestaña nueva
              </a>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 w-full h-full bg-slate-100 relative">
          <iframe
            src={viewerUrl}
            className="w-full h-full border-none"
            title={`CV de ${candidateName || "Candidato"}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
