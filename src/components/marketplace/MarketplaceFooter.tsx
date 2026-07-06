import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";

const MarketplaceFooter = () => {
  return (
    <footer className="bg-foreground text-background mt-16">
      <div className="container mx-auto px-4 max-w-6xl py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.png" alt="Durahub" className="h-12 mb-4 brightness-200" />
            <p className="text-sm text-background/60 leading-relaxed mb-4">
              Connecting farmers and consumers for a sustainable agricultural future.
            </p>
            <div className="space-y-2 text-sm text-background/60">
              <a href="mailto:info.durahubonline@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                info.durahubonline@gmail.com
              </a>
              <a href="tel:+263789613200" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 shrink-0" />
                +263 789 613 200
              </a>
              <a href="tel:+263780431231" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 shrink-0" />
                +263 780 431 231
              </a>
            </div>
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
              <li><a href="https://durago.co.zw" className="hover:text-primary transition-colors">Delivery</a></li>
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
