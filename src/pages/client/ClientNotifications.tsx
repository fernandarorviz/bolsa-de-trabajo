import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Calendar, Info, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ClientNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsService.getNotifications(),
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error: Error) => {
      toast.error('Error al marcar como leída', { description: error.message });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: (error: Error) => {
      toast.error('Error al marcar todas como leídas', { description: error.message });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'interview_proposal':
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case 'interview_confirmed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'status_change':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Notificaciones</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus avisos y alertas del portal
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Historial de Notificaciones</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} pendientes</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No tienes notificaciones por el momento</p>
              </div>
            ) : (
              <div className="divide-y overflow-hidden rounded-b-lg">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 transition-colors hover:bg-muted/50",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500"
                    )}
                  >
                    <div className="p-2 rounded-full bg-background border shadow-sm shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm sm:text-base truncate">
                          {notification.title}
                        </h4>
                        <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="sm:h-8 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        <span className="text-xs">Marcar leída</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
