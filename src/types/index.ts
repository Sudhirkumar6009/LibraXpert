export type UserRole = "student" | "external" | "librarian" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enrollmentNo?: string;
  profileImage?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverImage: string;
  description: string;
  publicationYear: number;
  publisher: string;
  category: string[];
  totalCopies: number;
  availableCopies: number;
  location: string;
  rating?: number;
  status: "available" | "reserved" | "borrowed" | "unavailable";
  addedBy?: string; // Admin ID who added the book
  lastUpdated?: Date;
}

export interface Loan {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  bookTitle: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: "active" | "returned" | "overdue";
  processedBy?: string; // Librarian who processed the loan
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  bookTitle: string;
  reservationDate: Date;
  expiryDate: Date;
  status: "pending" | "fulfilled" | "expired" | "cancelled";
  approvedBy?: string; // Librarian who approved the reservation
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: Date;
  isRead: boolean;
  type: "due_date" | "reservation" | "system" | "overdue";
  actionLink?: string; // Optional link to take action on the notification
}

export interface BookInventoryAction {
  id: string;
  bookId: string;
  bookTitle: string;
  actionType: "add" | "remove" | "update";
  quantity: number;
  date: Date;
  performedBy: string; // Admin ID
  notes?: string;
}

export interface EnrollmentDetails {
  enrollmentNo: string;
  year: string; // First 2 digits - e.g., "24" for 2024
  month: string; // Next 2 digits - e.g., "01" for January
  instituteCode: string; // Next 3 digits - e.g., "331"
  departmentCode: string; // Next 2 digits - e.g., "16" for IT
  serialNumber: string; // Last 3 digits - e.g., "008"
}
