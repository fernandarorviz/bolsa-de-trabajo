import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Briefcase,
  Users,
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Menu,
  ShieldCheck,
  Calendar,
  PieChart,
  Receipt,
  History,
  Bell,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { NotificationBell } from '../notifications/NotificationBell';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vacantes', href: '/vacantes', icon: Briefcase },
  { name: 'Candidatos', href: '/candidatos', icon: Users },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Notificaciones', href: '/notificaciones', icon: Bell },
  { 
    name: 'Plantillas', 
    href: '/plantillas', 
    icon: Copy, 
    roles: ['admin', 'reclutador', 'coordinador'] 
  },
  { name: 'Clientes', href: '/clientes', icon: Building2 },
  { 
    name: 'Carga de Trabajo', 
    href: '/carga-trabajo', 
    icon: Users,
    roles: ['admin', 'coordinador'] 
  },
  { name: 'Facturación', href: '/facturacion', icon: Receipt },
  { 
    name: 'Reportes', 
    href: '/reportes', 
    icon: PieChart,
    roles: ['admin', 'coordinador'],
    children: [
      { name: 'Vista General', href: '/reportes' },
      { name: 'Contrataciones Cliente', href: '/reportes/clientes' },
      { name: 'Servicios Analista', href: '/reportes/analistas' },
    ]
  },
  { 
    name: 'Auditoría', 
    href: '/auditoria', 
    icon: History,
    roles: ['admin']
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(['Reportes']);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-destructive/20 text-destructive';
      case 'coordinador': return 'bg-warning/20 text-warning';
      case 'reclutador': return 'bg-info/20 text-info';
      case 'ejecutivo': return 'bg-success/20 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2 ml-4">
          <div className="flex items-center gap-0.5">
            <span className="text-xl font-bold text-white tracking-tighter">Kh</span>
            <div className="w-2 h-2 rounded-full bg-[#E31E24] mt-2" />
            <span className="text-xl font-bold text-white tracking-tighter">r+</span>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            'h-16 flex items-center border-b border-sidebar-border px-4',
            sidebarCollapsed && 'justify-center px-2'
          )}>
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-2xl font-bold text-white tracking-tighter">Kh</span>
              <div className="w-2.5 h-2.5 rounded-full bg-[#E31E24] mt-2.5" />
              <span className="text-2xl font-bold text-white tracking-tighter">r+</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if (item.roles && !item.roles.includes(role as string)) return null;

              const hasChildren = item.children && item.children.length > 0;
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              const isOpen = openMenus.includes(item.name);

              if (hasChildren && !sidebarCollapsed) {
                return (
                  <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleMenu(item.name)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent',
                          isActive && !isOpen && 'bg-sidebar-primary/10'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-9 space-y-1 mt-1">
                      {item.children?.map(child => (
                        <Link
                          key={child.href}
                          to={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'block py-1.5 px-3 rounded-md text-sm transition-colors',
                            location.pathname === child.href
                              ? 'text-sidebar-primary font-semibold'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              );
            })}
            
            {role === 'admin' && (
              <Link
                to="/usuarios"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  location.pathname === '/usuarios'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">Usuarios</span>}
              </Link>
            )}
          </nav>

          {/* Collapse button (desktop only) */}
          <div className="hidden lg:block p-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full text-sidebar-foreground hover:bg-sidebar-accent',
                sidebarCollapsed && 'px-2'
              )}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft className={cn(
                'w-5 h-5 transition-transform',
                sidebarCollapsed && 'rotate-180'
              )} />
              {!sidebarCollapsed && <span className="ml-2">Colapsar</span>}
            </Button>
          </div>


        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen pt-16 lg:pt-0 transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 border-b border-sidebar-border items-center justify-between px-8 bg-background sticky top-0 z-30">
          <div /> {/* Spacer for left side if needed */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 px-2 hover:bg-sidebar-accent h-auto py-1.5 rounded-full"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none mb-1">
                      {profile?.nombre || 'Usuario'}
                    </p>
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold tracking-wider',
                      getRoleBadgeColor(role)
                    )}>
                      {role || 'Sin rol'}
                    </span>
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
                      {profile?.nombre ? getInitials(profile.nombre) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.nombre}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/perfil')}>
                  <Users className="mr-2 h-4 w-4" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuracion')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
