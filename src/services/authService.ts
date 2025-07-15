import axios from "axios";
import { User, UserRole, AuthResponse } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/register`,
        {
          name,
          email,
          password,
          role,
          enrollmentNo,
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Registration failed. Please try again.");
    }
  },
};

export default authService;
