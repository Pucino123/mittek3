import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, X, Sparkles, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import confetti from 'canvas-confetti';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href?: string;
  isOptional?: boolean;
  checkComplete: (profile: any, achievements: any, manualSteps: string[]) => boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Opret profil',
    description: 'Tilmeld dig MitTek',
    checkComplete: () => true, // Always complete since they're logged in
  },
  {
    id: 'device',
    title: 'Vælg din enhed',
    description: 'iPhone, iPad eller Mac',
    href: '/settings',
    checkComplete: (profile) => !!profile?.device_preference && profile.device_preference !== 'iphone',
  },
  {
    id: 'emergency-contact',
    title: 'Udfyld Nødkontakt',
    description: 'For din sikkerhed',
    href: '/settings?scrollTo=emergency-section',
    isOptional: true,
    checkComplete: (profile, _, manualSteps) => 
      !!profile?.emergency_helper_phone || manualSteps.includes('emergency-contact'),
  },
  {
    id: 'invite-helper',
    title: 'Inviter en Hjælper',
    description: 'Del med familie',
    href: '/settings?scrollTo=helper-section',
    isOptional: true,
    checkComplete: (_, __, manualSteps) => manualSteps.includes('invite-helper'),
  },
];

const OPTIONAL_TOOLTIP = "Dette trin er valgfrit. Det er en god idé for din sikkerhed, men du kan krydse det af nu og gøre det senere, hvis du vil.";

export function OnboardingTracker() {
  const { profile } = useAuth();
  const { achievements, loading } = useUserAchievements();
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const [manualSteps, setManualSteps] = useState<string[]>([]);

  // Load manual steps from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('onboarding-manual-steps');
    if (stored) {
      try {
        setManualSteps(JSON.parse(stored));
      } catch {
        setManualSteps([]);
      }
    }
  }, []);

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissedAt = localStorage.getItem('onboarding-tracker-dismissed');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const now = new Date();
      // Hide for 24 hours after dismissal
      if (now.getTime() - dismissedDate.getTime() < 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('onboarding-tracker-dismissed');
      }
    }
  }, []);

  // Calculate completion status
  const completedSteps = onboardingSteps.filter(step => 
    step.checkComplete(profile, achievements, manualSteps)
  );
  const progress = (completedSteps.length / onboardingSteps.length) * 100;
  const isComplete = progress === 100;

  // Trigger confetti when complete
  useEffect(() => {
    if (isComplete && !hasShownConfetti && !loading) {
      setHasShownConfetti(true);
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
      });
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        handleDismiss();
      }, 5000);
    }
  }, [isComplete, hasShownConfetti, loading]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('onboarding-tracker-dismissed', new Date().toISOString());
  };

  const toggleManualStep = (stepId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wasCompleted = manualSteps.includes(stepId);
    const newManualSteps = wasCompleted
      ? manualSteps.filter(id => id !== stepId)
      : [...manualSteps, stepId];
    
    setManualSteps(newManualSteps);
    localStorage.setItem('onboarding-manual-steps', JSON.stringify(newManualSteps));
    
    // Fire confetti when marking step as complete
    if (!wasCompleted) {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    }
  };

  // Don't show if dismissed, loading, or complete (after confetti)
  if (isDismissed || loading) return null;

  const displayName = profile?.display_name || 'der';

  return (
    <TooltipProvider>
      <div className="mb-6 sm:mb-8">
        <div className="card-elevated p-5 sm:p-6 relative overflow-hidden">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Luk"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Kom godt i gang, {displayName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isComplete ? '🎉 Du er klar!' : `${completedSteps.length} af ${onboardingSteps.length} trin fuldført`}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch">
            {onboardingSteps.map((step) => {
              const isStepComplete = step.checkComplete(profile, achievements, manualSteps);
              const isManuallyCompleted = manualSteps.includes(step.id);
              
              const content = (
                <div
                  className={`p-3 rounded-xl border transition-all relative h-full flex flex-col ${
                    isStepComplete 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-secondary/50 border-border hover:border-primary/50 hover:bg-secondary'
                  }`}
                >
                  {/* Optional indicator with tooltip */}
                  {step.isOptional && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          className="absolute top-2 right-2 p-0.5 text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-center">
                        <p className="text-xs">{OPTIONAL_TOOLTIP}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <div className="flex items-center gap-2 mb-1">
                    {isStepComplete ? (
                      step.isOptional && isManuallyCompleted ? (
                        <button
                          onClick={(e) => toggleManualStep(step.id, e)}
                          className="w-5 h-5 rounded-full bg-success flex items-center justify-center hover:bg-success/80 transition-all duration-200 cursor-pointer animate-scale-in flex-shrink-0 aspect-square"
                          style={{ minWidth: '20px', minHeight: '20px' }}
                          aria-label="Fjern markering"
                        >
                          <Check className="h-3 w-3 text-white" />
                        </button>
                      ) : (
                        <div 
                          className="w-5 h-5 rounded-full bg-success flex items-center justify-center animate-scale-in flex-shrink-0 aspect-square"
                          style={{ minWidth: '20px', minHeight: '20px' }}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )
                    ) : step.isOptional ? (
                      <button
                        onClick={(e) => toggleManualStep(step.id, e)}
                        className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer flex-shrink-0 aspect-square"
                        style={{ minWidth: '20px', minHeight: '20px' }}
                        aria-label="Marker som fuldført"
                      />
                    ) : (
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0 aspect-square"
                        style={{ minWidth: '20px', minHeight: '20px' }}
                      />
                    )}
                    <span className={`text-sm font-medium ${isStepComplete ? 'text-success' : ''}`}>
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-7">
                    {step.description}
                  </p>
                </div>
              );

              if (step.href && !isStepComplete) {
                return (
                  <Link key={step.id} to={step.href} className="block h-full">
                    {content}
                  </Link>
                );
              }

              return <div key={step.id} className="h-full">{content}</div>;
            })}
          </div>

          {/* Completion message */}
          {isComplete && (
            <div className="mt-4 p-3 rounded-xl bg-success/10 border border-success/30 text-center">
              <p className="text-success font-medium">
                🎉 Fantastisk! Du har fuldført alle trin!
              </p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
