
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

interface MarketplaceHeaderProps {
  cartCount: number;
}

const MarketplaceHeader = ({ cartCount }: MarketplaceHeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Store className="h-8 w-8 text-green-600" />
          <h1 className="text-2xl font-bold text-green-800">DuraHub</h1>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/dashboard" className="text-gray-700 hover:text-green-600 transition-colors">
            Dashboard
          </Link>
          <Link to="/marketplace" className="text-green-600 font-medium">
            Marketplace
          </Link>
          <Link to="/community" className="text-gray-700 hover:text-green-600 transition-colors">
            Community
          </Link>
          <Link to="/ai-tools" className="text-gray-700 hover:text-green-600 transition-colors">
            AI Tools
          </Link>
        </nav>
        <div className="flex items-center space-x-3">
          <Link to="/cart">
            <Button variant="outline" size="sm">
              <ShoppingBag className="h-4 w-4 mr-1" />
              Cart ({cartCount})
            </Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Account
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default MarketplaceHeader;
