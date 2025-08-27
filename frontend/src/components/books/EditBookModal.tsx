import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Book } from "@/types";

interface EditBookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditBookModal: React.FC<EditBookModalProps> = ({
  book,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    isbn: "",
    publicationYear: "",
    publisher: "",
    totalCopies: "",
    availableCopies: "",
    location: "",
    categories: "",
    tags: "",
    description: "",
    cover: null as File | null,
    file: null as File | null, // PDF file for e-book
  });
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [newPdfName, setNewPdfName] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (book) {
      setEditForm({
        title: book.title,
        author: book.author,
        isbn: (book as any).isbn || "",
        publicationYear: (book as any).publicationYear?.toString() || "",
        publisher: (book as any).publisher || "",
        totalCopies: (book as any).totalCopies?.toString() || "",
        availableCopies: (book as any).availableCopies?.toString() || "",
        location: (book as any).location || "",
        categories: (book as any).categories?.join(", ") || "",
        tags: (book as any).tags?.join(", ") || "",
        description: (book as any).description || "",
        cover: null,
        file: null,
      });
      setEditCoverPreview((book as any).coverImage || null);
      setNewPdfName(null);
    }
  }, [book]);

  const onEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const onEditCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cover = e.target.files?.[0] || null;
    setEditForm((f) => ({ ...f, cover }));
    if (cover) {
      const url = URL.createObjectURL(cover);
      setEditCoverPreview((prev) => {
        if (prev && prev !== book?.coverImage) URL.revokeObjectURL(prev);
        return url;
      });
    } else {
      if (editCoverPreview && editCoverPreview !== book?.coverImage) {
        URL.revokeObjectURL(editCoverPreview);
      }
      setEditCoverPreview(book?.coverImage || null);
    }
  };

  // NEW: handler for uploading a new PDF when editing
  const onEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEditForm((f) => ({ ...f, file }));
    setNewPdfName(file ? file.name : null);
  };

  const updateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setLoading(true);
    try {
      const fd = new FormData();
      // append simple fields (skip cover and file here)
      Object.entries(editForm).forEach(([k, v]) => {
        if (k === "cover" || k === "file") return;
        if (v) fd.append(k, v as any);
      });
      // append binary uploads if provided
      if (editForm.cover) fd.append("cover", editForm.cover);
      if (editForm.file) fd.append("file", editForm.file);

      const token = localStorage.getItem("libraxpert_token");
      const res = await fetch(`${API_URL}/books/${book.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message || `Failed to update book (${res.status})`
        );
      }
      toast({ title: "Book updated successfully!" });
      onSuccess();
      onClose();
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

  const handleClose = () => {
    // cleanup object URLs if a new cover preview was created
    setEditForm({
      title: "",
      author: "",
      isbn: "",
      publicationYear: "",
      publisher: "",
      totalCopies: "",
      availableCopies: "",
      location: "",
      categories: "",
      tags: "",
      description: "",
      cover: null,
      file: null,
    });
    if (editCoverPreview && editCoverPreview !== book?.coverImage) {
      URL.revokeObjectURL(editCoverPreview);
    }
    setEditCoverPreview(null);
    setNewPdfName(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Book</DialogTitle>
        </DialogHeader>
        <form onSubmit={updateBook} className="space-y-4">
          <Input
            name="title"
            placeholder="Title"
            value={editForm.title}
            onChange={onEditChange}
            required
          />
          <Input
            name="author"
            placeholder="Author"
            value={editForm.author}
            onChange={onEditChange}
            required
          />
          <Input
            name="isbn"
            placeholder="ISBN"
            value={editForm.isbn}
            onChange={onEditChange}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="publicationYear"
              placeholder="Year"
              value={editForm.publicationYear}
              onChange={onEditChange}
            />
            <Input
              name="totalCopies"
              placeholder="Total Copies"
              type="number"
              min={1}
              value={editForm.totalCopies}
              onChange={onEditChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="availableCopies"
              placeholder="Available Copies"
              type="number"
              min={0}
              value={editForm.availableCopies}
              onChange={onEditChange}
            />
            <Input
              name="publisher"
              placeholder="Publisher"
              value={editForm.publisher}
              onChange={onEditChange}
            />
          </div>
          <Input
            name="location"
            placeholder="Location"
            value={editForm.location}
            onChange={onEditChange}
          />
          <Input
            name="categories"
            placeholder="Categories (comma separated)"
            value={editForm.categories}
            onChange={onEditChange}
          />
          <Input
            name="tags"
            placeholder="Tags (comma separated)"
            value={editForm.tags}
            onChange={onEditChange}
          />
          <Textarea
            name="description"
            placeholder="Description"
            value={editForm.description}
            onChange={onEditChange}
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Cover Image (optional)
            </label>
            {editCoverPreview && (
              <div className="w-24 aspect-[2/3] overflow-hidden rounded border border-slate-200">
                <img
                  src={editCoverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Input type="file" accept="image/*" onChange={onEditCover} />
          </div>

          {/* NEW: PDF upload for editing */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              E-book PDF (optional)
            </label>
            {newPdfName ? (
              <div className="text-sm text-slate-700">{newPdfName}</div>
            ) : book && (book as any).pdfFile ? (
              <a
                href={(book as any).pdfFile}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-library-600 hover:underline"
              >
                View current PDF
              </a>
            ) : (
              <div className="text-sm text-slate-500">No PDF uploaded</div>
            )}
            <Input type="file" accept="application/pdf" onChange={onEditFile} />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-library-500 hover:bg-library-600"
            >
              {loading ? "Updating..." : "Update Book"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookModal;
