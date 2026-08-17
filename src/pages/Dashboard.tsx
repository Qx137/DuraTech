import { useAuth } from "@/contexts/AuthContext";
import { BuyerDashboard } from "@/components/dashboard/BuyerDashboard";
import { SellerDashboard } from "@/components/dashboard/SellerDashboard";
import { DriverDashboard } from "@/components/dashboard/DriverDashboard";
import { CompanyDashboard } from "@/components/dashboard/CompanyDashboard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type UserRole = 'driver' | 'company' | 'seller' | 'buyer';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const { data: userRole, isLoading: loading } = useQuery({
    queryKey: ['userRole', user?.id, user?.userType],
    queryFn: async (): Promise<UserRole> => {
      try {
        // Neither check depends on the other's result - run them together.
        const [{ data: companyData }, { data: driverData }] = await Promise.all([
          supabase
            .from('delivery_companies')
            .select('id')
            .eq('owner_id', user!.id)
            .maybeSingle(),
          supabase
            .from('drivers')
            .select('id')
            .eq('user_id', user!.id)
            .maybeSingle(),
        ]);

        if (companyData) {
          return 'company';
        } else if (driverData) {
          return 'driver';
        } else {
          // Default to user type
          return user!.userType === 'seller' ? 'seller' : 'buyer';
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        return 'buyer';
      }
    },
    enabled: !!user?.id,
  });

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {userRole === 'company' ? (
        <CompanyDashboard userId={user.id} />
      ) : userRole === 'driver' ? (
        <DriverDashboard userId={user.id} />
      ) : userRole === 'seller' ? (
        <SellerDashboard user={user} />
      ) : (
        <BuyerDashboard user={user} />
      )}
    </div>
  );
};

export default Dashboard;
