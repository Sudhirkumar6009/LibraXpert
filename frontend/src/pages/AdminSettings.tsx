import React from "react";
import { LibraryRulesContent } from "@/components/library/LibraryRules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminSettingsPage = () => {
  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Admin Settings
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Configure system-wide settings and view library policies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Library Rules & Regulations</CardTitle>
        </CardHeader>
        <CardContent>
          <LibraryRulesContent />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
