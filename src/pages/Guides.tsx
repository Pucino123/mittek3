import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hardcodedGuides, HardcodedGuide, DeviceType } from '@/data/hardcodedGuides';
import { DeviceSelector } from '@/components/ui/DeviceSelector';
import { CategoryFilter, GuideCategory } from '@/components/guides/CategoryFilter';
import { GuideStepCard } from '@/components/guides/GuideStepCard';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { 
  BookOpen,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  XCircle,
  Type,
  Tv,
  Headphones,
  Loader2,
  CheckCircle2,
  PartyPopper,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackGuideView } from '@/utils/analytics';

interface GuideStep {
  id: string;
  step_number: number;
  title: string;
  instruction: string;
  image_url?: string | null;
  video_url?: string | null;
  tip_text?: string | null;
  warning_text?: string | null;
  device_type?: string[];
}

interface Guide {
  id: string;
  title: string;
  description: string | null;
  icon?: string;
  category?: string;
  steps: GuideStep[];
  supportsDevices?: boolean;
  titleByDevice?: Record<DeviceType, string>;
  stepsByDevice?: Record<DeviceType, GuideStep[]>;
}

const getGuideIcon = (icon: string | undefined) => {
  switch (icon) {
    case 'update': return RefreshCw;
    case 'popup': return XCircle;
    case 'text': return Type;
    case 'tv': return Tv;
    case 'audio': return Headphones;
    default: return BookOpen;
  }
};


// Convert hardcoded guide to Guide format with device support
const convertHardcodedGuide = (hardcodedGuide: HardcodedGuide): Guide => {
  const defaultSteps = hardcodedGuide.stepsByDevice?.iphone || hardcodedGuide.steps;
  return {
    id: hardcodedGuide.id,
    title: hardcodedGuide.title,
    description: hardcodedGuide.description,
    icon: hardcodedGuide.icon,
    supportsDevices: hardcodedGuide.supportsDevices,
    titleByDevice: hardcodedGuide.titleByDevice,
    stepsByDevice: hardcodedGuide.stepsByDevice ? Object.fromEntries(
      Object.entries(hardcodedGuide.stepsByDevice).map(([device, steps]) => [
        device,
        steps.map(s => ({
          id: `${hardcodedGuide.id}-${device}-${s.step_number}`,
          step_number: s.step_number,
          title: s.title,
          instruction: s.instruction,
          image_url: s.image_url,
        })),
      ])
    ) as Record<DeviceType, GuideStep[]> : undefined,
    steps: defaultSteps.map(s => ({
      id: `${hardcodedGuide.id}-${s.step_number}`,
      step_number: s.step_number,
      title: s.title,
      instruction: s.instruction,
      image_url: s.image_url,
    })),
  };
};

