import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, LogIn, UserCircle } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Public Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/empleos')}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Portal de Empleo</span>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="hidden sm:flex items-center gap-2"
            onClick={() => navigate('/candidato/auth')}
          >
            <UserCircle className="w-4 h-4" />
            Soy Candidato
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="hidden sm:flex items-center gap-2"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="w-4 h-4" />
            Soy Reclutador
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t border-gray-100 mt-auto bg-white">
        <p>© {new Date().getFullYear()} Bolsa de Trabajo. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
