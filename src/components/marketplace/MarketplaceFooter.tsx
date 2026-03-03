import { Link } from "react-router-dom";

const MarketplaceFooter = () => {
  return (
    <footer className="bg-foreground text-background mt-16">
      <div className="container mx-auto px-4 max-w-6xl py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.png" alt="Durahub" className="h-12 mb-4 brightness-200" />
            <p className="text-sm text-background/60 leading-relaxed">
              Connecting farmers and consumers for a sustainable agricultural future.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-background/90">Shop</h4>
            <ul className="space-y-2.5 text-sm text-background/50">
              <li><Link to="/" className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link to="/cart" className="hover:text-primary transition-colors">Cart</Link></li>
              <li><Link to="/ai-tools" className="hover:text-primary transition-colors">AI Tools</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-background/90">Sell</h4>
            <ul className="space-y-2.5 text-sm text-background/50">
              <li><Link to="/register?type=seller" className="hover:text-primary transition-colors">Start Selling</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/delivery" className="hover:text-primary transition-colors">Delivery</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-background/90">Community</h4>
            <ul className="space-y-2.5 text-sm text-background/50">
              <li><Link to="/community" className="hover:text-primary transition-colors">Forum</Link></li>
              <li><Link to="/settings" className="hover:text-primary transition-colors">Settings</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 mt-10 pt-6 text-center text-xs text-background/40">
          &copy; {new Date().getFullYear()} Durahub. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default MarketplaceFooter;
