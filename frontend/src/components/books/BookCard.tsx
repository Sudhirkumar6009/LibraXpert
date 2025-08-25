import React from "react";
import { Link } from "react-router-dom";
import { Book } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  // Normalize cover/pdf URLs in case backend returned relative paths
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const backendOrigin = (API_URL || "http://localhost:5000/api").replace(
    /\/api\/?$/,
    ""
  );
  const makeUrl = (p: any) => {
    if (!p) return undefined;
    if (typeof p !== "string") return undefined;
    if (/^https?:\/\//.test(p)) return p;
    return `${backendOrigin}/${p.replace(/^\/*/, "")}`;
  };

  const coverSrc = makeUrl(book.coverImage) || "/placeholder.svg";
  const statusColors = {
    available: "bg-green-100 text-green-800 border-green-200",
    reserved: "bg-yellow-100 text-yellow-800 border-yellow-200",
    borrowed: "bg-blue-100 text-blue-800 border-blue-200",
    unavailable: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Link to={`/book/${book.id}`}>
      <Card className="book-card overflow-hidden h-full border-gray-100 hover:shadow-sm">
        <div className="relative rounded-xl overflow-hidden shadow ring-1 ring-gray-200/70 bg-white/70 backdrop-blur-sm border border-white/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            <img
              src={coverSrc}
              alt={book.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-base leading-tight line-clamp-1 mb-1">
              {book.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-1 mb-2">
              {book.author}
            </p>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {book.publicationYear}
              </span>
              {book.rating !== undefined && (
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-xs font-semibold">
                    {book.rating}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
};

export default BookCard;
