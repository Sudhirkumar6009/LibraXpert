
import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Link } from 'react-router-dom';
import { BookOpenText, ArrowLeft } from 'lucide-react';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Panel - Auth Form */}
        <div className="w-full md:w-1/2 flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="absolute top-4 left-4">
              <Link to="/" className="flex items-center text-library-600 hover:text-library-800">
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span>Back to Home</span>
              </Link>
            </div>
            
            <LoginForm />
          </div>
        </div>
        
        {/* Right Panel - Image & Info */}
        <div className="hidden md:block md:w-1/2 bg-library-600 text-white">
          <div className="h-full flex flex-col items-center justify-center p-12">
            <BookOpenText className="h-16 w-16 mb-6" />
            <h2 className="text-3xl font-bold mb-6 text-center">Access Your Library Account</h2>
            <p className="max-w-md text-center text-library-100 mb-8">
              Sign in to manage your borrowed books, check due dates, and discover new reading recommendations.
            </p>
            
            <div className="bg-library-700/30 rounded-lg p-6 max-w-md">
              <h3 className="font-semibold mb-3">With ACLMS you can:</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-library-200 mr-2"></div>
                  <span>Borrow books with a single click</span>
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-library-200 mr-2"></div>
                  <span>Reserve books that are currently unavailable</span>
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-library-200 mr-2"></div>
                  <span>Receive notifications about due dates</span>
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-library-200 mr-2"></div>
                  <span>Track your reading history and preferences</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
