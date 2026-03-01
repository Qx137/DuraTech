import { Link } from "react-router-dom";
import { ReactNode } from "react";

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
  { label: "AI Tools", to: "/ai-tools" },
];

const NotchHeader = ({ navItems = defaultNavItems, actions }: NotchHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 pt-4 px-4">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-5xl bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-gray-200/60">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Durahub Logo" className="h-14" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                item.active
                  ? "text-green-600 font-medium"
                  : "text-gray-600 hover:text-green-600 transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {actions}
        </div>
      </div>
    </header>
  );
};

export default NotchHeader;
