import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Search,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  BookOpenText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { toast } from "@/components/ui/use-toast";

const Navbar = () => {
  const { user, isAuthenticated, logout, notifications } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  const unreadNotificationsCount =
    notifications?.filter((n) => !n.isRead).length || 0;

  const handleLogout = () => {
    logout();
    navigate("/");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BookOpenText className="h-8 w-8 text-library-500" />
              <div className="ml-2">
                <span className="text-xl font-semibold text-library-700">
                  LibraXpert
                </span>
                <span className="text-xs block text-gray-500">
                  Advanced Library Management
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                to="/catalog"
                className="text-library-600 hover:text-library-800 px-3 py-2 text-sm font-medium"
              >
                Catalog
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="text-library-600 hover:text-library-800 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
              {isAuthenticated &&
                (user?.role === "librarian" || user?.role === "admin") && (
                  <Link
                    to="/management"
                    className="text-library-600 hover:text-library-800 px-3 py-2 text-sm font-medium"
                  >
                    Management
                  </Link>
                )}
              {isAuthenticated && user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-library-600 hover:text-library-800 px-3 py-2 text-sm font-medium"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Popover
                  open={isNotificationsOpen}
                  onOpenChange={setIsNotificationsOpen}
                >
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadNotificationsCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                          {unreadNotificationsCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <NotificationCenter
                      onClose={() => setIsNotificationsOpen(false)}
                    />
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative flex items-center gap-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user?.profileImage}
                          alt={user?.name}
                        />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden lg:block">
                        <span className="text-sm font-medium">
                          {user?.name}
                        </span>
                        <span className="text-xs block text-gray-500 capitalize">
                          {user?.role}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    {user?.role === "student" && user?.enrollmentNo && (
                      <DropdownMenuItem>
                        <span className="text-xs text-muted-foreground ml-6">
                          Enrollment: {user.enrollmentNo}
                        </span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-library-500 p-2"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div id="mobile-menu" className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            <Link
              to="/catalog"
              className="block px-3 py-2 rounded-md text-base font-medium text-library-600 hover:bg-library-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Catalog
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-library-600 hover:bg-library-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated &&
              (user?.role === "librarian" || user?.role === "admin") && (
                <Link
                  to="/management"
                  className="block px-3 py-2 rounded-md text-base font-medium text-library-600 hover:bg-library-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Management
                </Link>
              )}
            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-md text-base font-medium text-library-600 hover:bg-library-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <Link
              to="/search"
              className="block px-3 py-2 rounded-md text-base font-medium text-library-600 hover:bg-library-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Search
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImage} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-library-800">
                    {user?.name}
                  </div>
                  <div className="text-xs text-library-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <button
                  onClick={() => {}}
                  className="block rounded-md px-3 py-2 text-base font-medium text-library-600 hover:bg-library-100 w-full text-left"
                >
                  Profile
                </button>
                <button
                  onClick={() => {}}
                  className="block rounded-md px-3 py-2 text-base font-medium text-library-600 hover:bg-library-100 w-full text-left"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="block rounded-md px-3 py-2 text-base font-medium text-library-600 hover:bg-library-100 w-full text-left"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex flex-col space-y-2 px-4">
                <Button
                  variant="ghost"
                  asChild
                  className="justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
