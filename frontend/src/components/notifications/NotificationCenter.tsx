import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Calendar,
  BookOpen,
  Info,
  MessageSquare,
  Star,
  Mail,
  User,
  Clock,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Notification } from "@/types";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";

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

interface NotificationCenterProps {
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const { notifications, markNotificationRead, refreshNotifications } =
    useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackDetail, setFeedbackDetail] = useState<FeedbackDetail | null>(
    null
  );
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );

  const openFeedbackModal = (
    detail: FeedbackDetail | null,
    loading = false
  ) => {
    setFeedbackDetail(detail);
    setFeedbackLoading(loading);
    setFeedbackModalOpen(true);
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markNotificationRead(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    if (notification.type === "feedback" && notification.relatedId) {
      // Open the modal with loading state
      openFeedbackModal(null, true);

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
        // Close the notification center only after successfully loading feedback
        onClose();
      } catch (error) {
        console.error("Error loading feedback detail:", error);
        setFeedbackModalOpen(false);
        toast({
          title: "Unable to open feedback",
          description:
            "We couldn't load the feedback details. Please try again from the feedback page.",
          variant: "destructive",
        });
      } finally {
        setFeedbackLoading(false);
      }
      return;
    }

    if (notification.actionLink) {
      navigate(notification.actionLink);
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    const unread = sortedNotifications.filter(
      (notification) => !notification.isRead
    );

    if (unread.length === 0) {
      onClose();
      return;
    }

    try {
      await Promise.all(
        unread.map((notification) => markNotificationRead(notification.id))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      await refreshNotifications();
    }

    onClose();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "due_date":
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      case "reservation":
        return <BookOpen className="h-5 w-5 text-green-500" />;
      case "overdue":
        return <Calendar className="h-5 w-5 text-red-500" />;
      case "feedback":
        return <MessageSquare className="h-5 w-5 text-library-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <>
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
            onClick={handleMarkAllAsRead}
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
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-accent/20" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4
                          className={`text-sm font-medium ${
                            !notification.isRead ? "text-primary" : ""
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
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
          <Button
            variant="link"
            size="sm"
            className="text-xs"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Render dialog using portal to avoid z-index issues */}
      {createPortal(
        <Dialog
          open={feedbackModalOpen}
          onOpenChange={(open) => {
            setFeedbackModalOpen(open);
            if (!open) {
              setFeedbackDetail(null);
              setFeedbackLoading(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-xl" style={{ zIndex: 9999 }}>
            <DialogHeader>
              <DialogTitle>Feedback details</DialogTitle>
              <DialogDescription>
                Review the feedback submitted by the user without leaving your
                current view.
              </DialogDescription>
            </DialogHeader>

            {feedbackLoading ? (
              <div className="flex items-center justify-center py-10">
                <Clock className="h-6 w-6 animate-spin text-library-600" />
              </div>
            ) : feedbackDetail ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-foreground">
                      {feedbackDetail.name || "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${feedbackDetail.email}`}
                      className="underline decoration-dotted underline-offset-4"
                    >
                      {feedbackDetail.email || "Not provided"}
                    </a>
                  </div>
                </div>

                {(() => {
                  const subject = feedbackDetail.subject || "General";
                  const status = (feedbackDetail.status || "pending") as
                    | "pending"
                    | "reviewed"
                    | "resolved";

                  return (
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {subject.replace(/-/g, " ")}
                      </Badge>
                      <Badge
                        className={
                          status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : status === "reviewed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {status}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span>{feedbackDetail.rating ?? 0}/5</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Message
                  </h4>
                  <p className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                    {feedbackDetail.message ||
                      "No additional message provided."}
                  </p>
                </div>

                {feedbackDetail.adminNotes ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      Admin notes
                    </h4>
                    <p className="rounded-md border bg-blue-50 p-3 text-sm leading-relaxed text-blue-700">
                      {feedbackDetail.adminNotes}
                    </p>
                  </div>
                ) : null}

                <div className="text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(feedbackDetail.createdAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="py-6 text-sm text-muted-foreground">
                No feedback details available.
              </div>
            )}
          </DialogContent>
        </Dialog>,
        document.body
      )}
    </>
  );
};

export default NotificationCenter;
