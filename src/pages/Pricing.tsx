import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Star, X, MessageCircle, Shield, Lock, Camera, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SEOHead, subscriptionPricingSchema } from '@/components/seo/SEOHead';
import { Breadcrumb, generateBreadcrumbSchema } from '@/components/seo/Breadcrumb';
const plans = [{
  id: 'basic',
  name: 'Basic',
  price: '39',
  description: 'Alt det grundlæggende til en tryg digital hverdag',
  popular: false,
  features: [{
    text: 'Din Digitale Hjælper (ubegrænset chat)',
    included: true,
    highlight: true
  }, {
    text: 'Månedligt Tjek (3–6 min)',
    included: true
  }, {
    text: 'Mini-guides med billeder',
    included: true
  }, {
    text: 'Trusted Helper (læseadgang)',
    included: true
  }, {
    text: 'Kode-mappe (krypteret)',
    included: false
  }, {
    text: 'Screenshot → AI Forklaring',
    included: false
  }, {
    text: 'Sikkerhedsskjold',
    included: false
  }, {
    text: 'Tryghedsknap',
    included: false
  }]
}, {
  id: 'plus',
  name: 'Plus',
  price: '79',
  description: 'Ekstra tryghed med alle sikkerhedsfunktioner',
  popular: true,
  features: [{
    text: 'Din Digitale Hjælper (ubegrænset chat)',
    included: true,
    highlight: true
  }, {
    text: 'Månedligt Tjek (3–6 min)',
    included: true
  }, {
    text: 'Mini-guides med billeder',
    included: true
  }, {
    text: 'Trusted Helper (læseadgang)',
    included: true
  }, {
    text: 'Kode-mappe (krypteret)',
    included: true,
    icon: Lock
  }, {
    text: 'Screenshot → AI Forklaring',
    included: true,
    icon: Camera
  }, {
    text: 'Sikkerhedsskjold (svindeltjek)',
    included: true,
    icon: Shield
  }, {
    text: 'Tryghedsknap (panikflow)',
    included: true,
    icon: AlertTriangle
  }, {
    text: '2 support-henvendelser/md',
    included: true
  }]
}, {
  id: 'pro',
  name: 'Pro',
  price: '99',
  description: 'Fuld service med prioriteret support',
  popular: false,
  features: [{
    text: 'Din Digitale Hjælper (ubegrænset chat)',
    included: true,
    highlight: true
  }, {
    text: 'Alt fra Plus',
    included: true
  }, {
    text: 'Ubegrænset support',
    included: true
  }, {
    text: 'Prioritet i køen',
    included: true
  }, {
    text: 'Kode-mappe (krypteret)',
    included: true,
    icon: Lock
  }]
}];
const featureTooltips: Record<string, string> = {
  'Din Digitale Hjælper (ubegrænset chat)': 'Du kan skrive og spørge lige så meget du vil. Du får svar i et roligt, enkelt sprog – også når du ikke lige ved, hvad du skal spørge om.',
  'Månedligt Tjek (3–6 min)': 'Et hurtigt tjek der hjælper dig med at holde din iPhone/iPad “i form”. Du får små, konkrete råd – trin for trin.',
  'Mini-guides med billeder': 'Små vejledninger med billeder, så du kan følge med i dit eget tempo. Godt hvis du gerne vil lære én ting ad gangen.',
  'Trusted Helper (læseadgang)': 'Du kan give en hjælper lov til at “kigge med” (kun læse). Det gør det nemmere at hjælpe dig, uden at overtage alt.',
  'Kode-mappe (krypteret)': 'Et sikkert sted til dine koder. “Krypteret” betyder, at andre ikke bare kan læse dem – selv hvis de får adgang til din konto.',
  'Screenshot → AI Forklaring': 'Du kan tage et screenshot af noget du er i tvivl om. Så forklarer vi billedet og fortæller, hvad du trygt kan gøre bagefter.',
  'Sikkerhedsskjold': 'Hjælper dig med at spotte svindel og farlige beskeder. Du får en klar anbefaling: “det er sikkert” eller “vær forsigtig”.',
  'Sikkerhedsskjold (svindeltjek)': 'Hjælper dig med at spotte svindel og farlige beskeder. Du får en klar anbefaling: “det er sikkert” eller “vær forsigtig”.',
  'Tryghedsknap': 'Hvis du føler dig usikker, guider knappen dig roligt igennem de vigtigste skridt, så du ikke står alene med det.',
  'Tryghedsknap (panikflow)': 'Hvis du føler dig usikker, guider knappen dig roligt igennem de vigtigste skridt, så du ikke står alene med det.',
  '2 support-henvendelser/md': 'Du kan få personlig hjælp 2 gange om måneden. Perfekt hvis du af og til har brug for et menneske til at hjælpe dig helt i mål fra en tekniker med Apple Tech ID.',
  'Ubegrænset support': 'Ingen grænse for hvor mange gange du kan få hjælp. Perfekt hvis du har brug for løbende support fra vores teknikere.',
  'Prioritet i køen': 'Vi sidder klar til at hjælpe dig først, hvis du oplever problemer, så du ikke skal vente så længe.',
  'Alt fra Plus': 'Du får alle de samme funktioner som i Plus – og derudover ekstra fordele, som gør det endnu nemmere at få hjælp hurtigt.'
};
const getFeatureTooltip = (text: string) => featureTooltips[text] ?? 'Denne funktion er med i planen og er lavet til at gøre din digitale hverdag mere tryg og enkel.';
const Pricing = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if user is coming from signup page (needs to select plan first)
  const isSignupFlow = searchParams.get('signup') === 'true';
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [subscriptionPricingSchema, generateBreadcrumbSchema(location.pathname)]
  };
  const handleSelectPlan = async (planId: string) => {
    // If user is in signup flow, redirect to signup with selected plan
    if (isSignupFlow) {
      navigate(`/signup?plan=${planId}`);
      return;
    }
    setLoadingPlan(planId);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        body: {
          planTier: planId
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Ingen checkout URL modtaget');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Der opstod en fejl. Prøv igen.');
      setLoadingPlan(null);
    }
  };
  return <PublicLayout>
      <SEOHead title="Priser - MitTek IT-hjælp fra 39 kr./md" description="Vælg den plan der passer dig. Basic fra 39 kr., Plus fra 79 kr. eller Pro fra 99 kr. Ingen binding, opsig når som helst. Din Digitale Hjælper inkluderet." canonical="https://www.mittek.dk/pricing" jsonLd={combinedSchema} />
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
                <h3 className="font-semibold text-base md:text-lg text-primary">Din Digitale Hjælper er inkluderet i alle planer</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Stil spørgsmål på dansk døgnet rundt. Vores hjælper forstår dig og giver enkle svar.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing cards - 1 col mobile, 2 col tablet, 3 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {plans.map(plan => <div key={plan.id} className={`card-elevated p-5 sm:p-6 md:p-8 relative flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-xl shadow-primary/10' : ''} ${plan.id === 'pro' ? 'sm:col-span-2 sm:max-w-[560px] sm:justify-self-center lg:col-span-1 lg:max-w-none' : ''}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-3 py-1 md:px-4 md:py-1.5 bg-primary text-primary-foreground rounded-full text-xs md:text-sm font-semibold shadow-lg shadow-primary/30">
                      <Star className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Mest valgt
                    </div>
                  </div>}

                <div className="text-center mb-4 sm:mb-4 md:mb-8">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">{plan.name}</h2>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-3 md:mb-6">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold">{plan.price}</span>
                    <span className="text-base sm:text-lg md:text-xl text-muted-foreground">kr./md</span>
                  </div>
                </div>

                <TooltipProvider delayDuration={150}>
                  <ul className="space-y-2 sm:space-y-2 md:space-y-4 mb-6 md:mb-8 flex-1">
                    {plan.features.map((feature, index) => <li key={index} className={`flex items-start gap-2 ${feature.highlight ? 'bg-primary/5 -mx-2 px-2 py-1.5 sm:py-1.5 md:py-2 rounded-lg' : ''}`}>
                        {feature.included ? <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" /> : <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn("text-sm leading-tight cursor-help", !feature.included && "text-muted-foreground/50", feature.highlight && "font-medium")}>
                              {feature.text}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-[320px] whitespace-normal leading-relaxed">
                            {getFeatureTooltip(feature.text)}
                          </TooltipContent>
                        </Tooltip>
                      </li>)}
                  </ul>
                </TooltipProvider>

                <div className="space-y-2">
                  <Button variant={plan.popular ? 'hero' : 'outline'} size="lg" className="w-full h-11 rounded-full" onClick={() => handleSelectPlan(plan.id)} disabled={loadingPlan !== null}>
                    {loadingPlan === plan.id ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vent venligst...
                      </> : <>
                        <span className="text-sm">Start gratis prøve</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Ingen betaling i dag
                  </p>
                </div>
              </div>)}
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
    </PublicLayout>;
};
export default Pricing;