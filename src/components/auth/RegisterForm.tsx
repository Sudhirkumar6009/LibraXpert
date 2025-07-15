import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { BookOpenText } from "lucide-react";
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

  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleChange = (value: UserRole) => {
    setRole(value);
    setShowEnrollment(value === "student");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        await register(
          response.user.name,
          response.user.email,
          password,
          response.user.role,
          response.user.enrollmentNo
        );
      }

      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
      navigate("/dashboard");
    } catch (error) {
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
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <BookOpenText className="h-12 w-12 text-library-500 mb-2" />
        <h1 className="text-2xl font-bold text-library-700">LibraXpert</h1>
        <p className="text-gray-500 mt-3">Create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </div>

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
