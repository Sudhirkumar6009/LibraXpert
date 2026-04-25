import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Librarian = {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
};

const emptyForm = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
};

const ManagementUsersPage = () => {
  const { user } = useAuth();
  const [librarians, setLibrarians] = useState<Librarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isAdmin = user?.role === "admin";

  const fetchLibrarians = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/admin/librarians`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch librarians");
      }

      const data = await response.json();
      setLibrarians(data || []);
    } catch (error: any) {
      toast({
        title: "Unable to load librarians",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrarians();
  }, [isAdmin]);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.username || !form.email || !form.password) {
      toast({
        title: "Missing required fields",
        description: "Username, email and password are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(`${API_URL}/admin/librarians`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create librarian");
      }

      const created = await response.json();
      setForm(emptyForm);
      await fetchLibrarians();
      toast({
        title: "Librarian added",
        description: `${created?.librarian?.username || "New librarian"} can now access librarian features.`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to add librarian",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = async (librarian: Librarian) => {
    const confirmed = window.confirm(`Remove librarian ${librarian.username}?`);
    if (!confirmed) return;

    try {
      setDeletingId(librarian._id);
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/admin/librarians/${librarian._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to remove librarian");
      }

      setLibrarians((current) =>
        current.filter((item) => item._id !== librarian._id),
      );
      toast({
        title: "Librarian removed",
        description: `${librarian.username} was removed successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to remove librarian",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-sm text-slate-600">Loading user session...</div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-4">User Management</h1>
        <p className="text-sm text-red-600">
          Only administrators can add or remove librarian accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Librarian Management</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Add librarian accounts and remove them when access should be revoked.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Librarian</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder="librarian.username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="librarian@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                placeholder="Last name"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Librarian"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Librarians</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading librarian list...</p>
          ) : librarians.length === 0 ? (
            <p className="text-sm text-slate-500">
              No librarian accounts found.
            </p>
          ) : (
            <div className="space-y-3">
              {librarians.map((librarian) => (
                <div
                  key={librarian._id}
                  className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {librarian.username}
                    </p>
                    <p className="text-sm text-slate-600">{librarian.email}</p>
                    <p className="text-xs text-slate-500">
                      {librarian.firstName || librarian.lastName
                        ? `${librarian.firstName || ""} ${librarian.lastName || ""}`.trim()
                        : "No display name"}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === librarian._id}
                    onClick={() => onRemove(librarian)}
                  >
                    {deletingId === librarian._id ? "Removing..." : "Remove"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementUsersPage;
