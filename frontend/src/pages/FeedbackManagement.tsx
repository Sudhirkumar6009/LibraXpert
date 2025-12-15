import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface Feedback {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  rating: number;
  status: "pending" | "reviewed" | "resolved";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  overall: {
    totalFeedback: number;
    averageRating: number;
    pendingCount: number;
    reviewedCount: number;
    resolvedCount: number;
  };
  bySubject: Array<{ _id: string; count: number; averageRating: number }>;
  byRating: Array<{ _id: number; count: number }>;
}

const FeedbackManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "",
    subject: "",
  });
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [pendingFeedbackId, setPendingFeedbackId] = useState<string | null>(
    null
  );

  const location = useLocation();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const userRole = (user?.role || "").toLowerCase();

  // Check if user has permission (admin-only)
  if (!user || userRole !== "admin") {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You need an administrator account to view this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem("libraxpert_token");
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      if (filter.subject) params.append("subject", filter.subject);

      const response = await fetch(`${API_URL}/feedback?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      } else {
        throw new Error("Failed to fetch feedback");
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback data",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/feedback-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateFeedback = async (
    feedbackId: string,
    status: string,
    notes?: string
  ) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          adminNotes: notes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Feedback updated successfully",
        });
        await fetchFeedback();
        await fetchStats();
        setSelectedFeedback(null);
        setAdminNotes("");
      } else {
        throw new Error("Failed to update feedback");
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFeedback(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [filter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const feedbackIdFromQuery = params.get("feedbackId");
    if (feedbackIdFromQuery && feedbackIdFromQuery !== pendingFeedbackId) {
      setPendingFeedbackId(feedbackIdFromQuery);
    }
  }, [location.search, pendingFeedbackId]);

  useEffect(() => {
    if (!pendingFeedbackId) return;

    const params = new URLSearchParams(location.search);
    const removeQueryParam = () => {
      params.delete("feedbackId");
      const nextUrl = `${location.pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      navigate(nextUrl, { replace: true });
    };

    const match = feedback.find((item) => item._id === pendingFeedbackId);
    if (match) {
      setSelectedFeedback(match);
      setAdminNotes(match.adminNotes || "");
      setPendingFeedbackId(null);
      removeQueryParam();
      return;
    }

    const fetchById = async () => {
      try {
        const token = localStorage.getItem("libraxpert_token");
        const response = await fetch(
          `${API_URL}/feedback/${pendingFeedbackId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch feedback");
        }

        const data: Feedback = await response.json();

        setFeedback((prev) => {
          const exists = prev.some((item) => item._id === data._id);
          if (exists) {
            return prev.map((item) => (item._id === data._id ? data : item));
          }
          return [data, ...prev];
        });

        setSelectedFeedback(data);
        setAdminNotes(data.adminNotes || "");
      } catch (error) {
        console.error("Error fetching feedback from notification:", error);
        toast({
          title: "Feedback unavailable",
          description:
            "We couldn't open the feedback item linked to this notification.",
          variant: "destructive",
        });
      } finally {
        setPendingFeedbackId(null);
        removeQueryParam();
      }
    };

    fetchById();
  }, [
    pendingFeedbackId,
    feedback,
    location.pathname,
    location.search,
    navigate,
    toast,
  ]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      reviewed: { color: "bg-blue-100 text-blue-800", icon: MessageSquare },
      resolved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    };

    const variant = variants[status as keyof typeof variants];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-library-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Feedback Management
        </h1>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Feedback
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.overall.totalFeedback}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-library-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Average Rating
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.overall.averageRating.toFixed(1)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">
                    {stats.overall.pendingCount}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold">
                    {stats.overall.resolvedCount}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </label>
              <Select
                value={filter.status}
                onValueChange={(value) =>
                  setFilter((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Subject
              </label>
              <Select
                value={filter.subject}
                onValueChange={(value) =>
                  setFilter((prev) => ({ ...prev, subject: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  <SelectItem value="book-collection">
                    Book Collection
                  </SelectItem>
                  <SelectItem value="library-services">
                    Library Services
                  </SelectItem>
                  <SelectItem value="digital-resources">
                    Digital Resources
                  </SelectItem>
                  <SelectItem value="staff-assistance">
                    Staff Assistance
                  </SelectItem>
                  <SelectItem value="facility-issues">
                    Facility Issues
                  </SelectItem>
                  <SelectItem value="system-technical">
                    System & Technical
                  </SelectItem>
                  <SelectItem value="suggestions">Suggestions</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="grid gap-4">
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No feedback found matching your filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => (
            <Card key={item._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{item.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Subject:{" "}
                        {item.subject
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      {renderStars(item.rating)}
                    </div>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                      {item.message}
                    </p>
                  </div>

                  {item.adminNotes && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Admin Notes:
                      </p>
                      <p className="text-blue-700">{item.adminNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFeedback(item);
                        setAdminNotes(item.adminNotes || "");
                      }}
                    >
                      Update Status
                    </Button>

                    {item.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={() => updateFeedback(item._id, "reviewed")}
                          disabled={updating}
                        >
                          Mark Reviewed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => updateFeedback(item._id, "resolved")}
                          disabled={updating}
                        >
                          Mark Resolved
                        </Button>
                      </>
                    )}

                    {item.status === "reviewed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => updateFeedback(item._id, "resolved")}
                        disabled={updating}
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Update Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <Select
                  value={selectedFeedback.status}
                  onValueChange={(value) =>
                    setSelectedFeedback((prev) =>
                      prev ? { ...prev, status: value as any } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Admin Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this feedback..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFeedback(null);
                    setAdminNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    updateFeedback(
                      selectedFeedback._id,
                      selectedFeedback.status,
                      adminNotes
                    )
                  }
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Update"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
