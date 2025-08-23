import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import BookDetailPage from "./pages/BookDetailPage";
// Added feature pages
import SearchPage from "./pages/Search";
import LoansPage from "./pages/Loans";
import ProfilePage from "./pages/Profile";
import CalendarPage from "./pages/Calendar";
// Management pages
import ManagementLoansPage from "./pages/ManagementLoans";
import ManagementReturnsPage from "./pages/ManagementReturns";
import ManagementUsersPage from "./pages/ManagementUsers";
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

// Page title manager & route transition wrapper
const RouteFX: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    if (p.startsWith("/management/loans"))
      return `${BASE_TITLE} – Loan Management`;
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
        exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BackgroundFX />
          <RouteFX>
            <FullBleed>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/book/:id" element={<BookDetailPage />} />
                {/* Protected Routes (authenticated users) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/loans"
                  element={
                    <ProtectedRoute>
                      <LoansPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />
                {/* Management (librarian + admin) */}
                <Route
                  path="/management/loans"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementLoansPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/management/returns"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementReturnsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/management/users"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <ManagementUsersPage />
                    </ProtectedRoute>
                  }
                />
                {/* Admin Routes */}
                <Route
                  path="/management"
                  element={
                    <ProtectedRoute requiredRoles={["librarian", "admin"]}>
                      <div className="p-10 w-full">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent animate-[gradient_8s_linear_infinite]">
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
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <div className="p-10 w-full">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent animate-[gradient_8s_linear_infinite]">
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
                  path="/admin/reports"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <AdminSettingsPage />
                    </ProtectedRoute>
                  }
                />
                {/* Authorization feedback */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </FullBleed>
          </RouteFX>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
