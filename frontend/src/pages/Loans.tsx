import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Loan } from "@/lib/loan";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LoansPage = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("libraxpert_token");
        const res = await fetch(`${API_URL}/loans/my-loans`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Handle non-JSON responses
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch loans");
        }

        const data = await res.json();
        setLoans(data);
      } catch (err: any) {
        console.error("Error fetching loans:", err);
        toast({
          title: "Error fetching loans",
          description: err.message,
          variant: "destructive",
        });
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLoans();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "returned":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700">
            Returned
          </Badge>
        );
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderRenewalStatus = (loan: Loan) => {
    switch (loan.renewalStatus) {
      case "pending":
        return (
          <p className="text-xs font-medium text-amber-600">
            Renewal pending librarian approval
            {loan.renewalRequestedAt
              ? ` • Requested ${formatDateTime(loan.renewalRequestedAt)}`
              : null}
          </p>
        );
      case "approved":
        return (
          <p className="text-xs text-slate-500">
            Renewed {loan.renewalCount ?? 0} time
            {(loan.renewalCount ?? 0) === 1 ? "" : "s"}
            {loan.renewalDecisionAt
              ? ` • Last approved ${formatDateTime(loan.renewalDecisionAt)}`
              : null}
          </p>
        );
      case "declined":
        return (
          <p className="text-xs font-medium text-red-500">
            Last renewal request declined
            {loan.renewalDecisionAt
              ? ` • ${formatDateTime(loan.renewalDecisionAt)}`
              : null}
          </p>
        );
      default:
        return null;
    }
  };

  const canRequestRenewal = (loan: Loan) => {
    if (loan.status !== "active") return false;
    return loan.renewalStatus !== "pending";
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) {
      return "Due date unavailable";
    }

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    }
    return `${diffDays} days remaining`;
  };

  const handleRenewalRequest = async (loanId: string) => {
    try {
      const token = localStorage.getItem("libraxpert_token");
      const res = await fetch(`${API_URL}/loans/${loanId}/request-renewal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to request renewal");
      }

      const updatedLoan = await res.json();

      setLoans((currentLoans) =>
        currentLoans.map((loan) => (loan.id === loanId ? updatedLoan : loan))
      );

      toast({
        title: "Renewal requested",
        description: "We'll notify you once a librarian reviews it.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to request renewal",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          My Loans
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Track and manage your current and past loans.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-library-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-sm text-slate-500">Loading your loans...</p>
        </div>
      ) : loans.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-library-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No books borrowed yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Visit the catalog to find and borrow books
            </p>
            <Button
              className="mt-6 bg-library-500 hover:bg-library-600"
              asChild
            >
              <a href="/catalog">Browse Catalog</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => (
            <Card key={loan.id} className="overflow-hidden">
              <div className="flex h-full">
                <div className="w-1/3 bg-slate-100">
                  {loan.coverImage ? (
                    <img
                      src={loan.coverImage}
                      alt={loan.bookTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-library-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-12 w-12 text-library-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium line-clamp-2">
                      {loan.bookTitle}
                    </h3>
                    <p className="text-sm text-slate-500 mb-2">
                      {loan.bookAuthor}
                    </p>
                    <div className="my-2">{getStatusBadge(loan.status)}</div>
                    {renderRenewalStatus(loan)}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">
                      <span className="block">
                        Borrowed: {formatDate(loan.borrowDate)}
                      </span>
                      <span className="block">
                        Due: {formatDateTime(loan.dueDate)}
                      </span>
                      {loan.status === "active" && (
                        <span className="block font-medium text-library-600">
                          {getDaysRemaining(loan.dueDate)}
                        </span>
                      )}
                      {loan.returnDate && (
                        <span className="block">
                          Returned: {formatDate(loan.returnDate)}
                        </span>
                      )}
                    </div>
                    {loan.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-library-600 border-library-300 hover:bg-library-50 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => handleRenewalRequest(loan.id)}
                        disabled={!canRequestRenewal(loan)}
                      >
                        {loan.renewalStatus === "pending"
                          ? "Renewal Pending"
                          : loan.renewalStatus === "approved" &&
                            (loan.renewalCount ?? 0) > 0
                          ? "Request Another Renewal"
                          : loan.renewalStatus === "declined"
                          ? "Request Renewal Again"
                          : "Request Renewal"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoansPage;
