import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, UserRole, Notification } from "@/types";
import { toast } from "@/components/ui/use-toast";
import authService from "@/services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
  login: (emailOrEnrollment: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    enrollmentNo?: string
  ) => Promise<void>;
  logout: () => void;
  markNotificationRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  setCurrentUser: (user: User) => void; // Add this method
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const allowedNotificationTypes: Notification["type"][] = [
  "due_date",
  "reservation",
  "system",
  "overdue",
  "feedback",
];

const parseNotificationType = (value: unknown): Notification["type"] => {
  if (
    typeof value === "string" &&
    allowedNotificationTypes.includes(value as any)
  ) {
    return value as Notification["type"];
  }
  return "system";
};

const generateNotificationId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const mapNotification = (raw: any): Notification => {
  const id = raw?._id || raw?.id || generateNotificationId();
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
    type: parseNotificationType(raw?.type),
    actionLink: raw?.actionLink ?? undefined,
    relatedId: raw?.relatedId ? String(raw.relatedId) : undefined,
  };
};

const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const token = authService.getToken();
    if (!token) return [];

    const response = await fetch(`${API_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load notifications (${response.status})`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map(mapNotification);
  },
  markAsRead: async (notificationId: string): Promise<void> => {
    const token = authService.getToken();
    if (!token || !notificationId) return;

    const response = await fetch(
      `${API_URL}/notifications/${notificationId}/read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to mark notification as read (${response.status})`
      );
    }
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refreshNotifications = useCallback(async () => {
    try {
      const loaded = await notificationService.getNotifications();
      setNotifications(loaded);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
      setNotifications([]);
    }
  }, []);

  // Check auth state on initial load
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Try to get user from token
        const currentUser = await authService.getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
          await refreshNotifications();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear any invalid tokens
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshNotifications]);

  // Login function
  const login = async (emailOrEnrollment: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(emailOrEnrollment, password);
      setUser(response.user);

      // Fetch notifications for the user
      let userNotifications: Notification[] = [];
      try {
        userNotifications = await notificationService.getNotifications();
        setNotifications(userNotifications);
      } catch (notificationError) {
        console.error(
          "Failed to load notifications after login:",
          notificationError
        );
        setNotifications([]);
      }

      // Show new notification count
      const unreadCount = userNotifications.filter((n) => !n.isRead).length;
      if (unreadCount > 0) {
        toast({
          title: `${unreadCount} unread notification${
            unreadCount > 1 ? "s" : ""
          }`,
          description: "Check your notification center",
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    enrollmentNo?: string,
    userData?: User // Add this parameter
  ) => {
    setIsLoading(true);
    try {
      if (userData) {
        // If user data is provided, don't make another API call
        setUser(userData);
        setNotifications([]);
        return;
      }

      // Only make API call if no user data provided
      const response = await authService.register(
        name,
        email,
        password,
        role,
        enrollmentNo
      );
      setUser(response.user);

      // Initialize empty notifications for new user
      setNotifications([]);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    setNotifications([]);
    // Redirect to login page would be handled by the component
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!notificationId) return;

    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );

    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      await refreshNotifications();
    }
  };

  // Add this method
  const setCurrentUser = (user: User) => {
    setUser(user);
    setNotifications([]);
  };

  // Export it in the context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    notifications,
    login,
    register,
    logout,
    markNotificationRead,
    refreshNotifications,
    setCurrentUser, // Add this to the exported context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
