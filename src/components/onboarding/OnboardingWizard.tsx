import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Sparkles,
  BookOpen,
  Wrench,
  MessageCircle,
  ArrowRight,
  Check,
} from 'lucide-react';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Velkommen til MitTek!',
    description: 'Her er din nye IT-hjælper. Lad os vise dig rundt – det tager kun 1 minut.',
    icon: Sparkles,
    highlight: null,
  },
  {
    id: 'guides',
    title: 'Her finder du guides',
    description: 'Trinvise vejledninger med billeder, tilpasset netop din enhed. Perfekt til at lære noget nyt.',
    icon: BookOpen,
    highlight: 'guides',
  },
  {
    id: 'tools',
    title: 'Dine værktøjer',
    description: 'Test din sikkerhed med svindel-quizzen, slå ord op i ordbogen, og hold styr på dine koder.',
    icon: Wrench,
    highlight: 'tools',
  },
  {
    id: 'chat',
    title: 'Din Digitale Hjælper',
    description: 'Sidder du fast? Brug chatten nederst til højre – den forstår dansk og svarer døgnet rundt.',
    icon: MessageCircle,
    highlight: 'chat',
  },
];

export const OnboardingWizard = ({ open, onClose }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const displayName = profile?.display_name || 'der';

  const handleComplete = async () => {
    if (!user) return;
    
    setIsCompleting(true);
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);
      
      toast.success('Du er nu klar! Udforsk dit dashboard.');
      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  // Personalize the welcome step
  const getStepTitle = () => {
    if (step.id === 'welcome') {
      return `Velkommen til MitTek, ${displayName}!`;
    }
    return step.title;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideClose className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-soft">
              <StepIcon className="h-10 w-10 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">{getStepTitle()}</DialogTitle>
          <DialogDescription className="text-center text-lg">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="space-y-3">
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleNext}
              disabled={isCompleting}
            >
              {isCompleting ? (
                'Gemmer...'
              ) : isLastStep ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Start mit dashboard
                </>
              ) : (
                <>
                  Næste
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Skip option - always available */}
            <button
              onClick={handleComplete}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              disabled={isCompleting}
            >
              Spring over
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
