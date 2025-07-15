
import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import { Link } from 'react-router-dom';
import { BookOpenText, ArrowLeft } from 'lucide-react';

const Register = () => {
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
            
            <RegisterForm />
          </div>
        </div>
        
        {/* Right Panel - Image & Info */}
        <div className="hidden md:block md:w-1/2 bg-library-600 text-white">
          <div className="h-full flex flex-col items-center justify-center p-12">
            <BookOpenText className="h-16 w-16 mb-6" />
            <h2 className="text-3xl font-bold mb-6 text-center">Join Our Library Community</h2>
            <p className="max-w-md text-center text-library-100 mb-8">
              Create an account to access our extensive collection of books, journals, and digital resources.
            </p>
            
            <div className="bg-library-700/30 rounded-lg p-6 max-w-md">
              <h3 className="font-semibold mb-3">Member Benefits:</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-library-200 mr-2"></div>
                  <span>Access to over 10,000 books and resources</span>
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-library-200 mr-2"></div>
                  <span>Personalized reading recommendations</span>
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-library-200 mr-2"></div>
                  <span>Extended lending periods for members</span>
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-library-200 mr-2"></div>
                  <span>Early access to new arrivals and events</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
