
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Truck, User, FileText, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const DriverRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
    driversLicense: "",
    insurance: "",
    bankAccount: "",
    routingNumber: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Application Submitted",
      description: "Thank you for applying! We'll review your application and get back to you within 24 hours.",
    });

    setTimeout(() => {
      navigate('/driver-dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/a2db2940-ded3-4e46-9144-25350c853d8d.png" 
              alt="DuraTech Logo" 
              className="h-12"
            />
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/login" className="text-gray-700 hover:text-green-600 transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Truck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Become a DuraTech Market Driver</h1>
            <p className="text-gray-600">Join our team and help deliver fresh produce to customers in your area</p>
          </div>

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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Required Documents</span>
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
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance">Insurance Policy Number *</Label>
                      <Input
                        id="insurance"
                        name="insurance"
                        value={formData.insurance}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>You will need to upload the following documents:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Valid driver's license</li>
                        <li>Vehicle registration</li>
                        <li>Proof of insurance</li>
                        <li>Vehicle inspection certificate</li>
                      </ul>
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
                        <SelectTrigger>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleMake">Make *</Label>
                        <Input
                          id="vehicleMake"
                          name="vehicleMake"
                          value={formData.vehicleMake}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleModel">Model *</Label>
                        <Input
                          id="vehicleModel"
                          name="vehicleModel"
                          value={formData.vehicleModel}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleYear">Year *</Label>
                        <Input
                          id="vehicleYear"
                          name="vehicleYear"
                          type="number"
                          min="2000"
                          max="2024"
                          value={formData.vehicleYear}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="licensePlate">License Plate *</Label>
                        <Input
                          id="licensePlate"
                          name="licensePlate"
                          value={formData.licensePlate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
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
                    <div>
                      <Label htmlFor="bankAccount">Bank Account Number *</Label>
                      <Input
                        id="bankAccount"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="routingNumber">Routing Number *</Label>
                      <Input
                        id="routingNumber"
                        name="routingNumber"
                        value={formData.routingNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Your earnings will be deposited directly to this account weekly.</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
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
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Submit Application
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;