const Guides = () => {
  const [searchParams] = useSearchParams();
  const { guideId: routeGuideId } = useParams<{ guideId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [device, setDevice] = useState<DeviceType>('iphone');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory>('alle');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { markGuideAsRead, isGuideRead } = useUserAchievements();

  // Parse step from URL hash or search params (e.g., #step-3 or ?step=3)
  const getInitialStepFromUrl = useCallback(() => {
    // Check hash first (e.g., #step-3)
    const hash = location.hash;
    if (hash) {
      const stepMatch = hash.match(/#step-(\d+)/);
      if (stepMatch) {
        return parseInt(stepMatch[1], 10) - 1; // Convert to 0-indexed
      }
    }
    // Check query param (e.g., ?step=3)
    const stepParam = searchParams.get('step');
    if (stepParam) {
      return parseInt(stepParam, 10) - 1; // Convert to 0-indexed
    }
    return null;
  }, [location.hash, searchParams]);

  // Get current steps based on device selection
  // For hardcoded guides: use stepsByDevice
  // For database guides: filter by device_type array (includes current device or 'universal')
  const getCurrentSteps = () => {
    if (!selectedGuide) return [];
    
    // Hardcoded guides with stepsByDevice
    if (selectedGuide.supportsDevices && selectedGuide.stepsByDevice?.[device]) {
      return selectedGuide.stepsByDevice[device];
    }
    
    // Database guides: filter steps by device_type
    // A step is shown if its device_type includes the current device OR 'universal'
    const filteredSteps = selectedGuide.steps.filter(step => {
      const deviceTypes = (step as any).device_type as string[] | undefined;
      if (!deviceTypes || deviceTypes.length === 0) {
        return true; // No device_type means universal
      }
      return deviceTypes.includes(device) || deviceTypes.includes('universal');
    });
    
    return filteredSteps;
  };

  // Get current title based on device selection
  const getCurrentTitle = () => {
    if (!selectedGuide) return '';
    if (selectedGuide.supportsDevices && selectedGuide.titleByDevice?.[device]) {
      return selectedGuide.titleByDevice[device];
    }
    return selectedGuide.title;
  };

  // Check if database guide has any device-specific steps
  const hasDeviceSpecificSteps = () => {
    if (!selectedGuide) return false;
    return selectedGuide.steps.some(step => {
      const deviceTypes = (step as any).device_type as string[] | undefined;
      return deviceTypes && deviceTypes.length > 0 && !deviceTypes.includes('universal');
    });
  };

  const currentSteps = getCurrentSteps();
  const currentTitle = getCurrentTitle();

  // Fetch guides on mount and handle deep links
  useEffect(() => {
    const initGuides = async () => {
      const guideId = routeGuideId || searchParams.get('guide') || searchParams.get('id');
      const initialStep = getInitialStepFromUrl();
      
      // If we have a guideId, first check hardcoded guides for immediate response
      if (guideId) {
        const hardcodedGuide = hardcodedGuides.find(g => g.id === guideId);
        if (hardcodedGuide) {
          const convertedGuide = convertHardcodedGuide(hardcodedGuide);
          setSelectedGuide(convertedGuide);
          // Set initial step from URL if provided
          if (initialStep !== null && initialStep >= 0) {
            setCurrentStep(Math.min(initialStep, convertedGuide.steps.length - 1));
            setHighlightedStep(Math.min(initialStep, convertedGuide.steps.length - 1));
          } else {
            setCurrentStep(0);
          }
          setLoading(false);
          trackGuideView(hardcodedGuide.id, hardcodedGuide.title);
          // Still fetch DB guides in background for the list
          fetchGuides();
          return;
        }
      }
      
      // Fetch database guides
      await fetchGuides();
    };
    
    initGuides();
  }, []);

  // Handle step highlighting and scrolling
  useEffect(() => {
    if (highlightedStep !== null) {
      // Scroll to the highlighted step after a brief delay
      setTimeout(() => {
        const stepElement = stepRefs.current[highlightedStep];
        if (stepElement) {
          stepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      
      // Remove highlight after animation
      const timeout = setTimeout(() => {
        setHighlightedStep(null);
      }, 2500);
      
      return () => clearTimeout(timeout);
    }
  }, [highlightedStep]);

  // Handle deep link navigation after guides are loaded
  useEffect(() => {
    const guideId = routeGuideId || searchParams.get('guide') || searchParams.get('id');
    const initialStep = getInitialStepFromUrl();
    
    // Skip if no guideId, still loading, or already have a selected guide
    if (!guideId || loading || selectedGuide) return;
    
    // Check hardcoded guides first
    const hardcodedGuide = hardcodedGuides.find(g => g.id === guideId);
    if (hardcodedGuide) {
      const convertedGuide = convertHardcodedGuide(hardcodedGuide);
      setSelectedGuide(convertedGuide);
      // Set initial step from URL if provided
      if (initialStep !== null && initialStep >= 0) {
        setCurrentStep(Math.min(initialStep, convertedGuide.steps.length - 1));
        setHighlightedStep(Math.min(initialStep, convertedGuide.steps.length - 1));
      } else {
        setCurrentStep(0);
      }
      trackGuideView(hardcodedGuide.id, hardcodedGuide.title);
      return;
    }
    
    // Then check DB guides
    const guide = guides.find(g => g.id === guideId);
    if (guide) {
      setSelectedGuide(guide);
      // Set initial step from URL if provided
      if (initialStep !== null && initialStep >= 0) {
        setCurrentStep(Math.min(initialStep, guide.steps.length - 1));
        setHighlightedStep(Math.min(initialStep, guide.steps.length - 1));
      } else {
        setCurrentStep(0);
      }
      trackGuideView(guide.id, guide.title);
    }
  }, [searchParams, guides, routeGuideId, loading, selectedGuide, getInitialStepFromUrl]);

  // Reset step when device changes
  const handleDeviceChange = (newDevice: DeviceType) => {
    setDevice(newDevice);
    setCurrentStep(0);
  };

  const fetchGuides = async () => {
    try {
      // Fetch ALL published guides - no limit
      const { data: guidesData, error: guidesError } = await supabase
        .from('guides')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (guidesError) throw guidesError;

      if (!guidesData || guidesData.length === 0) {
        setGuides([]);
        setLoading(false);
        return;
      }

      // Fetch steps for all guides
      const { data: stepsData, error: stepsError } = await supabase
        .from('guide_steps')
        .select('*')
        .in('guide_id', guidesData.map(g => g.id))
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;

      // Combine guides with their steps, including device_type, tip_text, warning_text for filtering
      const guidesWithSteps: Guide[] = guidesData.map(guide => ({
        id: guide.id,
        title: guide.title,
        description: guide.description,
        category: (guide as any).category || 'hverdag',
        steps: (stepsData || [])
          .filter(step => step.guide_id === guide.id)
          .map(step => ({
            id: step.id,
            step_number: step.step_number,
            title: step.title,
            instruction: step.instruction,
            image_url: step.image_url,
            video_url: step.video_url,
            tip_text: (step as any).tip_text,
            warning_text: (step as any).warning_text,
            device_type: step.device_type,
          })),
      }));

      setGuides(guidesWithSteps);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Kunne ikke hente guides');
    } finally {
      setLoading(false);
    }
  };


  const handleMarkAsRead = async () => {
    if (!selectedGuide || isMarkingRead) return;
    
    setIsMarkingRead(true);
    const success = await markGuideAsRead(selectedGuide.id);
    
    if (success) {
      // Show confetti
      setShowConfetti(true);
      
      // Show toast
      toast.success('Du fik et stempel!', {
        description: 'Tjek dit stempelkort på forsiden.',
        icon: <PartyPopper className="h-5 w-5" />,
      });
      
      // Hide confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
        // Navigate to dashboard
        navigate('/dashboard');
      }, 2000);
    } else {
      toast.info('Du har allerede læst denne guide');
    }
    
    setIsMarkingRead(false);
  };

  // Guide detail view
  if (selectedGuide) {
    const step = currentSteps[currentStep];
    const alreadyRead = isGuideRead(selectedGuide.id);
    const isLastStep = currentStep === currentSteps.length - 1;

    // Show loading state while fetching steps, not a permanent fallback
    if (!step && currentSteps.length === 0) {
      return (
        <div className="min-h-screen bg-background">
          <header className="border-b border-border">
            <div className="container flex h-18 items-center px-4">
              <button 
                onClick={() => {
                  setSelectedGuide(null);
                  setCurrentStep(0);
                }}
                className="flex items-center gap-2 text-primary font-medium min-h-[44px]"
              >
                <ChevronLeft className="h-5 w-5" />
                Tilbage
              </button>
            </div>
          </header>
          <main className="container py-12 px-4">
            <div className="max-w-md mx-auto text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-3">Henter guide...</h2>
              <p className="text-muted-foreground mb-6">
                Vent venligst mens vi henter indholdet.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedGuide(null);
                  setCurrentStep(0);
                }}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Se andre guides
              </Button>
            </div>
          </main>
        </div>
      );
    }

    // If we have steps but current step is out of bounds, reset
    if (!step && currentSteps.length > 0) {
      setCurrentStep(0);
      return null;
    }

    return (
      <div className="min-h-screen bg-background relative">
        {/* Confetti overlay */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
                  width: `${8 + Math.random() * 8}px`,
                  height: `${8 + Math.random() * 8}px`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                }}
              />
            ))}
          </div>
        )}

        <header className="border-b border-border">
          <div className="container flex h-18 items-center px-4">
            <button 
              onClick={() => {
                setSelectedGuide(null);
                setCurrentStep(0);
              }}
              className="flex items-center gap-2 text-primary font-medium min-h-[44px]"
            >
              <ChevronLeft className="h-5 w-5" />
              Tilbage
            </button>
          </div>
        </header>

        <main className="container py-6 md:py-8 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Device Selector for multi-device guides (hardcoded or database guides with device-specific steps) */}
            {(selectedGuide.supportsDevices || hasDeviceSpecificSteps()) && (
              <div className="mb-6">
                <DeviceSelector value={device} onChange={handleDeviceChange} />
              </div>
            )}

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>{currentTitle}</span>
                <span>Trin {currentStep + 1} af {currentSteps.length}</span>
              </div>
              <div className="flex gap-1">
                {currentSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Premium Step Card */}
            <div 
              ref={(el) => { stepRefs.current[currentStep] = el; }}
              className={`transition-all duration-500 ${
                highlightedStep === currentStep 
                  ? 'ring-4 ring-primary/30 rounded-2xl animate-highlight-step' 
                  : ''
              }`}
            >
              <GuideStepCard
                stepNumber={currentStep + 1}
                totalSteps={currentSteps.length}
                title={step.title}
                instruction={step.instruction}
                imageUrl={step.image_url}
                videoUrl={step.video_url}
                tipText={step.tip_text}
                warningText={step.warning_text}
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between mb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Forrige
              </Button>

              {currentStep < currentSteps.length - 1 ? (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Næste
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-success hover:bg-success/90"
                  onClick={() => {
                    setSelectedGuide(null);
                    setCurrentStep(0);
                  }}
                >
                  Færdig!
                </Button>
              )}
            </div>

            {/* Mark as Read button - show on last step */}
            {isLastStep && !alreadyRead && (
              <div className="card-elevated p-6 bg-gradient-to-r from-primary/5 to-success/5 border-2 border-primary/20">
                <div className="text-center">
                  <PartyPopper className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Godt klaret!</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Marker guiden som læst og få et stempel på dit kort!
                  </p>
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={handleMarkAsRead}
                    disabled={isMarkingRead}
                    className="w-full sm:w-auto"
                  >
                    {isMarkingRead ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                    )}
                    Jeg har læst og forstået denne guide
                  </Button>
                </div>
              </div>
            )}

            {/* Already read badge */}
            {alreadyRead && (
              <div className="card-elevated p-4 bg-success/5 border border-success/20 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <p className="text-sm text-success font-medium">
                  Du har allerede læst denne guide og fået dine point!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Guides list
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-primary font-medium min-h-[44px]">
            <ChevronLeft className="h-5 w-5" />
            Tilbage
          </Link>
        </div>
      </header>

      <main className="container py-6 md:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Breadcrumb />
          </div>

          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold mb-2">Mini-guides</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Trin-for-trin guides med billeder der viser præcis hvad du skal gøre
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Søg efter guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[48px]"
            />
          </div>

          {/* Category Filter - horizontal scroll on mobile */}
          <div className="mb-6 sticky top-0 z-10 bg-background py-2 -mx-4 px-4 overflow-x-auto">
            <CategoryFilter value={selectedCategory} onChange={setSelectedCategory} />
          </div>

          {(() => {
            // Combine database guides with hardcoded guides
            const allGuides: Guide[] = [
              // First, add all hardcoded guides converted to Guide format
              ...hardcodedGuides.map(hg => convertHardcodedGuide(hg)),
              // Then add database guides that aren't duplicates
              ...guides.filter(dbGuide => !hardcodedGuides.some(hg => hg.id === dbGuide.id)),
            ];

            // Filter guides by category and search
            const filteredGuides = allGuides.filter(guide => {
              // Get category from guide or default to 'hverdag'
              const guideCategory = (guide as any).category || 
                hardcodedGuides.find(hg => hg.id === guide.id)?.category || 
                'hverdag';
              
              const matchesCategory = selectedCategory === 'alle' || guideCategory === selectedCategory;
              const matchesSearch = searchQuery === '' || 
                guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (guide.description && guide.description.toLowerCase().includes(searchQuery.toLowerCase()));
              return matchesCategory && matchesSearch;
            });

            if (allGuides.length === 0) {
              return (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Ingen guides tilgængelige endnu</p>
                </div>
              );
            }

            if (filteredGuides.length === 0) {
              return (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Vi fandt desværre ikke noget.</p>
                  <p className="text-sm text-muted-foreground">
                    Prøv at søge efter "Batteri" eller "Lyd"
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredGuides.map((guide) => {
                  // Get icon from hardcoded guide if available
                  const hardcodedGuide = hardcodedGuides.find(hg => hg.id === guide.id);
                  const IconComponent = getGuideIcon(hardcodedGuide?.icon || guide.icon);
                  const isRead = isGuideRead(guide.id);
                  return (
                    <button
                      key={guide.id}
                      onClick={() => {
                        setSelectedGuide(guide);
                        setCurrentStep(0);
                        trackGuideView(guide.id, guide.title);
                      }}
                      className="card-interactive p-6 w-full text-left flex items-center gap-4"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isRead ? 'bg-success/10' : 'bg-info/10'
                      }`}>
                        {isRead ? (
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        ) : (
                          <IconComponent className="h-6 w-6 text-info" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground">{guide.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
};

export default Guides;
