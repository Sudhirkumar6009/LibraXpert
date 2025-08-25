import axios from "axios";
import { User, UserRole } from "@/types";

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Configure axios with better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

const authService = {
  /**
   * Login a user with email/enrollment number and password
   */
  login: async (
    emailOrEnrollment: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
        emailOrEnrollment,
        password,
      });

      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("libraxpert_token", response.data.token);
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Login failed. Please check your credentials.");
    }
  },

  /**
   * Register a new user
   */
  register: async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    enrollmentNo?: string
  ): Promise<AuthResponse> => {
    try {
      const userData = {
        username: name,
        email,
        password,
        role,
        enrollmentNo: enrollmentNo || undefined,
        firstName: name.split(" ")[0] || "",
        lastName: name.split(" ").slice(1).join(" ") || "",
      };

      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/register`,
        userData
      );

      if (response.data.token) {
        localStorage.setItem("libraxpert_token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 500) {
        throw new Error("Server error. Please try again later.");
      } else if (error.response?.status === 409) {
        throw new Error("User already exists with this email or username.");
      } else if (error.response?.status === 400) {
        throw new Error("Invalid input. Please check your information.");
      } else {
        throw new Error("Registration failed. Please try again later.");
      }
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("libraxpert_token");
    return !!token;
  },

  /**
   * Get current token
   */
  getToken: (): string | null => {
    return localStorage.getItem("libraxpert_token");
  },

  /**
   * Logout user
   */
  logout: (): void => {
  localStorage.removeItem("libraxpert_token");
  // stored key during register was 'user', not 'libraxpert_user'
  localStorage.removeItem("user");
  },

  /**
   * Get current user from API with token
   */
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem("libraxpert_token");
    if (!token) return null;

    try {
      const response = await axios.get<{ user: User }>(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  // Persist the latest user snapshot for quick reloads
  try { localStorage.setItem("user", JSON.stringify(response.data.user)); } catch {}
  return response.data.user;
    } catch (error) {
      localStorage.removeItem("libraxpert_token");
  localStorage.removeItem("user");
      return null;
    }
  },
};

export default authService;
