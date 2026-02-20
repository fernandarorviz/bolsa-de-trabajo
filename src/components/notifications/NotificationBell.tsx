import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/types/ats";
import { notificationsService } from "@/services/notifications";
import { NotificationList } from "./NotificationList";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const NotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => notificationsService.getNotifications(),
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const subscription = notificationsService.subscribeToNotifications(user.id, (newNotification) => {
      // Refresh notifications on new one
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, queryClient]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h4 className="font-semibold text-sm">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <NotificationList
          notifications={notifications}
          onRead={() => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] })}
        />
      </PopoverContent>
    </Popover>
  );
};
