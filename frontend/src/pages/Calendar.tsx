import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  format,
  isAfter,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  addDays,
} from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type CalendarItem = {
  id: string;
  type: "loan" | "reservation";
  title: string;
  subtitle?: string;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  status?: string;
  person?: string;
};

const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const humanizeStatus = (value?: string) => {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const CalendarPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);

  const isStaff = user?.role === "librarian" || user?.role === "admin";

  useEffect(() => {
    const fetchCalendarData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("libraxpert_token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const loanEndpoint = isStaff ? "/loans/active" : "/loans/my-loans";
        const reservationEndpoint = isStaff
          ? "/reservations/pending"
          : "/reservations/my-reservations";

        const [loanResponse, reservationResponse] = await Promise.all([
          fetch(`${API_URL}${loanEndpoint}`, { headers }),
          fetch(`${API_URL}${reservationEndpoint}`, { headers }),
        ]);

        if (!loanResponse.ok || !reservationResponse.ok) {
          const loanError = loanResponse.ok
            ? null
            : await loanResponse.json().catch(() => ({}));
          const reservationError = reservationResponse.ok
            ? null
            : await reservationResponse.json().catch(() => ({}));
          throw new Error(
            loanError?.message ||
              reservationError?.message ||
              "Failed to load calendar data",
          );
        }

        const loansRaw = await loanResponse.json();
        const reservationsRaw = await reservationResponse.json();

        const loanItems: CalendarItem[] = (
          Array.isArray(loansRaw) ? loansRaw : []
        ).map((loan: any, index: number) => {
          const startDate =
            toDate(loan.borrowDate) ||
            toDate(loan.approvedAt) ||
            toDate(loan.requestedAt);
          const dueDate = toDate(loan.dueDate);
          const endDate = toDate(loan.returnDate) || dueDate || startDate;

          return {
            id: String(
              loan.id || loan._id || `${loan.bookId || "loan"}-${index}`,
            ),
            type: "loan",
            title: loan.bookTitle || loan.book?.title || "Loaned Book",
            subtitle: loan.bookAuthor || loan.book?.author || "Unknown Author",
            startDate,
            dueDate,
            endDate,
            status: loan.status,
            person: isStaff
              ? loan.borrowerName || loan.user?.username || loan.user?.email
              : undefined,
          };
        });

        const reservationItems: CalendarItem[] = (
          Array.isArray(reservationsRaw) ? reservationsRaw : []
        ).map((reservation: any, index: number) => {
          const startDate =
            toDate(reservation.reservationDate) ||
            toDate(reservation.requestedAt) ||
            toDate(reservation.createdAt);
          const dueDate = toDate(reservation.expiryDate);
          const endDate =
            toDate(reservation.fulfilledAt) ||
            toDate(reservation.cancelledAt) ||
            dueDate ||
            startDate;

          const personName = reservation.user
            ? [reservation.user.firstName, reservation.user.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() ||
              reservation.user.username ||
              reservation.user.email
            : undefined;

          return {
            id: String(
              reservation.id ||
                reservation._id ||
                `${reservation.bookId || "reservation"}-${index}`,
            ),
            type: "reservation",
            title:
              reservation.bookTitle ||
              reservation.book?.title ||
              "Reserved Book",
            subtitle:
              reservation.book?.author ||
              reservation.author ||
              "Unknown Author",
            startDate,
            dueDate,
            endDate,
            status: reservation.status,
            person: isStaff ? personName : undefined,
          };
        });

        setItems([...loanItems, ...reservationItems]);
      } catch (error: any) {
        console.error("Calendar load error:", error);
        toast({
          title: "Unable to load calendar",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [user, isStaff]);

  const loanRanges = useMemo(
    () =>
      items
        .filter(
          (item) => item.type === "loan" && item.startDate && item.endDate,
        )
        .map((item) => ({
          from: item.startDate as Date,
          to: item.endDate as Date,
        })),
    [items],
  );

  const reservationRanges = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.type === "reservation" && item.startDate && item.endDate,
        )
        .map((item) => ({
          from: item.startDate as Date,
          to: item.endDate as Date,
        })),
    [items],
  );

  const loanDueDates = useMemo(
    () =>
      items
        .filter((item) => item.type === "loan" && item.dueDate)
        .map((item) => item.dueDate as Date),
    [items],
  );

  const reservationDueDates = useMemo(
    () =>
      items
        .filter((item) => item.type === "reservation" && item.dueDate)
        .map((item) => item.dueDate as Date),
    [items],
  );

  const itemsForSelectedDate = useMemo(() => {
    return items.filter((item) => {
      if (!item.startDate || !item.endDate) {
        return item.dueDate ? isSameDay(item.dueDate, selectedDate) : false;
      }

      const start = startOfDay(item.startDate);
      const end = endOfDay(item.endDate);
      if (isAfter(start, end)) {
        return isSameDay(start, selectedDate);
      }

      return isWithinInterval(selectedDate, { start, end });
    });
  }, [items, selectedDate]);

  const upcomingDeadlines = useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysLater = endOfDay(addDays(today, 7));

    return items
      .filter((item) => {
        if (!item.dueDate) return false;
        if (item.type === "loan" && item.status === "returned") return false;
        if (
          item.type === "reservation" &&
          ["cancelled", "fulfilled", "expired"].includes(item.status || "")
        ) {
          return false;
        }
        return isWithinInterval(item.dueDate, {
          start: today,
          end: sevenDaysLater,
        });
      })
      .sort(
        (a, b) => (a.dueDate as Date).getTime() - (b.dueDate as Date).getTime(),
      )
      .slice(0, 8);
  }, [items]);

  const loanCount = items.filter((item) => item.type === "loan").length;
  const reservationCount = items.filter(
    (item) => item.type === "reservation",
  ).length;

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Calendar & Date Notation
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Easily view loan and reservation ranges, due dates, and upcoming
          deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Loan Ranges</p>
            <p className="text-3xl font-bold text-sky-700">{loanCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Reservation Ranges</p>
            <p className="text-3xl font-bold text-indigo-700">
              {reservationCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Due In Next 7 Days</p>
            <p className="text-3xl font-bold text-rose-700">
              {upcomingDeadlines.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Range Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading calendar data...</p>
            ) : (
              <>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  className="rounded-md border"
                  modifiers={{
                    loanRange: loanRanges,
                    reservationRange: reservationRanges,
                    loanDue: loanDueDates,
                    reservationDue: reservationDueDates,
                  }}
                  modifiersClassNames={{
                    loanRange:
                      "bg-sky-100 text-sky-900 border border-sky-200 rounded-md",
                    reservationRange:
                      "bg-violet-100 text-violet-900 border border-violet-200 rounded-md",
                    loanDue:
                      "ring-2 ring-sky-600 bg-sky-500 text-white font-semibold",
                    reservationDue:
                      "ring-2 ring-violet-600 bg-violet-500 text-white font-semibold",
                  }}
                />

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="border-sky-300 text-sky-700 bg-sky-50"
                  >
                    Loan Range
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-violet-300 text-violet-700 bg-violet-50"
                  >
                    Reservation Range
                  </Badge>
                  <Badge className="bg-sky-600">Loan Due Date</Badge>
                  <Badge className="bg-violet-600">Reservation Expiry</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{format(selectedDate, "PPP")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading day tasks...</p>
            ) : itemsForSelectedDate.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks on this date.</p>
            ) : (
              <div className="space-y-3">
                {itemsForSelectedDate.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="border rounded-md p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                        {item.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          item.type === "loan"
                            ? "border-sky-300 text-sky-700"
                            : "border-violet-300 text-violet-700"
                        }
                      >
                        {item.type === "loan" ? "Loan" : "Reservation"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.subtitle || ""}
                    </p>
                    {item.person ? (
                      <p className="text-xs text-slate-500 mt-1">
                        User: {item.person}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-600 mt-2">
                      Range:{" "}
                      {item.startDate ? format(item.startDate, "MMM d") : "N/A"}{" "}
                      - {item.endDate ? format(item.endDate, "MMM d") : "N/A"}
                    </p>
                    <p className="text-xs text-slate-600">
                      Due: {item.dueDate ? format(item.dueDate, "PPP") : "N/A"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Status: {humanizeStatus(item.status)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines (Next 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">
              Loading upcoming deadlines...
            </p>
          ) : upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-500">
              No upcoming due dates in the next week.
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((item) => (
                <div
                  key={`deadline-${item.type}-${item.id}`}
                  className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.type === "loan"
                        ? "Loan due"
                        : "Reservation expires"}{" "}
                      • {item.dueDate ? format(item.dueDate, "PPP") : "N/A"}
                    </p>
                    {item.person ? (
                      <p className="text-xs text-slate-500">
                        User: {item.person}
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    className={
                      item.type === "loan" ? "bg-sky-600" : "bg-violet-600"
                    }
                  >
                    {humanizeStatus(item.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
