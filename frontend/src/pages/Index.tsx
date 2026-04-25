import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Search,
  User,
  BookCheck,
  ChevronRight,
  MonitorSmartphone,
  Star,
  CheckCircle,
  BellRing,
  LayoutDashboard,
  CloudUpload,
  MessageSquare,
  MessageSquareShare,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import RecommendedBooksSection from "@/components/books/RecommendedBooksSection";

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const [books, setBooks] = React.useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    rating: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.subject) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    if (formData.rating === 0) {
      newErrors.rating = "Rating is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessDialog(true);
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          rating: 0,
        });
        setErrors({});
        toast({
          title: "Feedback sent",
          description:
            "Thanks for sharing your thoughts. We'll review it shortly.",
        });
      } else {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessage = data.errors.join(", ");
          toast({
            title: "Submission Failed",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Submission Failed",
            description:
              data.message || "Failed to submit feedback. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Network Error",
        description:
          "Failed to submit feedback. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };
  React.useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/books`);
        const data = await res.json();
        const backendOrigin = (API_URL || "http://localhost:5000/api").replace(
          /\/api\/?$/,
          "",
        );
        const isInvalidFunctionString = (s: string) =>
          /function\s+link\s*\(|link\(options,\s*originalCb\)/.test(s);
        const makeUrl = (p: any) => {
          if (!p) return undefined;
          if (typeof p !== "string") return undefined;
          if (isInvalidFunctionString(p)) return undefined;
          if (/^https?:\/\//.test(p)) return p;
          return `${backendOrigin}/${p.replace(/^\/*/, "")}`;
        };
        setBooks(
          data.map((b: any) => ({
            ...b,
            coverImage: makeUrl(b.coverImage),
            pdfFile: makeUrl(b.pdfFile),
          })),
        );
      } catch (e) {
        console.error("Failed to load books", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const popularBooks = React.useMemo(() => {
    return [...books]
      .sort(
        (a, b) =>
          b.totalCopies -
          b.availableCopies -
          (a.totalCopies - a.availableCopies),
      )
      .slice(0, 10);
  }, [books]);

  const topAuthors = React.useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      if (b.author) {
        b.author.split(/,|&/).forEach((raw: string) => {
          const name = raw.trim();
          if (!name) return;
          counts[name] = (counts[name] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({
        id: name,
        name,
        books: count,
        avatar: name.charAt(0),
      }));
  }, [books]);
  const StarRating = ({
    rating,
    onRatingChange,
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
  }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? "fill-library-300 text-library-400"
                  : "text-gray-200"
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };
  const gradientText =
    "bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent";

  // local carousel offsets for authors and popular books (in-page sliding)
  const [authorStart, setAuthorStart] = React.useState<number>(0);
  const AUTHOR_VISIBLE = 4;

  const [booksStart, setBooksStart] = React.useState<number>(0);
  const BOOKS_VISIBLE = 5;

  return (
    <div className="min-h-screen flex flex-col">
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-10 w-10 text-library-500" />
              <div>
                <DialogTitle>Feedback sent</DialogTitle>
                <DialogDescription>
                  We appreciate your feedback. Our team will review it soon.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Full Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Library Books"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-2xl bg-transparent/50 pl-10 pt-20 pb-20 pr-20 rounded-lg mt-10">
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-4xl md:text-5xl text-white ">
                  Future of Learning
                </h3>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-library-200 via-library-400 to-library-500 bg-clip-text text-transparent">
                  LibraXpert
                </h1>
                <p className="text-xl font-['Helvetica', 'Arial', 'sans-serif'] md:text-2xl tracking-wide text-white/100 leading-relaxed">
                  Advanced Library Management System to Discover, borrow, and
                  manage library resources across all your devices with our
                  cross-platform solution.
                </p>
                <div className="flex flex-wrap gap-4 pt-6">
                  <Button
                    asChild
                    variant="outline"
                    className="relative p-8 w-45 text-lg border-transparent hover:bg-white border-library-800 text-library-500 bg-white hover:text-white transition-all duration-300 overflow-hidden group"
                  >
                    <Link
                      to="/catalog"
                      className="relative z-10 flex items-center justify-center gap-1"
                    >
                      {/* You can change these colors as needed */}
                      <div className="absolute inset-0 bg-gradient-to-r from-library-200 to-library-400 hover:transition-duration-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>

                      <span className="relative z-10">Discover Catalog</span>
                      <ChevronRight className="relative z-10 mt-1" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="relative p-8 w-44 text-lg border-transparent hover:bg-library-400 border-white/10 text-white bg-library-400 hover:text-white transition-all duration-300 overflow-hidden group"
                  >
                    <Link
                      to="/login"
                      className="relative z-10 flex items-center justify-center gap-1"
                    >
                      {/* You can change these colors as needed */}
                      <div className="absolute inset-0 bg-gradient-to-r from-library-200 to-library-500 hover:transition-duration-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>

                      <span className="relative z-10">Explore</span>
                      <ChevronRight className="relative z-10 mt-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="flex justify-center w-full mt-10">
        <span className="h-[3px] w-36 bg-gradient-to-r from-library-500 via-library-400 to-library-300 rounded-full" />
      </div>
      <section className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-library-50/20 to-white" />
        <div className="container mx-auto px-6 relative">
          <RecommendedBooksSection
            title="Recommended Collection"
            subtitle="Professional recommendations based on total/available copies, borrow history, and reservation demand."
            limit={8}
          />
        </div>
      </section>
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-library-50/70 via-white to-transparent" />
        <div className="absolute -top-24 right-8 h-64 w-64 rounded-full bg-library-200/30 blur-3xl" />
        <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-library-100/60 blur-3xl" />
        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-12">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-library-600">
                Collection Insights
              </p>
              <h2 className={`text-4xl md:text-5xl font-bold ${gradientText}`}>
                Best Authors
              </h2>
              <p className="text-library-700/90 text-lg">
                Identify the most read writers across your community and jump
                straight to their titles.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-xl border border-library-100/70 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-xs text-library-600">Total titles</p>
                  <p className="text-lg font-semibold text-library-800">
                    {books.length}
                  </p>
                </div>
                <div className="rounded-xl border border-library-100/70 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-xs text-library-600">Active authors</p>
                  <p className="text-lg font-semibold text-library-800">
                    {topAuthors.length}
                  </p>
                </div>
                <div className="rounded-xl border border-library-100/70 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-xs text-library-600">Top picks</p>
                  <p className="text-lg font-semibold text-library-800">
                    {popularBooks.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-library-600 text-white hover:bg-library-700"
              >
                <Link to="/catalog" className="flex items-center gap-2">
                  Browse by author <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-library-300 text-library-700 hover:bg-library-50"
              >
                <Link to="/search">Advanced search</Link>
              </Button>
            </div>
          </div>
          <div className="relative rounded-3xl border border-library-100/70 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
            {/* chevrons for sliding authors */}
            {topAuthors.length > AUTHOR_VISIBLE && (
              <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-20">
                <button
                  aria-label="prev authors"
                  onClick={() =>
                    setAuthorStart((s) => Math.max(0, s - AUTHOR_VISIBLE))
                  }
                  className="p-2 rounded-full bg-white/90 hover:bg-white shadow-md border border-library-100/70"
                >
                  <ChevronRight className="-rotate-180" />
                </button>
              </div>
            )}
            {topAuthors.length > AUTHOR_VISIBLE && (
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-20">
                <button
                  aria-label="next authors"
                  onClick={() =>
                    setAuthorStart((s) =>
                      Math.min(
                        s + AUTHOR_VISIBLE,
                        Math.max(0, topAuthors.length - AUTHOR_VISIBLE),
                      ),
                    )
                  }
                  className="p-2 rounded-full bg-white/90 hover:bg-white shadow-md border border-library-100/70"
                >
                  <ChevronRight />
                </button>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading && (
                <p className="text-sm text-library-600 col-span-full">
                  Loading authors...
                </p>
              )}
              {!loading && topAuthors.length === 0 && (
                <p className="text-sm text-library-600 col-span-full">
                  No authors yet.
                </p>
              )}
              {/** sliding window of authors */}
              {topAuthors
                .slice(authorStart, authorStart + AUTHOR_VISIBLE)
                .map((a) => (
                  <Card
                    key={a.id}
                    className="group border border-library-100/70 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 rounded-2xl bg-white/90"
                  >
                    <CardContent className="pt-7 pb-6 flex flex-col items-center text-center space-y-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-library-500 to-library-700 text-white flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-105 transition-transform duration-300">
                        {a.avatar}
                      </div>
                      <div className="space-y-2">
                        <h3
                          className={`text-lg font-bold ${gradientText} group-hover:text-library-700 transition-colors duration-300`}
                        >
                          {a.name}
                        </h3>
                        <p className="text-xs text-library-600 flex items-center justify-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {a.books} title{a.books === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Link
                        to={`/catalog?author=${encodeURIComponent(a.name)}`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-library-700 bg-library-50 rounded-full hover:bg-library-100 hover:text-library-800 transition-all duration-300"
                      >
                        View titles
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-center w-full">
        <span className="h-[3px] w-36 bg-gradient-to-r from-library-500 via-library-400 to-library-300 rounded-full" />
      </div>
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-library-50/40 to-white" />
        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-library-600">
                Circulation Spotlight
              </p>
              <h2 className={`text-4xl md:text-5xl font-bold ${gradientText}`}>
                Popular Books
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Most borrowed titles this season. Surface trending picks and
                explore high demand collections with real-time availability.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="px-6 py-6 bg-library-600 text-white hover:bg-library-700 transition-all duration-300 rounded-lg shadow-sm"
              >
                <Link to="/catalog" className="flex items-center gap-2">
                  Explore Full Catalog <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            {popularBooks.length > BOOKS_VISIBLE && (
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-20">
                <button
                  aria-label="prev books"
                  onClick={() =>
                    setBooksStart((s) => Math.max(0, s - BOOKS_VISIBLE))
                  }
                  className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-library-50 transition-all duration-300 border border-library-100"
                >
                  <ChevronRight className="-rotate-180 h-5 w-5 text-library-600" />
                </button>
              </div>
            )}
            {popularBooks.length > BOOKS_VISIBLE && (
              <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-20">
                <button
                  aria-label="next books"
                  onClick={() =>
                    setBooksStart((s) =>
                      Math.min(
                        s + BOOKS_VISIBLE,
                        Math.max(0, popularBooks.length - BOOKS_VISIBLE),
                      ),
                    )
                  }
                  className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-library-50 transition-all duration-300 border border-library-100"
                >
                  <ChevronRight className="h-5 w-5 text-library-600" />
                </button>
              </div>
            )}
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {loading && (
                <li className="col-span-full text-sm text-library-600">
                  Loading books...
                </li>
              )}
              {!loading && popularBooks.length === 0 && (
                <li className="col-span-full text-sm text-library-600">
                  No books found.
                </li>
              )}
              {!loading &&
                // sliding window of popular books
                popularBooks
                  .slice(booksStart, booksStart + BOOKS_VISIBLE)
                  .map((b) => (
                    <li key={b.id} className="group relative select-none">
                      <div className="relative rounded-2xl overflow-hidden border border-library-100/70 bg-white shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img
                            src={b.coverImage}
                            alt={b.title}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-x-0 bottom-0 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="flex items-center justify-between px-4 py-3 text-sm font-medium bg-gradient-to-r from-library-600/95 to-library-500/95 text-white backdrop-blur-sm">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {Math.max(
                                  0,
                                  (b.totalCopies || 0) -
                                    (b.availableCopies || 0),
                                )}{" "}
                                loans
                              </span>
                              <Link
                                to={`/catalog?highlight=${encodeURIComponent(
                                  b.title,
                                )}`}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors duration-200"
                              >
                                View <ChevronRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <p
                            className={`text-sm font-bold leading-tight line-clamp-2 ${gradientText} group-hover:text-library-700 transition-colors duration-300`}
                          >
                            {b.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            by {b.author}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-library-600 pt-1">
                            <span className="inline-flex items-center gap-1">
                              <BookCheck className="h-3 w-3" />
                              {b.availableCopies ?? 0} available
                            </span>
                            <span className="text-gray-400">
                              {b.totalCopies ?? 0} total
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
            </ul>
          </div>
          <div className="mt-8 flex justify-center md:hidden">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="px-6 py-3 border-library-200 bg-white hover:bg-library-50 text-library-700 hover:text-library-800 transition-all duration-300 rounded-full shadow-sm hover:shadow-md"
            >
              <Link to="/catalog" className="flex items-center gap-2">
                Explore Full Catalog <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <div className="flex justify-center w-full">
        <span className="h-[3px] w-36 bg-gradient-to-r from-library-500 via-library-400 to-library-300 rounded-full" />
      </div>
      {/* Features Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-library-50/40 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-12">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-library-600">
                Operations Suite
              </p>
              <h2 className={`text-4xl md:text-5xl font-bold ${gradientText}`}>
                Key Features
              </h2>
              <p className="text-library-600 text-base md:text-lg">
                Build a reliable, modern library workflow with streamlined
                circulation, transparent access controls, and secure storage.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group border border-library-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/95">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-library-100 rounded-xl group-hover:bg-library-500 transition-colors duration-300">
                    <BookOpen className="h-6 w-6 text-library-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-lg ${gradientText} group-hover:text-library-700`}
                    >
                      Comprehensive Catalog
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Organized inventory with rich metadata, covers, and
                      instant availability.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group border border-library-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/95">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-library-100 rounded-xl group-hover:bg-library-500 transition-colors duration-300">
                    <Search className="h-6 w-6 text-library-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-lg ${gradientText} group-hover:text-library-700`}
                    >
                      Advanced Search
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Multi-criteria discovery across author, category,
                      availability, and year.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group border border-library-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/95">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-library-100 rounded-xl group-hover:bg-library-500 transition-colors duration-300">
                    <User className="h-6 w-6 text-library-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-lg ${gradientText} group-hover:text-library-700`}
                    >
                      Role-based Accounts
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Tailored experiences for patrons, librarians, and admins
                      with clear permissions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group border border-library-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/95">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-library-100 rounded-xl group-hover:bg-library-500 transition-colors duration-300">
                    <BookCheck className="h-6 w-6 text-library-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-lg ${gradientText} group-hover:text-library-700`}
                    >
                      Loan Management
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Structured approvals, due dates, and personal loan
                      tracking at a glance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group border border-library-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/95">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-library-100 rounded-xl group-hover:bg-library-500 transition-colors duration-300">
                    <MonitorSmartphone className="h-6 w-6 text-library-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-lg ${gradientText} group-hover:text-library-700`}
                    >
                      Modern Responsive UI
                    </h3>
                    <p className="text-gray-600 text-sm">
                      A consistent experience across desktop, tablet, and mobile
                      screens.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group border border-library-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/95">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-library-100 rounded-xl group-hover:bg-library-500 transition-colors duration-300">
                    <BellRing className="h-6 w-6 text-library-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-lg ${gradientText} group-hover:text-library-700`}
                    >
                      Notifications Center
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Real-time alerts with clear status and easy dismissal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group border border-library-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/95">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-library-100 rounded-xl group-hover:bg-library-500 transition-colors duration-300">
                    <LayoutDashboard className="h-6 w-6 text-library-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-lg ${gradientText} group-hover:text-library-700`}
                    >
                      Librarian Console
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Centralized controls for catalog, reservations, and users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group border border-library-100/80 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white/95">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-library-100 rounded-xl group-hover:bg-library-500 transition-colors duration-300">
                    <CloudUpload className="h-6 w-6 text-library-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-lg ${gradientText} group-hover:text-library-700`}
                    >
                      Secure File Storage
                    </h3>
                    <p className="text-gray-600 text-sm">
                      PDFs and covers stored with reliable access and versioned
                      uploads.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="flex justify-center w-full">
        <span className="h-[3px] w-36 bg-gradient-to-r from-library-500 via-library-400 to-library-300 rounded-full m-16" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px transform -translate-x-1/2">
          <div className="h-[15px] w-[15px] bg-gradient-to-r from-library-500 to-library-700 mb-4 rounded-full" />
          <div className="h-[610px] w-[15px] bg-gradient-to-r from-library-500 to-library-700 mb-4 rounded-full" />
        </div>
        <div>
          <Card className="shadow-md border-library-400/20 ml-20 mr-10 mb-10">
            <CardHeader className="bg-gradient-to-r from-library-500 to-library-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-transparent/10 transition-all duration-900">
                  <MessageSquareShare className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Library Feedback</CardTitle>
                  <CardDescription className="text-white/80">
                    Help us improve your library experience
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-library-700 font-medium"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={`border-library-600 h-12 bg-white focus:border-library-700 ${
                        errors.name ? "border-red-500" : ""
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-library-700 font-medium"
                    >
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`border-library-600 h-12 bg-white focus:border-library-700 ${
                        errors.email ? "border-red-500" : ""
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-library-700 font-medium"
                  >
                    Subject *
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) =>
                      handleInputChange("subject", value)
                    }
                  >
                    <SelectTrigger
                      className={`border-library-600 h-12 bg-white focus:border-library-900 ${
                        errors.subject ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select feedback category" />
                    </SelectTrigger>
                    <SelectContent>
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
                  {errors.subject && (
                    <p className="text-sm text-red-500">{errors.subject}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-library-700 font-medium">
                    Overall Rating *
                  </Label>
                  <div className="flex items-center gap-4">
                    <StarRating
                      rating={formData.rating}
                      onRatingChange={(rating) =>
                        handleInputChange("rating", rating)
                      }
                    />
                    <span className="text-sm flex text-center text-library-700 capitalize">
                      {formData.rating > 0 && `${formData.rating} `}
                    </span>
                  </div>
                  {errors.rating && (
                    <p className="text-sm text-red-500">
                      Please provide a rating
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="message"
                    className="text-library-700 font-medium"
                  >
                    Your Message *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    className={`min-h-[100px] bg-white border-library-600 focus:border-library-500 resize-none ${
                      errors.message ? "border-red-500" : ""
                    }`}
                    placeholder="Please share your detailed feedback, suggestions, or concerns..."
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500">{errors.message}</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className="w-2/4 h-12 text-md rounded-full bg-gradient-to-r from-library-500 to-library-700 hover:opacity-90 text-white py-3 shadow-md"
                  >
                    <BookOpen className="h-5 w-5 mr-1" />
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className=" ml-10 mr-20">
          <div>
            <h1
              className={`text-center text-3xl font-bold mb-10 ${gradientText}`}
            >
              Why Your Feedback Matters
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 m-5">
            <Card className="p-1 border-library-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-4">
                <h3 className={`text-xl font-semibold mb-3 ${gradientText}`}>
                  Enhancing Book Collection
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Feedback helps libraries identify in-demand books and
                  subjects. Reader suggestions ensure the collection stays
                  updated, relevant, and aligned with academic and personal
                  interests.
                </p>
              </CardContent>
            </Card>

            <Card className="p-1 border-library-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-4">
                <h3 className={`text-xl font-semibold mb-3 ${gradientText}`}>
                  Improving Library Services
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  User suggestions improve services like borrowing, returning,
                  and reservations. This makes processes smoother, reduces
                  difficulties, and enhances the overall library experience.
                </p>
              </CardContent>
            </Card>

            <Card className="p-1 border-library-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-4">
                <h3 className={`text-xl font-semibold mb-3 ${gradientText}`}>
                  Upgrading Digital Resources
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Feedback reveals gaps in digital content, guiding libraries to
                  add e-books, journals, and databases. This ensures students
                  get easy and accessible learning resources anytime, anywhere.
                </p>
              </CardContent>
            </Card>

            <Card className="p-1 border-library-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-4">
                <h3 className={`text-xl font-semibold mb-3 ${gradientText}`}>
                  Building User Engagement
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  A feedback system empowers members to shape the library,
                  building trust and transparency. Engaged users feel valued,
                  leading to stronger relationships and active library
                  participation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {!isAuthenticated && (
        <section className="py-16 bg-transparent">
          <div className="container mx-auto px-6">
            <div className="relative overflow-hidden rounded-3xl border border-library-200 bg-gradient-to-r from-white via-library-50/70 to-white p-8 md:p-12">
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-library-200/40 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-library-100/60 blur-3xl" />
              <div className="relative z-10 text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-library-600">
                  Get Started
                </p>
                <h2
                  className={`text-3xl md:text-4xl font-bold ${gradientText}`}
                >
                  Launch a smarter library workflow
                </h2>
                <p className="text-gray-600">
                  Create an account to borrow books, track loans, and unlock
                  personalized recommendations.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="bg-library-600 text-white hover:bg-library-700"
                  >
                    <Link to="/register" className="flex items-center gap-2">
                      Create Account <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-library-400 text-library-700 hover:bg-library-50"
                  >
                    <Link to="/catalog">Browse Catalog</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Footer */}
      <footer className="bg-library-700 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                <BookOpen className="h-6 w-6" />
                <span
                  className={`ml-2 font-semibold text-xl bg-gradient-to-r from-library-50 via-library-100 to-library-300 bg-clip-text text-transparent`}
                >
                  LibraXpert
                </span>
              </div>
              <p className="text-library-100 mt-4">
                Modern, responsive, and scalable cross-platform library
                management system.
              </p>
            </div>

            <div>
              <h3
                className={`font-semibold text-lg mb-4 bg-gradient-to-r from-library-100 via-library-500 to-library-900 bg-clip-text text-transparent`}
              >
                Quick Links
              </h3>
              <ul className="space-y-2">
                {!isAuthenticated ? (
                  <>
                    <li>
                      <a
                        href="/catalog"
                        className="text-library-200 hover:text-white"
                      >
                        Catalog
                      </a>
                    </li>
                    <li>
                      <a
                        href="/login"
                        className="text-library-200 hover:text-white"
                      >
                        Sign In
                      </a>
                    </li>
                    <li>
                      <a
                        href="/register"
                        className="text-library-200 hover:text-white"
                      >
                        Create Account
                      </a>
                    </li>
                  </>
                ) : (
                  <li>
                    <a
                      href="/catalog"
                      className="text-library-100 hover:text-white"
                    >
                      Catalog
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3
                className={`font-semibold text-lg mb-4 bg-gradient-to-r from-library-100 via-library-500 to-library-900 bg-clip-text text-transparent`}
              >
                Contact
              </h3>
              <ul className="space-y-2">
                <li className="text-library-100">
                  Email: sudhir.kuchara@gmail.com
                </li>
                <li className="text-library-100">Phone: +91 88499 41378</li>
                <li className="text-library-100">
                  Address: Rakhial, Ahmedabad, Gujarat
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-library-600 mt-8 pt-8 text-center text-library-200 text-sm">
            <p>© {new Date().getFullYear()} LibraXpert. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
