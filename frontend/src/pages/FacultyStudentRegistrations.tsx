import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type PendingStudent = {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enrollmentNo?: string;
  departmentCode?: string;
  departmentName?: string;
  createdAt: string;
  approvalStatus: "pending" | "approved" | "declined";
};

const FacultyStudentRegistrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canManage = user?.role === "faculty" || user?.role === "admin";

  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/faculty-registrations/pending-students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load pending students");
      }

      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Unable to load pending students",
        description: error.message,
        variant: "destructive",
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    fetchPendingStudents();
  }, [canManage]);

  const handleApprove = async (student: PendingStudent) => {
    try {
      setProcessingId(student._id);
      const comment = window.prompt("Optional approval note:") || "";
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/faculty-registrations/students/${student._id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comment: comment || undefined }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to approve student");
      }

      setStudents((current) =>
        current.filter((item) => item._id !== student._id),
      );
      toast({
        title: "Student approved",
        description: `${student.username} can now log in as a student.`,
      });
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (student: PendingStudent) => {
    try {
      setProcessingId(student._id);
      const comment =
        window.prompt("Reason for decline (optional):") ||
        "Registration declined by faculty";
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/faculty-registrations/students/${student._id}/decline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comment }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to decline student");
      }

      setStudents((current) =>
        current.filter((item) => item._id !== student._id),
      );
      toast({
        title: "Student declined",
        description: `${student.username} has been declined.`,
      });
    } catch (error: any) {
      toast({
        title: "Decline failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-sm text-slate-600">Loading user session...</div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-8 animate-fade-in space-y-2">
        <h1 className="text-2xl font-semibold">
          Student Registration Approvals
        </h1>
        <p className="text-sm text-slate-600">
          Only faculty and administrators can access this section.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Student Registration Approvals
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Review pending student signups and approve or decline department-wise
          requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">
              Loading pending students...
            </p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500">
              No pending student registrations.
            </p>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student._id}
                  className="border rounded-md p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {student.username}
                    </p>
                    <p className="text-sm text-slate-600">{student.email}</p>
                    <p className="text-xs text-slate-500">
                      Enrollment: {student.enrollmentNo || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Department:{" "}
                      {student.departmentName || student.departmentCode || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Requested: {new Date(student.createdAt).toLocaleString()}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {student.approvalStatus}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={processingId === student._id}
                      onClick={() => handleApprove(student)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={processingId === student._id}
                      onClick={() => handleDecline(student)}
                    >
                      Decline
                    </Button>
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

export default FacultyStudentRegistrationsPage;
