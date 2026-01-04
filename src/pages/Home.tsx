import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Star, Users, Clock, Shield, Wrench, Zap, Droplets, Paintbrush, Thermometer, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";

const services = [
  { name: "Plumbing", icon: Droplets, description: "Expert plumbing repairs and installations" },
  { name: "Electrical", icon: Zap, description: "Safe and reliable electrical services" },
  { name: "HVAC", icon: Thermometer, description: "Heating and cooling solutions" },
  { name: "Painting", icon: Paintbrush, description: "Interior and exterior painting" },
  { name: "Carpentry", icon: Hammer, description: "Custom woodwork and repairs" },
  { name: "General Repairs", icon: Wrench, description: "All-around home maintenance" },
];

const stats = [
  { value: "500+", label: "Projects Completed" },
  { value: "50+", label: "Expert Technicians" },
  { value: "10+", label: "Years Experience" },
  { value: "100%", label: "Satisfaction Rate" },
];

const testimonials = [
  { name: "John D.", text: "Serap Group fixed our plumbing issue in no time. Highly professional!", rating: 5 },
  { name: "Sarah M.", text: "Excellent electrical work. Very satisfied with the service.", rating: 5 },
  { name: "Mike R.", text: "Best home repair service in town. Will definitely use again!", rating: 5 },
];

const Home = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                #1 Home Repair Services
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                You Need It, <br />
                <span className="text-primary">We Fix It</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Professional home repair and maintenance services you can trust. From plumbing to electrical, we've got you covered with quality workmanship and guaranteed satisfaction.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Get Free Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/services">Our Services</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border-2 border-background font-medium">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">500+ Happy Customers</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary to-secondary p-1">
                <div className="w-full h-full rounded-3xl bg-muted flex items-center justify-center">
                  <Wrench className="h-32 w-32 text-primary" />
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-background rounded-2xl shadow-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Licensed & Insured</p>
                    <p className="text-sm text-muted-foreground">Certified Professionals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</p>
                <p className="text-primary-foreground/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
              What We Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide comprehensive home repair and maintenance services to keep your home in perfect condition.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all hover:-translate-y-1 border-border">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <service.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Why Choose Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Trusted by Thousands of Homeowners
              </h2>
              <p className="text-muted-foreground mb-8">
                With over 10 years of experience, we've built a reputation for excellence in home repair services. Our team of certified professionals is dedicated to providing quality work and exceptional customer service.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Users, text: "Expert & Certified Technicians" },
                  { icon: Clock, text: "24/7 Emergency Services" },
                  { icon: Shield, text: "100% Satisfaction Guarantee" },
                  { icon: CheckCircle, text: "Transparent Pricing" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-secondary" />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Wrench className="h-20 w-20 text-primary/40" />
                </div>
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                  <Zap className="h-16 w-16 text-secondary/40" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Droplets className="h-16 w-16 text-primary/40" />
                </div>
                <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                  <Hammer className="h-20 w-20 text-secondary/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Our Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                  <p className="font-semibold">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Contact us today for a free quote. Our team is ready to help with all your home repair needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Call (555) 123-4567
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
