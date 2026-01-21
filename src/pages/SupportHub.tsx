import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Monitor, 
  Users, 
  Check, 
  ArrowRight,
  Video,
  Headphones,
  Shield,
  Clock,
  Star
} from 'lucide-react';

const SupportHub = () => {
  useScrollRestoration();
  const { hasAccess } = useAuth();
  const [selectedOption, setSelectedOption] = useState<'remote' | 'personal' | null>(null);

  const remoteFeatures = [
    'Skærmdeling med tegneværktøjer',
    'Realtidsvejledning fra tekniker',
    'Op til 30 minutters session',
    'Fuld privatliv og sikkerhed',
  ];

  const personalFeatures = [
    'Personligt fremmøde',
    'Grundig gennemgang af enheder',
    'Fysisk hjælp og opsætning',
    'Fleksibel tidsaftale',
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center px-4">
          <BackButton />
        </div>
      </header>

      <main className="container py-6 md:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Breadcrumb />
          </div>

          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Headphones className="h-4 w-4" />
              Support Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Få personlig hjælp</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Vælg den supportmulighed der passer bedst til dit behov
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Remote Control Option */}
            <div 
              className={`relative card-elevated p-6 cursor-pointer transition-all ${
                selectedOption === 'remote' 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedOption('remote')}
            >
              <div className="absolute -top-3 left-4">
                <span className="px-3 py-1 rounded-full bg-success text-success-foreground text-xs font-medium">
                  Mest populær
                </span>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-info/10 flex items-center justify-center shrink-0">
                  <Monitor className="h-7 w-7 text-info" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Fjernsupport</h3>
                  <p className="text-sm text-muted-foreground">
                    Vi hjælper dig via skærmdeling
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">199 kr</span>
                <span className="text-muted-foreground text-sm">/session</span>
              </div>

              <ul className="space-y-2 mb-6">
                {remoteFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to="/support-hub/booking">
                <Button variant="hero" className="w-full">
                  Book fjernsupport
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~30 min
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Sikker forbindelse
                </span>
              </div>
            </div>

            {/* Personal Help Option */}
            <div 
              className={`relative card-elevated p-6 cursor-pointer transition-all ${
                selectedOption === 'personal' 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedOption('personal')}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center shrink-0">
                  <Users className="h-7 w-7 text-warning" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Personlig hjælp</h3>
                  <p className="text-sm text-muted-foreground">
                    Vi kommer til dig eller mød os
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">499 kr</span>
                <span className="text-muted-foreground text-sm">/besøg</span>
              </div>

              <ul className="space-y-2 mb-6">
                {personalFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full">
                Book personlig hjælp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~60 min
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  4.9/5 rating
                </span>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Alle vores teknikere er certificerede Apple-eksperter
            </p>
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">100% sikker</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                <span className="text-sm">Krypteret forbindelse</span>
              </div>
            </div>
          </div>

          {/* Link to regular help tickets */}
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Har du allerede en sag? Eller foretrækker du skriftlig support?
            </p>
            <Link to="/help">
              <Button variant="link" className="text-primary">
                Gå til mine supportsager
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupportHub;
