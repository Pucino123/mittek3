import { useState } from 'react';
import { 
  Wifi, 
  Check,
  Smartphone,
  Share2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { BackButton } from '@/components/layout/BackButton';
import { useSeniorMode } from '@/contexts/SeniorModeContext';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';

// Import visual guide images
import guideIcloudSettings from '@/assets/guide-icloud-settings.png';
import guideSafariPopups from '@/assets/guide-safari-popups.png';

interface Step {
  id: number;
  title: string;
  instruction: string;
  icon: React.ElementType;
  tip?: string;
  visualDescription?: string;
  visualImage?: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Lås din egen telefon op',
    instruction: 'Sørg for at din iPhone er låst op og forbundet til dit Wi-Fi. Du kan tjekke dette ved at se efter Wi-Fi-ikonet øverst på skærmen.',
    icon: Smartphone,
    tip: 'Din Bluetooth skal også være tændt (det plejer den at være).',
    visualDescription: 'Se efter Wi-Fi-ikonet (tre buer) øverst til højre på din skærm. Det viser du er forbundet.',
    visualImage: guideIcloudSettings,
  },
  {
    id: 2,
    title: 'Bed din gæst vælge netværket',
    instruction: 'Din gæst skal gå til Indstillinger → Wi-Fi på deres telefon, og vælge dit netværk fra listen. De skal IKKE taste koden endnu.',
    icon: Wifi,
    visualDescription: 'Din gæst finder dit netværksnavn på listen (det samme navn som står på din router).',
  },
  {
    id: 3,
    title: 'Vent på pop-up beskeden',
    instruction: 'Efter et øjeblik kommer der en besked op på DIN skærm: "Vil du dele Wi-Fi-adgangskoden?". Det kan tage 5-10 sekunder.',
    icon: Share2,
    tip: 'Hold telefonerne tæt på hinanden (inden for 1-2 meter).',
    visualDescription: 'En hvid boks popper op midt på din skærm med spørgsmålet og to knapper.',
    visualImage: guideSafariPopups,
  },
  {
    id: 4,
    title: 'Tryk på "Del adgangskode"',
    instruction: 'Tryk på den blå knap "Del adgangskode". Din gæst forbindes nu automatisk til dit Wi-Fi – helt uden at taste noget!',
    icon: Sparkles,
    visualDescription: 'Tryk på den BLÅ knap. Den grå knap annullerer handlingen.',
  },
];

const GuestWifi = () => {
  useScrollRestoration();

  const { seniorMode } = useSeniorMode();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const toggleStep = (stepId: number) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const markComplete = (stepId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
        // Auto-expand next step
        if (stepId < steps.length) {
          setExpandedStep(stepId + 1);
        }
      }
      return newSet;
    });
  };

  const progress = (completedSteps.size / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container flex h-18 items-center">
          <BackButton />
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-info/10 flex items-center justify-center mx-auto mb-4">
              <Wifi className="h-10 w-10 text-info" />
            </div>
            <h1 className={`font-bold mb-2 ${seniorMode ? 'text-3xl' : 'text-2xl'}`}>
              Del Wi-Fi uden at taste koder
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Din iPhone kan automatisk dele dit Wi-Fi med gæster. Ingen grund til at finde koden frem!
            </p>
          </div>

          {/* Progress */}
          <div className="card-elevated p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Din fremgang</span>
              <span className="text-muted-foreground">{completedSteps.size} af {steps.length} trin</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-info/10 border border-info/20 rounded-xl p-4 mb-6 flex gap-3">
            <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Krav til denne funktion</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Begge telefoner skal være iPhone (eller Apple-enheder)</li>
                <li>• Din gæst skal være i din kontaktbog</li>
                <li>• Bluetooth og Wi-Fi skal være tændt på begge telefoner</li>
              </ul>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              const isExpanded = expandedStep === step.id;

              return (
                <div
                  key={step.id}
                  className="card-elevated overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    {/* Completion toggle */}
                    <button
                      onClick={(e) => markComplete(step.id, e)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-success border-success text-success-foreground' 
                          : 'border-muted-foreground/30 hover:border-primary'
                      }`}
                    >
                      {isCompleted && <Check className="h-4 w-4" />}
                    </button>

                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="h-5 w-5 text-info" />
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isCompleted ? 'line-through opacity-60' : ''}`}>
                        {step.id}. {step.title}
                      </p>
                    </div>

                    {/* Expand icon */}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="ml-12 pl-4 border-l-2 border-info/20 space-y-3">
                        <p className={`text-muted-foreground ${seniorMode ? 'text-base' : 'text-sm'}`}>
                          {step.instruction}
                        </p>
                        
                        {/* Visual guide image */}
                        {step.visualImage && (
                          <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
                            <img 
                              src={step.visualImage} 
                              alt={step.title}
                              className="w-full h-auto object-contain max-h-48"
                            />
                          </div>
                        )}
                        
                        {/* Visual description box */}
                        {step.visualDescription && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-sm flex items-start gap-2">
                              <span className="text-primary text-lg leading-none">👁️</span>
                              <span><strong className="text-foreground">Hvad skal du kigge efter:</strong> <span className="text-muted-foreground">{step.visualDescription}</span></span>
                            </p>
                          </div>
                        )}
                        
                        {step.tip && (
                          <p className="text-sm text-info bg-info/5 rounded-lg p-2">
                            💡 <span className="font-medium">Tip:</span> {step.tip}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completion message */}
          {completedSteps.size === steps.length && (
            <div className="mt-8 card-elevated p-6 bg-success/10 text-center">
              <Check className="h-12 w-12 text-success mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2">Din gæst er nu online!</h3>
              <p className="text-muted-foreground">
                Wi-Fi-koden blev delt automatisk. Ingen grund til at huske lange koder.
              </p>
            </div>
          )}

          {/* Alternative method */}
          <div className="mt-8 card-elevated p-6">
            <h3 className="font-semibold mb-3">Virker det ikke?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Hvis pop-up'en ikke kommer frem, kan du prøve disse ting:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                Sørg for at din gæst er i din kontaktbog (med deres Apple ID email).
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                Lås begge telefoner op og hold dem tæt på hinanden.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                Slå Bluetooth til og fra på begge telefoner, og prøv igen.
              </li>
            </ul>
          </div>
        </div>
      </main>

      <ToolPageHelpButton />
    </div>
  );
};

export default GuestWifi;