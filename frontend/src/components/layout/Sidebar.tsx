import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Home,
  LayoutDashboard,
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
  ChevronLeft,
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

  const items: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Catalog",
      href: "/catalog",
      icon: <BookOpen className="h-5 w-5" />,
    },
    { title: "Search", href: "/search", icon: <Search className="h-5 w-5" /> },
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
      title: "Catalog Mgmt",
      href: "/management/catalog",
      icon: <BookOpen className="h-5 w-5" />,
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

  const filtered = items.filter(
    (i) => !i.roles || (user && i.roles.includes(user.role))
  );
  const studentItems = filtered.filter(
    (i) => !i.roles || i.roles.includes("student")
  );
  const librarianItems = filtered.filter((i) =>
    i.href.startsWith("/management")
  );
  const adminItems = filtered.filter((i) => i.href.startsWith("/admin"));

  const renderGroup = (group: SidebarItem[]) =>
    group.map((item) => {
      const active = location.pathname === item.href;
      return (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            `flex items-center h-11 px-3 rounded-md text-sm font-medium transition-colors}`,
            active
              ? "bg-library-100 text-library-700 shadow-sm"
              : "text-library-600 hover:bg-library-50 hover:text-library-700"
          )}
        >
          <span className="flex items-center justify-center w-6 h-6 mr-2 text-library-500">
            {item.icon}
          </span>
          <span className="truncate">{item.title}</span>
        </Link>
      );
    });

  return (
    <div
      className={cn(
        "w-64 flex flex-col flex-shrink-0 bg-white/90 backdrop-blur border-r border-gray-200",
        className
      )}
    >
      <div className="flex justify-between items-center h-14 px-4 border-b border-gray-200">
        {/* Left side (Logo + Name) */}
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-library-600" />
          <span className="font-semibold text-library-700 tracking-tight">
            LibraXpert
          </span>
        </Link>

        {/* Right side (Home icon) */}
        <Link
          to="/"
          className="flex items-center bg-library-400 rounded-sm border-library-400 hover:bg-library-400/50"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-md text-library-600">
            <Home className="h-5 w-5" color="white" />
          </span>
        </Link>
      </div>

      <div className="flex-1 py-4 px-2 space-y-6">
        <nav className="space-y-1">{renderGroup(studentItems)}</nav>

        {librarianItems.length > 0 && (
          <div>
            <Separator className="my-3" />
            <h3 className="px-2 mb-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              Library Management
            </h3>
            <nav className="space-y-1">{renderGroup(librarianItems)}</nav>
          </div>
        )}

        {adminItems.length > 0 && (
          <div>
            <Separator className="my-3" />
            <h3 className="px-2 mb-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              Administration
            </h3>
            <nav className="space-y-1">{renderGroup(adminItems)}</nav>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="text-[10px] tracking-wide text-gray-400 font-medium">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
