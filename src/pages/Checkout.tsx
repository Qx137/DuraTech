
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { CreditCard, User, Truck, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LocationMap from "@/components/checkout/LocationMap";
import DeliveryOptions from "@/components/checkout/DeliveryOptions";
import { calculateTotalShipping, type Location as UtilsLocation } from "@/utils/distanceCalculator";
import { DuraGoHeader } from "@/components/delivery/DuraGoHeader";
import { LocationPicker } from "@/components/delivery/LocationPicker";
import { TransportTypeSelector, type TransportType } from "@/components/delivery/TransportTypeSelector";
import { calculateDistance, calculateMinPrice, formatCurrency } from "@/lib/pricing";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Location {
  lat: number;
  lng: number;
}

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
type PaymentMethod = 'contipay';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('contipay');

  const [deliveryLocation, setDeliveryLocation] = useState<Location & { address: string } | null>(null);
  const [shippingDetails, setShippingDetails] = useState<{
    totalShipping: number;
    details: Array<{ sellerId: string; distance: number; price: number; }>;
  } | null>(null);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);
  const [biddingEnabled, setBiddingEnabled] = useState(true); // Default to true for DuraGo focus
  
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [transportType, setTransportType] = useState<TransportType | null>(null);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);

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
  
  const [showShippingWarning, setShowShippingWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const shippingWarningConfirmedRef = useRef(false);

  // Countdown timer for shipping warning
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showShippingWarning && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showShippingWarning, countdown]);

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

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cartItemsForCheckout', user?.id],
    queryFn: async () => {
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
        .eq('user_id', user!.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
    const shipping = shippingDetails?.totalShipping || 0;
    const tax = subtotal * 0.1;
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  };

  const handleLocationSelect = async (location: { lat: number; lng: number; address: string }) => {
    setDeliveryLocation(location);

    if (cartItems.length > 0) {
      const shippingCalc = await calculateTotalShipping(cartItems, location as UtilsLocation);
      setShippingDetails(shippingCalc);
    }
  };

  useEffect(() => {
    if (pickup && destination && transportType) {
      const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
      const min = calculateMinPrice(distance, transportType.priceMultiplier);
      setMinPrice(min);
    }
  }, [pickup, destination, transportType]);

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
    if (!deliveryLocation) {
      toast({
        title: "Missing Information",
        description: "Please select a delivery location.",
        variant: "destructive",
      });
      return;
    }

    if (!biddingEnabled && !selectedDeliveryOption) {
      toast({
        title: "Missing Information",
        description: "Please choose a delivery option or enable competitive bidding.",
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

    const { subtotal, total: orderTotal, shipping: shippingTotal } = calculateTotal();
    
    // Intercept if shipping is higher than 50% of order value
    if (orderTotal > subtotal * 1.5 && !shippingWarningConfirmedRef.current) {
      setCountdown(3);
      setShowShippingWarning(true);
      return;
    }
    shippingWarningConfirmedRef.current = false;

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
          payment_status: 'pending',
          // order_type: 'marketplace'
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

      // Create delivery with bidding settings
      const biddingDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: order.id,
          pickup_address: { 
            lat: pickup.lat, 
            lng: pickup.lng,
            address: "Pickup Location" 
          },
          delivery_address: {
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            address: deliveryLocation?.address || "Delivery Location",
            coordinates: {
              lat: destination.lat,
              lng: destination.lng
            },
            phone: sanitizedData.phone
          },
          status: 'pending',
          bidding_enabled: true,
          bidding_deadline: biddingDeadline,
          buyer_can_select: true,
          estimated_price: offerPrice,
          distance_km: calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      // Send order confirmation email (optional)
      try {
        await supabase.functions.invoke('send-order-email', {
          body: { orderId: order.id, type: 'confirmation' }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      toast({
        title: "Request Sent!",
        description: "Your transport request has been sent to drivers. You will receive bids shortly.",
      });

      // Redirect to bid selection screen instead of payment
      navigate(`/delivery-bid-selection/${delivery.id}`);
    } catch (error: any) {
      console.error('Error creating order:', error);

      let errorMessage = "There was an error processing your order. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }

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
              src="/logo.png"
              alt="Durahub Logo"
              className="h-16"
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

              {/* DuraGo Specific Workflow */}
              <div className="space-y-6">
                <DuraGoHeader />
                
                <Card className="overflow-hidden border-none shadow-md">
                  <div className="h-[280px]"> {/* Reduced size map */}
                    <LocationPicker 
                      pickup={pickup}
                      destination={destination}
                      onPickupChange={setPickup}
                      onDestinationChange={setDestination}
                    />
                  </div>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-sm">Transport Vehicle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TransportTypeSelector 
                        selected={transportType?.id || null} 
                        onSelect={setTransportType} 
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-sm">Your Offer Price (USD)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input 
                          type="number"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(parseFloat(e.target.value) || 0)}
                          className="pl-7"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Min. recommended: <span className="font-semibold">{formatCurrency(minPrice)}</span>
                      </p>
                      <div className="bg-primary/5 p-2 rounded-md border border-primary/10">
                        <p className="text-[10px] leading-tight text-primary font-medium">
                          Note: Drivers are more likely to accept offers at or above the recommended price.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Original Delivery Options - only needed when competitive bidding is off,
                  since that's the only other way to set selectedDeliveryOption. */}
              <div className={biddingEnabled ? "hidden" : ""}>
                <DeliveryOptions
                  onDeliverySelect={setSelectedDeliveryOption}
                  selectedOption={selectedDeliveryOption?.id}
                  deliveryDistance={shippingDetails?.details.reduce((sum, detail) => sum + detail.distance, 0) / (shippingDetails?.details.length || 1)}
                />
              </div>

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
                    <div className="space-y-4">
                      {shippingDetails.details.map((detail, index) => (
                        <div key={detail.sellerId} className="flex justify-between text-sm p-2 rounded bg-muted">
                          <span>Seller {index + 1} ({detail.distance.toFixed(1)} km)</span>
                          <span>{formatCurrency(detail.price)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                          <span>Estimated Shipping:</span>
                          <span>{formatCurrency(shippingDetails.totalShipping)}</span>
                        </div>
                      </div>

                      {/* Competitive Bidding Toggle */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center space-x-3">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                              <Label htmlFor="bidding-toggle" className="font-medium cursor-pointer">
                                Enable Competitive Bidding
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Let drivers and companies bid for your delivery
                              </p>
                            </div>
                          </div>
                          <Switch
                            id="bidding-toggle"
                            checked={biddingEnabled}
                            onCheckedChange={setBiddingEnabled}
                          />
                        </div>
                        {biddingEnabled && (
                          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                            <p className="text-amber-800">
                              <strong>How it works:</strong> After placing your order, drivers and delivery companies will submit bids.
                              You'll have 24 hours to review and select the best offer before delivery begins.
                            </p>
                          </div>
                        )}
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
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === 'contipay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => setPaymentMethod('contipay')}>
                      <RadioGroupItem value="contipay" id="contipay" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="contipay" className="flex items-center justify-between cursor-pointer">
                          <div>
                            <p className="font-medium">ContiPay</p>
                            <p className="text-sm text-muted-foreground font-normal">Pay with EcoCash, OneMoney, InnBucks, ZIPIT, or Card</p>
                          </div>
                          <div className="flex items-center space-x-1 flex-wrap gap-1">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">EcoCash</span>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">OneMoney</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">InnBucks</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">ZIPIT</span>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Card</span>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      You will be redirected to ContiPay's secure payment page to complete your payment with your preferred method.
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
                        <span>{formatCurrency(item.products.price * item.quantity)}</span>
                      </div>
                    ))}
                    {cartItems.length === 0 && (
                      <div className="text-sm text-gray-500">Your cart is empty</div>
                    )}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(shipping)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 mt-6"
                    size="lg"
                    disabled={loading || cartItems.length === 0 || !pickup || !destination || !transportType}
                  >
                    {loading ? "Processing..." : "Send Request to Drivers"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
      
      <AlertDialog open={showShippingWarning} onOpenChange={setShowShippingWarning}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              High Delivery Cost Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p>
                The delivery cost for this order is relatively high compared to the value of the items.
              </p>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-2 text-sm">
                <div className="flex justify-between text-amber-800">
                  <span>Cart Items:</span>
                  <span className="font-semibold">{formatCurrency(calculateTotal().subtotal)}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Delivery & Tax:</span>
                  <span className="font-semibold">{formatCurrency(calculateTotal().shipping + calculateTotal().tax)}</span>
                </div>
                <div className="border-t border-amber-200 pt-2 flex justify-between font-bold text-amber-900">
                  <span>Total Cost:</span>
                  <span>{formatCurrency(calculateTotal().total)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                This often happens when ordering fresh produce from multiple farmers at different locations.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowShippingWarning(false);
                shippingWarningConfirmedRef.current = true;
                // We use a timeout to let the dialog close before re-submitting.
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }, 100);
              }}
              disabled={countdown > 0}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {countdown > 0 ? `Wait ${countdown}s...` : "Proceed Anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Checkout;
