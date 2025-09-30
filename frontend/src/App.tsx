import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Outlet,
  Link,
} from "react-router-dom";
import { useEffect, useMemo } from "react";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import SiteFooter from "@/components/layout/SiteFooter";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
// Use the page-level BookDetailPage (fetches book by id) for the route
import BookDetailPage from "./pages/BookDetailPage";
// Added feature pages
import SearchPage from "./pages/Search";
import LoansPage from "./pages/Loans";
import ReservationsPage from "./pages/Reservations";
import ProfilePage from "./pages/Profile";
import CalendarPage from "./pages/Calendar";
import NotificationsPage from "./pages/Notifications";
// Management pages
import ManagementLoansPage from "./pages/ManagementLoans";
import ManagementReturnsPage from "./pages/ManagementReturns";
import ManagementUsersPage from "./pages/ManagementUsers";
import ManagementCatalogPage from "./pages/ManagementCatalog.tsx";
import ManagementBorrowRequestsPage from "./pages/ManagementBorrowRequests";
import ManagementReservationsPage from "./pages/ManagementReservations";
// Admin pages
import AdminReportsPage from "./pages/AdminReports";
import AdminAnalyticsPage from "./pages/AdminAnalytics";
import AdminSettingsPage from "./pages/AdminSettings";
// Authorization feedback
import Unauthorized from "@/pages/Unauthorized"; // 403 page
document.title =
  "LibraXpert - Advanced Cross-Platform Library Management System";
import NotFound from "./pages/NotFound";
// Base title constant; per route augmentation handled below
const BASE_TITLE = "LibraXpert";

// Title manager only (no full page remount animations to preserve shell)
const TitleManager: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const title = useMemo(() => {
    const p = location.pathname.toLowerCase();
    if (p === "/" || p === "/index") return `${BASE_TITLE} – Home`;
    if (p.startsWith("/login")) return `${BASE_TITLE} – Login`;
    if (p.startsWith("/register")) return `${BASE_TITLE} – Register`;
    if (p.startsWith("/dashboard")) return `${BASE_TITLE} – Dashboard`;
    if (p.startsWith("/catalog")) return `${BASE_TITLE} – Catalog`;
    if (p.startsWith("/book/")) return `${BASE_TITLE} – Book Details`;
    if (p.startsWith("/search")) return `${BASE_TITLE} – Search`;
    if (p.startsWith("/loans")) return `${BASE_TITLE} – Loans`;
    if (p.startsWith("/profile")) return `${BASE_TITLE} – Profile`;
    if (p.startsWith("/calendar")) return `${BASE_TITLE} – Calendar`;
    if (p.startsWith("/reservations")) return `${BASE_TITLE} – Reservations`;
    if (p.startsWith("/management/loans"))
      return `${BASE_TITLE} – Loan Management`;
    if (p.startsWith("/management/borrow-requests"))
      return `${BASE_TITLE} – Borrow Requests`;
    if (p.startsWith("/management/reservations"))
      return `${BASE_TITLE} – Reservations Management`;
    if (p.startsWith("/management/returns")) return `${BASE_TITLE} – Returns`;
    if (p.startsWith("/management/users"))
      return `${BASE_TITLE} – User Management`;
    if (p.startsWith("/admin/reports")) return `${BASE_TITLE} – Reports`;
    if (p.startsWith("/admin/analytics")) return `${BASE_TITLE} – Analytics`;
    if (p.startsWith("/admin/settings")) return `${BASE_TITLE} – Settings`;
    if (p.startsWith("/management")) return `${BASE_TITLE} – Management`;
    if (p.startsWith("/admin")) return `${BASE_TITLE} – Admin`;
    if (p.startsWith("/unauthorized")) return `${BASE_TITLE} – Unauthorized`;
    return `${BASE_TITLE} – Not Found`;
  }, [location.pathname]);
  useEffect(() => {
    document.title = title;
  }, [title]);
  return <>{children}</>;
};

// (Removed compact footer; all authenticated pages now use full SiteFooter)

// Persistent shell for authenticated area
const AppShell: React.FC = () => {
  // Determine if the current outlet corresponds to the dashboard to display the large site footer
  // We'll inspect window.location.pathname (safe in client) — for SSR you'd use useLocation
  const locPath = typeof window !== "undefined" ? window.location.pathname : ""; // retained if needed later
  return (
    <div className="w-full flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="flex flex-1 w-full">
        <Sidebar className="hidden md:flex" />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">
            <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <SiteFooter noTopMargin />
    </div>
  );
};

