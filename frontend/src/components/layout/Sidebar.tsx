
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Home,
  Search,
  User,
  Users,
  Settings,
  BookCheck,
  Bell,
  BarChart,
  FileText,
  Calendar,
  BookPlus,
  BookX
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
};

const Sidebar = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  const sidebarItems: SidebarItem[] = [
    {
      title: 'Home',
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: 'Catalog',
      href: '/catalog',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: 'Search',
      href: '/search',
      icon: <Search className="h-5 w-5" />,
    },
    {
      title: 'My Loans',
      href: '/loans',
      icon: <BookCheck className="h-5 w-5" />,
      roles: ['student', 'librarian', 'admin'],
    },
    {
      title: 'My Profile',
      href: '/profile',
      icon: <User className="h-5 w-5" />,
      roles: ['student', 'librarian', 'admin'],
    },
    {
      title: 'Calendar',
      href: '/calendar',
      icon: <Calendar className="h-5 w-5" />,
      roles: ['student', 'librarian', 'admin'],
    },
    {
      title: 'Loan Management',
      href: '/management/loans',
      icon: <BookPlus className="h-5 w-5" />,
      roles: ['librarian', 'admin'],
    },
    {
      title: 'Returns',
      href: '/management/returns',
      icon: <BookX className="h-5 w-5" />,
      roles: ['librarian', 'admin'],
    },
    {
      title: 'Users',
      href: '/management/users',
      icon: <Users className="h-5 w-5" />,
      roles: ['librarian', 'admin'],
    },
    {
      title: 'Reports',
      href: '/admin/reports',
      icon: <FileText className="h-5 w-5" />,
      roles: ['admin'],
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart className="h-5 w-5" />,
      roles: ['admin'],
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      roles: ['admin'],
    },
  ];

  const filteredItems = sidebarItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const studentItems = filteredItems.filter(item => 
    !item.roles || 
    (user?.role === 'student' && item.roles.includes('student'))
  );
  
  const librarianItems = filteredItems.filter(item => 
    ['librarian', 'admin'].includes(user?.role || '') && 
    item.href.startsWith('/management')
  );
  
  const adminItems = filteredItems.filter(item => 
    user?.role === 'admin' && 
    item.href.startsWith('/admin')
  );
  
  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 w-64",
      className
    )}>
      <div className="flex-1 overflow-y-auto py-5 px-3">
        <nav className="space-y-1 px-2">
          {studentItems.map((item) => (
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
              <div className="mr-3 text-library-500">{item.icon}</div>
              {item.title}
            </Link>
          ))}
          
          {librarianItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                  <div className="mr-3 text-library-500">{item.icon}</div>
                  {item.title}
                </Link>
              ))}
            </>
          )}
          
          {adminItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                  <div className="mr-3 text-library-500">{item.icon}</div>
                  {item.title}
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
