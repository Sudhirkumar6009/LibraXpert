import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search, User, BookCheck, ChevronRight } from "lucide-react";

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const [books, setBooks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/books`);
        const data = await res.json();
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
        setBooks(
          data.map((b: any) => ({
            ...b,
            coverImage: makeUrl(b.coverImage),
            pdfFile: makeUrl(b.pdfFile),
          }))
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
          (a.totalCopies - a.availableCopies)
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

  const gradientText =
    "bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Full Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Library Books"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
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
                    className="p-8 w-43 bg-white text-lg text-library-700 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-900"
                  >
                    <Link to="/catalog">Discover Catalog</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="p-8 w-44 text-lg border-transparent border-white/10 text-white hover:bg-white/100 bg-library-400 hover:text-library-700 transition-all duration-[900ms]"
                  >
                    <Link to="/login">
                      Explore <ChevronRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Books Section */}
      <hr className="mt-3 mr-10 ml-10 border-library-500" />
      {/* Best Authors Section */}
      <section className="py-10 pb-20 bg-transparent">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${gradientText}`}>
              Best Authors
            </h2>
            <p className="text-library-600 text-sm md:text-base max-w-xl">
              Authors whose works are resonating most with our community
              readers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
            {topAuthors.map((a) => (
              <Card
                key={a.id}
                className="group border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-library-100 text-library-700 flex items-center justify-center text-lg font-semibold shadow">
                    {a.avatar}
                  </div>
                  <div className="space-y-1">
                    <p
                      className={`font-semibold text-sm md:text-base ${gradientText}`}
                    >
                      {a.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {a.books} book{a.books === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Link
                    to={`/catalog?author=${encodeURIComponent(a.name)}`}
                    className="text-library-500 hover:text-library-600 text-xs font-medium underline-offset-2 hover:underline"
                  >
                    View Titles
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-6 gap-4">
            <div>
              <h2 className={`text-3xl font-bold mb-5 ${gradientText}`}>
                Popular Books
              </h2>
              <p className="text-library-600 text-sm mb-4 md:text-base max-w-xl">
                Most borrowed titles this season. Slide to explore trending
                picks.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="mb-5 px-5 py-6 hidden md:inline-flex border-transparent transition-all duration-300 bg-library-500 text-white hover:bg-library-500/70 hover:text-white"
            >
              <Link to="/catalog" className="flex items-center gap-1">
                Explore <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div>
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
                popularBooks.map((b) => (
                  <li key={b.id} className="group relative select-none">
                    <div className="relative rounded-xl overflow-hidden shadow ring-1 ring-gray-200/70 bg-white/70 backdrop-blur-sm border border-white/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="relative aspect-[3/4] w-full overflow-hidden">
                        <img
                          src={b.coverImage}
                          alt={b.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium bg-gradient-to-r from-library-600/95 to-library-500/95 text-white rounded-t-md">
                            <span>
                              {Math.max(
                                0,
                                (b.totalCopies || 0) - (b.availableCopies || 0)
                              )}{" "}
                              loans
                            </span>
                            <Link
                              to={`/catalog?highlight=${encodeURIComponent(
                                b.title
                              )}`}
                              className="underline underline-offset-2 hover:text-library-100"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 space-y-1">
                        <p
                          className={`text-sm font-semibold leading-tight line-clamp-2 ${gradientText}`}
                        >
                          {b.title}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {b.author}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
          <div className="mt-6 flex justify-end md:hidden">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-library-500 text-library-500 hover:bg-library-50"
            >
              <Link to="/catalog" className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${gradientText}`}>
              Key Features
            </h2>
            <p className="text-library-600 text-sm md:text-base max-w-xxl">
              Our library management system is designed to streamline all
              aspects of library operations for students, patrons, librarians,
              and administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-library-100 rounded-full mb-4">
                    <BookOpen className="h-6 w-6 text-library-600" />
                  </div>
                  <h3 className={`font-semibold text-lg mb-2 ${gradientText}`}>
                    Comprehensive Catalog
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Browse and search our extensive collection of books,
                    journals, and digital resources.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 hover:shadow-md hover:scale-105 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-library-100 rounded-full mb-4">
                    <Search className="h-6 w-6 text-library-600" />
                  </div>
                  <h3 className={`font-semibold text-lg mb-2 ${gradientText}`}>
                    Advanced Search
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Find exactly what you need with powerful filtering and
                    sorting options.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 hover:shadow-md hover:scale-105 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-library-100 rounded-full mb-4">
                    <User className="h-6 w-6 text-library-600" />
                  </div>
                  <h3 className={`font-semibold text-lg mb-2 ${gradientText}`}>
                    User Accounts
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Personalized accounts for students, librarians, and
                    administrators with role-specific features.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 hover:shadow-md hover:scale-105 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-library-100 rounded-full mb-4">
                    <BookCheck className="h-6 w-6 text-library-600" />
                  </div>
                  <h3 className={`font-semibold text-lg mb-2 ${gradientText}`}>
                    Loan Management
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Borrow, reserve, and return books with real-time tracking
                    and notifications.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-transparent">
          <div className="container mx-auto px-6">
            <div className="bg-gradient-to-r  border border-library-300 from-library-100 via-library-50 to-library-100 rounded-2xl p-8 md:p-12">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className={`text-3xl font-bold mb-6 ${gradientText}`}>
                  Ready to get started?
                </h2>
                <p className="text-gray-600 mb-8">
                  Create an account to borrow books, manage your loans, and get
                  personalized recommendations.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-library-500 text-white hover:bg-library-600"
                  >
                    <Link to="/register">Create Account</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-library-500 text-library-500 hover:bg-library-50"
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
              <p className="text-library-200 mt-4">
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
              </ul>
            </div>

            <div>
              <h3
                className={`font-semibold text-lg mb-4 bg-gradient-to-r from-library-100 via-library-500 to-library-900 bg-clip-text text-transparent`}
              >
                Contact
              </h3>
              <ul className="space-y-2">
                <li className="text-library-200">
                  Email: sudhir.kuchara@gmail.com
                </li>
                <li className="text-library-200">Phone: +91 88499 41378</li>
                <li className="text-library-200">
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
