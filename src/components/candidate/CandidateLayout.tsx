import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  UserCircle, 
  Briefcase, 
  LogOut, 
  Menu,
  X,
  LayoutDashboard,
  Settings,
  Bell,
  Calendar
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationBell } from '../notifications/NotificationBell';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const links = [
    {
      href: '/candidato/perfil',
      label: 'Mi Perfil',
      icon: UserCircle
    },
    {
      href: '/candidato/postulaciones',
      label: 'Mis Postulaciones',
      icon: Briefcase
    },
    {
      href: '/candidato/agenda',
      label: 'Mi Agenda',
      icon: Calendar
    },
    {
      href: '/candidato/notificaciones',
      label: 'Notificaciones',
      icon: Bell
    },
    {
      href: '/empleos',
      label: 'Buscar Empleos',
      icon: LayoutDashboard
    },
    {
      href: '/candidato/cuenta',
      label: 'Configuración',
      icon: Settings
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/candidato/auth');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Briefcase className="w-6 h-6" />
          <span>Bolsa de Trabajo</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Portal Candidatos</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(link.href)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-sm truncate">{profile?.nombre || 'Candidato'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card fixed h-full z-30">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <Briefcase className="w-5 h-5" />
          <span>Bolsa de Trabajo</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-84">
               {/* The SheetClose is handled by clicking links in NavContent */}
               <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 animate-fade-in">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
