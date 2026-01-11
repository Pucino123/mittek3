import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Star, ArrowRight, MessageCircle, Shield } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: '39',
    description: 'Alt det grundlæggende',
    popular: false,
    features: [
      'Din Digitale Hjælper 24/7',
      'Månedligt Tjek',
      'Mini-guides med billeder',
      'Trusted Helper (læseadgang)',
    ],
  },
  {
    name: 'Plus',
    price: '79',
    description: 'Ekstra tryghed og sikkerhed',
    popular: true,
    features: [
      'Alt i Basic',
      'Kode-mappe (krypteret)',
      'Sikkerhedsskjold',
      'Screenshot → AI Forklaring',
      'Tryghedsknap',
      '1 support-henvendelse/md',
    ],
  },
  {
    name: 'Pro',
    price: '99',
    description: 'Fuld service og prioritet',
    popular: false,
    features: [
      'Alt i Plus',
      '2 support-henvendelser/md',
      'Prioritet i køen',
    ],
  },
];

export function PricingPreviewSection() {
  return (
    <section className="py-12 md:py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Enkle og gennemsigtige priser
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Vælg den plan, der passer til dine behov. Ingen skjulte gebyrer, ingen binding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card-elevated p-6 relative ${
                plan.popular ? 'ring-2 ring-primary shadow-xl shadow-primary/10' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    <Star className="h-3.5 w-3.5" />
                    Mest valgt
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">kr./md</span>
                </div>
              </div>

              {/* Digital Helper highlight */}
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg mb-4">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Inkl. Din Digitale Hjælper 24/7</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <Link to="/pricing">
                  <Button
                    variant={plan.popular ? 'hero' : 'outline'}
                    size="lg"
                    className="w-full h-11 rounded-full"
                  >
                    <span className="text-sm">Start gratis prøve</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground">
                  Ingen betaling i dag
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Guarantee Section */}
        <div className="mt-8 md:mt-12 max-w-2xl mx-auto">
          <div className="flex items-start gap-4 p-5 sm:p-6 rounded-2xl bg-success/10 border border-success/20">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-success mb-1">Din tryghedsgaranti</h3>
              <p className="text-foreground">
                Husk: Du har <strong>14 dages gratis prøveperiode</strong>. Du betaler intet i dag, 
                og du kan opsige når som helst inden de 14 dage er gået.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
