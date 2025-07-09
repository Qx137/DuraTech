
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Leaf, ShoppingCart, User, Mail, Lock, Phone, MapPin, Building, Upload, FileText, Shield } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'buyer';
  const [userType, setUserType] = useState(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    businessName: '',
    description: '',
    kycDocument: null as File | null,
    farmDocument: null as File | null
  });
  const { toast } = useToast();
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (userType === 'seller' && (!formData.kycDocument || !formData.farmDocument)) {
      toast({
        title: "Missing Documents",
        description: "Please upload both KYC and farm legal documents.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await register({ ...formData, userType });
      
      if (success) {
        toast({
          title: "Registration Successful!",
          description: `Welcome to DuraHub as a ${userType}!`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Registration Failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6 text-green-600 hover:text-green-700">
            <Leaf className="h-8 w-8" />
            <span className="text-2xl font-bold">DuraHub</span>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                  </div>

                  {/* KYC and Document Upload Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <Shield className="h-5 w-5" />
                      <h3 className="font-semibold">Verification Documents Required</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      As a seller, you need to provide the following documents for verification:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="kycDocument" className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>KYC Document (ID/Passport)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="kycDocument"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'kycDocument')}
                            required
                            disabled={isLoading}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          />
                        </div>
                        {formData.kycDocument && (
                          <p className="text-xs text-green-600">✓ {formData.kycDocument.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="farmDocument" className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Farm Legal Document</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="farmDocument"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'farmDocument')}
                            required
                            disabled={isLoading}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          />
                        </div>
                        {formData.farmDocument && (
                          <p className="text-xs text-green-600">✓ {formData.farmDocument.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded">
                      <strong>Note:</strong> All documents will be securely stored and used only for verification purposes. 
                      Your account will be reviewed within 2-3 business days after submission.
                    </div>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
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
