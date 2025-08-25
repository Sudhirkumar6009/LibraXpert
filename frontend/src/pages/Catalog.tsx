import React, { useState, useEffect, useMemo } from "react";
import SearchBar from "@/components/search/SearchBar";
import BookGrid from "@/components/books/BookGrid";
import { Book } from "@/types";

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/books`);
      const data = await res.json();
      setBooks(
        data.map((b: any) => ({
          id: b.id || b._id,
          title: b.title,
          author: b.author,
          isbn: b.isbn,
          coverImage: b.coverImage,
          description: b.description || "No description provided.",
          publicationYear: b.publicationYear || 0,
          publisher: b.publisher || "",
          category: b.categories || [],
          totalCopies: b.totalCopies || 0,
          availableCopies: b.availableCopies || 0,
          location: b.location || "",
          rating: b.rating,
          status: b.status || "available",
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (query: string, filter: string) => {
    setIsLoading(true);
    setSearchQuery(query);
    setSearchFilter(filter);

    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Filter books based on search query and filter
  const filteredBooks = useMemo(
    () =>
      books.filter((book) => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();

        switch (searchFilter) {
          case "title":
            return book.title.toLowerCase().includes(query);
          case "author":
            return book.author.toLowerCase().includes(query);
          case "isbn":
            return book.isbn.includes(query);
          case "category":
            return book.category.some((cat) =>
              cat.toLowerCase().includes(query)
            );
          default:
            return (
              book.title.toLowerCase().includes(query) ||
              book.author.toLowerCase().includes(query) ||
              book.isbn.includes(query) ||
              book.category.some((cat) => cat.toLowerCase().includes(query))
            );
        }
      }),
    [books, searchQuery, searchFilter]
  );

  const gradientText =
    "bg-gradient-to-r from-library-500 via-library-700 to-library-800 bg-clip-text text-transparent";

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold  mb-6 ${gradientText}`}>
              Book Catalog
            </h1>
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="mb-6">
            {searchQuery && (
              <p className="text-sm text-gray-500 mb-4">
                Showing results for "{searchQuery}"
                {searchFilter !== "all" && ` in ${searchFilter}`}
              </p>
            )}
          </div>
          <BookGrid books={filteredBooks} loading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default Catalog;
