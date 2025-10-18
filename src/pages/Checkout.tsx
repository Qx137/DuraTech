
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, CreditCard, MapPin, User, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LocationMap from "@/components/checkout/LocationMap";
import DeliveryOptions from "@/components/checkout/DeliveryOptions";
import { calculateTotalShipping, type Location } from "@/utils/distanceCalculator";

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [deliveryLocation, setDeliveryLocation] = useState<Location & { address: string } | null>(null);
  const [shippingDetails, setShippingDetails] = useState<{
    totalShipping: number;
    details: Array<{ sellerId: string; distance: number; price: number; }>;
  } | null>(null);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            seller_id
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
    const shipping = shippingDetails?.totalShipping || 0;
    const tax = subtotal * 0.1;
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  };

  const handleLocationSelect = async (location: { lat: number; lng: number; address: string }) => {
    setDeliveryLocation(location);
    
    if (cartItems.length > 0) {
      const shippingCalc = await calculateTotalShipping(cartItems, location);
      setShippingDetails(shippingCalc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your order.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName || !deliveryLocation || !selectedDeliveryOption) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields, select a delivery location, and choose a delivery option.",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { subtotal, shipping, tax, total } = calculateTotal();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total,
          tax,
          delivery_address: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: deliveryLocation.address,
            coordinates: {
              lat: deliveryLocation.lat,
              lng: deliveryLocation.lng
            },
            phone: formData.phone
          },
          payment_method: 'paynow',
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      for (const cartItem of cartItems) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: cartItem.product_id,
            quantity: cartItem.quantity,
            price: cartItem.products.price
          });

        if (itemError) throw itemError;
      }

      // Clear cart
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (clearCartError) throw clearCartError;

      // Create delivery
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: order.id,
          pickup_address: { address: "Farm Location" }, // This would be the seller's address
          delivery_address: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: deliveryLocation.address,
            coordinates: {
              lat: deliveryLocation.lat,
              lng: deliveryLocation.lng
            },
            phone: formData.phone,
            deliveryService: selectedDeliveryOption.name,
            deliveryServiceId: selectedDeliveryOption.id
          },
          status: 'pending'
        });

      if (deliveryError) throw deliveryError;

      // Create Paynow payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-paynow-payment', {
        body: {
          orderId: order.id,
          amount: total,
          email: formData.email,
          phone: formData.phone,
          customerName: `${formData.firstName} ${formData.lastName}`
        }
      });

      if (paymentError || !paymentData.success) {
        throw new Error(paymentData?.error || 'Failed to create payment');
      }

      // Redirect to Paynow payment page
      window.location.href = paymentData.paymentUrl;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, shipping, tax, total } = cartItems.length > 0 ? calculateTotal() : { subtotal: 0, shipping: 0, tax: 0, total: 0 };

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
          <div className="flex items-center space-x-4">
            <Link to="/cart">
              <Button variant="outline" size="sm">
                Back to Cart
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Forms */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Location Map */}
              <LocationMap
                onLocationSelect={handleLocationSelect}
                selectedLocation={deliveryLocation}
              />

              {/* Delivery Options */}
              <DeliveryOptions
                onDeliverySelect={setSelectedDeliveryOption}
                selectedOption={selectedDeliveryOption?.id}
                deliveryDistance={shippingDetails?.details.reduce((sum, detail) => sum + detail.distance, 0) / (shippingDetails?.details.length || 1)}
              />

              {/* Shipping Details */}
              {shippingDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Truck className="h-5 w-5" />
                      <span>Shipping Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {shippingDetails.details.map((detail, index) => (
                        <div key={detail.sellerId} className="flex justify-between text-sm p-2 rounded bg-muted">
                          <span>Seller {index + 1} ({detail.distance.toFixed(1)} km)</span>
                          <span>${detail.price.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total Shipping:</span>
                          <span>${shippingDetails.totalShipping.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Paynow Payment</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      You will be redirected to Paynow to complete your payment securely. 
                      Paynow supports EcoCash, Telecel Cash, OneMoney, Visa, and Mastercard.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.products.name} ({item.quantity}x)</span>
                        <span>${(item.products.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {cartItems.length === 0 && (
                      <div className="text-sm text-gray-500">Your cart is empty</div>
                    )}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 mt-6"
                    size="lg"
                    disabled={loading || cartItems.length === 0 || !deliveryLocation || !selectedDeliveryOption}
                  >
                    {loading ? "Processing..." : "Complete Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
