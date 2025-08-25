import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import authService from "@/services/authService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RefreshCw, LogOut, UserCog, CalendarDays, Crown } from "lucide-react";

const formatDate = (d?: Date | string) => {
  if (!d) return "-";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const roleColors: Record<string, string> = {
  student: "bg-library-100 text-library-700 border border-library-200",
  external: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  librarian: "bg-blue-100 text-blue-700 border border-blue-200",
  admin: "bg-library-500 text-white border border-library-600",
};

const ProfilePage: React.FC = () => {
  const { user, isLoading, logout, setCurrentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const refreshed = await authService.getCurrentUser();
      if (refreshed) setCurrentUser(refreshed);
    } catch (e: any) {
      setError(e.message || "Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const membershipDays = user?.createdAt
    ? Math.max(
        1,
        Math.round((Date.now() - new Date(user.createdAt).getTime()) / 86400000)
      )
    : null;

  return (
    <div className="p-6 mt-10 md:p-10 max-w-6xl mx-auto animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View your account information, role, and membership details.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing || isLoading}
            onClick={handleRefresh}
            className="border-library-300 text-library-600 hover:bg-library-50"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-1", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={logout}
            className="bg-red-500 hover:bg-red-600"
          >
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">
          {error}
        </div>
      )}

      {isLoading && !user && (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl bg-gradient-to-br from-library-100/40 to-white border border-library-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && !user && (
        <Card className="border-dashed border-library-300 bg-white/80 backdrop-blur">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-gray-600">No profile loaded. Please log in.</p>
            <Button asChild className="bg-library-500 hover:bg-library-600">
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {user && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column: Identity */}
          <Card className="lg:col-span-1 border-library-200/70 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-library-200">
                  <AvatarImage src="" alt={fullName || user.username} />
                  <AvatarFallback className="bg-library-500 text-white text-xl">
                    {(fullName || user.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold mb-1">
                    {fullName || user.username}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2 py-0.5 text-[11px] font-semibold rounded-md capitalize",
                        roleColors[user.role] || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {user.role}
                    </Badge>
                    {user.role === "admin" && (
                      <span className="flex items-center text-[10px] font-medium text-library-600 bg-library-100 px-2 py-0.5 rounded">
                        <Crown className="h-3 w-3 mr-1" /> Elevated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-sm grid gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                    Username
                  </p>
                  <p className="font-medium text-library-700">
                    {user.username}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                    Email
                  </p>
                  <p className="font-medium text-library-700 break-all">
                    {user.email}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                      First Name
                    </p>
                    <p className="font-medium text-library-700">
                      {user.firstName || (
                        <span className="text-gray-400">—</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                      Last Name
                    </p>
                    <p className="font-medium text-library-700">
                      {user.lastName || (
                        <span className="text-gray-400">—</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Joined
                    </p>
                    <p className="font-medium text-library-700">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                      Updated
                    </p>
                    <p className="font-medium text-library-700">
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-library-600 border-library-300 hover:bg-library-50"
                >
                  <UserCog className="h-4 w-4 mr-1" /> Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right column: Stats & Meta */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid sm:grid-cols-3 gap-5">
              <Card className="relative overflow-hidden border-library-200/70">
                <CardContent className="pt-5 pb-5">
                  <p className="text-[11px] tracking-wider uppercase text-gray-500 font-medium mb-1">
                    Membership Days
                  </p>
                  <p className="text-2xl font-semibold bg-gradient-to-r from-library-500 to-library-700 bg-clip-text text-transparent">
                    {membershipDays ?? "-"}
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-library-200/70">
                <CardContent className="pt-5 pb-5">
                  <p className="text-[11px] tracking-wider uppercase text-gray-500 font-medium mb-1">
                    Designation
                  </p>
                  <p className="text-xl font-semibold capitalize text-library-700">
                    {user.role}
                  </p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-library-200/70">
                <CardContent className="pt-5 pb-5">
                  {user.role === "student" ? (
                    <>
                      <p className="text-[11px] tracking-wider uppercase text-gray-500 font-medium mb-1">
                        Enrollment No.
                      </p>
                      <p className="text-lg font-semibold text-library-700">
                        {user.enrollmentNo}
                      </p>
                    </>
                  ) : user.role === "external" ? (
                    <>
                      <p className="text-[11px] tracking-wider uppercase text-gray-500 font-medium mb-1">
                        External User
                      </p>
                      <p className="text-lg font-semibold text-library-700">
                        External User Details
                      </p>
                    </>
                  ) : user.role === "librarian" ? (
                    <>
                      <p className="text-[11px] tracking-wider uppercase text-gray-500 font-medium mb-1">
                        Library
                      </p>
                      <p className="text-lg font-semibold text-library-700">
                        Librarian ID
                      </p>
                    </>
                  ) : user.role === "admin" ? (
                    <>
                      <p className="text-[11px] tracking-wider uppercase text-gray-500 font-medium mb-1">
                        Admin
                      </p>
                      <p className="text-lg font-semibold text-library-700">
                        Elevated
                      </p>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="border-library-200/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">
                  Account Integrity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email Verified</span>
                  <span className="font-medium text-library-600">Assumed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Password Strength</span>
                  <span className="font-medium text-library-600">Hidden</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Two-Factor Auth</span>
                  <span className="font-medium text-red-500">Disabled</span>
                </div>
                <Separator />
                <p className="text-[11px] text-gray-500">
                  Security enhancements coming soon.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
