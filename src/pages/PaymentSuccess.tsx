
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Leaf, Package, Truck, Star, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Driver {
  id: string;
  user_id: string;
  rating: number;
  vehicle_type: string;
  phone: string;
  current_location: any;
  profiles?: {
    name: string;
  };
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const orderNumber = "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [showDriverSelection, setShowDriverSelection] = useState(false);

  useEffect(() => {
    // Simulate scanning and then fetch available drivers
    setTimeout(() => {
      fetchAvailableDrivers();
    }, 3000);
  }, []);

  const fetchAvailableDrivers = async () => {
    try {
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select(`
          *,
          profiles!drivers_user_id_fkey(name)
        `)
        .eq('status', 'available')
        .limit(3);

      if (error) {
        console.error('Error fetching drivers:', error);
        toast.error("Error finding drivers. Please try again.");
        return;
      }

      setAvailableDrivers(drivers || []);
      setIsScanning(false);
      setShowDriverSelection(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error finding drivers. Please try again.");
      setIsScanning(false);
    }
  };

  const handleDriverSelection = (driver: Driver) => {
    setSelectedDriver(driver);
    toast.success(`${driver.profiles?.name || 'Driver'} selected for your delivery!`);
    
    // Navigate to delivery tracking after selection
    setTimeout(() => {
      navigate('/delivery-tracking', { 
        state: { 
          orderNumber, 
          orderTotal: 24.94,
          selectedDriver: driver
        } 
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="h-24 w-24 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Thank you for your order. We're now finding the best driver for your delivery.</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order Number:</span>
                <span className="font-mono text-green-600">{orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="font-semibold">$24.94</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-medium">Payment Confirmed</span>
              </div>
            </CardContent>
          </Card>

          {isScanning && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Truck className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">Finding Your Driver</h3>
              </div>
              <p className="text-blue-700 mb-4">
                We're scanning for available drivers in your area to ensure the fastest delivery of your fresh produce.
              </p>
              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {showDriverSelection && availableDrivers.length > 0 && !selectedDriver && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="text-center mb-6">
                <Truck className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">Select Your Driver</h3>
                <p className="text-green-700">Choose from available drivers in your area</p>
              </div>
              
              <div className="grid gap-4">
                {availableDrivers.map((driver) => (
                  <Card 
                    key={driver.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-green-300"
                    onClick={() => handleDriverSelection(driver)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Truck className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{driver.profiles?.name || 'Professional Driver'}</h4>
                            <p className="text-muted-foreground text-sm">{driver.vehicle_type}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{driver.rating}</span>
                              <div className="flex items-center space-x-1 ml-4">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-muted-foreground">{driver.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">ETA</p>
                          <p className="font-semibold text-green-600">30-45 min</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {showDriverSelection && availableDrivers.length === 0 && !isScanning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-center">
              <Truck className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Drivers Available</h3>
              <p className="text-yellow-700 mb-4">There are currently no drivers available in your area. Please try again in a few minutes.</p>
              <Button onClick={fetchAvailableDrivers} variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                Retry Search
              </Button>
            </div>
          )}

          {selectedDriver && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Driver Selected!</h3>
              <p className="text-green-700 mb-2">
                <strong>{selectedDriver.profiles?.name || 'Professional Driver'}</strong> will handle your delivery
              </p>
              <p className="text-green-600 text-sm">Redirecting to delivery tracking...</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Order Details</h3>
                <p className="text-gray-600 text-sm">
                  2x Organic Tomatoes<br />
                  1x Fresh Apples
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Delivery Info</h3>
                <p className="text-gray-600 text-sm">
                  Estimated delivery:<br />
                  30-45 minutes
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {!showDriverSelection && !selectedDriver && (
              <p className="text-gray-600">
                Please wait while we find available drivers for your delivery.
              </p>
            )}
            {showDriverSelection && !selectedDriver && availableDrivers.length > 0 && (
              <p className="text-gray-600">
                Select a driver above to proceed with your delivery.
              </p>
            )}
            {selectedDriver && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/delivery-tracking" state={{ orderNumber, orderTotal: 24.94, selectedDriver }}>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Track My Delivery
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button variant="outline">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
