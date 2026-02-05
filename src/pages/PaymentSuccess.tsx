
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Leaf, Package, Truck, Star, Phone, Users } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

interface Order {
  id: string;
  total: number;
  tax: number;
  delivery_address: any;
  created_at: string;
  status: string;
  payment_status: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    unit: string;
  };
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [delivery, setDelivery] = useState<any>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [showDriverSelection, setShowDriverSelection] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  useEffect(() => {
    // Only scan for drivers if bidding is not enabled
    if (delivery && !delivery.bidding_enabled) {
      setTimeout(() => {
        fetchAvailableDrivers();
      }, 3000);
    } else if (delivery && delivery.bidding_enabled) {
      setIsScanning(false);
    }
  }, [delivery]);

  const fetchOrderData = async () => {
    if (!orderId) return;

    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            unit
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);

      // Fetch delivery info
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (deliveryError) throw deliveryError;
      setDelivery(deliveryData);

    } catch (error) {
      console.error('Error fetching order data:', error);
      toast.error("Error loading order details");
    }
  };

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
          orderId,
          orderTotal: order?.total || 0,
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
              src="/logo.png"
              alt="Durahub Logo"
              className="h-16"
            />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="h-24 w-24 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              {delivery?.bidding_enabled
                ? "Thank you for your order. Drivers and companies will submit bids for your delivery."
                : "Thank you for your order. We're now finding the best driver for your delivery."
              }
            </p>
          </div>

          {/* Bidding Enabled Section */}
          {delivery?.bidding_enabled && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Competitive Bidding Enabled</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Drivers and delivery companies will submit bids for your delivery. You can review and select the best offer.
                </p>
                <Badge variant="secondary" className="mb-4">
                  Tracking: {delivery.tracking_number}
                </Badge>
                <div className="mt-4">
                  <Button asChild className="w-full sm:w-auto">
                    <Link to={`/delivery-bids/${delivery.id}`}>
                      View & Select Bids
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order Number:</span>
                <span className="font-mono text-green-600">ORD-{order?.id?.slice(-8).toUpperCase() || 'Loading...'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="font-semibold">${order?.total?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-medium">
                  {order?.payment_status === 'completed' ? 'Payment Confirmed' : 'Processing...'}
                </span>
              </div>
            </CardContent>
          </Card>

          {isScanning && !delivery?.bidding_enabled && (
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
                <div className="text-gray-600 text-sm space-y-1">
                  {orderItems.length > 0 ? (
                    orderItems.map((item, index) => (
                      <div key={index}>
                        {item.quantity}x {item.products.name} ({item.products.unit})
                      </div>
                    ))
                  ) : (
                    <div>Loading order details...</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Delivery Info</h3>
                <div className="text-gray-600 text-sm">
                  {delivery ? (
                    <>
                      <div className="mb-2">
                        <strong>Delivery Address:</strong><br />
                        {order?.delivery_address?.address || 'Address not available'}
                      </div>
                      <div>
                        <strong>Status:</strong> {delivery.status}
                      </div>
                      <div className="mt-2">
                        Estimated delivery:<br />
                        30-45 minutes
                      </div>
                    </>
                  ) : (
                    <div>Loading delivery details...</div>
                  )}
                </div>
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
                <Link to="/delivery-tracking" state={{ orderId, orderTotal: order?.total || 0, selectedDriver }}>
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
