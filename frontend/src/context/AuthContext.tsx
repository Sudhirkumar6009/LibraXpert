import React, { createContext, useContext, useState, useEffect } from "react";
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
  markNotificationRead: (notificationId: string) => void;
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

// Mock notification service - in production, this would be replaced by a real API
const notificationService = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    // This could be replaced with a real API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Sample notifications
    return [
      {
        id: "1",
        userId,
        title: "Book due tomorrow",
        message:
          'Your borrowed book "The Design of Everyday Things" is due tomorrow',
        date: new Date(),
        isRead: false,
        type: "due_date",
      },
      {
        id: "2",
        userId,
        title: "New arrivals",
        message: "5 new books have been added to our collection",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isRead: false,
        type: "system",
      },
      {
        id: "3",
        userId,
        title: "Book reservation available",
        message: 'Your reserved book "Clean Code" is now available',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isRead: true,
        type: "reservation",
      },
    ];
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check auth state on initial load
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Try to get user from token
        const currentUser = await authService.getCurrentUser();

        if (currentUser) {
          setUser(currentUser);

          // Load notifications for the user
          const userNotifications = await notificationService.getNotifications(
            currentUser.id
          );
          setNotifications(userNotifications);
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
  }, []);

  // Login function
  const login = async (emailOrEnrollment: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(emailOrEnrollment, password);
      setUser(response.user);

      // Fetch notifications for the user
      const userNotifications = await notificationService.getNotifications(
        response.user.id
      );
      setNotifications(userNotifications);

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

  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
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
    setCurrentUser, // Add this to the exported context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
