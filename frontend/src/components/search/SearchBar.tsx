import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string, filter: string) => void;
  className?: string;
}

const SearchBar = ({ onSearch, className }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, filter);
  };

  const clearSearch = () => {
    setQuery("");
    setFilter("all");
    onSearch("", "all");
  };

  return (
    <form onSubmit={handleSearch} className={`w-full ${className}`}>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search books, authors, ISBN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-library-800 text-sm tracking-wider pl-10 pr-10 h-12 bg-gray-50 border-library-500"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-library-600" />
          </div>
          {query && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={clearSearch}
                className="focus:outline-none"
              >
                <X className="h-5 w-5 text-library-600 hover:text-library-600/50" />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32 h-12 bg-gray-50 border-library-500">
              <SelectValue placeholder="Filter By" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all" className="">
                All
              </SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="author">Author</SelectItem>
              <SelectItem value="isbn">ISBN</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="submit"
            className="h-12 w-full md:w-auto bg-library-500 text-white hover:bg-library-600"
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
