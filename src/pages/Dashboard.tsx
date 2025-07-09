
import { useAuth } from "@/contexts/AuthContext";
import { BuyerDashboard } from "@/components/dashboard/BuyerDashboard";
import { SellerDashboard } from "@/components/dashboard/SellerDashboard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.userType === 'seller' ? (
        <SellerDashboard user={user} />
      ) : (
        <BuyerDashboard user={user} />
      )}
    </div>
  );
};

export default Dashboard;
