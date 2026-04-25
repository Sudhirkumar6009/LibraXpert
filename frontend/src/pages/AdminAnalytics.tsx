import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Users,
  BookOpen,
  BookCheck,
  AlertCircle,
  UserCog,
  Wallet,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type LabeledCount = {
  role?: string;
  status?: string;
  name?: string;
  department?: string;
  count?: number;
  value?: number;
};

type LibrarianActivity = {
  id: string;
  name: string;
  email: string;
  approvedLoans: number;
  declinedRequests: number;
  renewalsHandled: number;
  finesApproved: number;
  totalActions: number;
};

type CirculationPoint = {
  key: string;
  month: string;
  approvedLoans: number;
  returns: number;
  reservations: number;
  studentRegistrations: number;
  finesCollectedAmount: number;
  booksAdded: number;
};

type AdminOverview = {
  summary: {
    totalUsers: number;
    totalStudents: number;
    totalLibrarians: number;
    totalBooks: number;
    activeLoans: number;
    overdueLoans: number;
    pendingBorrowRequests: number;
    pendingReservations: number;
    pendingFinePayments: number;
    totalFineCollectedAmount: number;
  };
  usersByRole: Array<{ role: string; count: number }>;
  studentsByDepartment: Array<{ department: string; count: number }>;
  studentApprovalStatus: {
    pending: number;
    approved: number;
    declined: number;
  };
  circulationByMonth: CirculationPoint[];
  librarianDirectory: Array<{ id: string; name: string; email: string }>;
  librarianActivity: LibrarianActivity[];
};

type CirculationResponse = {
  generatedAt: string;
  role: string;
  admin?: AdminOverview;
};

const ADMIN_COLORS = ["#0284c7", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444"];

const toChartValue = (
  items: LabeledCount[],
  labelKey: "role" | "department" | "status" | "name",
) =>
  (items || [])
    .map((item) => ({
      label: String(item[labelKey] || "Unknown"),
      value: Number(item.count ?? item.value ?? 0),
    }))
    .filter((item) => item.value > 0);

const AdminAnalyticsPage = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("libraxpert_token");

        const response = await fetch(
          `${API_URL}/reports/circulation-overview`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const details = await response.json().catch(() => ({}));
          throw new Error(details.message || "Failed to fetch analytics");
        }

        const data: CirculationResponse = await response.json();
        if (!data.admin) {
          throw new Error("Admin analytics data is unavailable for this role");
        }

        setOverview(data.admin);
      } catch (err: any) {
        console.error("Admin analytics load error:", err);
        setError(err.message || "Unable to load analytics");
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const roleMix = useMemo(
    () => toChartValue((overview?.usersByRole || []) as LabeledCount[], "role"),
    [overview],
  );

  const studentDept = useMemo(
    () =>
      toChartValue(
        (overview?.studentsByDepartment || []) as LabeledCount[],
        "department",
      ).slice(0, 8),
    [overview],
  );

  const approvalStatus = useMemo(() => {
    if (!overview) return [];
    return [
      {
        label: "Pending",
        value: Number(overview.studentApprovalStatus.pending || 0),
      },
      {
        label: "Approved",
        value: Number(overview.studentApprovalStatus.approved || 0),
      },
      {
        label: "Declined",
        value: Number(overview.studentApprovalStatus.declined || 0),
      },
    ];
  }, [overview]);

  const topLibrarians = useMemo(
    () => (overview?.librarianActivity || []).slice(0, 8),
    [overview],
  );

  const trend = overview?.circulationByMonth || [];

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-600">Loading analytics...</div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-sm text-slate-600">No analytics data found.</p>
      </div>
    );
  }

  const pendingOps =
    Number(overview.summary.pendingBorrowRequests || 0) +
    Number(overview.summary.pendingReservations || 0) +
    Number(overview.summary.pendingFinePayments || 0);

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Admin Circulation Analytics
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Overall view of librarians, students, borrowing behavior, and
          circulation trends.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Users</p>
                <p className="text-3xl font-bold text-slate-900">
                  {overview.summary.totalUsers}
                </p>
              </div>
              <Users className="h-10 w-10 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Librarians</p>
                <p className="text-3xl font-bold text-sky-700">
                  {overview.summary.totalLibrarians}
                </p>
              </div>
              <UserCog className="h-10 w-10 text-sky-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Students</p>
                <p className="text-3xl font-bold text-indigo-700">
                  {overview.summary.totalStudents}
                </p>
              </div>
              <Users className="h-10 w-10 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Loans</p>
                <p className="text-3xl font-bold text-emerald-700">
                  {overview.summary.activeLoans}
                </p>
              </div>
              <BookCheck className="h-10 w-10 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="text-3xl font-bold text-rose-700">
                  {overview.summary.overdueLoans}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Fine Collected</p>
                <p className="text-2xl font-bold text-amber-700">
                  Rs. {Number(overview.summary.totalFineCollectedAmount || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Pending ops: {pendingOps}
                </p>
              </div>
              <Wallet className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Circulation Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="approvedLoans"
                  stroke="#0284c7"
                  strokeWidth={2}
                  name="Approved Loans"
                />
                <Line
                  type="monotone"
                  dataKey="returns"
                  stroke="#16a34a"
                  strokeWidth={2}
                  name="Returns"
                />
                <Line
                  type="monotone"
                  dataKey="reservations"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  name="Reservations"
                />
                <Line
                  type="monotone"
                  dataKey="studentRegistrations"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Student Registrations"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Role Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={roleMix}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ label, value }) => `${label}: ${value}`}
                >
                  {roleMix.map((_, index) => (
                    <Cell
                      key={`role-${index}`}
                      fill={ADMIN_COLORS[index % ADMIN_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Librarian Operations Graph</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={topLibrarians}
                layout="vertical"
                margin={{ left: 30, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={110} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="approvedLoans"
                  stackId="a"
                  fill="#0284c7"
                  name="Approvals"
                />
                <Bar
                  dataKey="renewalsHandled"
                  stackId="a"
                  fill="#14b8a6"
                  name="Renewals"
                />
                <Bar
                  dataKey="finesApproved"
                  stackId="a"
                  fill="#f59e0b"
                  name="Fine Approvals"
                />
                <Bar
                  dataKey="declinedRequests"
                  stackId="a"
                  fill="#ef4444"
                  name="Declines"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={studentDept}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Student Approval Status
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={approvalStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Librarian List</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.librarianActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No librarians found.</p>
          ) : (
            <div className="space-y-3">
              {overview.librarianActivity.map((lib) => (
                <div
                  key={lib.id}
                  className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">{lib.name}</p>
                    <p className="text-xs text-slate-500">{lib.email}</p>
                  </div>
                  <div className="text-sm text-slate-600 flex gap-4">
                    <span>Approvals: {lib.approvedLoans}</span>
                    <span>Renewals: {lib.renewalsHandled}</span>
                    <span>Fine approvals: {lib.finesApproved}</span>
                    <span>Total actions: {lib.totalActions}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog Growth by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="booksAdded"
                fill="#0f766e"
                radius={[6, 6, 0, 0]}
                name="Books Added"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;
