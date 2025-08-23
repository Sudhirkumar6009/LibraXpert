import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
          403
        </h1>
        <h2 className="text-xl font-semibold text-slate-800">Access Denied</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          You do not have the required permissions to view this page. If you
          believe this is an error, contact a system administrator.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-md bg-sky-600 text-white text-sm font-medium shadow hover:bg-sky-500 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-md border border-slate-300 text-slate-700 text-sm font-medium bg-white hover:bg-slate-50 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