// Full-bleed cinematic background layer
const BackgroundFX = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
    <div className="animate-[spin_30s_linear_infinite] absolute -top-1/2 -left-1/2 h-[160vmax] w-[160vmax] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_60%)]" />
    <div className="animate-[pulse_8s_ease-in-out_infinite] absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
    <div className="animate-[pulse_11s_ease-in-out_infinite] absolute bottom-10 right-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-3xl" />
    <div className="absolute inset-0 backdrop-[mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
  </div>
);

// Content container (no horizontal margin as requested)
const FullBleed: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full min-h-screen flex flex-col">{children}</div>
);

const queryClient = new QueryClient();

// Global floating Dashboard/Home switcher always visible
const GlobalFloatNav: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const onDashboard = location.pathname === "/dashboard";
  const linkTo = onDashboard ? "/" : "/dashboard";
  const label = onDashboard ? "Home" : "Dashboard";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return (
    <nav className="fixed top-0 right-0 z-[1050] p-6">
      <div className="bg-white backdrop-blur-sm rounded-full px-4 py-3 shadow-lg border border-white/20">
        <div className="flex items-center pl-2 pr-2 space-x-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className="text-black hover:text-library-300"
              >
                <span className="relative inline-flex">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
              <Link
                to="/catalog"
                className="text-black text-md hover:text-library-300 transition-colors duration-300 font-medium"
              >
                Catalog
              </Link>
              <Link
                to={linkTo}
                className="text-white bg-library-400 hover:bg-library-400/70 px-4 py-2 rounded-full transition-all duration-300 text-md font-medium"
              >
                {label}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-black text-md hover:text-library-500 transition-colors duration-300 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-white bg-library-400 hover:bg-library-400/70 px-4 py-2 rounded-full transition-all duration-300 text-md font-medium"
              >
                Register
              </Link>
            </>
          )}
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 text-black text-md hover:text-library-300 transition-colors duration-300 font-medium"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-library-300 bg-library-500/10 flex items-center justify-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src=""
                    alt={fullName || user?.username || "User"}
                  />
                  <AvatarFallback className="bg-library-500 text-white text-sm">
                    {(fullName || user?.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </Link>
          ) : (
            <></>
          )}
        </div>
      </div>
    </nav>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BackgroundFX />
          <GlobalFloatNav />
          <TitleManager>
            <Routes>
              {/* Public pages */}
              <Route
                path="/"
                element={
                  <FullBleed>
                    <Index />
                  </FullBleed>
                }
              />
              <Route
                path="/login"
                element={
                  <FullBleed>
                    <Login />
                  </FullBleed>
                }
              />
              <Route
                path="/register"
                element={
                  <FullBleed>
                    <Register />
                  </FullBleed>
                }
              />
              <Route
                path="/book/:id"
                element={
                  <FullBleed>
                    <BookDetailPage />
                  </FullBleed>
                }
              />
              {/* Authenticated shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="catalog" element={<Catalog />} />
                <Route
                  path="management/catalog"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementCatalogPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="search" element={<SearchPage />} />
                <Route path="loans" element={<LoansPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route
                  path="management"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <div className="p-10 w-full">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                          Management
                        </h1>
                        <p className="mt-4 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                          Restricted area for librarians & administrators.
                        </p>
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="management/loans"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementLoansPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="management/borrow-requests"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementBorrowRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="management/reservations"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementReservationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="management/returns"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementReturnsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="management/users"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <div className="p-10 w-full">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                          Admin Panel
                        </h1>
                        <p className="mt-4 text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                          Administrator-only configuration space.
                        </p>
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/reports"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/analytics"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/settings"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminSettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              {/* Authorization feedback */}
              <Route
                path="/unauthorized"
                element={
                  <FullBleed>
                    <Unauthorized />
                  </FullBleed>
                }
              />
              {/* 404 */}
              <Route
                path="*"
                element={
                  <FullBleed>
                    <NotFound />
                  </FullBleed>
                }
              />
            </Routes>
          </TitleManager>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
