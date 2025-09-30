import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Notification } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("libraxpert_token")}`,
          },
        });
        if (!res.ok)
          throw new Error(`Failed to load notifications (${res.status})`);
        let data = [];
        try {
          data = await res.json();
        } catch (e) {
          console.warn("Notifications response not JSON", e);
        }
        setNotifications(data || []);
      } catch (err) {
        console.error(err);
        toast({ title: "Failed to load notifications" });
      }
    };
    load();
  }, [user]);

  const markRead = async (id: string) => {
    try {
      // Check if id is undefined and handle it
      if (!id) {
        console.error("Notification ID is undefined");
        toast({
          title: "Error",
          description: "Could not identify the notification",
          variant: "destructive",
        });
        return;
      }

      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("libraxpert_token")}`,
        },
      });

      // Remove the notification from the list instead of just marking it as read
      setNotifications((currentNotifications) =>
        currentNotifications.filter((n) => ((n as any)._id || n.id) !== id)
      );

      // Show a toast notification
      toast({
        title: "Notification dismissed",
        description: "The notification has been marked as read",
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to mark read" });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      {notifications.length === 0 ? (
        <Card className="mb-3">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No notifications
            </p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((n) => (
          <Card
            key={(n as any)._id || n.id} // Use _id if available, fall back to id
            className={`mb-3 ${n.isRead ? "" : "ring-1 ring-primary/30"}`}
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{n.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markRead((n as any)._id || n.id)} // Use _id if available, fall back to id
                >
                  Mark read
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              {n.actionLink && (
                <a
                  className="text-sm text-primary mt-2 inline-block"
                  href={n.actionLink}
                >
                  Open
                </a>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default NotificationsPage;
