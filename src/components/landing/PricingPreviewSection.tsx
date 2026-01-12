import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Star, ArrowRight, MessageCircle, Shield } from 'lucide-react';

const featureTooltips: Record<string, string> = {
  'Din Digitale Hjælper 24/7': 'Du kan skrive og spørge lige så meget du vil. Du får svar i et roligt, enkelt sprog – også når du ikke lige ved, hvad du skal spørge om.',
  'Månedligt Tjek': 'Et hurtigt tjek der hjælper dig med at holde din iPhone/iPad "i form". Du får små, konkrete råd – trin for trin.',
  'Mini-guides med billeder': 'Små vejledninger med billeder, så du kan følge med i dit eget tempo. Godt hvis du gerne vil lære én ting ad gangen.',
  'Trusted Helper (læseadgang)': 'Du kan give en hjælper lov til at "kigge med" (kun læse). Det gør det nemmere at hjælpe dig, uden at overtage alt.',
  'Alt i Basic': 'Du får alle de samme funktioner som i Basic – og derudover ekstra fordele.',
  'Kode-mappe (krypteret)': 'Et sikkert sted til dine koder. "Krypteret" betyder, at andre ikke bare kan læse dem – selv hvis de får adgang til din konto.',
  'Sikkerhedsskjold': 'Hjælper dig med at spotte svindel og farlige beskeder. Du får en klar anbefaling: "det er sikkert" eller "vær forsigtig".',
  'Screenshot → AI Forklaring': 'Du kan tage et screenshot af noget du er i tvivl om. Så forklarer vi billedet og fortæller, hvad du trygt kan gøre bagefter.',
  'Tryghedsknap': 'Hvis du føler dig usikker, guider knappen dig roligt igennem de vigtigste skridt, så du ikke står alene med det.',
  '1 support-henvendelse/md': 'Du kan få personlig hjælp 1 gang om måneden. Perfekt hvis du af og til har brug for et menneske til at hjælpe dig helt i mål.',
  'Alt i Plus': 'Du får alle de samme funktioner som i Plus – og derudover ekstra fordele, som gør det endnu nemmere at få hjælp hurtigt.',
  '2 support-henvendelser/md': 'Du kan få personlig hjælp 2 gange om måneden. Godt hvis du ofte har spørgsmål eller vil have ekstra tryghed.',
  'Prioritet i køen': 'Vi sidder klar til at hjælpe dig først, hvis du oplever problemer, så du ikke skal vente så længe.',
};

const getFeatureTooltip = (text: string) => featureTooltips[text] ?? 'Denne funktion er med i planen og er lavet til at gøre din digitale hverdag mere tryg og enkel.';

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          <TooltipProvider delayDuration={150}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card-elevated p-6 relative ${
                  plan.popular ? 'ring-2 ring-primary shadow-xl shadow-primary/10' : ''
                } ${
                  plan.name === 'Pro'
                    ? 'sm:col-span-2 sm:max-w-[420px] sm:justify-self-center lg:col-span-1 lg:max-w-none'
                    : ''
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

                <div className="text-center mb-4 sm:mb-4 md:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-3 md:mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm sm:text-base">kr./md</span>
                  </div>
                </div>

                {/* Digital Helper highlight */}
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary/10 rounded-lg mb-3 sm:mb-4">
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-primary">Inkl. Din Digitale Hjælper 24/7</span>
                </div>

                <ul className="space-y-2 sm:space-y-2 md:space-y-3 mb-4 sm:mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs sm:text-sm leading-tight cursor-help">
                            {feature}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          className="max-w-[320px] whitespace-normal leading-relaxed"
                        >
                          {getFeatureTooltip(feature)}
                        </TooltipContent>
                      </Tooltip>
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
          </TooltipProvider>
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
