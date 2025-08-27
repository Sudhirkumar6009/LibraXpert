import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Props {
  bookId: string;
  title?: string;
  deleteTitle?: boolean;
  onDeleted?: () => void;
  icon?: React.ReactNode;
  height?: string | number;
}

const DeleteBook: React.FC<Props> = ({
  bookId,
  title,
  onDeleted,
  icon,
  deleteTitle,
  height,
}) => {
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("libraxpert_token");
      const res = await fetch(`${API_URL}/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Failed to delete (${res.status})`);
      }
      toast({ title: "Book deleted" });
      if (onDeleted) onDeleted();
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

  const defaultIcon = <Trash className="h-5 w-5" />;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" style={{ height }}>
          {icon ?? defaultIcon}
          {deleteTitle ? "Delete" : ""}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Book</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{title}"? This action cannot be
            undone and will remove the cover image and PDF file if present.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteBook;
