import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { BookOpenText, Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/types";
import authService from "@/services/authService";

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, setCurrentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleChange = (value: UserRole) => {
    setRole(value);
    setShowEnrollment(value === "student");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if already submitting
    if (isSubmitting) {
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (role === "student" && !enrollmentNo) {
      toast({
        title: "Error",
        description: "Please enter your enrollment number",
        variant: "destructive",
      });
      return;
    }

    if (role === "student" && !/^\d{12}$/.test(enrollmentNo)) {
      toast({
        title: "Error",
        description: "Enrollment number must be 12 digits",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Starting registration for:", email);

      const response = await authService.register(
        name,
        email,
        password,
        role,
        enrollmentNo
      );

      // Store the token
      if (response.token) {
        localStorage.setItem("libraxpert_token", response.token);
      }

      // Update user context
      if (response.user) {
        // Simply update the context state
        setCurrentUser(response.user);
      }

      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error in form:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to register",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Form header */}
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <BookOpenText className="h-12 w-12 text-library-500 mb-2" />
        <h1 className="text-2xl font-bold text-library-700">LibraXpert</h1>
        <p className="text-gray-500 mt-3">Create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter Sudhirkumar Kuchara"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
          />
        </div>

        {/* Role selection */}
        <div className="space-y-2">
          <Label htmlFor="role">User Type</Label>
          <Select
            value={role}
            onValueChange={(value: UserRole) => handleRoleChange(value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="external">External User</SelectItem>
              <SelectItem value="librarian">Librarian</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conditional enrollment field */}
        {showEnrollment && (
          <div className="space-y-2">
            <Label htmlFor="enrollmentNo">GTU Enrollment Number</Label>
            <Input
              id="enrollmentNo"
              placeholder="e.g., 240133116008"
              value={enrollmentNo}
              onChange={(e) => setEnrollmentNo(e.target.value)}
              disabled={isSubmitting}
              pattern="\d{12}"
              title="Please enter a valid 12-digit enrollment number"
            />
            <p className="text-xs text-gray-500">
              Format: YYMMIIIBBSSS (Year, Month, Institute, Branch, Serial)
            </p>
          </div>
        )}

        {/* Password field with show/hide toggle */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isSubmitting}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={togglePasswordVisibility}
              className="absolute right-1 top-1 h-8 w-8"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>

        {/* Confirm Password field with show/hide toggle */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isSubmitting}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-1 top-1 h-8 w-8"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full bg-library-600 hover:bg-library-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-library-600 hover:text-library-800"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
