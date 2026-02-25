import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateBidForm } from '@/components/delivery/CreateBidForm';
import { 
  Building2, Users, Package, DollarSign, Star, 
  TrendingUp, MapPin, Clock, Gavel, Plus 
} from 'lucide-react';
import { toast } from 'sonner';
import { KycVerification } from './KycVerification';

interface CompanyDashboardProps {
  userId: string;
}

interface Company {
  id: string;
  name: string;
  description: string | null;
  rating: number | null;
  is_verified: boolean;
  contact_email: string;
  contact_phone: string;
  address: string | null;
  city: string | null;
}

interface CompanyDriver {
  id: string;
  status: string;
  rating: number | null;
  vehicle_type: string;
  profiles: {
    name: string;
    email: string;
  };
}

interface AvailableDelivery {
  id: string;
  status: string;
  pickup_address: any;
  delivery_address: any;
  distance_km: number | null;
  estimated_price: number | null;
  bidding_enabled: boolean;
  bidding_deadline: string | null;
  order_id: string;
}

export const CompanyDashboard = ({ userId }: CompanyDashboardProps) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [drivers, setDrivers] = useState<CompanyDriver[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<AvailableDelivery[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyData();
  }, [userId]);

  const fetchCompanyData = async () => {
    try {
      // Fetch company
      const { data: companyData, error: companyError } = await supabase
        .from('delivery_companies')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch company drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select(`
          id, status, rating, vehicle_type,
          profiles:user_id(name, email)
        `)
        .eq('company_id', companyData.id);

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      // Fetch available deliveries for bidding
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('status', 'pending')
        .eq('bidding_enabled', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (deliveriesError) throw deliveriesError;
      setAvailableDeliveries(deliveriesData || []);

      // Fetch company's bids
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
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;
      setMyBids(bidsData || []);
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading company dashboard...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Company Found</CardTitle>
            <CardDescription>You haven't registered a delivery company yet</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/company-registration">
              <Button className="w-full">
                <Building2 className="h-4 w-4 mr-2" />
                Register Your Company
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Company Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{company.name}</CardTitle>
                    {company.is_verified && (
                      <Badge className="bg-blue-500 text-white">Verified</Badge>
                    )}
                  </div>
                  <CardDescription>{company.description || 'Delivery Company'}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{company.rating?.toFixed(1) || '5.0'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{drivers.length}</p>
                <p className="text-sm text-muted-foreground">Drivers</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {myBids.filter(b => b.status === 'accepted').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Gavel className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {myBids.filter(b => b.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Bids</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">
                  {myBids.filter(b => b.status === 'accepted').length > 0
                    ? Math.round((myBids.filter(b => b.status === 'accepted').length / myBids.length) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="deliveries">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deliveries">Available Deliveries</TabsTrigger>
            <TabsTrigger value="bids">My Bids</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Open for Bidding</h3>
                {availableDeliveries.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No deliveries available for bidding</p>
                    </CardContent>
                  </Card>
                ) : (
                  availableDeliveries.map((delivery) => (
                    <Card 
                      key={delivery.id} 
                      className={`cursor-pointer transition-all ${
                        selectedDelivery === delivery.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedDelivery(delivery.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Order #{delivery.order_id.slice(0, 8)}</span>
                            <Badge variant="outline">Open</Badge>
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
                  ))
                )}
              </div>

              <div>
                {selectedDelivery ? (
                  <CreateBidForm
                    deliveryId={selectedDelivery}
                    companyId={company.id}
                    suggestedPrice={
                      availableDeliveries.find(d => d.id === selectedDelivery)?.estimated_price || undefined
                    }
                    onBidCreated={() => {
                      fetchCompanyData();
                      setSelectedDelivery(null);
                    }}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Select a delivery to submit your bid
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bids" className="space-y-4">
            {myBids.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No bids submitted yet</p>
                </CardContent>
              </Card>
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
                            <Badge variant={getStatusVariant(bid.status)}>{bid.status}</Badge>
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Company Drivers</h3>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </div>
            
            {drivers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No drivers registered yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Invite drivers to join your company
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver) => (
                  <Card key={driver.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{driver.profiles?.name || 'Driver'}</p>
                          <p className="text-sm text-muted-foreground">{driver.vehicle_type}</p>
                        </div>
                        <Badge variant={driver.status === 'available' ? 'default' : 'secondary'}>
                          {driver.status}
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {driver.rating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verification">
            <KycVerification />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
