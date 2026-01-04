import { Home, Wrench } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      {/* Logo Icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
          <div className="relative">
            <Home className="h-10 w-10 text-primary-foreground" />
            <Wrench className="h-5 w-5 text-primary-foreground absolute -bottom-1 -right-1" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-wide mb-4">
        SERAP-GROUP
      </h1>

      {/* Tagline */}
      <p className="text-lg text-muted-foreground mb-8">
        You need it, we fix it
      </p>

      {/* Decorative Line */}
      <div className="w-48 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full" />
    </div>
  );
};

export default Index;
