import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Notification } from "@/types/ats";
import { notificationsService } from "@/services/notifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, Info, Calendar, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  notifications: Notification[];
  onRead?: () => void;
}

export const NotificationList = ({ notifications, onRead }: NotificationListProps) => {
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      onRead?.();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'interview_proposal':
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'interview_confirmed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'status_change':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No hay notificaciones
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border">
      <div className="flex flex-col">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "flex flex-col gap-1 border-b p-4 transition-colors hover:bg-muted/50",
              !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2">
                <div className="mt-1">{getIcon(notification.type)}</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{notification.title}</span>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground self-end">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
