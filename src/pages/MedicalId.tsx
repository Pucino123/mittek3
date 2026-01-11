import { useState } from 'react';
import { 
  Heart, 
  Check,
  AlertCircle,
  Phone,
  User,
  Pill,
  Droplet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BackButton } from '@/components/layout/BackButton';
import { useSeniorMode } from '@/contexts/SeniorModeContext';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

// Import visual guide images
import guideFindMy from '@/assets/guide-find-my.png';
import guideIcloudSettings from '@/assets/guide-icloud-settings.png';
import guideTwoFactor from '@/assets/guide-two-factor.png';

interface Step {
  id: number;
  title: string;
  instruction: string;
  icon: React.ElementType;
  important?: boolean;
  visualDescription?: string;
  visualImage?: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Åbn appen "Sundhed"',
    instruction: 'Find appen med det hvide hjerte på rød baggrund. Den hedder "Sundhed" og er installeret på alle iPhones.',
    icon: Heart,
    visualDescription: 'Kig efter et hvidt hjerte på rød baggrund på din startskærm. Den ligger ofte i mappen "Ekstra".',
    visualImage: guideFindMy,
  },
  {
    id: 2,
    title: 'Tryk på dit profilbillede',
    instruction: 'I øverste højre hjørne ser du dit profilbillede (eller dine initialer i en cirkel). Tryk på det.',
    icon: User,
    visualDescription: 'Dit profilbillede er en lille rund cirkel i øverste højre hjørne af skærmen.',
    visualImage: guideIcloudSettings,
  },
  {
    id: 3,
    title: 'Vælg "Nød-ID"',
    instruction: 'Find og tryk på "Nød-ID". Her kan du indtaste vigtige sundhedsoplysninger.',
    icon: AlertCircle,
    visualDescription: 'Scroll ned og find "Nød-ID" på listen. Det har et rødt hjerte-ikon ved siden af.',
  },
  {
    id: 4,
    title: 'Tryk på "Rediger"',
    instruction: 'Tryk på "Rediger" øverst til højre for at kunne ændre dine oplysninger.',
    icon: Pill,
    visualDescription: 'Knappen "Rediger" er blå og sidder i øverste højre hjørne.',
  },
  {
    id: 5,
    title: 'Udfyld dine oplysninger',
    instruction: 'Indtast din medicin, allergier, blodtype og andre vigtige helbredsoplysninger. Tag dig god tid.',
    icon: Droplet,
    visualDescription: 'Tryk på hvert felt for at udfylde det. F.eks. "Medicin", "Allergier", "Blodtype".',
  },
  {
    id: 6,
    title: 'Tilføj en nødkontakt',
    instruction: 'Under "Nødkontakt" kan du vælge en person fra din kontaktbog. Vælg din hjælper eller nærmeste pårørende.',
    icon: Phone,
    visualDescription: 'Tryk på "tilføj nødkontakt" og vælg en person fra din kontaktbog. Angiv også forholdet (f.eks. "Datter").',
  },
  {
    id: 7,
    title: '"Vis på låst skærm" SKAL være TIL',
    instruction: 'Denne indstilling er MEGET vigtig! Sørg for at "Vis på låst skærm" er slået TIL (grøn). Så kan reddere se dine oplysninger uden at låse telefonen op.',
    icon: AlertCircle,
    important: true,
    visualDescription: 'Find kontakten ved siden af "Vis på låst skærm" og sørg for den er GRØN. Dette er det vigtigste trin!',
    visualImage: guideTwoFactor,
  },
];

const MedicalId = () => {
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
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-destructive" />
            </div>
            <h1 className={`font-bold mb-2 ${seniorMode ? 'text-3xl' : 'text-2xl'}`}>
              Dit Digitale Nødkort
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sæt dit Nød-ID op så reddere kan se dine helbredsoplysninger, selv når din telefon er låst.
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

          {/* Warning Card */}
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-foreground">Hvorfor er dette vigtigt?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hvis du bliver syg eller kommer ud for en ulykke, kan reddere se dine helbredsoplysninger og kontakte dine pårørende – selv hvis din telefon er låst.
              </p>
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
                  className={`card-elevated overflow-hidden transition-all ${
                    step.important ? 'ring-2 ring-warning' : ''
                  }`}
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      step.important ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary'
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isCompleted ? 'line-through opacity-60' : ''}`}>
                        {step.id}. {step.title}
                      </p>
                      {step.important && (
                        <span className="text-xs text-warning font-medium">VIGTIGT</span>
                      )}
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
                      <div className="ml-12 pl-4 border-l-2 border-primary/20 space-y-3">
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
              <h3 className="text-xl font-semibold mb-2">Fantastisk!</h3>
              <p className="text-muted-foreground">
                Dit Nød-ID er nu sat op. Reddere kan nu se dine helbredsoplysninger hvis du får brug for hjælp.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MedicalId;