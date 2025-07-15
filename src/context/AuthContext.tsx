
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Notification } from '@/types';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
  login: (emailOrEnrollment: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, enrollmentNo?: string) => Promise<void>;
  logout: () => void;
  markNotificationRead: (notificationId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mock API service - in real app, this would connect to MongoDB
const apiService = {
  login: async (emailOrEnrollment: string, password: string): Promise<User> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if this is an enrollment login
    if (password === 'enrollment-auth') {
      // Parse enrollment info
      const year = emailOrEnrollment.substring(0, 2);
      const month = emailOrEnrollment.substring(2, 4);
      const institute = emailOrEnrollment.substring(4, 7);
      const department = emailOrEnrollment.substring(7, 9);
      const serial = emailOrEnrollment.substring(9, 12);
      
      // Validate enrollment format
      if (emailOrEnrollment.length !== 12 || !/^\d+$/.test(emailOrEnrollment)) {
        throw new Error('Invalid enrollment number format');
      }
      
      return {
        id: `student-${emailOrEnrollment}`,
        name: `Student ${serial}`,
        email: `student${serial}@example.com`,
        role: 'student',
        enrollmentNo: emailOrEnrollment,
        department: department === '16' ? 'IT' : 'Other',
        year: `20${year}`,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailOrEnrollment}`
      };
    }
    
    // Mock login - in real app, this would verify against MongoDB
    if (emailOrEnrollment === 'student@example.com') {
      return {
        id: 'student-1',
        name: 'John Student',
        email: 'student@example.com',
        role: 'student',
        enrollmentNo: '240133116001',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
      };
    } else if (emailOrEnrollment === 'librarian@example.com') {
      return {
        id: 'librarian-1',
        name: 'Jane Librarian',
        email: 'librarian@example.com',
        role: 'librarian',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
      };
    } else if (emailOrEnrollment === 'admin@example.com') {
      return {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
      };
    } else if (emailOrEnrollment === 'user@example.com') {
      return {
        id: 'external-1',
        name: 'External User',
        email: 'user@example.com',
        role: 'external',
        profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=External'
      };
    } else {
      // Default to external user role for any other email
      return {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name: emailOrEnrollment.split('@')[0],
        email: emailOrEnrollment,
        role: 'external',
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailOrEnrollment}`
      };
    }
  },
  
  register: async (name: string, email: string, password: string, role: UserRole, enrollmentNo?: string): Promise<User> => {
    // Simulate API call to MongoDB
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser: User = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };
    
    if (role === 'student' && enrollmentNo) {
      newUser.enrollmentNo = enrollmentNo;
    }
    
    return newUser;
  },
  
  getNotifications: async (userId: string): Promise<Notification[]> => {
    // Simulate API call to MongoDB
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Generate mock notifications based on user role
    return [
      {
        id: '1',
        userId,
        title: 'Book due soon',
        message: '"Design Patterns" is due in 2 days',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isRead: false,
        type: 'due_date'
      },
      {
        id: '2',
        userId,
        title: 'New feature available',
        message: 'LibraXpert now supports enrollment number login',
        date: new Date(),
        isRead: false,
        type: 'system'
      },
      {
        id: '3',
        userId,
        title: 'Book reservation available',
        message: 'Your reserved book "Clean Code" is now available',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isRead: true,
        type: 'reservation'
      }
    ];
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check local storage for user data on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('libraxpert_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Load notifications for the user
        apiService.getNotifications(parsedUser.id)
          .then(notifications => {
            setNotifications(notifications);
          })
          .catch(error => {
            console.error('Failed to fetch notifications:', error);
          });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Login function - connects to MongoDB in a real app
  const login = async (emailOrEnrollment: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await apiService.login(emailOrEnrollment, password);
      
      // Save to local storage
      localStorage.setItem('libraxpert_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      
      // Fetch notifications for the user
      const userNotifications = await apiService.getNotifications(loggedInUser.id);
      setNotifications(userNotifications);
      
      // Show new notification count
      const unreadCount = userNotifications.filter(n => !n.isRead).length;
      if (unreadCount > 0) {
        toast({
          title: `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`,
          description: "Check your notification center",
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register function - connects to MongoDB in a real app
  const register = async (name: string, email: string, password: string, role: UserRole, enrollmentNo?: string) => {
    setIsLoading(true);
    try {
      const newUser = await apiService.register(name, email, password, role, enrollmentNo);
      
      // Save to local storage
      localStorage.setItem('libraxpert_user', JSON.stringify(newUser));
      setUser(newUser);
      
      // Initialize empty notifications for new user
      setNotifications([]);
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('libraxpert_user');
    setUser(null);
    setNotifications([]);
  };
  
  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    notifications,
    login,
    register,
    logout,
    markNotificationRead
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
