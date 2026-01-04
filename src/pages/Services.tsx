import { Link } from "react-router-dom";
import { Wrench, Zap, Droplets, Paintbrush, Thermometer, Hammer, ArrowRight, CheckCircle, Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";

const services = [
  {
    name: "Plumbing",
    icon: Droplets,
    description: "Complete plumbing solutions for your home including repairs, installations, and maintenance.",
    features: ["Leak repairs", "Pipe installations", "Drain cleaning", "Water heater services", "Bathroom remodeling"],
  },
  {
    name: "Electrical",
    icon: Zap,
    description: "Safe and reliable electrical services from certified electricians.",
    features: ["Wiring & rewiring", "Panel upgrades", "Outlet installation", "Lighting fixtures", "Safety inspections"],
  },
  {
    name: "HVAC",
    icon: Thermometer,
    description: "Heating, ventilation, and air conditioning services to keep you comfortable year-round.",
    features: ["AC installation", "Furnace repair", "Duct cleaning", "Thermostat setup", "Maintenance plans"],
  },
  {
    name: "Painting",
    icon: Paintbrush,
    description: "Professional interior and exterior painting services with quality finishes.",
    features: ["Interior painting", "Exterior painting", "Cabinet refinishing", "Deck staining", "Wallpaper removal"],
  },
  {
    name: "Carpentry",
    icon: Hammer,
    description: "Custom woodwork and carpentry solutions for all your needs.",
    features: ["Custom cabinets", "Door installation", "Trim & molding", "Deck building", "Furniture repair"],
  },
  {
    name: "General Repairs",
    icon: Wrench,
    description: "Comprehensive home repair and maintenance services for any issue.",
    features: ["Handyman services", "Drywall repair", "Flooring", "Roof repairs", "Window replacement"],
  },
];

const process = [
  { step: "1", title: "Request", description: "Contact us with your repair needs" },
  { step: "2", title: "Assessment", description: "We evaluate and provide a quote" },
  { step: "3", title: "Schedule", description: "Book a convenient time for you" },
  { step: "4", title: "Repair", description: "Our experts complete the work" },
];

const Services = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Our Services
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Professional <span className="text-primary">Home Repair</span> Services
            </h1>
            <p className="text-lg text-muted-foreground">
              From minor fixes to major renovations, our expert team handles all your home maintenance needs with precision and care.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all border-border overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                    <service.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Simple Process</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting your home repaired has never been easier. Follow these simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {process.map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
                {index < process.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Why Choose Our Services
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Quality You Can Trust
              </h2>
              <div className="space-y-6">
                {[
                  { icon: Shield, title: "Licensed & Insured", description: "All our technicians are fully licensed and our work is insured for your peace of mind." },
                  { icon: Home, title: "Residential Experts", description: "We specialize in residential services, understanding the unique needs of homeowners." },
                  { icon: CheckCircle, title: "Satisfaction Guaranteed", description: "We stand behind our work with a 100% satisfaction guarantee on all services." },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Wrench className="h-32 w-32 text-primary/40" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Need a Repair?
          </h2>
          <p className="text-primary-foreground/90 mb-8">
            Get a free quote today and let our experts handle your home repair needs.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/contact">
              Get Free Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
