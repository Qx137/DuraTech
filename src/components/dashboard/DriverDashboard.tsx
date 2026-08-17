import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { CreateBidForm } from '@/components/delivery/CreateBidForm';
import { MapPin, Package, Clock, DollarSign, CheckCircle, Navigation, Gavel, Building2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { KycVerification } from './KycVerification';
import NotchHeader from '../layout/NotchHeader';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Driver {
  id: string;
  status: string;
  rating: number;
  vehicle_type: string;
  company_id: string | null;
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
  bidding_enabled: boolean;
  bidding_deadline: string | null;
  orders: {
    total: number;
    user_id: string;
  };
}

export const DriverDashboard = ({ userId }: { userId: string }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [biddableDeliveries, setBiddableDeliveries] = useState<Delivery[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliveryForBid, setSelectedDeliveryForBid] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);
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

      if (driverError && driverError.code !== 'PGRST116') throw driverError;

      if (driverData) {
        setDriver(driverData);
      } else {
        // If no driver profile, check for pending application
        const { data: applicationData } = await supabase
          .from('driver_applications')
          .select('status')
          .eq('user_id', userId)
          .maybeSingle();

        if (applicationData) {
          setApplicationStatus(applicationData.status);
        }
        setLoading(false);
        return;
      }

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

      // Fetch available deliveries (non-bidding) if driver is available
      if (driverData.status === 'available') {
        const { data: available, error: availableError } = await supabase
          .from('deliveries')
          .select(`
            *,
            orders(total, user_id)
          `)
          .eq('status', 'pending')
          .eq('bidding_enabled', false)
          .limit(10);

        if (availableError) throw availableError;
        setAvailableDeliveries(available || []);

        // Fetch biddable deliveries
        const { data: biddable, error: biddableError } = await supabase
          .from('deliveries')
          .select(`
            *,
            orders(total, user_id)
          `)
          .eq('status', 'pending')
          .eq('bidding_enabled', true)
          .limit(10);

        if (biddableError) throw biddableError;
        setBiddableDeliveries(biddable || []);
      }

      // Fetch my bids
      const { data: bidsData, error: bidsError } = await supabase
        .from('delivery_bids')
        .select(`
          *,
          deliveries(
            id,
            status,
            pickup_address,
            delivery_address,
            order_id
          )
        `)
        .eq('driver_id', driverData.id)
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;
      setMyBids(bidsData || []);
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
        fetchDriverData();
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

    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
    }

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
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

  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
    };
  }, []);

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
    if (loading) return null; // Should be handled by main loading state, but safety check

    if (applicationStatus === 'pending') {
      return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="mx-auto bg-yellow-100 p-3 rounded-full mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-center">Application Under Review</CardTitle>
              <CardDescription className="text-center">
                Your driver application is currently being reviewed by our team. This process usually takes 24-48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              We'll notify you via email once your application status changes.
            </CardContent>
          </Card>
        </div>
      );
    }

    if (applicationStatus === 'rejected') {
      return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="mx-auto bg-red-100 p-3 rounded-full mb-4">
                <Gavel className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-center">Application Update</CardTitle>
              <CardDescription className="text-center">
                Unfortunately, your driver application could not be approved at this time.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => window.location.href = 'https://durago.co.zw'}>
                Submit New Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto bg-blue-100 p-3 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-center">Complete Your Registration</CardTitle>
            <CardDescription className="text-center">
              To start accepting deliveries, we need some additional details about you and your vehicle.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => window.location.href = 'https://durago.co.zw'} className="w-full">
              Complete Driver Profile
            </Button>
          </CardContent>
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

  const getBidStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success("Logged out successfully");
  };

  return (
    <>
      <NotchHeader
        navItems={[
          { label: "Dashboard", to: "/dashboard", active: true },
          { label: "Marketplace", to: "/marketplace" },
          { label: "Community", to: "/community" },
          { label: "DuraGo", to: "https://durago.co.zw" },
          { label: "AI Tools", to: "/ai-tools" },
        ]}
        actions={
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        }
      />
      <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Driver Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Driver Dashboard</CardTitle>
                <CardDescription>
                  Vehicle: {driver.vehicle_type} • Rating: ⭐ {driver.rating}
                  {driver.company_id && (
                    <Badge variant="secondary" className="ml-2">
                      <Building2 className="h-3 w-3 mr-1" />
                      Company Driver
                    </Badge>
                  )}
                </CardDescription>
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

        {/* Available & Biddable Deliveries */}
        {driver.status === 'available' && (
          <Tabs defaultValue="instant">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instant">Instant Accept</TabsTrigger>
              <TabsTrigger value="bidding">Open for Bidding</TabsTrigger>
              <TabsTrigger value="mybids">My Bids ({myBids.filter(b => b.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="instant">
              <Card>
                <CardHeader>
                  <CardTitle>Available Deliveries</CardTitle>
                  <CardDescription>Accept these deliveries immediately</CardDescription>
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
            </TabsContent>

            <TabsContent value="bidding">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      Open for Bidding
                    </CardTitle>
                    <CardDescription>Submit competitive bids for these deliveries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {biddableDeliveries.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No biddable deliveries available</p>
                    ) : (
                      <div className="space-y-4">
                        {biddableDeliveries.map((delivery) => (
                          <Card
                            key={delivery.id}
                            className={`cursor-pointer transition-all ${selectedDeliveryForBid === delivery.id ? 'ring-2 ring-primary' : ''
                              }`}
                            onClick={() => setSelectedDeliveryForBid(delivery.id)}
                          >
                            <CardContent className="pt-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Order #{delivery.order_id.slice(0, 8)}</span>
                                  <Badge variant="outline">
                                    <Gavel className="h-3 w-3 mr-1" />
                                    Bidding
                                  </Badge>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4 mt-0.5" />
                                  <div>
                                    <p>From: {delivery.pickup_address?.address || 'N/A'}</p>
                                    <p>To: {delivery.delivery_address?.address || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  {delivery.distance_km && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {delivery.distance_km.toFixed(1)} km
                                    </span>
                                  )}
                                  {delivery.estimated_price && (
                                    <span className="flex items-center gap-1 text-primary font-medium">
                                      <DollarSign className="h-4 w-4" />
                                      Est. ${delivery.estimated_price.toFixed(2)}
                                    </span>
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

                <div>
                  {selectedDeliveryForBid ? (
                    <CreateBidForm
                      deliveryId={selectedDeliveryForBid}
                      driverId={driver.id}
                      suggestedPrice={
                        biddableDeliveries.find(d => d.id === selectedDeliveryForBid)?.estimated_price || undefined
                      }
                      onBidCreated={() => {
                        fetchDriverData();
                        setSelectedDeliveryForBid(null);
                      }}
                    />
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Select a delivery to submit your bid</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mybids">
              <Card>
                <CardHeader>
                  <CardTitle>My Bids</CardTitle>
                  <CardDescription>Track your submitted bids</CardDescription>
                </CardHeader>
                <CardContent>
                  {myBids.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No bids submitted yet</p>
                  ) : (
                    <div className="space-y-4">
                      {myBids.map((bid) => (
                        <Card key={bid.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    Order #{bid.deliveries?.order_id?.slice(0, 8) || 'N/A'}
                                  </span>
                                  <Badge variant={getBidStatusVariant(bid.status)}>{bid.status}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="flex items-center gap-1 font-semibold text-primary">
                                    <DollarSign className="h-4 w-4" />
                                    ${bid.bid_amount.toFixed(2)}
                                  </span>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {bid.estimated_time_minutes} min
                                  </span>
                                </div>
                                {bid.message && (
                                  <p className="text-sm text-muted-foreground italic">"{bid.message}"</p>
                                )}
                              </div>
                              {bid.status === 'accepted' && (
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Won
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification">
              <KycVerification />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
    </>
  );
};
