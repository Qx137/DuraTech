import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Package, Clock, Phone, User, Star, ArrowLeft, Navigation } from 'lucide-react';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { supabase } from '@/integrations/supabase/client';

interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicle: string;
  eta: string;
  phone: string;
  distance: string;
  avatar: string;
}

const DeliveryTracking = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { orderStatus, loading } = useOrderStatus(orderId);
  
  const [deliveryStatus, setDeliveryStatus] = useState<'pending' | 'scanning' | 'assigned' | 'pickup' | 'delivery' | 'delivered'>('scanning');
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const { location: driverLocation } = useDriverLocation(driverId);

  useEffect(() => {
    if (!orderId) return;

    // Fetch delivery and driver information
    const fetchDeliveryData = async () => {
      try {
        const { data: delivery, error } = await supabase
          .from('deliveries')
          .select(`
            *,
            drivers (
              id,
              user_id,
              vehicle_type,
              license_number,
              phone,
              rating,
              current_location
            )
          `)
          .eq('order_id', orderId)
          .single();

        if (error) throw error;

        if (delivery && delivery.drivers) {
          const driverData = delivery.drivers as any;
          setDriverId(driverData.id);
          setDriver({
            id: driverData.id,
            name: 'Driver',
            rating: driverData.rating || 5,
            vehicle: `${driverData.vehicle_type} - ${driverData.license_number}`,
            eta: delivery.estimated_delivery_time ? 
              new Date(delivery.estimated_delivery_time).toLocaleTimeString() : 'Calculating...',
            phone: driverData.phone,
            distance: delivery.distance_km ? `${delivery.distance_km.toFixed(1)} km` : 'Calculating...',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Driver'
          });
          setDeliveryStatus(delivery.status as any);
        }
      } catch (error) {
        console.error('Error fetching delivery data:', error);
      }
    };

    fetchDeliveryData();

    // Subscribe to delivery updates
    const channel = supabase
      .channel(`delivery-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          setDeliveryStatus(payload.new.status as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scanning':
      case 'pending':
        return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'pickup': return 'bg-orange-500';
      case 'delivery': return 'bg-green-500';
      case 'delivered': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scanning':
      case 'pending':
        return 'Finding Driver';
      case 'assigned': return 'Driver Assigned';
      case 'pickup': return 'Picking up Order';
      case 'delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  const getProgressPercentage = () => {
    switch (deliveryStatus) {
      case 'scanning':
      case 'pending': return 20;
      case 'assigned': return 40;
      case 'pickup': return 60;
      case 'delivery': return 80;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Delivery Tracking</h1>
              {orderId && (
                <p className="text-sm text-muted-foreground">Order #{orderId.slice(0, 8)}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Status & Driver Info */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
                <CardDescription>Real-time tracking of your order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(deliveryStatus)}`}></div>
                  <span className="font-semibold">{getStatusText(deliveryStatus)}</span>
                  <Badge variant="outline" className="ml-auto">
                    {deliveryStatus}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Progress value={getProgressPercentage()} />
                  <div className="grid grid-cols-5 gap-1 text-xs text-center">
                    <div className={deliveryStatus === 'pending' || deliveryStatus === 'scanning' ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}>
                      Finding
                    </div>
                    <div className={deliveryStatus === 'assigned' ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                      Assigned
                    </div>
                    <div className={deliveryStatus === 'pickup' ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                      Pickup
                    </div>
                    <div className={deliveryStatus === 'delivery' ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      Delivery
                    </div>
                    <div className={deliveryStatus === 'delivered' ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                      Done
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Information */}
            {deliveryStatus === 'pending' || deliveryStatus === 'scanning' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <span>Finding Your Driver</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="animate-pulse flex justify-center mb-4">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                    <p className="text-muted-foreground">Scanning for available drivers in your area...</p>
                  </div>
                </CardContent>
              </Card>
            ) : driver && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>Your Driver</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <img
                      src={driver.avatar}
                      alt={driver.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{driver.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{driver.rating}</span>
                        <span>•</span>
                        <span>{driver.vehicle}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{driver.distance}</span>
                        {driverLocation && (
                          <>
                            <span>•</span>
                            <Navigation className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Live tracking</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        <span>ETA: {driver.eta}</span>
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
            {orderStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>Order #{orderId?.slice(0, 8)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status</span>
                      <Badge variant="outline">{orderStatus.status}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Payment Status</span>
                      <Badge variant={orderStatus.payment_status === 'completed' ? 'default' : 'secondary'}>
                        {orderStatus.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium mb-1">Delivery Address</p>
                        <p className="text-muted-foreground">
                          {/* Address would come from order data */}
                          Delivery location from order
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Live Tracking</CardTitle>
                <CardDescription>Real-time driver location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Live map tracking</p>
                    {driverLocation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Driver at: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
                      </p>
                    )}
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
