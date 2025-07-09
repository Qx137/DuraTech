
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Leaf, ShoppingCart, User, Mail, Lock, Phone, MapPin, Building } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'buyer';
  const [userType, setUserType] = useState(initialType);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    businessName: '',
    description: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Simulate registration
    toast({
      title: "Registration Successful!",
      description: `Welcome to AgriMarket as a ${userType}!`,
    });

    console.log('Registration data:', { ...formData, userType });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6 text-green-600 hover:text-green-700">
            <Leaf className="h-8 w-8" />
            <span className="text-2xl font-bold">AgriMarket</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join the agricultural revolution</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-center">Register</CardTitle>
            <CardDescription className="text-center">
              Choose how you want to participate in our marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">I want to:</Label>
                <RadioGroup value={userType} onValueChange={setUserType} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-green-50 transition-colors">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer" className="cursor-pointer flex items-center space-x-2 flex-1">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Buy Products</div>
                        <div className="text-sm text-gray-500">Purchase fresh produce</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-green-50 transition-colors">
                    <RadioGroupItem value="seller" id="seller" />
                    <Label htmlFor="seller" className="cursor-pointer flex items-center space-x-2 flex-1">
                      <Leaf className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Sell Products</div>
                        <div className="text-sm text-gray-500">Farmer/Producer</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="inline h-4 w-4 mr-1" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    <Lock className="inline h-4 w-4 mr-1" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Create a password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    <Lock className="inline h-4 w-4 mr-1" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Location
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="City, State"
                  />
                </div>
              </div>

              {/* Seller-specific fields */}
              {userType === 'seller' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      <Building className="inline h-4 w-4 mr-1" />
                      Farm/Business Name
                    </Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                      placeholder="Your farm or business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Tell us about your farm</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe what you grow, your farming methods, etc."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-lg py-3">
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
