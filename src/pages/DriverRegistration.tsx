import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, User, FileText, CreditCard, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Zod validation schema
const driverApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100, "Full name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20, "Phone number must be less than 20 characters").regex(/^[\d\s\-+()]+$/, "Invalid phone number format"),
  nationalId: z.string().trim().min(5, "National ID must be at least 5 characters").max(50, "National ID must be less than 50 characters"),
  address: z.string().trim().min(5, "Address must be at least 5 characters").max(200, "Address must be less than 200 characters"),
  city: z.string().trim().min(2, "City must be at least 2 characters").max(100, "City must be less than 100 characters"),
  driversLicense: z.string().trim().min(5, "Driver's license must be at least 5 characters").max(50, "Driver's license must be less than 50 characters"),
  licenseExpiry: z.string().trim().min(1, "License expiry date is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  vehicleMake: z.string().trim().min(2, "Vehicle make must be at least 2 characters").max(50, "Vehicle make must be less than 50 characters"),
  vehicleModel: z.string().trim().min(1, "Vehicle model is required").max(50, "Vehicle model must be less than 50 characters"),
  vehicleYear: z.string().trim().min(4, "Vehicle year must be 4 digits").max(4, "Vehicle year must be 4 digits").regex(/^\d{4}$/, "Invalid year format"),
  vehicleColor: z.string().trim().min(2, "Vehicle color is required").max(30, "Vehicle color must be less than 30 characters"),
  registrationNumber: z.string().trim().min(2, "Registration number is required").max(20, "Registration number must be less than 20 characters"),
  bankName: z.string().trim().min(2, "Bank name is required").max(100, "Bank name must be less than 100 characters"),
  accountHolderName: z.string().trim().min(2, "Account holder name is required").max(100, "Account holder name must be less than 100 characters"),
  accountNumber: z.string().trim().min(8, "Account number must be at least 8 digits").max(20, "Account number must be less than 20 characters").regex(/^\d+$/, "Account number must contain only digits"),
  mobileMoneyNumber: z.string().trim().max(20, "Mobile money number must be less than 20 characters").regex(/^[\d\s\-+()]*$/, "Invalid mobile money number format").optional().or(z.literal("")),
});

type FormErrors = Partial<Record<keyof z.infer<typeof driverApplicationSchema>, string>>;

const DriverRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [existingApplication, setExistingApplication] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    address: "",
    city: "",
    driversLicense: "",
    licenseExpiry: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    registrationNumber: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    mobileMoneyNumber: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply as a driver.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: '/driver-registration' } });
    }
  }, [user, authLoading, navigate, toast]);

  // Check for existing application
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('driver_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setExistingApplication(true);
        toast({
          title: "Application Already Exists",
          description: `You already have a ${data.status} driver application.`,
        });
      }
    };

    checkExistingApplication();
  }, [user, toast]);

  // Pre-fill user data
  useEffect(() => {
    const prefillUserData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          fullName: profile.name || "",
          email: profile.email || user.email || "",
        }));
      }
    };

    prefillUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Mask sensitive data - only store last 4 digits
  const maskAccountNumber = (accountNumber: string): string => {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your application.",
        variant: "destructive",
      });
      return;
    }

    if (existingApplication) {
      toast({
        title: "Application Exists",
        description: "You already have a pending driver application.",
        variant: "destructive",
      });
      return;
    }

    // Validate form data
    const result = driverApplicationSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);

      toast({
        title: "Validation Error",
        description: "Please correct the highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save application with masked banking info
      const { error } = await supabase
        .from('driver_applications')
        .insert({
          user_id: user.id,
          full_name: result.data.fullName,
          email: result.data.email,
          phone: result.data.phone,
          national_id: result.data.nationalId,
          address: result.data.address,
          city: result.data.city,
          drivers_license: result.data.driversLicense,
          license_expiry: result.data.licenseExpiry,
          vehicle_type: result.data.vehicleType,
          vehicle_make: result.data.vehicleMake,
          vehicle_model: result.data.vehicleModel,
          vehicle_year: result.data.vehicleYear,
          vehicle_color: result.data.vehicleColor,
          registration_number: result.data.registrationNumber,
          bank_name: result.data.bankName,
          account_holder_name: result.data.accountHolderName,
          account_number_masked: maskAccountNumber(result.data.accountNumber),
          mobile_money_number_masked: result.data.mobileMoneyNumber
            ? maskAccountNumber(result.data.mobileMoneyNumber)
            : null,
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Thank you for applying! We'll review your application and get back to you within 24-48 hours.",
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Durahub Logo"
              className="h-16"
            />
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Truck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Become a Durahub Market Driver</h1>
            <p className="text-muted-foreground">Join our team and help deliver fresh produce to customers in your area</p>
          </div>

          {existingApplication ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">You already have a driver application on file.</p>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Personal Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={errors.fullName ? "border-destructive" : ""}
                        />
                        {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <Label htmlFor="nationalId">National ID Number *</Label>
                        <Input
                          id="nationalId"
                          name="nationalId"
                          value={formData.nationalId}
                          onChange={handleInputChange}
                          className={errors.nationalId ? "border-destructive" : ""}
                        />
                        {errors.nationalId && <p className="text-sm text-destructive mt-1">{errors.nationalId}</p>}
                      </div>
                      <div>
                        <Label htmlFor="address">Street Address *</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={errors.address ? "border-destructive" : ""}
                        />
                        {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={errors.city ? "border-destructive" : ""}
                        />
                        {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Documents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>License Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="driversLicense">Driver's License Number *</Label>
                        <Input
                          id="driversLicense"
                          name="driversLicense"
                          value={formData.driversLicense}
                          onChange={handleInputChange}
                          className={errors.driversLicense ? "border-destructive" : ""}
                        />
                        {errors.driversLicense && <p className="text-sm text-destructive mt-1">{errors.driversLicense}</p>}
                      </div>
                      <div>
                        <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
                        <Input
                          id="licenseExpiry"
                          name="licenseExpiry"
                          type="date"
                          value={formData.licenseExpiry}
                          onChange={handleInputChange}
                          className={errors.licenseExpiry ? "border-destructive" : ""}
                        />
                        {errors.licenseExpiry && <p className="text-sm text-destructive mt-1">{errors.licenseExpiry}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Vehicle Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Truck className="h-5 w-5" />
                        <span>Vehicle Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="vehicleType">Vehicle Type *</Label>
                        <Select value={formData.vehicleType} onValueChange={(value) => handleSelectChange('vehicleType', value)}>
                          <SelectTrigger className={errors.vehicleType ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                            <SelectItem value="truck">Pickup Truck</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.vehicleType && <p className="text-sm text-destructive mt-1">{errors.vehicleType}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vehicleMake">Make *</Label>
                          <Input
                            id="vehicleMake"
                            name="vehicleMake"
                            value={formData.vehicleMake}
                            onChange={handleInputChange}
                            className={errors.vehicleMake ? "border-destructive" : ""}
                          />
                          {errors.vehicleMake && <p className="text-sm text-destructive mt-1">{errors.vehicleMake}</p>}
                        </div>
                        <div>
                          <Label htmlFor="vehicleModel">Model *</Label>
                          <Input
                            id="vehicleModel"
                            name="vehicleModel"
                            value={formData.vehicleModel}
                            onChange={handleInputChange}
                            className={errors.vehicleModel ? "border-destructive" : ""}
                          />
                          {errors.vehicleModel && <p className="text-sm text-destructive mt-1">{errors.vehicleModel}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vehicleYear">Year *</Label>
                          <Input
                            id="vehicleYear"
                            name="vehicleYear"
                            placeholder="e.g. 2020"
                            value={formData.vehicleYear}
                            onChange={handleInputChange}
                            className={errors.vehicleYear ? "border-destructive" : ""}
                          />
                          {errors.vehicleYear && <p className="text-sm text-destructive mt-1">{errors.vehicleYear}</p>}
                        </div>
                        <div>
                          <Label htmlFor="vehicleColor">Color *</Label>
                          <Input
                            id="vehicleColor"
                            name="vehicleColor"
                            value={formData.vehicleColor}
                            onChange={handleInputChange}
                            className={errors.vehicleColor ? "border-destructive" : ""}
                          />
                          {errors.vehicleColor && <p className="text-sm text-destructive mt-1">{errors.vehicleColor}</p>}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="registrationNumber">Registration Number *</Label>
                        <Input
                          id="registrationNumber"
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleInputChange}
                          className={errors.registrationNumber ? "border-destructive" : ""}
                        />
                        {errors.registrationNumber && <p className="text-sm text-destructive mt-1">{errors.registrationNumber}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Payment Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                        <p>🔒 Your banking information is securely masked. Only the last 4 digits are stored.</p>
                      </div>
                      <div>
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                          id="bankName"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          className={errors.bankName ? "border-destructive" : ""}
                        />
                        {errors.bankName && <p className="text-sm text-destructive mt-1">{errors.bankName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                        <Input
                          id="accountHolderName"
                          name="accountHolderName"
                          value={formData.accountHolderName}
                          onChange={handleInputChange}
                          className={errors.accountHolderName ? "border-destructive" : ""}
                        />
                        {errors.accountHolderName && <p className="text-sm text-destructive mt-1">{errors.accountHolderName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number *</Label>
                        <Input
                          id="accountNumber"
                          name="accountNumber"
                          type="password"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          className={errors.accountNumber ? "border-destructive" : ""}
                        />
                        {errors.accountNumber && <p className="text-sm text-destructive mt-1">{errors.accountNumber}</p>}
                      </div>
                      <div>
                        <Label htmlFor="mobileMoneyNumber">Mobile Money Number (Optional)</Label>
                        <Input
                          id="mobileMoneyNumber"
                          name="mobileMoneyNumber"
                          type="tel"
                          value={formData.mobileMoneyNumber}
                          onChange={handleInputChange}
                          className={errors.mobileMoneyNumber ? "border-destructive" : ""}
                        />
                        {errors.mobileMoneyNumber && <p className="text-sm text-destructive mt-1">{errors.mobileMoneyNumber}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <h4 className="font-semibold mb-2">What happens next?</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Background check (2-3 business days)</li>
                            <li>Vehicle inspection scheduling</li>
                            <li>Account activation</li>
                            <li>Driver orientation session</li>
                          </ul>
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          size="lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Application"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;
