import { Link } from "react-router-dom";
import { Home, Wrench, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <div className="relative">
                  <Home className="h-5 w-5 text-primary-foreground" />
                  <Wrench className="h-3 w-3 text-primary-foreground absolute -bottom-0.5 -right-0.5" />
                </div>
              </div>
              <span className="text-xl font-bold text-primary">SERAP-GROUP</span>
            </Link>
            <p className="text-muted text-sm mb-4">
              Your trusted partner for all home repair and maintenance services. Quality work, guaranteed satisfaction.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-muted/20 rounded-lg hover:bg-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-muted/20 rounded-lg hover:bg-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-muted/20 rounded-lg hover:bg-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-muted/20 rounded-lg hover:bg-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link to="/projects" className="hover:text-primary transition-colors">Projects</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Our Services</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/services" className="hover:text-primary transition-colors">Plumbing</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Electrical</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">HVAC</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Painting</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Carpentry</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                123 Repair Street, City, State 12345
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                (555) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                info@serapgroup.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-muted/20 mt-8 pt-8 text-center text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} Serap Group. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
