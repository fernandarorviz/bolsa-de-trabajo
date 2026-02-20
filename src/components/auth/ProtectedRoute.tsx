import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/types/ats';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, role, loading, hasPermission, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If no role assigned yet, show pending message
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Pendiente de Asignación</h1>
          <p className="text-muted-foreground mb-4">
            Tu cuenta está activa pero aún no tienes un rol asignado.
            Contacta al administrador para que te asigne los permisos correspondientes.
          </p>
          <div className="flex flex-col gap-2 border-t pt-4">
            <button
              onClick={() => window.location.reload()}
              className="text-primary font-medium hover:underline"
            >
              Verificar nuevamente
            </button>
            <button
              onClick={() => signOut()}
              className="text-destructive text-sm hover:underline mt-2"
            >
              Cerrar sesión e intentar con otra cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check role permissions if specified
  if (requiredRoles && !hasPermission(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
