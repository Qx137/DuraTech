import { Link } from "react-router-dom";
import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  active?: boolean;
}

interface NotchHeaderProps {
  navItems?: NavItem[];
  actions?: ReactNode;
}

const defaultNavItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Marketplace", to: "/marketplace" },
  { label: "Community", to: "/community" },
  { label: "DuraGo", to: "/delivery" },
  { label: "AI Tools", to: "/ai-tools" },
];

const NotchHeader = ({ navItems = defaultNavItems, actions }: NotchHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 pt-4 px-4">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between max-w-5xl bg-card/95 backdrop-blur-md rounded-full shadow-lg border border-border">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Durahub Logo" className="h-10 sm:h-14" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                item.active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-primary transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {actions}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-5xl bg-card/95 backdrop-blur-md rounded-2xl shadow-lg border border-border p-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default NotchHeader;
