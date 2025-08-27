import React, { useState } from "react";
import { Book } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarCheck,
  BookCheck,
  BookX,
  Check,
  Clock,
  Download,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import EditBookModal from "./EditBookModal";
import DeleteBook from "./DeleteBook";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface BookDetailProps {
  book: Book;
}

const BookDetail = ({ book }: BookDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const statusColors = {
    available: "bg-green-100 text-green-800 border-green-200",
    reserved: "bg-yellow-100 text-yellow-800 border-yellow-200",
    borrowed: "bg-blue-100 text-blue-800 border-blue-200",
    unavailable: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const handleReserve = () => {
    setIsLoading(true);
    // Mock API call delay
    setTimeout(() => {
      toast({
        title: "Book Reserved",
        description: `You have successfully reserved "${book.title}". Please collect within 48 hours.`,
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleBorrow = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("libraxpert_token");
      const res = await fetch(`${API_URL}/borrow-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: book.id }),
      });
      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (body && body.message) message = body.message;
        } catch (e) {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }
      toast({
        title: "Request sent",
        description: "Borrow request sent to librarian",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Request failed",
        description: err.message || "Could not send request",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = () => {
    setIsLoading(true);
    // Mock API call delay
    setTimeout(() => {
      toast({
        title: "Book Returned",
        description: `You have successfully returned "${book.title}". Thank you!`,
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-shrink-0 w-full lg:w-1/3 xl:w-1/4">
        <Card className="overflow-hidden border-gray-100">
          <div className="aspect-[2/3] relative overflow-hidden">
            <img
              src={book.coverImage}
              alt={book.title}
              className="h-full w-full object-cover"
            />
            <Badge
              variant="outline"
              className={`absolute top-3 right-3 capitalize ${
                statusColors[book.status]
              }`}
            >
              {book.status}
            </Badge>
          </div>

          <CardFooter className="flex flex-col gap-3 pt-4">
            {/* PDF Download Button - Always visible if PDF exists */}
            {book.pdfFile && (
              <Button
                asChild
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <a
                  href={book.pdfFile}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            )}

            {user?.role === "student" && (
              <>
                {book.status === "available" ? (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button
                      onClick={handleReserve}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      Reserve
                    </Button>
                    <Button
                      onClick={handleBorrow}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <BookCheck className="mr-2 h-4 w-4" />
                      Borrow
                    </Button>
                  </div>
                ) : book.status === "borrowed" ? (
                  <Button
                    onClick={handleReturn}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <BookX className="mr-2 h-4 w-4" />
                    Return
                  </Button>
                ) : book.status === "reserved" ? (
                  <Button
                    onClick={handleBorrow}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Pick Up
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="w-full opacity-50 cursor-not-allowed"
                  >
                    Unavailable
                  </Button>
                )}
              </>
            )}

            {(user?.role === "librarian" || user?.role === "admin") && (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  className="w-full bg-library-400 hover:bg-library-500"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <DeleteBook
                  height={40}
                  deleteTitle
                  bookId={book.id}
                  title={book.title}
                  onDeleted={() => window.location.reload()}
                />
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="flex-grow">
        <Card className="border-gray-100 h-full">
          <CardHeader>
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {book.title}
                </CardTitle>
                <p className="text-gray-600 mt-1">by {book.author}</p>
              </div>

              {book.rating !== undefined && (
                <div className="flex items-center px-3 py-1 bg-yellow-50 rounded-full">
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 font-medium">{book.rating}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {book.description}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <h3 className="font-semibold mb-2">Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">ISBN:</dt>
                    <dd className="text-sm font-medium">{book.isbn}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Publication Year:</dt>
                    <dd className="text-sm font-medium">
                      {book.publicationYear}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Publisher:</dt>
                    <dd className="text-sm font-medium">{book.publisher}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Location:</dt>
                    <dd className="text-sm font-medium">{book.location}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Availability</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Status:</dt>
                    <dd className="text-sm">
                      <Badge
                        variant="outline"
                        className={`capitalize ${statusColors[book.status]}`}
                      >
                        {book.status}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Copies:</dt>
                    <dd className="text-sm font-medium">{book.totalCopies}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Available:</dt>
                    <dd className="text-sm font-medium">
                      {book.availableCopies}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {book.category.map((cat) => (
                  <Badge key={cat} variant="outline" className="bg-library-50">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Book Modal */}
      <EditBookModal
        book={book}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          toast({ title: "Book updated successfully!" });
          // Optionally refresh the page to show updated data
          window.location.reload();
        }}
      />
    </div>
  );
};

export default BookDetail;
