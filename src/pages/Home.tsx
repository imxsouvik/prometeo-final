import { Link } from "react-router-dom";
import { AlertTriangle, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: AlertTriangle,
    title: "Quick Reporting",
    description: "Report emergencies in seconds with GPS location and video evidence",
  },
  {
    icon: Clock,
    title: "24/7 Response",
    description: "Round-the-clock monitoring and rapid response from emergency services",
  },
  {
    icon: MapPin,
    title: "Live Tracking",
    description: "Real-time incident tracking with interactive maps and status updates",
  },
  {
    icon: Users,
    title: "Multi-Agency",
    description: "Coordinated response from hospitals, fire stations, and police",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Report Emergencies.{" "}
              <span className="text-primary">Save Lives.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              PROMETEO connects you instantly with emergency services. 
              Report incidents with video evidence, track response in real-time, 
              and get help when you need it most.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8 shadow-glow">
                <Link to="/report">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Report Emergency
                </Link>
              </Button>
              {!user && (
                <Button asChild variant="outline" size="lg" className="text-base px-8">
                  <Link to="/register">
                    Create Account
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform streamlines emergency reporting and response coordination
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="gradient-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Ready to Make Your Community Safer?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                Join PROMETEO today and be part of a connected emergency response network.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary" className="text-base">
                  <Link to="/register">Get Started Free</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-base text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
