import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import SiteFooter from "@/components/layout/SiteFooter";
import BookDetail from "@/components/books/BookDetail";
import { Button } from "@/components/ui/button";
import { Book } from "@/types";
import { ArrowLeft } from "lucide-react";

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/books/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const backendOrigin = (API_URL || "http://localhost:5000/api").replace(
          /\/api\/?$/,
          ""
        );
        const isInvalidFunctionString = (s: string) =>
          /function\s+link\s*\(|link\(options,\s*originalCb\)/.test(s);
        const makeUrl = (p: any) => {
          if (!p) return undefined;
          if (typeof p !== "string") return undefined;
          if (isInvalidFunctionString(p)) return undefined;
          if (/^https?:\/\//.test(p)) return p;
          return `${backendOrigin}/${p.replace(/^[\/*]/, "")}`;
        };
        if (cancelled) return;
        const mapped: Book = {
          id: data.id || data._id,
          title: data.title,
          author: data.author || "Unknown",
          isbn: data.isbn || "",
          coverImage:
            makeUrl(data.coverImage) ||
            "https://via.placeholder.com/300x450?text=No+Cover",
          pdfFile: makeUrl(data.pdfFile),
          description: data.description || "No description provided.",
          publicationYear: data.publicationYear || 0,
          publisher: data.publisher || "",
          category: data.categories || [],
          totalCopies: data.totalCopies || 0,
          availableCopies: data.availableCopies || 0,
          location: data.location || "",
          rating: data.rating,
          status: data.status || "available",
        };
        setBook(mapped);
      } catch (e) {
        console.error(e);
        setBook(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex">
        <Sidebar className="hidden lg:block h-[calc(100vh-4rem)]" />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <Button variant="ghost" className="mr-2 p-0 h-8 w-8" asChild>
                  <Link to="/catalog">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-800">
                  {isLoading ? "Loading..." : book?.title || "Book Not Found"}
                </h1>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col lg:flex-row gap-6 animate-pulse">
                <div className="flex-shrink-0 w-full lg:w-1/3 xl:w-1/4">
                  <div className="aspect-[2/3] bg-gray-200 rounded"></div>
                </div>
                <div className="flex-grow space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ) : book ? (
              <BookDetail book={book} />
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Book Not Found</h2>
                <p className="text-gray-600 mb-6">
                  The book you are looking for does not exist or has been
                  removed.
                </p>
                <Button asChild className="bg-library-700">
                  <Link to="/catalog">Return to Catalog</Link>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <SiteFooter noTopMargin />
    </div>
  );
};

export default BookDetailPage;
