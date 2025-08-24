
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import BookDetail from '@/components/books/BookDetail';
import { Button } from '@/components/ui/button';
import { Book } from '@/types';
import { ArrowLeft } from 'lucide-react';

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  
  // Mock books data for demonstration
  const mockBooks: Book[] = [
    {
      id: '1',
      title: 'Clean Code: A Handbook of Agile Software',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      coverImage: 'https://m.media-amazon.com/images/I/51E2055ZGUL._SY445_SX342_.jpg',
      description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way. Noted software expert Robert C. Martin presents a revolutionary paradigm with Clean Code: A Handbook of Agile Software Craftsmanship. Martin has teamed up with his colleagues from Object Mentor to distill their best agile practice of cleaning code \"on the fly\" into a book that will instill within you the values of a software craftsman and make you a better programmer—but only if you work at it.",
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
      description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems. Previously undocumented, these 23 patterns allow designers to create more flexible, elegant, and ultimately reusable designs without having to rediscover the design solutions themselves. The authors begin by describing what patterns are and how they can help you design object-oriented software. They then go on to systematically name, explain, evaluate, and catalog recurring designs in object-oriented systems. With Design Patterns as your guide, you will learn how these important patterns fit into the software development process, and how you can leverage them to solve your own design problems most efficiently.',
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
      description: 'The Pragmatic Programmer cuts through the increasing specialization and technicalities of modern software development to examine the core process--taking a requirement and producing working, maintainable code that delights its users. The Pragmatic Programmer covers topics ranging from personal responsibility and career development to architectural techniques for keeping your code flexible and easy to adapt and reuse. Readers will learn techniques and specific tools to help them build better software.',
      publicationYear: 1999,
      publisher: 'Addison-Wesley Professional',
      category: ['Programming', 'Software Engineering'],
      totalCopies: 2,
      availableCopies: 0,
      location: 'Section A, Shelf 10',
      rating: 4.7,
      status: 'borrowed'
    }
  ];
  
  useEffect(() => {
    // Simulate API call to fetch book by ID
    setIsLoading(true);
    
    // Simulate loading time
    setTimeout(() => {
      const foundBook = mockBooks.find(b => b.id === id);
      setBook(foundBook || null);
      setIsLoading(false);
    }, 800);
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar className="hidden lg:block h-[calc(100vh-4rem)]" />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <Button 
                  variant="ghost" 
                  className="mr-2 p-0 h-8 w-8" 
                  asChild
                >
                  <Link to="/catalog">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-800">
                  {isLoading ? 'Loading...' : book?.title || 'Book Not Found'}
                </h1>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col lg:flex-row gap-6 animate-pulse">
                <div className="flex-shrink-0 w-full lg:w-1/3 xl:w-1/4">
                  <div className="aspect-[2/3] bg-gray-200 rounded"></div>
                </div>
                <div className="flex-grow space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ) : book ? (
              <BookDetail book={book} />
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Book Not Found</h2>
                <p className="text-gray-600 mb-6">
                  The book you are looking for does not exist or has been removed.
                </p>
                <Button asChild>
                  <Link to="/catalog">Return to Catalog</Link>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookDetailPage;
