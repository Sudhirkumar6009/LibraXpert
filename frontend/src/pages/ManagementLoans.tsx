import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type RenewalRequest = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string | null;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowDate: string;
  dueDate: string;
  renewalRequestedAt: string;
  renewalCount: number;
};

const ManagementLoansPage = () => {
  const { user } = useAuth();
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const isLibrarian =
    !!user && (user.role === "librarian" || user.role === "admin");

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

  const fetchRenewalRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("libraxpert_token");
      const res = await fetch(`${API_URL}/loans/pending-renewals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to fetch renewal requests"
        );
      }

      const data: RenewalRequest[] = await res.json();
      setRenewalRequests(data);
    } catch (err: any) {
      console.error("Error fetching renewal requests:", err);
      toast({
        title: "Unable to load renewals",
        description: err.message,
        variant: "destructive",
      });
      setRenewalRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLibrarian) {
      fetchRenewalRequests();
    }
  }, [isLibrarian]);

  const handleRenewalDecision = async (
    requestId: string,
    action: "approve" | "decline"
  ) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem("libraxpert_token");

      let endpoint = `${API_URL}/loans/${requestId}/renew`;
      let fetchOptions: RequestInit = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (action === "decline") {
        const reason =
          window.prompt("Add an optional note for the borrower:") || undefined;
        endpoint = `${endpoint}/decline`;
        fetchOptions = {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        };
      }

      const res = await fetch(endpoint, fetchOptions);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${action} renewal`);
      }

      setRenewalRequests((current) =>
        current.filter((req) => req.id !== requestId)
      );

      toast({
        title: action === "approve" ? "Renewal approved" : "Renewal declined",
        description:
          action === "approve"
            ? "The due date has been extended by 30 days."
            : "The borrower will be notified of your decision.",
      });
    } catch (err: any) {
      toast({
        title: "Action failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) {
    return (
      <div className="p-8 animate-fade-in text-center text-sm text-slate-500">
        Loading account details...
      </div>
    );
  }

  if (!isLibrarian) {
    return (
      <div className="p-8 animate-fade-in space-y-2">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Only librarians and administrators can manage renewal requests.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Renewal Requests
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          Review outstanding renewal requests and extend loans when appropriate.
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-library-400 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-sm text-slate-500">
            Loading renewal requests...
          </p>
        </div>
      ) : renewalRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 text-library-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-full w-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">No pending renewals</h3>
            <p className="text-sm text-slate-500">
              Borrowers will appear here whenever they request additional time.
            </p>
            <Button variant="outline" onClick={fetchRenewalRequests}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {renewalRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-1/3 bg-slate-100">
                  {request.coverImage ? (
                    <img
                      src={request.coverImage}
                      alt={request.bookTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-library-100 p-6">
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
                <div className="flex-1">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold line-clamp-2">
                          {request.bookTitle}
                        </CardTitle>
                        <Badge variant="secondary">
                          Renewal #{(request.renewalCount ?? 0) + 1}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        Requested by {request.borrowerName}
                        {request.borrowerEmail
                          ? ` • ${request.borrowerEmail}`
                          : ""}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 text-xs text-slate-600">
                      <span>
                        Current due: {formatDateTime(request.dueDate)}
                      </span>
                      <span>
                        Borrowed on: {formatDateTime(request.borrowDate)}
                      </span>
                      <span>
                        Requested on:{" "}
                        {formatDateTime(request.renewalRequestedAt)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        className="sm:flex-1 bg-library-600 hover:bg-library-700"
                        onClick={() =>
                          handleRenewalDecision(request.id, "approve")
                        }
                        disabled={processingId === request.id}
                      >
                        Approve +30 days
                      </Button>
                      <Button
                        variant="destructive"
                        className="sm:flex-1"
                        onClick={() =>
                          handleRenewalDecision(request.id, "decline")
                        }
                        disabled={processingId === request.id}
                      >
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagementLoansPage;
