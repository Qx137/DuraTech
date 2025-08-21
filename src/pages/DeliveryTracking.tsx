
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, MapPin, Phone, Star, Truck, Clock, CheckCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface Driver {
  id: number;
  name: string;
  rating: number;
  vehicle: string;
  eta: string;
  phone: string;
  distance: string;
  avatar: string;
}

const DeliveryTracking = () => {
  const location = useLocation();
  const { orderNumber, orderTotal } = location.state || { orderNumber: "ORD-123456", orderTotal: 24.94 };
  
  const [status, setStatus] = useState<'scanning' | 'assigned' | 'pickup' | 'delivery' | 'delivered'>('scanning');
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [availableDrivers] = useState<Driver[]>([
    {
      id: 1,
      name: "Mike Rodriguez",
      rating: 4.9,
      vehicle: "Honda Civic",
      eta: "15 min",
      phone: "+1 (555) 123-4567",
      distance: "2.3 miles away",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Sarah Chen",
      rating: 4.8,
      vehicle: "Toyota Prius",
      eta: "18 min",
      phone: "+1 (555) 987-6543",
      distance: "3.1 miles away",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "David Kim",
      rating: 4.7,
      vehicle: "Ford Transit",
      eta: "22 min",
      phone: "+1 (555) 456-7890",
      distance: "4.2 miles away",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'scanning') {
        setAssignedDriver(availableDrivers[0]);
        setStatus('assigned');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, availableDrivers]);

  useEffect(() => {
    if (status === 'assigned') {
      const statusTimer = setTimeout(() => setStatus('pickup'), 5000);
      return () => clearTimeout(statusTimer);
    }
    if (status === 'pickup') {
      const statusTimer = setTimeout(() => setStatus('delivery'), 8000);
      return () => clearTimeout(statusTimer);
    }
  }, [status]);

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scanning': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'pickup': return 'bg-orange-500';
      case 'delivery': return 'bg-green-500';
      case 'delivered': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scanning': return 'Scanning for Drivers';
      case 'assigned': return 'Driver Assigned';
      case 'pickup': return 'Picking up Order';
      case 'delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">DuraTech</h1>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-green-600 transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Delivery Tracking</h1>
          <p className="text-gray-600">Order #{orderNumber}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Status & Driver Info */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`}></div>
                    <span className="font-semibold">{getStatusText(status)}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getStatusColor(status)}`}
                      style={{ 
                        width: status === 'scanning' ? '20%' : 
                               status === 'assigned' ? '40%' : 
                               status === 'pickup' ? '60%' : 
                               status === 'delivery' ? '80%' : '100%' 
                      }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-xs text-center">
                    <div className={status === 'scanning' ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                      Scanning
                    </div>
                    <div className={status === 'assigned' ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      Assigned
                    </div>
                    <div className={status === 'pickup' ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                      Pickup
                    </div>
                    <div className={status === 'delivery' ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      Delivery
                    </div>
                    <div className={status === 'delivered' ? 'text-green-700 font-medium' : 'text-gray-500'}>
                      Delivered
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Information */}
            {status === 'scanning' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Finding Available Drivers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="animate-pulse flex justify-center mb-4">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                    <p className="text-gray-600">Scanning for drivers in your area...</p>
                    <p className="text-sm text-gray-500 mt-2">Found {availableDrivers.length} drivers nearby</p>
                  </div>
                </CardContent>
              </Card>
            ) : assignedDriver && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Your Driver</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <img
                      src={assignedDriver.avatar}
                      alt={assignedDriver.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{assignedDriver.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{assignedDriver.rating}</span>
                        <span>•</span>
                        <span>{assignedDriver.vehicle}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{assignedDriver.distance}</span>
                        <span>•</span>
                        <Clock className="h-4 w-4" />
                        <span>ETA: {assignedDriver.eta}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Details & Map */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Organic Tomatoes (2x)</span>
                    <span>$9.98</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fresh Apples (1x)</span>
                    <span>$3.99</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Delivering to: 123 Main St, Anytown, ST 12345</span>
                </div>
              </CardContent>
            </Card>

            {/* Live Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Live Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Live map tracking</p>
                    <p className="text-sm text-gray-500">Real-time driver location</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;
