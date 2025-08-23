import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Home,
  Search,
  User,
  Users,
  Settings,
  BookCheck,
  BarChart,
  FileText,
  Calendar,
  BookPlus,
  BookX,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
};

const Sidebar = ({ className }: { className?: string }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const sidebarItems: SidebarItem[] = [
    {
      title: "Home",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Catalog",
      href: "/catalog",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Search",
      href: "/search",
      icon: <Search className="h-5 w-5" />,
    },
    {
      title: "My Loans",
      href: "/loans",
      icon: <BookCheck className="h-5 w-5" />,
      roles: ["student", "librarian", "admin"],
    },
    {
      title: "My Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
      roles: ["student", "librarian", "admin"],
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: <Calendar className="h-5 w-5" />,
      roles: ["student", "librarian", "admin"],
    },
    {
      title: "Loan Management",
      href: "/management/loans",
      icon: <BookPlus className="h-5 w-5" />,
      roles: ["librarian", "admin"],
    },
    {
      title: "Returns",
      href: "/management/returns",
      icon: <BookX className="h-5 w-5" />,
      roles: ["librarian", "admin"],
    },
    {
      title: "Users",
      href: "/management/users",
      icon: <Users className="h-5 w-5" />,
      roles: ["librarian", "admin"],
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: <FileText className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin"],
    },
  ];

  const filteredItems = sidebarItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const studentItems = filteredItems.filter(
    (item) =>
      !item.roles ||
      (user?.role === "student" && item.roles.includes("student"))
  );

  const librarianItems = filteredItems.filter(
    (item) =>
      ["librarian", "admin"].includes(user?.role || "") &&
      item.href.startsWith("/management")
  );

  const adminItems = filteredItems.filter(
    (item) => user?.role === "admin" && item.href.startsWith("/admin")
  );

  return (
    <div
      className={cn(
        "group flex flex-col h-full bg-white/85 backdrop-blur border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-library-600" />
          {!collapsed && (
            <span className="font-semibold text-library-700 tracking-tight">
              LibraXpert
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-library-50 text-library-600 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <nav className="space-y-1">
          {studentItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group/item flex items-center px-2 py-2 text-sm font-medium rounded-md relative overflow-hidden",
                location.pathname === item.href
                  ? "bg-library-100 text-library-700 shadow-sm"
                  : "text-library-600 hover:bg-library-50 hover:text-library-700"
              )}
            >
              <div className="mr-3 text-library-500 flex-none">{item.icon}</div>
              <span
                className={cn(
                  "transition-opacity duration-300",
                  collapsed && "opacity-0 pointer-events-none"
                )}
              >
                {item.title}
              </span>
              <span
                className={cn(
                  "absolute right-3 text-[10px] uppercase tracking-wide text-library-400 font-semibold transition-transform duration-300",
                  collapsed
                    ? "translate-x-0 opacity-100"
                    : "translate-x-4 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0"
                )}
              >
                {item.title.charAt(0)}
              </span>
            </Link>
          ))}

          {librarianItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3
                className={cn(
                  "px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-300",
                  collapsed && "opacity-0"
                )}
              >
                Library Management
              </h3>

              {librarianItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    location.pathname === item.href
                      ? "bg-library-100 text-library-700"
                      : "text-library-600 hover:bg-library-50 hover:text-library-700"
                  )}
                >
                  <div className="mr-3 text-library-500 flex-none">
                    {item.icon}
                  </div>
                  <span
                    className={cn(
                      "transition-opacity duration-300",
                      collapsed && "opacity-0 pointer-events-none"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              ))}
            </>
          )}

          {adminItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3
                className={cn(
                  "px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-300",
                  collapsed && "opacity-0"
                )}
              >
                Administration
              </h3>

              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    location.pathname === item.href
                      ? "bg-library-100 text-library-700"
                      : "text-library-600 hover:bg-library-50 hover:text-library-700"
                  )}
                >
                  <div className="mr-3 text-library-500 flex-none">
                    {item.icon}
                  </div>
                  <span
                    className={cn(
                      "transition-opacity duration-300",
                      collapsed && "opacity-0 pointer-events-none"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
      <div className="p-3 border-t border-gray-200">
        <div
          className={cn(
            "text-[10px] tracking-wide text-gray-400 font-medium",
            collapsed && "text-center"
          )}
        >
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
