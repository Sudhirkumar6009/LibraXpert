export interface Loan {
  id: string;
  bookId: string;
  userId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: "active" | "returned" | "overdue";
  renewalStatus?: "none" | "pending" | "approved" | "declined";
  renewalRequestedAt?: string;
  renewalDecisionAt?: string;
  renewalCount?: number;
}