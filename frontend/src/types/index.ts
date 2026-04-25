export type UserRole =
  | "student"
  | "external"
  | "faculty"
  | "librarian"
  | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  enrollmentNo?: string;
  departmentCode?: string;
  departmentName?: string;
  approvalStatus?: "pending" | "approved" | "declined";
  createdAt: Date;
  updatedAt: Date;
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
  pdfFile?: string; // PDF file URL/path
  description: string;
  publicationYear: number;
  publisher: string;
  category: string[];
  categories?: string[]; // Alternative field name used by backend
  tags?: string[]; // Tags for the book
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
  userName?: string;
  bookId: string;
  bookTitle: string;
  book?: Book;
  reservationDate: Date;
  expiryDate: Date;
  status: "pending" | "fulfilled" | "expired" | "cancelled";
  approvedBy?: string; // Librarian who approved the reservation
  fulfilledAt?: Date;
  cancelledAt?: Date;
  notifiedUser?: boolean;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type:
    | "due_date"
    | "reservation"
    | "system"
    | "overdue"
    | "feedback"
    | "fine_pending_payment"
    | "fine_paid"
    | "purchase_request"
    | "purchase_request_approved"
    | "purchase_request_rejected"
    | "purchase_request_paid"
    | "student_registration_approval"
    | "student_registration_approved"
    | "student_registration_declined";
  actionLink?: string; // Optional link to take action on the notification
  relatedId?: string;
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
