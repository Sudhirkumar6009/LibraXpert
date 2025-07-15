
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { BookOpenText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginType, setLoginType] = useState('email');
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginType === 'email' && (!email || !password)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    if (loginType === 'enrollment' && !enrollmentNo) {
      toast({
        title: "Error",
        description: "Please enter your enrollment number",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (loginType === 'email') {
        await login(email, password);
      } else {
        // Handle enrollment login
        await login(enrollmentNo, 'enrollment-auth');
      }
      
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
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
        <p className="text-gray-500 mt-3">
          Sign in to your account
        </p>
      </div>
      
      <Tabs defaultValue="email" onValueChange={(value) => setLoginType(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="email">Email Login</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment Login</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <TabsContent value="email" className="space-y-5">
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
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-library-600 hover:text-library-800">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="enrollment" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="enrollmentNo">GTU Enrollment Number</Label>
              <Input
                id="enrollmentNo"
                type="text"
                placeholder="e.g., 240133116008"
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                pattern="\d{12}"
                title="Please enter a valid 12-digit enrollment number"
              />
            </div>
          </TabsContent>
          
          <Button
            type="submit"
            className="w-full bg-library-500 hover:bg-library-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Tabs>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="font-medium text-library-600 hover:text-library-800">
            Create one
          </a>
        </p>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>Demo accounts:</p>
        <div className="mt-1 space-y-1">
          <p><span className="font-medium">Student:</span> student@example.com / any password</p>
          <p><span className="font-medium">Librarian:</span> librarian@example.com / any password</p>
          <p><span className="font-medium">Admin:</span> admin@example.com / any password</p>
          <p><span className="font-medium">External User:</span> user@example.com / any password</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
