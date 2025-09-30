import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ManagementReservationsPage = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Fetch all pending reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("libraxpert_token");
        const response = await fetch(`${API_URL}/reservations/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch reservations: ${response.status}`);
        }

        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast({
          title: "Error",
          description: "Failed to load reservations.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [toast]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Notify user when book becomes available
  const handleNotifyUser = async (bookId) => {
    try {
      setProcessingId(bookId);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/reservations/notify-availability/${bookId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to notify user");
      }

      const data = await response.json();

      // Update local state - remove the notified reservation
      setReservations((prevReservations) =>
        prevReservations.filter(
          (r) => !(r.book._id === bookId && r._id === data.reservation._id)
        )
      );

      toast({
        title: "Success",
        description: "User has been notified about book availability.",
      });
    } catch (error) {
      console.error("Error notifying user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to notify user",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Calculate days waiting
  const calculateDaysWaiting = (requestedAt) => {
    const requested = new Date(requestedAt);
    const today = new Date();
    const differenceInTime = today.getTime() - requested.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reservation Management</CardTitle>
          <CardDescription>
            Manage waiting lists and notify users when books become available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-library-600"></div>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending reservations found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead>Waiting (Days)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation._id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {reservation.book && reservation.book.coverImage ? (
                            <img
                              src={reservation.book.coverImage}
                              alt={reservation.book.title}
                              className="h-14 w-10 object-cover rounded-sm"
                            />
                          ) : (
                            <div className="h-14 w-10 bg-library-50 flex items-center justify-center rounded-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-library-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {reservation.book
                                ? reservation.book.title
                                : "Unknown Book"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {reservation.book ? reservation.book.author : ""}
                            </p>
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-800 border-yellow-200"
                              >
                                {reservation.book &&
                                reservation.book.availableCopies > 0
                                  ? `${reservation.book.availableCopies} copies available`
                                  : "No copies available"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {reservation.user
                              ? `${reservation.user.firstName || ""} ${
                                  reservation.user.lastName || ""
                                }`.trim() || reservation.user.username
                              : "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {reservation.user
                              ? reservation.user.enrollmentNo ||
                                reservation.user.email
                              : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(reservation.requestedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-800 border-blue-200"
                        >
                          {calculateDaysWaiting(reservation.requestedAt)} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleNotifyUser(reservation.book._id)}
                          disabled={
                            processingId === reservation.book._id ||
                            (reservation.book &&
                              reservation.book.availableCopies <= 0)
                          }
                          size="sm"
                          className={
                            reservation.book &&
                            reservation.book.availableCopies > 0
                              ? "bg-library-600 hover:bg-library-700"
                              : "bg-gray-300 text-gray-600 cursor-not-allowed"
                          }
                        >
                          {processingId === reservation.book._id
                            ? "Processing..."
                            : "Notify User"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementReservationsPage;
