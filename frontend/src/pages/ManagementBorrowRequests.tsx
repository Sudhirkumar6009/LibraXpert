import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface BorrowRequest {
  _id: string;
  userId: string;
  bookId: string;
  status: string;
  createdAt: string;
  book?: {
    title: string;
    author: string;
    coverImage?: string;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    enrollmentNo?: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ManagementBorrowRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("libraxpert_token");
        const res = await fetch(`${API_URL}/borrow-requests/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Request failed (${res.status})`
          );
        }

        const data = await res.json();
        setRequests(data);
      } catch (error: any) {
        console.error("Error fetching borrow requests:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load borrow requests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === "librarian" || user.role === "admin")) {
      fetchRequests();
    }
  }, [user]);

  const handleAction = async (
    requestId: string,
    action: "approve" | "decline"
  ) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem("libraxpert_token");
      const res = await fetch(
        `${API_URL}/borrow-requests/${requestId}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed (${res.status})`);
      }

      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req._id !== requestId));

      toast({
        title: `Request ${action === "approve" ? "Approved" : "Declined"}`,
        description: `The borrow request has been ${
          action === "approve" ? "approved" : "declined"
        }.`,
      });
    } catch (error: any) {
      console.error(`Error ${action}ing request:`, error);
      toast({
        title: "Action Failed",
        description: error.message || `Failed to ${action} request`,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserDisplayName = (request: BorrowRequest) => {
    if (!request.user) return "Unknown User";

    if (request.user.firstName && request.user.lastName) {
      return `${request.user.firstName} ${request.user.lastName}`;
    }

    return request.user.username || request.user.enrollmentNo || "Unknown User";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Borrow Requests
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Manage pending book borrow requests.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-library-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-sm text-slate-500">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
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
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No pending requests</h3>
            <p className="mt-1 text-sm text-slate-500">
              There are currently no pending borrow requests
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <Card key={request._id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">
                  {request.book?.title || "Unknown Book"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Requested by:</span>{" "}
                    {getUserDisplayName(request)}
                  </p>
                  {request.book?.author && (
                    <p className="text-sm text-slate-500">
                      <span className="font-medium">Author:</span>{" "}
                      {request.book.author}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Requested on:</span>{" "}
                    {formatDate(request.createdAt)}
                  </p>

                  <div className="flex space-x-2 pt-3">
                    <Button
                      className="bg-green-500 hover:bg-green-600 flex-1"
                      disabled={processingId === request._id}
                      onClick={() => handleAction(request._id, "approve")}
                    >
                      {processingId === request._id
                        ? "Processing..."
                        : "Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-300 hover:bg-red-50 flex-1"
                      disabled={processingId === request._id}
                      onClick={() => handleAction(request._id, "decline")}
                    >
                      {processingId === request._id
                        ? "Processing..."
                        : "Decline"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagementBorrowRequestsPage;
