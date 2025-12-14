import { useAuth } from "@/contexts/AuthContext";
import { BuyerDashboard } from "@/components/dashboard/BuyerDashboard";
import { SellerDashboard } from "@/components/dashboard/SellerDashboard";
import { DriverDashboard } from "@/components/dashboard/DriverDashboard";
import { CompanyDashboard } from "@/components/dashboard/CompanyDashboard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type UserRole = 'driver' | 'company' | 'seller' | 'buyer';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const checkUserRole = async () => {
      if (!user?.id) return;

      try {
        // Check if user owns a delivery company
        const { data: companyData } = await supabase
          .from('delivery_companies')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (companyData) {
          setUserRole('company');
          setLoading(false);
          return;
        }

        // Check if user is a driver
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (driverData) {
          setUserRole('driver');
          setLoading(false);
          return;
        }

        // Default to user type
        setUserRole(user.userType === 'seller' ? 'seller' : 'buyer');
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('buyer');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [isAuthenticated, navigate, user?.id, user?.userType]);

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
