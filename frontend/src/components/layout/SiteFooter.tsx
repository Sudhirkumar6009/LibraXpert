import React from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

interface SiteFooterProps {
  noTopMargin?: boolean;
}

// Reusable site footer matching the home (Index) page footer styling
const SiteFooter: React.FC<SiteFooterProps> = ({ noTopMargin }) => {
  return (
    <footer
      className={`bg-library-700 text-white py-12 w-full ${
        noTopMargin ? "mt-0" : "mt-16"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center">
              <BookOpen className="h-6 w-6" />
              <span className="ml-2 font-semibold text-xl bg-gradient-to-r from-library-50 via-library-100 to-library-300 bg-clip-text text-transparent">
                LibraXpert
              </span>
            </div>
            <p className="text-library-200 mt-4">
              Modern, responsive, and scalable cross-platform library management
              system.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 bg-gradient-to-r from-library-100 via-library-500 to-library-900 bg-clip-text text-transparent">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/catalog"
                  className="text-library-200 hover:text-white"
                >
                  Catalog
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-library-200 hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-library-200 hover:text-white"
                >
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 bg-gradient-to-r from-library-100 via-library-500 to-library-900 bg-clip-text text-transparent">
              Contact
            </h3>
            <ul className="space-y-2 text-library-200 text-sm">
              <li>Email: sudhir.kuchara@gmail.com</li>
              <li>Phone: +91 88499 41378</li>
              <li>Address: Rakhial, Ahmedabad, Gujarat</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-library-600 mt-8 pt-8 text-center text-library-200 text-sm">
          <p>© {new Date().getFullYear()} LibraXpert. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
