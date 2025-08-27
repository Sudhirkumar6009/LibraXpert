import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ManagementBorrowRequests: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("libraxpert_token");
        const res = await fetch(`${API_URL}/borrow-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error(err);
        toast({ title: "Failed to load borrow requests" });
      }
    };
    load();
  }, []);

  const process = async (id: string, action: "approve" | "decline") => {
    try {
      const token = localStorage.getItem("libraxpert_token");
      const res = await fetch(`${API_URL}/borrow-requests/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to process");
      toast({ title: `Request ${action}d` });
      setRequests((r) => r.filter((req) => req._id !== id));
    } catch (err) {
      console.error(err);
      toast({ title: "Action failed" });
    }
  };

  if (!user || !["librarian", "admin"].includes(user.role))
    return <div>Forbidden</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Borrow Requests</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requester</TableHead>
            <TableHead>Book</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Requested At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r._id}>
              <TableCell>
                {r.user?.enrollmentNo ||
                  r.user?.username ||
                  r.user?.email ||
                  r.user?._id}
              </TableCell>
              <TableCell>{r.book?.title}</TableCell>
              <TableCell>{r.message || "-"}</TableCell>
              <TableCell>{new Date(r.requestedAt).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => process(r._id, "approve")}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => process(r._id, "decline")}
                  >
                    Decline
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ManagementBorrowRequests;
