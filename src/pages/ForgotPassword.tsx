
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate password reset
    toast({
      title: "Reset Link Sent!",
      description: "Check your email for password reset instructions.",
    });

    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6 text-green-600 hover:text-green-700">
            <img
              src="/logo.png"
              alt="Durahub Logo"
              className="h-12"
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your email to receive reset instructions</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
              {isSubmitted ? "Check your email" : "We'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-lg py-3">
                  Send Reset Link
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-6xl">✓</div>
                <p className="text-gray-600">
                  Password reset instructions have been sent to <strong>{email}</strong>
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center text-green-600 hover:text-green-700 font-medium">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
