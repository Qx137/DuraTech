
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, User, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LocationMap from "@/components/checkout/LocationMap";
import DeliveryOptions from "@/components/checkout/DeliveryOptions";
import { calculateTotalShipping, type Location } from "@/utils/distanceCalculator";
import { z } from "zod";

// Validation schema for checkout form
const checkoutSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number must be less than 20 characters")
    .regex(/^(\+?\d{1,4}[\s-]?)?(\(?\d{1,4}\)?[\s-]?)?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}$|^$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;
type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;
type PaymentMethod = 'paynow' | 'stripe';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  
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

  // Pre-fill contact information from user profile
  useEffect(() => {
    if (user) {
      const nameParts = user.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear the error for this field when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
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
            seller_id,
            pickup_latitude,
            pickup_longitude
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

  const validateForm = (): boolean => {
    const result = checkoutSchema.safeParse({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    });

    if (!result.success) {
      const errors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
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

    // Validate form with Zod
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Additional validation for delivery location and option
    if (!deliveryLocation || !selectedDeliveryOption) {
      toast({
        title: "Missing Information",
        description: "Please select a delivery location and choose a delivery option.",
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
      
      // Sanitize form data before sending to database
      const sanitizedData = {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
      };
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total,
          tax,
          delivery_address: {
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            address: deliveryLocation.address,
            coordinates: {
              lat: deliveryLocation.lat,
              lng: deliveryLocation.lng
            },
            phone: sanitizedData.phone
          },
          payment_method: paymentMethod,
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
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            address: deliveryLocation.address,
            coordinates: {
              lat: deliveryLocation.lat,
              lng: deliveryLocation.lng
            },
            phone: sanitizedData.phone,
            deliveryService: selectedDeliveryOption.name,
            deliveryServiceId: selectedDeliveryOption.id
          },
          status: 'pending'
        });

      if (deliveryError) throw deliveryError;

      // Send order confirmation email
      try {
        await supabase.functions.invoke('send-order-email', {
          body: { orderId: order.id, type: 'confirmation' }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      // Process payment based on selected method
      if (paymentMethod === 'stripe') {
        // Create Stripe checkout session
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-stripe-checkout', {
          body: {
            orderId: order.id,
            amount: total,
            email: sanitizedData.email,
            customerName: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
            items: cartItems.map(item => ({
              name: item.products.name,
              quantity: item.quantity,
              price: item.products.price
            }))
          }
        });

        if (stripeError || !stripeData?.success) {
          const errorMessage = stripeData?.error || stripeError?.message || 'Failed to create Stripe checkout';
          throw new Error(errorMessage);
        }

        // Redirect to Stripe Checkout
        window.location.href = stripeData.url;
      } else {
        // Create Paynow payment
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-paynow-payment', {
          body: {
            orderId: order.id,
            amount: total,
            email: sanitizedData.email,
            phone: sanitizedData.phone,
            customerName: `${sanitizedData.firstName} ${sanitizedData.lastName}`
          }
        });

        if (paymentError || !paymentData.success) {
          const errorMessage = paymentData?.error || paymentError?.message || 'Failed to create payment';
          
          let userMessage = "There was an error processing your order. Please try again.";
          
          if (errorMessage.includes('Unable to connect to payment gateway')) {
            userMessage = "The payment gateway is temporarily unavailable. Your order has been created. Please try again in a few moments or contact support with your order ID: " + order.id;
          } else if (errorMessage.includes('credentials')) {
            userMessage = "Payment system configuration error. Please contact support.";
          } else if (errorMessage.includes('Amount mismatch')) {
            userMessage = "There was an issue with the order amount. Please refresh and try again.";
          }
          
          throw new Error(userMessage);
        }

        // Redirect to Paynow payment page
        window.location.href = paymentData.paymentUrl;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      
      const errorMessage = error instanceof Error ? error.message : "There was an error processing your order. Please try again.";
      
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds for longer messages
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
              alt="Durahub Logo" 
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
                      className={formErrors.email ? "border-destructive" : ""}
                      maxLength={255}
                      required
                    />
                    {formErrors.email && (
                      <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={formErrors.firstName ? "border-destructive" : ""}
                        maxLength={100}
                        required
                      />
                      {formErrors.firstName && (
                        <p className="text-sm text-destructive mt-1">{formErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={formErrors.lastName ? "border-destructive" : ""}
                        maxLength={100}
                        required
                      />
                      {formErrors.lastName && (
                        <p className="text-sm text-destructive mt-1">{formErrors.lastName}</p>
                      )}
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
                      className={formErrors.phone ? "border-destructive" : ""}
                      maxLength={20}
                      placeholder="+263 7X XXX XXXX"
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>
                    )}
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

              {/* Payment Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Method</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="space-y-3"
                  >
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'}`}>
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Stripe</p>
                            <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or other cards</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Visa</span>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Mastercard</span>
                          </div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === 'paynow' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'}`}>
                      <RadioGroupItem value="paynow" id="paynow" />
                      <Label htmlFor="paynow" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Paynow</p>
                            <p className="text-sm text-muted-foreground">Pay with EcoCash, Telecel Cash, OneMoney</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">EcoCash</span>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">OneMoney</span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod === 'stripe' 
                        ? "You will be redirected to Stripe's secure checkout to complete your payment."
                        : "You will be redirected to Paynow to complete your payment with mobile money or card."
                      }
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
