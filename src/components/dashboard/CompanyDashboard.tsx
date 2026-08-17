import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useToast } from '@/hooks/use-toast';
import { KycVerification } from './KycVerification';
import NotchHeader from '../layout/NotchHeader';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/pricing';

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
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyQueryKey = ['companyDashboard', userId];

  const { data: companyData, isLoading: loading } = useQuery({
    queryKey: companyQueryKey,
    queryFn: async () => {
      try {
        // Company and available-deliveries don't depend on each other - fetch together.
        const [
          { data: company, error: companyError },
          { data: deliveriesData, error: deliveriesError },
        ] = await Promise.all([
          supabase
            .from('delivery_companies')
            .select('*')
            .eq('owner_id', userId)
            .single(),
          supabase
            .from('deliveries')
            .select('*')
            .eq('status', 'pending')
            .eq('bidding_enabled', true)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        if (companyError) throw companyError;
        if (deliveriesError) throw deliveriesError;

        // Drivers and bids both depend on company.id, but not on each other.
        const [
          { data: driversData, error: driversError },
          { data: bidsData, error: bidsError },
        ] = await Promise.all([
          supabase
            .from('drivers')
            .select(`
              id, status, rating, vehicle_type,
              profiles:user_id(name, email)
            `)
            .eq('company_id', company.id),
          supabase
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
            .eq('company_id', company.id)
            .order('created_at', { ascending: false }),
        ]);

        if (driversError) throw driversError;
        if (bidsError) throw bidsError;

        return {
          company: company as Company,
          availableDeliveries: (deliveriesData || []) as AvailableDelivery[],
          drivers: (driversData || []) as CompanyDriver[],
          myBids: bidsData || [],
        };
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast({ title: 'Failed to load company data', variant: 'destructive' });
        return {
          company: null as Company | null,
          availableDeliveries: [] as AvailableDelivery[],
          drivers: [] as CompanyDriver[],
          myBids: [] as any[],
        };
      }
    },
  });

  const company = companyData?.company ?? null;
  const availableDeliveries = companyData?.availableDeliveries ?? [];
  const drivers = companyData?.drivers ?? [];
  const myBids = companyData?.myBids ?? [];

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
            <a href="https://durago.co.zw">
              <Button className="w-full">
                <Building2 className="h-4 w-4 mr-2" />
                Register Your Company
              </Button>
            </a>
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

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({ title: "Logged out successfully" });
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
                                Est. {formatCurrency(delivery.estimated_price)}
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
                    key={selectedDelivery}
                    deliveryId={selectedDelivery}
                    companyId={company.id}
                    suggestedPrice={
                      availableDeliveries.find(d => d.id === selectedDelivery)?.estimated_price || undefined
                    }
                    onBidCreated={() => {
                      queryClient.invalidateQueries({ queryKey: companyQueryKey });
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
                              {formatCurrency(bid.bid_amount)}
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
    </>
  );
};
