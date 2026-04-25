import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type PurchaseRequestItem = {
  _id: string;
  title: string;
  author?: string;
  isbn?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "purchased";
  adminNote?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  purchasedAt?: string;
};

const emptyForm = {
  title: "",
  author: "",
  isbn: "",
  reason: "",
};

const PurchaseRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PurchaseRequestItem[]>([]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/purchase-requests/my-requests`, {
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
    if (!user) return;
    fetchMyRequests();
  }, [user]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title) {
      toast({
        title: "Title required",
        description: "Enter at least the requested book title.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/purchase-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to submit purchase request",
        );
      }

      setForm(emptyForm);
      await fetchMyRequests();
      toast({
        title: "Request submitted",
        description: "Librarians have been notified.",
      });
    } catch (error: any) {
      toast({
        title: "Unable to submit request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: PurchaseRequestItem["status"]) => {
    if (status === "pending") return <Badge variant="outline">Pending</Badge>;
    if (status === "approved")
      return <Badge className="bg-blue-600">Approved</Badge>;
    if (status === "rejected")
      return <Badge variant="destructive">Rejected</Badge>;
    return <Badge className="bg-green-600">Purchased</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Purchase Requests
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Request books for purchase. After librarian approval and offline
          payment success, the book is added to your owned books.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request a New Book Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Clean Code"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    author: event.target.value,
                  }))
                }
                placeholder="Robert C. Martin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN (optional)</Label>
              <Input
                id="isbn"
                value={form.isbn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isbn: event.target.value,
                  }))
                }
                placeholder="9780132350884"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Why this book should be purchased"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Purchase Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Purchase Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">
              No purchase requests submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="border rounded-md p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-800">
                      {request.title}
                    </p>
                    {statusBadge(request.status)}
                  </div>
                  <p className="text-sm text-slate-600">
                    {request.author || "Unknown author"}
                    {request.isbn ? ` • ISBN ${request.isbn}` : ""}
                  </p>
                  {request.reason ? (
                    <p className="text-sm text-slate-600">
                      Reason: {request.reason}
                    </p>
                  ) : null}
                  {request.adminNote ? (
                    <p className="text-sm text-slate-600">
                      Librarian note: {request.adminNote}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    Submitted: {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseRequestsPage;
