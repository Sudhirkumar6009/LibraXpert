import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookCheck, BookX, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const onDashboardPath = location.pathname === "/dashboard";

  // Remote books from MongoDB
  const [books, setBooks] = React.useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = React.useState(false);

  // Placeholder empty arrays until loan/reservation APIs exist
  const currentLoans: any[] = [];
  const reservations: any[] = [];
  const notifications: any[] = [];

  // Derive popular books from inventory (approximate: total - available as loan count)
  const popularBooks = React.useMemo(() => {
    return [...books]
      .sort(
        (a, b) =>
          b.totalCopies -
          b.availableCopies -
          (a.totalCopies - a.availableCopies)
      )
      .slice(0, 5)
      .map((b) => ({
        id: b.id || b._id,
        title: b.title,
        author: b.author,
        cover: b.coverImage || "https://via.placeholder.com/80x120?text=Book",
        loans: Math.max(0, (b.totalCopies || 0) - (b.availableCopies || 0)),
      }));
  }, [books]);

  // Aggregate authors by frequency
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
      .slice(0, 5)
      .map(([name, count]) => ({
        id: name,
        name,
        books: count,
        avatar: name.charAt(0),
      }));
  }, [books]);

  React.useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const load = async () => {
      setLoadingBooks(true);
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
        setLoadingBooks(false);
      }
    };
    load();
  }, []);

  const loanTrend = [
    { month: "Jan", loans: 40 },
    { month: "Feb", loans: 55 },
    { month: "Mar", loans: 52 },
    { month: "Apr", loans: 61 },
    { month: "May", loans: 58 },
    { month: "Jun", loans: 64 },
  ];

  return (
    <div className="space-y-8 mt-20">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-400 via-library-600 to-library-700 bg-clip-text text-transparent">
            Welcome, {user?.username || (user as any)?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Loans
                </p>
                <p className="text-2xl font-semibold">{currentLoans.length}</p>
              </div>
              <BookCheck className="h-6 w-6 text-sky-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Reservations
                </p>
                <p className="text-2xl font-semibold">{reservations.length}</p>
              </div>
              <Calendar className="h-6 w-6 text-indigo-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Overdue
                </p>
                <p className="text-2xl font-semibold">0</p>
              </div>
              <BookX className="h-6 w-6 text-rose-500" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Current Loans</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {currentLoans.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No loan data yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Reservations</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No reservation data yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Loan Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanTrend}>
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                  <Bar
                    dataKey="loans"
                    radius={[4, 4, 0, 0]}
                    fill="url(#gradLoans)"
                  />
                  <defs>
                    <linearGradient id="gradLoans" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00a3cc" />
                      <stop offset="100%" stopColor="#005266" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-5 flex flex-row items-center justify-between">
              <CardTitle>Best Books</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/catalog")}
              >
                See All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingBooks && (
                  <p className="text-sm text-gray-500">Loading books...</p>
                )}
                {!loadingBooks && popularBooks.length === 0 && (
                  <p className="text-sm text-gray-500">No books found.</p>
                )}
                {!loadingBooks &&
                  popularBooks.map((b) => (
                    <div key={b.id} className="flex items-center gap-4 group">
                      <div className="h-14 w-10 overflow-hidden rounded shadow ring-1 ring-slate-200">
                        <img
                          src={b.cover}
                          alt={b.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {b.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {b.author}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-slate-400">
                          Loans
                        </p>
                        <p className="text-sm font-semibold">{b.loans}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-5 flex flex-row items-center justify-between">
              <CardTitle>Best Authors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAuthors.length === 0 && (
                  <p className="text-sm text-gray-500">No authors yet.</p>
                )}
                {topAuthors.map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-library-100 text-library-700 flex items-center justify-center text-xs font-semibold shadow">
                      {a.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {a.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-slate-400">
                        Books
                      </p>
                      <p className="text-sm font-semibold">{a.books}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-5 flex flex-row items-center justify-between">
              <CardTitle>Notifications</CardTitle>
              <Button variant="ghost" size="sm">
                Mark All Read
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length === 0 && (
                  <p className="text-sm text-gray-500">No notifications.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
