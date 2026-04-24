import React from "react";
import RegisterForm from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";
import { BookOpenText, ArrowLeft } from "lucide-react";

const Register = () => {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-library-50 via-white to-library-50">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Panel - Auth Form */}
        <div className="relative w-full md:w-1/2 h-screen overflow-y-auto flex justify-center items-start py-10 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -left-20 h-56 w-56 rounded-full bg-library-200/40 blur-3xl" />
            <div className="absolute -bottom-24 right-10 h-56 w-56 rounded-full bg-library-100/60 blur-3xl" />
          </div>
          <div className="relative w-full max-w-md">
            <div className="absolute -top-8 left-0">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-library-700 hover:text-library-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs font-medium">Back to Home</span>
              </Link>
            </div>
            <div className="rounded-3xl border border-library-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-library-500">
                  Create Account
                </p>
                <h1 className="text-2xl font-semibold text-library-900 mt-2">
                  Join LibraXpert
                </h1>
                <p className="text-xs text-library-600 mt-2">
                  Set up your library profile in minutes and unlock personalized
                  recommendations.
                </p>
              </div>
              <RegisterForm />
            </div>
          </div>
        </div>

        {/* Right Panel - Image & Info */}
        <div className="relative hidden md:flex md:w-1/2 h-screen text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-library-700 via-library-600 to-library-800" />
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
          </div>
          <div className="relative h-full flex flex-col items-start justify-center p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <BookOpenText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-library-100">
                  Membership
                </p>
                <h2 className="text-2xl font-semibold">Join the Community</h2>
              </div>
            </div>
            <p className="max-w-md text-library-100/90 text-base mb-6">
              Create an account to access curated collections, digital
              resources, and member-exclusive services.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-library-100">Collections</p>
                <p className="text-xl font-semibold">10K+ titles</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-library-100">Member perks</p>
                <p className="text-xl font-semibold">Priority access</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 max-w-md border border-white/15">
              <h3 className="font-semibold mb-3">Member benefits</h3>
              <ul className="space-y-2 text-sm text-library-100">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-library-100" />
                  Personalized reading recommendations and lists.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-library-100" />
                  Early access to new arrivals and library events.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-library-100" />
                  Extended lending periods with smarter reminders.
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
