import { Link } from "react-router-dom";
import { CheckCircle, Users, Target, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";

const team = [
  { name: "James Wilson", role: "Founder & CEO", initial: "JW" },
  { name: "Maria Garcia", role: "Operations Manager", initial: "MG" },
  { name: "David Chen", role: "Lead Technician", initial: "DC" },
  { name: "Emily Brown", role: "Customer Relations", initial: "EB" },
];

const values = [
  { icon: CheckCircle, title: "Quality Work", description: "We never compromise on the quality of our services and materials." },
  { icon: Users, title: "Customer First", description: "Your satisfaction is our top priority in everything we do." },
  { icon: Target, title: "Reliability", description: "Count on us to be there when you need us, every time." },
  { icon: Award, title: "Excellence", description: "We strive for excellence in every project we undertake." },
];

const About = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              About Us
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Your Trusted Partner in <span className="text-primary">Home Repair</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              With over a decade of experience, Serap Group has been helping homeowners maintain and improve their properties with professional, reliable services.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-video rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Users className="h-24 w-24 text-primary/40" />
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Building Trust One Home at a Time
              </h2>
              <p className="text-muted-foreground mb-4">
                Founded in 2014, Serap Group started with a simple mission: to provide homeowners with reliable, high-quality repair services they can trust. What began as a small team of dedicated professionals has grown into a full-service home repair company serving thousands of satisfied customers.
              </p>
              <p className="text-muted-foreground mb-6">
                Today, we have over 50 expert technicians, each certified and trained to handle everything from minor repairs to major renovations. Our commitment to excellence and customer satisfaction remains at the heart of everything we do.
              </p>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-bold text-primary">10+</p>
                  <p className="text-muted-foreground">Years Experience</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">500+</p>
                  <p className="text-muted-foreground">Projects Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">50+</p>
                  <p className="text-muted-foreground">Team Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Our Values
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Drives Us</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-border">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
              Our Team
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Meet the Experts</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our team of certified professionals brings years of experience and dedication to every project.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="text-center border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground text-2xl font-bold">
                    {member.initial}
                  </div>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-muted-foreground text-sm">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary to-secondary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-4">
            Ready to Work With Us?
          </h2>
          <p className="text-secondary-foreground/90 mb-8">
            Let's discuss how we can help with your home repair needs.
          </p>
          <Button size="lg" variant="outline" className="bg-transparent border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary" asChild>
            <Link to="/contact">
              Get in Touch
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default About;
