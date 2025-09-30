import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
import { Clock, CalendarX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Reservation } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Reservations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Function to format date
  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return "N/A";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Status badge styles
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    fulfilled: "bg-green-100 text-green-800 border-green-200",
    expired: "bg-gray-100 text-gray-600 border-gray-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("libraxpert_token");
        const response = await fetch(
          `${API_URL}/reservations/my-reservations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch reservations");
        }

        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast({
          title: "Error",
          description: "Failed to load reservations. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user, toast]);

  // Handle cancellation of reservation
  const handleCancelReservation = async (reservationId: string) => {
    try {
      setCancellingId(reservationId);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/reservations/${reservationId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel reservation");
      }

      // Update the local state
      setReservations(
        reservations.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: "cancelled" }
            : reservation
        )
      );

      toast({
        title: "Success",
        description: "Reservation has been cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  // Calculate days remaining until expiry
  const calculateDaysRemaining = (expiryDate: Date | string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const differenceInTime = expiry.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">My Reservations</CardTitle>
          <CardDescription>
            View and manage your book reservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-library-600"></div>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No Reservations Yet
              </h3>
              <p className="text-gray-500 mb-4">
                You haven't made any book reservations.
              </p>
              <Button
                className="bg-library-600 text-white hover:bg-library-700"
                onClick={() => navigate("/catalog")}
              >
                Browse Catalog
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Reserved On</TableHead>
                    <TableHead>Expires On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-3">
                          {reservation.book && reservation.book.coverImage ? (
                            <img
                              src={reservation.book.coverImage}
                              alt={reservation.bookTitle}
                              className="h-12 w-9 object-cover rounded-sm"
                            />
                          ) : (
                            <div className="h-12 w-9 bg-library-50 flex items-center justify-center rounded-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-6 w-6 text-library-300"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                                />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {reservation.bookTitle || "Unknown Book"}
                            </div>
                            {reservation.book && (
                              <div className="text-xs text-gray-500">
                                by {reservation.book.author}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(reservation.reservationDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(reservation.expiryDate)}</span>
                          {reservation.status === "pending" && (
                            <span className="text-xs text-gray-500">
                              {calculateDaysRemaining(reservation.expiryDate)}{" "}
                              days remaining
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${
                            statusStyles[reservation.status] || ""
                          }`}
                        >
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reservation.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCancelReservation(reservation.id)
                            }
                            disabled={cancellingId === reservation.id}
                            className="text-red-500 border-red-200 hover:bg-red-50"
                          >
                            <CalendarX className="h-3.5 w-3.5 mr-1" />
                            {cancellingId === reservation.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </Button>
                        )}
                        {reservation.status === "fulfilled" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              navigate(`/book/${reservation.bookId}`)
                            }
                            className="bg-library-600 hover:bg-library-700"
                          >
                            View Book
                          </Button>
                        )}
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

export default Reservations;
