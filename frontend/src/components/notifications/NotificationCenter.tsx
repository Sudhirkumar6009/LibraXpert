
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Calendar, BookOpen, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Notification } from '@/types';

interface NotificationCenterProps {
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const { notifications, markNotificationRead } = useAuth();
  
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationRead(notification.id);
    }
    
    if (notification.actionLink) {
      // Navigate to action link if provided
      window.location.href = notification.actionLink;
    }
    
    // Close notification center
    onClose();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'due_date':
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      case 'reservation':
        return <BookOpen className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <Calendar className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="w-full max-w-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center">
          <Bell className="h-4 w-4 mr-2" /> 
          Notifications
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Mark all as read
        </Button>
      </div>
      
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="divide-y">
            {sortedNotifications.map((notification) => (
              <div 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-accent cursor-pointer transition-colors ${!notification.isRead ? 'bg-accent/20' : ''}`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-primary' : ''}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full absolute top-4 right-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      
      <div className="p-3 border-t text-center">
        <Button variant="link" size="sm" className="text-xs" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default NotificationCenter;
