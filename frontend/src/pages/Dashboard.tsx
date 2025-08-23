import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const currentLoans = [
    {
      id: "1",
      title: "Clean Code: A Handbook of Agile Software",
      author: "Robert C. Martin",
      dueDate: new Date("2025-05-05"),
      coverImage:
        "https://m.media-amazon.com/images/I/51E2055ZGUL._SY445_SX342_.jpg",
    },
    {
      id: "2",
      title: "Design Patterns: Elements of Reusable Object-Oriented Software",
      author: "Erich Gamma et al.",
      dueDate: new Date("2025-05-10"),
      coverImage:
        "https://m.media-amazon.com/images/I/51szD9HC9pL._SY445_SX342_.jpg",
    },
  ];

  const reservations = [
    {
      id: "1",
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt & David Thomas",
      availableDate: new Date("2025-04-25"),
      coverImage:
        "https://m.media-amazon.com/images/I/51W1sBPO7tL._SY445_SX342_.jpg",
    },
  ];

  const notifications = [
    {
      id: "1",
      title: "Book Due Soon",
      message: '"Design Patterns" is due in 5 days',
      date: new Date("2025-04-15"),
      type: "due_date",
    },
    {
      id: "2",
      title: "Reservation Available",
      message: '"The Pragmatic Programmer" is ready for pickup',
      date: new Date("2025-04-18"),
      type: "reservation",
    },
    {
      id: "3",
      title: "New Feature Added",
      message: "Try our new recommendation system",
      date: new Date("2025-04-10"),
      type: "system",
    },
  ];

  const topAuthors = [
    { id: "a1", name: "Robert C. Martin", books: 5, avatar: "R" },
    { id: "a2", name: "Martin Fowler", books: 4, avatar: "M" },
    { id: "a3", name: "Erich Gamma", books: 3, avatar: "E" },
    { id: "a4", name: "Andrew Hunt", books: 3, avatar: "A" },
  ];

  const popularBooks = [
    {
      id: "p1",
      title: "Clean Code",
      author: "Robert C. Martin",
      cover: currentLoans[0].coverImage,
      loans: 124,
    },
    {
      id: "p2",
      title: "Design Patterns",
      author: "Erich Gamma et al.",
      cover: currentLoans[1].coverImage,
      loans: 102,
    },
    {
      id: "p3",
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      cover: reservations[0].coverImage,
      loans: 98,
    },
  ];

  const loanTrend = [
    { month: "Jan", loans: 40 },
    { month: "Feb", loans: 55 },
    { month: "Mar", loans: 52 },
    { month: "Apr", loans: 61 },
    { month: "May", loans: 58 },
    { month: "Jun", loans: 64 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
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
              {currentLoans.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No current loans
                </div>
              ) : (
                <div className="space-y-4">
                  {currentLoans.map((book) => (
                    <div
                      key={book.id}
                      className="flex items-center gap-4 group"
                    >
                      <div className="flex-shrink-0 h-16 w-12 overflow-hidden rounded shadow ring-1 ring-slate-200">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {book.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {book.author}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 uppercase">
                          Due
                        </span>
                        <span className="text-sm font-medium">
                          {book.dueDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
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
              {reservations.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No reservations
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((book) => (
                    <div
                      key={book.id}
                      className="flex items-center gap-4 group"
                    >
                      <div className="flex-shrink-0 h-16 w-12 overflow-hidden rounded shadow ring-1 ring-slate-200">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {book.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {book.author}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 uppercase">
                          Available
                        </span>
                        <span className="text-sm font-medium text-emerald-600">
                          {book.availableDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
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
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Popular Books</CardTitle>
              <Button variant="ghost" size="sm">
                See All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularBooks.map((b) => (
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
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Best Authors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAuthors.map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center text-xs font-semibold shadow">
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
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Notifications</CardTitle>
              <Button variant="ghost" size="sm">
                Mark All Read
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div key={n.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-semibold">
                      {n.type === "due_date"
                        ? "D"
                        : n.type === "reservation"
                        ? "R"
                        : "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {n.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
