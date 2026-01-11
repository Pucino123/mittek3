import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Check, Star, X, MessageCircle, Shield, Lock, Camera, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumb, generateBreadcrumbSchema } from '@/components/seo/Breadcrumb';

const pricingSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'MitTek IT-hjælp',
  description: 'Personlig IT-hjælp til iPhone, iPad og Mac',
  brand: {
    '@type': 'Brand',
    name: 'MitTek',
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'Basic',
      price: '39',
      priceCurrency: 'DKK',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Plus',
      price: '79',
      priceCurrency: 'DKK',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '99',
      priceCurrency: 'DKK',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
    },
  ],
};

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '39',
    description: 'Alt det grundlæggende til en tryg digital hverdag',
    popular: false,
    features: [
      { text: 'Din Digitale Hjælper (ubegrænset chat)', included: true, highlight: true },
      { text: 'Månedligt Tjek (3–6 min)', included: true },
      { text: 'Mini-guides med billeder', included: true },
      { text: 'Trusted Helper (læseadgang)', included: true },
      { text: 'Kode-mappe (krypteret)', included: false },
      { text: 'Screenshot → AI Forklaring', included: false },
      { text: 'Sikkerhedsskjold', included: false },
      { text: 'Tryghedsknap', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '79',
    description: 'Ekstra tryghed med alle sikkerhedsfunktioner',
    popular: true,
    features: [
      { text: 'Din Digitale Hjælper (ubegrænset chat)', included: true, highlight: true },
      { text: 'Månedligt Tjek (3–6 min)', included: true },
      { text: 'Mini-guides med billeder', included: true },
      { text: 'Trusted Helper (læseadgang)', included: true },
      { text: 'Kode-mappe (krypteret)', included: true, icon: Lock },
      { text: 'Screenshot → AI Forklaring', included: true, icon: Camera },
      { text: 'Sikkerhedsskjold (svindeltjek)', included: true, icon: Shield },
      { text: 'Tryghedsknap (panikflow)', included: true, icon: AlertTriangle },
      { text: '1 support-henvendelse pr. måned', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99',
    description: 'Fuld service med prioriteret support',
    popular: false,
    features: [
      { text: 'Din Digitale Hjælper (ubegrænset chat)', included: true, highlight: true },
      { text: 'Alt fra Plus', included: true },
      { text: '2 support-henvendelser pr. måned', included: true },
      { text: 'Prioritet i køen', included: true },
      { text: 'Kode-mappe (krypteret)', included: true, icon: Lock },
    ],
  },
];

const Pricing = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const location = useLocation();
  
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      pricingSchema,
      generateBreadcrumbSchema(location.pathname),
    ],
  };

  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planTier: planId },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('Ingen checkout URL modtaget');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Der opstod en fejl. Prøv igen.');
      setLoadingPlan(null);
    }
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Priser - MitTek IT-hjælp fra 39 kr./md"
        description="Vælg den plan der passer dig. Basic fra 39 kr., Plus fra 79 kr. eller Pro fra 99 kr. Ingen binding, opsig når som helst. Din Digitale Hjælper inkluderet."
        canonical="https://www.mittek.dk/pricing"
        jsonLd={combinedSchema}
      />
      <section className="py-8 sm:py-12 md:py-24 px-4" aria-labelledby="pricing-heading">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Breadcrumb />
          </div>

          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Vælg din plan
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Start med det, der passer dig. Du kan altid opgradere senere.
              Ingen binding — opsig når som helst.
            </p>
          </div>

          {/* AI Technician highlight banner */}
          <div className="max-w-3xl mx-auto mb-8 md:mb-12">
            <div className="bg-primary/10 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg text-primary">Din Digitale Hjælper inkluderet i alle planer</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Stil spørgsmål på dansk døgnet rundt. Vores hjælper forstår dig og giver enkle svar.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`card-elevated p-5 sm:p-6 md:p-8 relative flex flex-col ${
                  plan.popular ? 'ring-2 ring-primary shadow-xl shadow-primary/10 order-first md:order-none' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-3 py-1 md:px-4 md:py-1.5 bg-primary text-primary-foreground rounded-full text-xs md:text-sm font-semibold shadow-lg shadow-primary/30">
                      <Star className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Mest valgt
                    </div>
                  </div>
                )}

                <div className="text-center mb-5 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{plan.name}</h2>
                  <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
                    <span className="text-lg md:text-xl text-muted-foreground">kr./md</span>
                  </div>
                </div>

                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li 
                      key={index} 
                      className={`flex items-start gap-2 md:gap-3 ${
                        feature.highlight ? 'bg-primary/5 -mx-2 px-2 py-2 rounded-lg' : ''
                      }`}
                    >
                      {feature.included ? (
                        <Check className="h-4 w-4 md:h-5 md:w-5 text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm md:text-base ${!feature.included ? 'text-muted-foreground/50' : ''} ${feature.highlight ? 'font-medium' : ''}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Button
                    variant={plan.popular ? 'hero' : 'outline'}
                    size="lg"
                    className="w-full h-11 rounded-full"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vent venligst...
                      </>
                    ) : (
                      <>
                        <span className="text-sm">Start gratis prøve</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
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

          {/* Trust indicators */}
          <div className="mt-8 md:mt-12 text-center px-2">
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
              Sikker betaling med kort via Stripe
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 md:gap-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4 md:h-5 md:w-5 text-success" />
                <span className="text-sm md:text-base">Ingen binding</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4 md:h-5 md:w-5 text-success" />
                <span className="text-sm md:text-base">Opsig når som helst</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4 md:h-5 md:w-5 text-success" />
                <span className="text-sm md:text-base">Dansk kundeservice</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Pricing;
