import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";

const projects = [
  {
    title: "Complete Kitchen Renovation",
    category: "Renovation",
    location: "Downtown District",
    date: "December 2025",
    description: "Full kitchen remodel including plumbing, electrical, and custom cabinetry installation.",
  },
  {
    title: "Electrical System Upgrade",
    category: "Electrical",
    location: "Riverside Area",
    date: "November 2025",
    description: "Complete electrical panel upgrade and rewiring for a 3-story residential building.",
  },
  {
    title: "HVAC Installation",
    category: "HVAC",
    location: "Suburban Heights",
    date: "October 2025",
    description: "New central air conditioning and heating system installation for a family home.",
  },
  {
    title: "Bathroom Plumbing Overhaul",
    category: "Plumbing",
    location: "Historic District",
    date: "September 2025",
    description: "Complete bathroom renovation with new plumbing fixtures and modern amenities.",
  },
  {
    title: "Interior Painting Project",
    category: "Painting",
    location: "East Side",
    date: "August 2025",
    description: "Full interior painting of a 5-bedroom house with custom color scheme.",
  },
  {
    title: "Custom Deck Construction",
    category: "Carpentry",
    location: "Lakefront Community",
    date: "July 2025",
    description: "Built a 500 sq ft composite deck with built-in seating and lighting.",
  },
];

const categories = ["All", "Renovation", "Electrical", "HVAC", "Plumbing", "Painting", "Carpentry"];

const Projects = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Our Portfolio
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Featured <span className="text-primary">Projects</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore our completed projects and see the quality of work we deliver to our clients.
            </p>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                size="sm"
                className={index === 0 ? "bg-primary" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <Card key={index} className="group overflow-hidden border-border hover:shadow-xl transition-all">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                  <Badge className="absolute top-4 left-4 bg-primary">{project.category}</Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{project.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {project.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {project.date}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">500+</p>
              <p className="text-secondary-foreground/80">Projects Completed</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">100%</p>
              <p className="text-secondary-foreground/80">Client Satisfaction</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">50+</p>
              <p className="text-secondary-foreground/80">Expert Technicians</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">10+</p>
              <p className="text-secondary-foreground/80">Years Experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Have a Project in Mind?
          </h2>
          <p className="text-muted-foreground mb-8">
            Let's discuss your home repair or renovation project. Get a free consultation today.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <Link to="/contact">
              Start Your Project
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Projects;
