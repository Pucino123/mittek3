import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { trackCTAClick } from '@/utils/analytics';

export function HeroSection() {
  return (
    <section 
      className="relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-trust-soft via-background to-background -z-10" aria-hidden="true" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" aria-hidden="true" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" aria-hidden="true" />

      <div className="container py-12 md:py-24 lg:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-trust-soft text-primary font-medium text-sm mb-6 md:mb-8 animate-fade-in">
            <Shield className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>Tryg hjælp til din digitale hverdag</span>
          </div>

          {/* Main headline - H1 for SEO */}
          <h1 
            id="hero-heading"
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 animate-slide-up leading-tight"
          >
            Din personlige IT-hjælp.
            <span className="block text-primary mt-2">
              Sikkerhed og ro i maven.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto animate-slide-up px-2" style={{ animationDelay: '0.1s' }}>
            Få hjælp til din iPhone, iPad og Mac — på helt almindeligt dansk. 
            Ingen teknisk snak, bare tryghed.
          </p>

          {/* CTA Buttons */}
          <nav 
            className="flex flex-col gap-4 sm:flex-row sm:gap-4 justify-center mb-6 md:mb-8 animate-slide-up px-4 sm:px-0" 
            style={{ animationDelay: '0.2s' }}
            aria-label="Primære handlinger"
          >
            <div className="flex flex-col items-center">
              <Link to="/pricing" className="w-full sm:w-auto" onClick={() => trackCTAClick('pricing', 'hero')}>
                <Button variant="hero" size="xl" className="w-full min-h-[56px]">
                  Prøv Gratis
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground mt-2">Ingen binding – opsig når som helst</span>
            </div>
            <Link to="/login" className="w-full sm:w-auto" onClick={() => trackCTAClick('login', 'hero')}>
              <Button variant="outline" size="xl" className="w-full min-h-[56px]">
                Jeg har allerede en konto
              </Button>
            </Link>
          </nav>

          {/* Trust indicators */}
          <ul 
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 text-muted-foreground animate-fade-in px-4 list-none" 
            style={{ animationDelay: '0.3s' }}
            aria-label="Fordele"
          >
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
              <span>Ingen binding</span>
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
              <span>Opsig når som helst</span>
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
              <span>Dansk support</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
