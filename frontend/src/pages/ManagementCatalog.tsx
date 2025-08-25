import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Book } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ManagementCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    publicationYear: "",
    publisher: "",
    totalCopies: "1",
    location: "",
    categories: "",
    tags: "",
    description: "",
    file: null as File | null, // PDF
    cover: null as File | null, // Cover image
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/books`);
      const data = await res.json();
      // Normalize file paths to full URLs
      const backendOrigin = (
        import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      ).replace(/\/api\/?$/, "");
      const makeUrl = (p: any) => {
        if (!p) return undefined;
        if (typeof p !== "string") return undefined;
        if (/^https?:\/\//.test(p)) return p;
        return `${backendOrigin}/${p.replace(/^\/*/, "")}`;
      };
      setBooks(
        data.map((b: any) => ({
          ...b,
          coverImage: makeUrl(b.coverImage),
          pdfFile: makeUrl(b.pdfFile),
        }))
      );
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, file }));
  };

  const onCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cover = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, cover }));
    if (cover) {
      const url = URL.createObjectURL(cover);
      setCoverPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } else {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "file" || k === "cover") return;
        // @ts-ignore
        if (v) fd.append(k, v);
      });
      if (form.file) fd.append("file", form.file);
      if (form.cover) fd.append("cover", form.cover);
      const token = localStorage.getItem("libraxpert_token");
      const res = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message || `Failed to add book (${res.status})`
        );
      }
      toast({ title: "Book added" });
      setForm({
        title: "",
        author: "",
        isbn: "",
        publicationYear: "",
        publisher: "",
        totalCopies: "1",
        location: "",
        categories: "",
        tags: "",
        description: "",
        file: null,
        cover: null,
      });
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      fetchBooks();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Catalog Management
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Add and manage books. PDF upload supported (20MB).
        </p>
      </div>
      <div className="grid lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-1 border-library-200/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add New Book</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <Input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={onChange}
                required
              />
              <Input
                name="author"
                placeholder="Author"
                value={form.author}
                onChange={onChange}
                required
              />
              <Input
                name="isbn"
                placeholder="ISBN"
                value={form.isbn}
                onChange={onChange}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="publicationYear"
                  placeholder="Year"
                  value={form.publicationYear}
                  onChange={onChange}
                />
                <Input
                  name="totalCopies"
                  placeholder="Copies"
                  type="number"
                  min={1}
                  value={form.totalCopies}
                  onChange={onChange}
                />
              </div>
              <Input
                name="publisher"
                placeholder="Publisher"
                value={form.publisher}
                onChange={onChange}
              />
              <Input
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={onChange}
              />
              <Input
                name="categories"
                placeholder="Categories (comma separated)"
                value={form.categories}
                onChange={onChange}
              />
              <Input
                name="tags"
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={onChange}
              />
              <Textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={onChange}
              />
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">
                  Cover Image (optional)
                </label>
                {coverPreview && (
                  <div className="w-24 aspect-[2/3] overflow-hidden rounded border border-slate-200">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={onCover} />
              </div>
              <Input type="file" accept="application/pdf" onChange={onFile} />
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-library-500 hover:bg-library-600"
              >
                {loading ? "Saving..." : "Add Book"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-library-200/70">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Existing Books ({books.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {books.length === 0 ? (
                <p className="text-sm text-slate-500">No books yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b">
                        <th className="py-2 pr-4">Title</th>
                        <th className="py-2 pr-4">Author</th>
                        <th className="py-2 pr-4">Year</th>
                        <th className="py-2 pr-4">Copies</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((b) => (
                        <tr key={b.id} className="border-b last:border-none">
                          <td className="py-2 pr-4">
                            {b.coverImage ? (
                              <img
                                src={b.coverImage}
                                alt={b.title}
                                className="h-12 w-8 object-cover rounded"
                              />
                            ) : (
                              <div className="h-12 w-8 bg-slate-100 rounded" />
                            )}
                          </td>
                          <td className="py-2 pr-4 font-medium max-w-[220px] truncate">
                            {b.title}
                          </td>
                          <td className="py-2 pr-4 max-w-[160px] truncate">
                            {b.author}
                          </td>
                          <td className="py-2 pr-4">
                            {(b as any).publicationYear || "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {(b as any).availableCopies}/
                            {(b as any).totalCopies}
                          </td>
                          <td className="py-2 pr-4 capitalize">
                            {(b as any).status}
                          </td>
                          <td className="py-2 pr-4">
                            {(b as any).pdfFile ? (
                              <a
                                className="text-library-600 hover:underline"
                                href={(b as any).pdfFile}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagementCatalogPage;
