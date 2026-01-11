import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, BookOpen, HelpCircle } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

const NotFound = () => {
  // Popular pages for helpful navigation
  const popularPages = [
    { label: "Guides", href: "/guides", icon: BookOpen },
    { label: "FAQ", href: "/faq", icon: HelpCircle },
    { label: "Hjælp", href: "/help", icon: Search },
  ];

  return (
    <>
      <SEOHead
        title="Side ikke fundet - MitTek"
        description="Siden du leder efter findes ikke. Gå tilbage til forsiden eller udforsk vores guides og hjælpesider."
        noindex={true}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4 max-w-lg">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-bold text-primary">404</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            Siden blev ikke fundet
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Beklager, men siden du leder efter findes ikke. 
            Måske er den blevet flyttet eller slettet.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button variant="outline" size="lg" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              Gå tilbage
            </Button>
            
            <Link to="/">
              <Button variant="hero" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Til forsiden
              </Button>
            </Link>
          </div>

          {/* Helpful links section */}
          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Måske kan disse sider hjælpe dig:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {popularPages.map((page) => (
                <Link key={page.href} to={page.href}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <page.icon className="h-4 w-4" />
                    {page.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;