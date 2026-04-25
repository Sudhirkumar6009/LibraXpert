import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type ActiveLoan = {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string | null;
  dueDate: string;
  overdueDays?: number;
  fineAmount?: number;
  borrowerName?: string;
  borrowerEmail?: string;
};

type PendingFine = {
  _id: string;
  amount: number;
  overdueDays: number;
  dailyRate: number;
  user?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    enrollmentNo?: string;
  };
  book?: {
    title?: string;
    author?: string;
  };
};

const ManagementReturnsPage = () => {
  const { user } = useAuth();
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loadingFines, setLoadingFines] = useState(true);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [pendingFines, setPendingFines] = useState<PendingFine[]>([]);
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);
  const [processingFineId, setProcessingFineId] = useState<string | null>(null);

  const isLibrarian = user?.role === "librarian" || user?.role === "admin";

  const formatDateTime = (value?: string) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
  };

  const getUserDisplayName = (fine: PendingFine) => {
    const person = fine.user;
    if (!person) return "Unknown user";
    const full = [person.firstName, person.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return (
      full ||
      person.enrollmentNo ||
      person.username ||
      person.email ||
      "Unknown user"
    );
  };

  const fetchActiveLoans = async () => {
    try {
      setLoadingLoans(true);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/loans/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch active loans");
      }

      const data = await response.json();
      setActiveLoans(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Unable to load active loans",
        description: error.message,
        variant: "destructive",
      });
      setActiveLoans([]);
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchPendingFines = async () => {
    try {
      setLoadingFines(true);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/fines/pending-payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to fetch pending fine payments",
        );
      }

      const data = await response.json();
      setPendingFines(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Unable to load pending fine payments",
        description: error.message,
        variant: "destructive",
      });
      setPendingFines([]);
    } finally {
      setLoadingFines(false);
    }
  };

  useEffect(() => {
    if (!isLibrarian) return;
    fetchActiveLoans();
    fetchPendingFines();
  }, [isLibrarian]);

  const handleReturn = async (loan: ActiveLoan) => {
    const confirmed = window.confirm(
      `Mark "${loan.bookTitle}" as returned for ${loan.borrowerName || "this user"}?`,
    );
    if (!confirmed) return;

    try {
      setProcessingLoanId(loan.id);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/loans/${loan.id}/return`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to process return");
      }

      const data = await response.json();
      setActiveLoans((current) =>
        current.filter((item) => item.id !== loan.id),
      );

      if (data?.fine?.amount) {
        toast({
          title: "Return processed with fine",
          description: `Fine Rs. ${data.fine.amount} is now waiting for offline payment approval.`,
        });
        fetchPendingFines();
      } else {
        toast({
          title: "Return processed",
          description: "Book returned successfully with no pending fine.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Unable to process return",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingLoanId(null);
    }
  };

  const handleApproveFinePayment = async (fine: PendingFine) => {
    const note = window.prompt("Optional note for payment approval:") || "";

    try {
      setProcessingFineId(fine._id);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/fines/${fine._id}/approve-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ note: note || undefined }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to approve payment");
      }

      setPendingFines((current) =>
        current.filter((item) => item._id !== fine._id),
      );
      toast({
        title: "Fine payment approved",
        description: `Rs. ${fine.amount} marked as paid.`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to approve payment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingFineId(null);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-sm text-slate-600">Loading user session...</div>
    );
  }

  if (!isLibrarian) {
    return (
      <div className="p-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-4">Returns & Fines</h1>
        <p className="text-sm text-red-600">
          Only librarians and administrators can process returns and fine
          payments.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Returns & Fines</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Return books, calculate overdue fines at Rs. 1/day, and approve
          offline fine payments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLoans ? (
            <p className="text-sm text-slate-500">Loading active loans...</p>
          ) : activeLoans.length === 0 ? (
            <p className="text-sm text-slate-500">No active loans found.</p>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{loan.bookTitle}</p>
                    <p className="text-sm text-slate-600">{loan.bookAuthor}</p>
                    <p className="text-xs text-slate-500">
                      Borrower: {loan.borrowerName || "Unknown"}
                      {loan.borrowerEmail ? ` (${loan.borrowerEmail})` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      Due: {formatDateTime(loan.dueDate)}
                    </p>
                    {(loan.overdueDays || 0) > 0 ? (
                      <Badge variant="destructive" className="mt-1">
                        Overdue {loan.overdueDays} day(s) • Estimated fine Rs.{" "}
                        {loan.fineAmount || 0}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1">
                        On time
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleReturn(loan)}
                    disabled={processingLoanId === loan.id}
                  >
                    {processingLoanId === loan.id
                      ? "Processing..."
                      : "Mark Returned"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Offline Fine Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFines ? (
            <p className="text-sm text-slate-500">
              Loading pending payments...
            </p>
          ) : pendingFines.length === 0 ? (
            <p className="text-sm text-slate-500">No pending fine payments.</p>
          ) : (
            <div className="space-y-3">
              {pendingFines.map((fine) => (
                <div
                  key={fine._id}
                  className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{fine.book?.title || "Book"}</p>
                    <p className="text-sm text-slate-600">
                      {fine.book?.author || "Unknown Author"}
                    </p>
                    <p className="text-xs text-slate-500">
                      User: {getUserDisplayName(fine)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Overdue {fine.overdueDays} day(s) x Rs. {fine.dailyRate} =
                      Rs. {fine.amount}
                    </p>
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveFinePayment(fine)}
                    disabled={processingFineId === fine._id}
                  >
                    {processingFineId === fine._id
                      ? "Approving..."
                      : "Approve Payment"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementReturnsPage;
