
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Search, User, BookCheck } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-library-500 to-library-600 text-white">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                LibraXpert
              </h1>
              <p className="text-xl text-library-100 max-w-lg">
                Advanced Library Management System to Discover, borrow, and manage library resources across all your devices with our cross-platform solution.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button asChild size="lg" className="bg-white text-library-700 hover:bg-library-100">
                  <Link to="/catalog">Explore Catalog</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-transparent border-white/10 text-white hover:bg-white/100 bg-library-800 hover:text-library-700">
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </div>
            
            <div className="hidden md:flex justify-center">
              <img
                src="https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Library Books"
                className="rounded-lg shadow-2xl max-w-auto h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-library-700">Key Features</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Our library management system is designed to streamline all aspects of library operations for students, patrons, librarians, and administrators.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-gray-100 hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-library-100 rounded-full mb-4">
                    <BookOpen className="h-6 w-6 text-library-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Comprehensive Catalog</h3>
                  <p className="text-gray-600 text-sm">
                    Browse and search our extensive collection of books, journals, and digital resources.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-100 hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-library-100 rounded-full mb-4">
                    <Search className="h-6 w-6 text-library-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Advanced Search</h3>
                  <p className="text-gray-600 text-sm">
                    Find exactly what you need with powerful filtering and sorting options.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-100 hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-library-100 rounded-full mb-4">
                    <User className="h-6 w-6 text-library-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">User Accounts</h3>
                  <p className="text-gray-600 text-sm">
                    Personalized accounts for students, librarians, and administrators with role-specific features.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-100 hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-library-100 rounded-full mb-4">
                    <BookCheck className="h-6 w-6 text-library-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Loan Management</h3>
                  <p className="text-gray-600 text-sm">
                    Borrow, reserve, and return books with real-time tracking and notifications.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-library-50 rounded-2xl p-8 md:p-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-library-700 mb-6">
                Ready to get started?
              </h2>
              <p className="text-gray-600 mb-8">
                Create an account to borrow books, manage your loans, and get personalized recommendations.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-library-500 text-white hover:bg-library-600">
                  <Link to="/register">Create Account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-library-500 text-library-500 hover:bg-library-50">
                  <Link to="/catalog">Browse Catalog</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-library-700 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                <BookOpen className="h-6 w-6" />
                <span className="ml-2 font-semibold text-xl">LibraXpert</span>
              </div>
              <p className="text-library-200 mt-4">
                Modern, responsive, and scalable cross-platform library management system.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/catalog" className="text-library-200 hover:text-white">Catalog</a></li>
                <li><a href="/login" className="text-library-200 hover:text-white">Sign In</a></li>
                <li><a href="/register" className="text-library-200 hover:text-white">Create Account</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-library-200">Email: sudhir.kuchara@gmail.com</li>
                <li className="text-library-200">Phone: +91 88499 41378</li>
                <li className="text-library-200">Address: Rakhial, Ahmedabad, Gujarat</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-library-600 mt-8 pt-8 text-center text-library-200 text-sm">
            <p>© {new Date().getFullYear()} LibraXpert. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
