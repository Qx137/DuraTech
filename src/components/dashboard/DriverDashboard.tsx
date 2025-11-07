import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { MapPin, Package, Clock, DollarSign, CheckCircle, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface Driver {
  id: string;
  status: string;
  rating: number;
  vehicle_type: string;
}

interface Delivery {
  id: string;
  status: string;
  pickup_address: any;
  delivery_address: any;
  estimated_delivery_time: string | null;
  distance_km: number | null;
  estimated_price: number | null;
  order_id: string;
  orders: {
    total: number;
    user_id: string;
  };
}

export const DriverDashboard = ({ userId }: { userId: string }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const { location, updateLocation } = useDriverLocation(driver?.id || null);

  useEffect(() => {
    fetchDriverData();
  }, [userId]);

  const fetchDriverData = async () => {
    try {
      // Fetch driver profile
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (driverError) throw driverError;
      setDriver(driverData);

      // Fetch assigned deliveries
      const { data: assignedDeliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders(total, user_id)
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['assigned', 'pickup', 'delivery']);

      if (deliveriesError) throw deliveriesError;
      setDeliveries(assignedDeliveries || []);

      // Fetch available deliveries if driver is available
      if (driverData.status === 'available') {
        const { data: available, error: availableError } = await supabase
          .from('deliveries')
          .select(`
            *,
            orders(total, user_id)
          `)
          .eq('status', 'pending')
          .limit(10);

        if (availableError) throw availableError;
        setAvailableDeliveries(available || []);
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast.error('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverStatus = async () => {
    if (!driver) return;

    const newStatus = driver.status === 'available' ? 'offline' : 'available';
    
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: newStatus })
        .eq('id', driver.id);

      if (error) throw error;
      setDriver({ ...driver, status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      
      if (newStatus === 'available') {
        fetchDriverData(); // Refresh to get available deliveries
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const acceptDelivery = async (deliveryId: string) => {
    if (!driver) return;

    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          driver_id: driver.id,
          status: 'assigned'
        })
        .eq('id', deliveryId);

      if (error) throw error;
      
      toast.success('Delivery accepted!');
      fetchDriverData();
    } catch (error) {
      console.error('Error accepting delivery:', error);
      toast.error('Failed to accept delivery');
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'delivered') {
        updates.actual_delivery_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', deliveryId);

      if (error) throw error;
      
      toast.success(`Delivery status updated to ${newStatus}`);
      fetchDriverData();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        updateLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get location');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    toast.success('Location tracking started');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardHeader>
            <CardTitle>Driver Registration Required</CardTitle>
            <CardDescription>You need to register as a driver to access this dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'offline': return 'secondary';
      case 'busy': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Driver Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Driver Dashboard</CardTitle>
                <CardDescription>Vehicle: {driver.vehicle_type} • Rating: ⭐ {driver.rating}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusColor(driver.status)}>{driver.status}</Badge>
                <Button onClick={toggleDriverStatus}>
                  {driver.status === 'available' ? 'Go Offline' : 'Go Online'}
                </Button>
                <Button onClick={startLocationTracking} variant="outline">
                  <Navigation className="h-4 w-4 mr-2" />
                  Start Tracking
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>Current Deliveries</CardTitle>
            <CardDescription>Your assigned and in-progress deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active deliveries</p>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <Card key={delivery.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span className="font-medium">Order #{delivery.order_id.slice(0, 8)}</span>
                            <Badge>{delivery.status}</Badge>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <div>
                              <p>Pickup: {delivery.pickup_address.address}</p>
                              <p>Delivery: {delivery.delivery_address.address}</p>
                            </div>
                          </div>
                          {delivery.distance_km && (
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {delivery.distance_km.toFixed(1)} km
                              </span>
                              {delivery.estimated_price && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  ${delivery.estimated_price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {delivery.status === 'assigned' && (
                            <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, 'pickup')}>
                              Start Pickup
                            </Button>
                          )}
                          {delivery.status === 'pickup' && (
                            <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, 'delivery')}>
                              Start Delivery
                            </Button>
                          )}
                          {delivery.status === 'delivery' && (
                            <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Deliveries */}
        {driver.status === 'available' && (
          <Card>
            <CardHeader>
              <CardTitle>Available Deliveries</CardTitle>
              <CardDescription>Accept new deliveries in your area</CardDescription>
            </CardHeader>
            <CardContent>
              {availableDeliveries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No available deliveries at the moment</p>
              ) : (
                <div className="space-y-4">
                  {availableDeliveries.map((delivery) => (
                    <Card key={delivery.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span className="font-medium">Order #{delivery.order_id.slice(0, 8)}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mt-0.5" />
                              <div>
                                <p>Pickup: {delivery.pickup_address.address}</p>
                                <p>Delivery: {delivery.delivery_address.address}</p>
                              </div>
                            </div>
                            {delivery.distance_km && (
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {delivery.distance_km.toFixed(1)} km
                                </span>
                                {delivery.estimated_price && (
                                  <span className="flex items-center gap-1 font-medium text-primary">
                                    <DollarSign className="h-4 w-4" />
                                    ${delivery.estimated_price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button onClick={() => acceptDelivery(delivery.id)}>
                            Accept
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
