
import { Button } from "@/components/ui/button";
import { ShoppingBag, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import NotchHeader from "@/components/layout/NotchHeader";

interface MarketplaceHeaderProps {
  cartCount: number;
}

const MarketplaceHeader = ({ cartCount }: MarketplaceHeaderProps) => {
  const navItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Marketplace", to: "/marketplace", active: true },
    { label: "Community", to: "/community" },
    { label: "DuraGo", to: "https://durago.co.zw" },
    { label: "AI Tools", to: "/ai-tools" },
  ];

  return (
    <NotchHeader
      navItems={navItems}
      actions={
        <>
          <Link to="/cart">
            <Button variant="outline" size="sm">
              <ShoppingBag className="h-4 w-4 mr-1" />
              Cart ({cartCount})
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </>
      }
    />
  );
};

export default MarketplaceHeader;
