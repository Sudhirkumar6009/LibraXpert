import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Notification } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Star, User, Clock } from "lucide-react";

interface FeedbackDetail {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  rating: number;
  status: "pending" | "reviewed" | "resolved";
  adminNotes?: string;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackDetail, setFeedbackDetail] = useState<FeedbackDetail | null>(
    null
  );
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const normalizeNotification = (raw: any): Notification => {
    const fallbackId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const id =
      raw?._id ||
      raw?.id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : fallbackId);
    const allowedTypes: Notification["type"][] = [
      "due_date",
      "reservation",
      "system",
      "overdue",
      "feedback",
    ];

    const parsedType =
      typeof raw?.type === "string" && allowedTypes.includes(raw.type)
        ? (raw.type as Notification["type"])
        : "system";

    return {
      id: String(id),
      userId: raw?.user
        ? String(raw.user)
        : raw?.userId
        ? String(raw.userId)
        : undefined,
      title: raw?.title ?? "Notification",
      message: raw?.message ?? "",
      createdAt: raw?.createdAt
        ? new Date(raw.createdAt).toISOString()
        : raw?.date
        ? new Date(raw.date).toISOString()
        : new Date().toISOString(),
      isRead: Boolean(raw?.isRead),
      type: parsedType,
      actionLink: raw?.actionLink ?? undefined,
      relatedId: raw?.relatedId ? String(raw.relatedId) : undefined,
    };
  };

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
        const mapped = Array.isArray(data)
          ? data.map((item: any) => normalizeNotification(item))
          : [];
        setNotifications(mapped);
      } catch (err) {
        console.error(err);
        toast({ title: "Failed to load notifications" });
      }
    };
    load();
  }, [user]);

  const openFeedbackModal = async (notification: Notification) => {
    if (!notification.relatedId) {
      toast({
        title: "Feedback unavailable",
        description: "This feedback item is missing a reference.",
        variant: "destructive",
      });
      return;
    }

    setActiveFeedbackId(notification.id);
    setFeedbackDetail(null);
    setFeedbackLoading(true);
    setFeedbackModalOpen(true);

    try {
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/feedback/${notification.relatedId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load feedback details");
      }

      const data: FeedbackDetail = await response.json();
      setFeedbackDetail(data);
    } catch (error) {
      console.error("Error loading feedback detail:", error);
      setFeedbackModalOpen(false);
      setActiveFeedbackId(null);
      setFeedbackDetail(null);
      toast({
        title: "Unable to open feedback",
        description: "Please try again from the Feedback management page.",
        variant: "destructive",
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

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
        currentNotifications.filter((n) => n.id !== id)
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
            key={n.id}
            className={`mb-3 ${n.isRead ? "" : "ring-1 ring-primary/30"}`}
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{n.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markRead(n.id)}
                >
                  Mark read
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              {n.type === "feedback" && n.relatedId ? (
                <Button
                  variant="link"
                  className="p-0 mt-2"
                  onClick={() => openFeedbackModal(n)}
                  disabled={feedbackLoading && activeFeedbackId === n.id}
                >
                  {feedbackLoading && activeFeedbackId === n.id
                    ? "Loading..."
                    : "View feedback"}
                </Button>
              ) : n.actionLink ? (
                <a
                  className="text-sm text-primary mt-2 inline-block"
                  href={n.actionLink}
                >
                  Open
                </a>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
      <FeedbackModal
        open={feedbackModalOpen}
        onOpenChange={(open) => {
          setFeedbackModalOpen(open);
          if (!open) {
            setFeedbackDetail(null);
            setActiveFeedbackId(null);
          }
        }}
        detail={feedbackDetail}
        loading={feedbackLoading}
      />
    </div>
  );
};

const FeedbackModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: FeedbackDetail | null;
  loading: boolean;
}> = ({ open, onOpenChange, detail, loading }) => (
  <Dialog
    open={open}
    onOpenChange={(next) => {
      onOpenChange(next);
    }}
  >
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Feedback details</DialogTitle>
        <DialogDescription>
          Review the feedback submitted by the user.
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Clock className="h-6 w-6 animate-spin text-library-600" />
        </div>
      ) : detail ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {detail.name || "Anonymous"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${detail.email}`}
                className="underline decoration-dotted underline-offset-4"
              >
                {detail.email || "Not provided"}
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="capitalize">
              {(detail.subject || "General").replace(/-/g, " ")}
            </Badge>
            <Badge
              className={
                detail.status === "resolved"
                  ? "bg-library-300 text-green-800"
                  : detail.status === "reviewed"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-library-500 hover:bg-transparent/50 cursor-pointer capitalize font-normal text-white"
              }
            >
              {detail.status || "pending"}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>{detail.rating ?? 0}/5</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Message</h4>
            <p className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
              {detail.message || "No additional message provided."}
            </p>
          </div>

          {detail.adminNotes ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">
                Admin notes
              </h4>
              <p className="rounded-md border bg-blue-50 p-3 text-sm leading-relaxed text-blue-700">
                {detail.adminNotes}
              </p>
            </div>
          ) : null}

          <div className="text-xs text-muted-foreground">
            Submitted {new Date(detail.createdAt).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="py-6 text-sm text-muted-foreground">
          No feedback details available.
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default NotificationsPage;
