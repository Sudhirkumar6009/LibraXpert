import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  BookmarkCheck,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

type RecommendedBook = {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  status?: string;
  totalCopies: number;
  availableCopies: number;
  borrowCount: number;
  reservationCount: number;
  circulationRatio: number;
  score: number;
  reasons: string[];
  primaryCategory: string;
};

type RecommendedBooksSectionProps = {
  title?: string;
  subtitle?: string;
  limit?: number;
  className?: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const RecommendedBooksSection: React.FC<RecommendedBooksSectionProps> = ({
  title = "Recommended Reads",
  subtitle = "Generated from circulation ratio, borrow demand, and reservation demand.",
  limit = 8,
  className = "",
}) => {
  const [items, setItems] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `${API_URL}/books/recommendations?limit=${limit}`,
        );

        if (!response.ok) {
          const details = await response.json().catch(() => ({}));
          throw new Error(details.message || "Failed to load recommendations");
        }

        const payload = await response.json();
        setItems(
          Array.isArray(payload?.recommendations)
            ? payload.recommendations
            : [],
        );
      } catch (err: any) {
        console.error("Recommendations load error:", err);
        setError(err.message || "Unable to load recommendations");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [limit]);

  const backendOrigin = useMemo(
    () => (API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, ""),
    [],
  );

  const makeUrl = (value?: string) => {
    if (!value || typeof value !== "string") return undefined;
    if (/^https?:\/\//.test(value)) return value;
    return `${backendOrigin}/${value.replace(/^\/*/, "")}`;
  };

  return (
    <section className={`space-y-5 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-sm text-slate-600 mt-2">{subtitle}</p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-library-300 text-library-700 hover:bg-library-50"
        >
          <Link to="/catalog" className="flex items-center gap-2">
            View Catalog <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: Math.min(limit, 8) }).map((_, index) => (
            <Card
              key={`placeholder-${index}`}
              className="border-library-100/80"
            >
              <CardContent className="p-4">
                <div className="h-40 bg-slate-100 animate-pulse rounded-md" />
                <div className="h-4 mt-4 bg-slate-100 animate-pulse rounded" />
                <div className="h-3 mt-2 w-2/3 bg-slate-100 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">
            {error}
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-slate-600">
            No recommendations available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {items.map((book) => {
            const coverUrl = makeUrl(book.coverImage);
            return (
              <Card
                key={book.id}
                className="group overflow-hidden border-library-100/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-44 bg-slate-100">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-library-100 to-library-200 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-library-500" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-library-700 border border-library-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {(book.score * 100).toFixed(0)}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-2">
                    {book.title}
                  </CardTitle>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {book.author || "Unknown author"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Borrowed: {book.borrowCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookmarkCheck className="h-3 w-3" />
                      Reserved: {book.reservationCount}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Ratio {(book.circulationRatio * 100).toFixed(0)}% •{" "}
                    {book.availableCopies}/{book.totalCopies} available
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {book.reasons.slice(0, 2).map((reason) => (
                      <Badge
                        key={`${book.id}-${reason}`}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-library-600 hover:bg-library-700"
                  >
                    <Link to={`/book/${book.id}`}>Open Book</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecommendedBooksSection;
