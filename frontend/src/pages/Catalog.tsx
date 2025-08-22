
import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import SearchBar from '@/components/search/SearchBar';
import BookGrid from '@/components/books/BookGrid';
import { Book } from '@/types';

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock books data
  const books: Book[] = [
    {
      id: '1',
      title: 'Clean Code: A Handbook of Agile Software',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      coverImage: 'https://m.media-amazon.com/images/I/51E2055ZGUL._SY445_SX342_.jpg',
      description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way.",
      publicationYear: 2008,
      publisher: 'Prentice Hall',
      category: ['Programming', 'Software Engineering', 'Computer Science'],
      totalCopies: 5,
      availableCopies: 3,
      location: 'Section A, Shelf 12',
      rating: 4.7,
      status: 'available'
    },
    {
      id: '2',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      isbn: '9780201633610',
      coverImage: 'https://m.media-amazon.com/images/I/51szD9HC9pL._SY445_SX342_.jpg',
      description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.',
      publicationYear: 1994,
      publisher: 'Addison-Wesley Professional',
      category: ['Programming', 'Software Design', 'Computer Science'],
      totalCopies: 3,
      availableCopies: 1,
      location: 'Section B, Shelf 5',
      rating: 4.8,
      status: 'available'
    },
    {
      id: '3',
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt, David Thomas',
      isbn: '9780201616224',
      coverImage: 'https://m.media-amazon.com/images/I/51W1sBPO7tL._SY445_SX342_.jpg',
      description: 'The Pragmatic Programmer cuts through the increasing specialization and technicalities of modern software development to examine the core process--taking a requirement and producing working, maintainable code that delights its users.',
      publicationYear: 1999,
      publisher: 'Addison-Wesley Professional',
      category: ['Programming', 'Software Engineering'],
      totalCopies: 2,
      availableCopies: 0,
      location: 'Section A, Shelf 10',
      rating: 4.7,
      status: 'borrowed'
    },
    {
      id: '4',
      title: 'Code Complete: A Practical Handbook of Software Construction',
      author: 'Steve McConnell',
      isbn: '9780735619678',
      coverImage: 'https://m.media-amazon.com/images/I/41nvEPEagML._SX258_BO1,204,203,200_.jpg',
      description: "Widely considered one of the best practical guides to programming, Steve McConnell's original CODE COMPLETE has been helping developers write better software for more than a decade.",
      publicationYear: 2004,
      publisher: 'Microsoft Press',
      category: ['Programming', 'Software Engineering'],
      totalCopies: 4,
      availableCopies: 1,
      location: 'Section A, Shelf 11',
      rating: 4.6,
      status: 'available'
    },
    {
      id: '5',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      isbn: '9780262033848',
      coverImage: 'https://m.media-amazon.com/images/I/41T0iBxY8FL._SX258_BO1,204,203,200_.jpg',
      description: 'Some books on algorithms are rigorous but incomplete; others cover masses of material but lack rigor. Introduction to Algorithms uniquely combines rigor and comprehensiveness.',
      publicationYear: 2009,
      publisher: 'MIT Press',
      category: ['Algorithms', 'Computer Science', 'Mathematics'],
      totalCopies: 3,
      availableCopies: 0,
      location: 'Section C, Shelf 2',
      rating: 4.5,
      status: 'reserved'
    },
    {
      id: '6',
      title: 'Cracking the Coding Interview',
      author: 'Gayle Laakmann McDowell',
      isbn: '9780984782857',
      coverImage: 'https://m.media-amazon.com/images/I/41oYsXjLvZL._SY344_BO1,204,203,200_.jpg',
      description: 'Learn how to uncover the hints and hidden details in a question, discover how to break down a problem into manageable chunks, develop techniques to unstick yourself when stuck, and more.',
      publicationYear: 2015,
      publisher: 'CareerCup',
      category: ['Programming', 'Interview', 'Computer Science'],
      totalCopies: 5,
      availableCopies: 3,
      location: 'Section B, Shelf 7',
      rating: 4.7,
      status: 'available'
    },
    {
      id: '7',
      title: 'Refactoring: Improving the Design of Existing Code',
      author: 'Martin Fowler',
      isbn: '9780201485677',
      coverImage: 'https://m.media-amazon.com/images/I/41oYsXjLvZL._SY344_BO1,204,203,200_.jpg',
      description: 'Refactoring is about improving the design of existing code. It is the process of changing a software system in such a way that it does not alter the external behavior of the code, yet improves its internal structure.',
      publicationYear: 1999,
      publisher: 'Addison-Wesley Professional',
      category: ['Programming', 'Software Engineering'],
      totalCopies: 2,
      availableCopies: 1,
      location: 'Section A, Shelf 9',
      rating: 4.5,
      status: 'available'
    },
    {
      id: '8',
      title: 'The Art of Computer Programming, Vol. 1',
      author: 'Donald E. Knuth',
      isbn: '9780201896831',
      coverImage: 'https://m.media-amazon.com/images/I/41gCSRxxVeL._SY344_BO1,204,203,200_.jpg',
      description: 'The bible of all fundamental algorithms and the work that taught many of today\'s software developers most of what they know about computer programming.',
      publicationYear: 1997,
      publisher: 'Addison-Wesley Professional',
      category: ['Programming', 'Algorithms', 'Computer Science'],
      totalCopies: 1,
      availableCopies: 0,
      location: 'Section C, Shelf 1',
      rating: 4.9,
      status: 'borrowed'
    }
  ];
  
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
  const filteredBooks = books.filter((book) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    switch (searchFilter) {
      case 'title':
        return book.title.toLowerCase().includes(query);
      case 'author':
        return book.author.toLowerCase().includes(query);
      case 'isbn':
        return book.isbn.includes(query);
      case 'category':
        return book.category.some(cat => cat.toLowerCase().includes(query));
      default:
        return (
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.isbn.includes(query) ||
          book.category.some(cat => cat.toLowerCase().includes(query))
        );
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar className="hidden lg:block h-[calc(100vh-4rem)]" />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Book Catalog
              </h1>
              
              <SearchBar onSearch={handleSearch} />
            </div>
            
            <div className="mb-6">
              {searchQuery && (
                <p className="text-sm text-gray-500 mb-4">
                  Showing results for "{searchQuery}"
                  {searchFilter !== 'all' && ` in ${searchFilter}`}
                </p>
              )}
            </div>
            
            <BookGrid books={filteredBooks} loading={isLoading} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Catalog;
