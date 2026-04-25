import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type RequestUser = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  enrollmentNo?: string;
};

type PurchaseRequestItem = {
  _id: string;
  title: string;
  author?: string;
  isbn?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "purchased";
  adminNote?: string;
  requestedBy?: RequestUser;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  purchasedAt?: string;
};

const ManagementPurchaseRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PurchaseRequestItem[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isLibrarian = user?.role === "librarian" || user?.role === "admin";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/purchase-requests/manage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to load purchase requests",
        );
      }

      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Unable to load purchase requests",
        description: error.message,
        variant: "destructive",
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLibrarian) return;
    fetchRequests();
  }, [isLibrarian]);

  const getRequesterName = (request: PurchaseRequestItem) => {
    const person = request.requestedBy;
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

  const runAction = async (
    requestId: string,
    action: "approve" | "reject" | "mark-paid",
    payload?: Record<string, any>,
  ) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/purchase-requests/${requestId}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload || {}),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${action} request`);
      }

      await fetchRequests();
      toast({
        title:
          action === "approve"
            ? "Request approved"
            : action === "reject"
              ? "Request rejected"
              : "Payment marked successful",
        description:
          action === "mark-paid"
            ? "Owned book entry has been created for the requester."
            : "Notification sent to requester.",
      });
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (request: PurchaseRequestItem) => {
    const note = window.prompt("Optional approval note:") || "";
    runAction(request._id, "approve", { adminNote: note || undefined });
  };

  const handleReject = async (request: PurchaseRequestItem) => {
    const note = window.prompt("Reason for rejection (optional):") || "";
    runAction(request._id, "reject", { adminNote: note || undefined });
  };

  const handleMarkPaid = async (request: PurchaseRequestItem) => {
    const linkedBookId = window.prompt(
      "Optional: Enter existing library book ID to link, or leave empty:",
    );
    const note = window.prompt("Optional payment note:") || "";

    runAction(request._id, "mark-paid", {
      linkedBookId: linkedBookId || undefined,
      note: note || undefined,
    });
  };

  if (!user) {
    return (
      <div className="p-8 text-sm text-slate-600">Loading user session...</div>
    );
  }

  if (!isLibrarian) {
    return (
      <div className="p-8 animate-fade-in space-y-2">
        <h1 className="text-2xl font-semibold">Purchase Requests</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Only librarians and administrators can manage purchase requests.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Purchase Requests Management
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Approve or reject requests. After offline payment success, mark as
          paid to assign ownership.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">
              No purchase requests available.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="border rounded-md p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-800">
                      {request.title}
                    </p>
                    <Badge
                      className={
                        request.status === "pending"
                          ? "bg-slate-700"
                          : request.status === "approved"
                            ? "bg-blue-600"
                            : request.status === "rejected"
                              ? "bg-red-600"
                              : "bg-green-600"
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {request.author || "Unknown author"}
                    {request.isbn ? ` • ISBN ${request.isbn}` : ""}
                  </p>
                  <p className="text-sm text-slate-600">
                    Requested by: {getRequesterName(request)}
                  </p>
                  {request.reason ? (
                    <p className="text-sm text-slate-600">
                      Reason: {request.reason}
                    </p>
                  ) : null}
                  {request.adminNote ? (
                    <p className="text-sm text-slate-600">
                      Admin note: {request.adminNote}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    Submitted: {new Date(request.createdAt).toLocaleString()}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {request.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleApprove(request)}
                          disabled={processingId === request._id}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
                          disabled={processingId === request._id}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {request.status === "approved" ? (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleMarkPaid(request)}
                        disabled={processingId === request._id}
                      >
                        Mark Payment Success
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementPurchaseRequestsPage;
