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
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("libraxpert_token")}`,
        },
      });
      setNotifications((s) =>
        s.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to mark read" });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      {notifications.map((n) => (
        <Card
          key={n.id}
          className={`mb-3 ${n.isRead ? "" : "ring-1 ring-primary/30"}`}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{n.title}</span>
              <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
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
      ))}
    </div>
  );
};

export default NotificationsPage;
