import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceSelector, DeviceType } from '@/components/ui/DeviceSelector';
import { GuideCategory } from '@/components/guides/CategoryFilter';
import { GuideStepCard } from '@/components/guides/GuideStepCard';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useAuth } from '@/contexts/AuthContext';
import { Breadcrumb, generateBreadcrumbSchema } from '@/components/seo/Breadcrumb';
import { SEOHead, articleSchema } from '@/components/seo/SEOHead';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { 
  BookOpen,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  XCircle,
  Loader2,
  CheckCircle2,
  PartyPopper,
  Search,
  Shield,
  Battery as BatteryIcon,
  Cloud,
  MessageSquare,
  AppWindow,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  LayoutGrid,
  Home
} from 'lucide-react';
import { DeviceBadges } from '@/components/guides/DeviceBadges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackGuideView } from '@/utils/analytics';
import { getCoverImage } from '@/assets/covers';

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
  slug: string | null;
  title: string;
  description: string | null;
  icon?: string;
  category?: string;
  steps: GuideStep[];
  supportsDevices?: boolean;
  titleByDevice?: Record<DeviceType, string>;
  stepsByDevice?: Record<DeviceType, GuideStep[]>;
  cover_image_url?: string | null;
  is_paginated?: boolean;
}

const getGuideIcon = (category: string | undefined) => {
  switch (category) {
    case 'hverdag': return RefreshCw;
    case 'sikkerhed': return Shield;
    case 'batteri': return BatteryIcon;
    case 'icloud': return Cloud;
    case 'beskeder': return MessageSquare;
    case 'apps': return AppWindow;
    default: return BookOpen;
  }
};

const Guides = () => {
  // Enable scroll restoration
  useScrollRestoration();
  
  const { profile } = useAuth();
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
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<'alle' | 'iphone' | 'ipad' | 'mac'>('alle');
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
  // Database guides: filter by device_type array (includes current device or 'universal')
  const getCurrentSteps = () => {
    if (!selectedGuide) return [];
    
    // Filter steps by device_type
    const filteredSteps = selectedGuide.steps.filter(step => {
      const deviceTypes = step.device_type as string[] | undefined;
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
    return selectedGuide.title;
  };

  // Check if guide has any device-specific steps
  const hasDeviceSpecificSteps = () => {
    if (!selectedGuide) return false;
    return selectedGuide.steps.some(step => {
      const deviceTypes = step.device_type as string[] | undefined;
      return deviceTypes && deviceTypes.length > 0 && !deviceTypes.includes('universal');
    });
  };

  const currentSteps = getCurrentSteps();
  const currentTitle = getCurrentTitle();

  // Fetch guides on mount
  useEffect(() => {
    fetchGuides();
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
    const guideIdentifier = routeGuideId || searchParams.get('guide') || searchParams.get('id');
    const initialStep = getInitialStepFromUrl();
    
    // Skip if no guideIdentifier, still loading, or already have a selected guide
    if (!guideIdentifier || loading || selectedGuide) return;
    
    // Find guide by slug first, then by id
    const guide = guides.find(g => g.slug === guideIdentifier || g.id === guideIdentifier);
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
        slug: (guide as any).slug || null,
        title: guide.title,
        description: guide.description,
        category: (guide as any).category || 'hverdag',
        cover_image_url: (guide as any).cover_image_url || null,
        is_paginated: (guide as any).is_paginated || false,
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

    // Generate Article schema for the selected guide
    const guideSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        articleSchema({
          title: selectedGuide.title,
          description: selectedGuide.description,
          slug: selectedGuide.slug,
          category: selectedGuide.category,
          stepsCount: currentSteps.length,
        }),
        generateBreadcrumbSchema(`/guides/${selectedGuide.slug || selectedGuide.id}`),
      ],
    };

    return (
      <div className="min-h-screen bg-background relative">
        <SEOHead
          title={`${selectedGuide.title} - MitTek Guide`}
          description={selectedGuide.description || `Lær ${selectedGuide.title.toLowerCase()} med denne letforståelige trin-for-trin guide fra MitTek.`}
          jsonLd={guideSchema}
        />
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

  // Group guides by category for better organization
  const groupGuidesByCategory = (guides: Guide[]) => {
    const categoryLabels: Record<string, string> = {
      'hverdag': '📱 Hverdagsbrug',
      'sikkerhed': '🔒 Sikkerhed',
      'batteri': '🔋 Batteri',
      'icloud': '☁️ iCloud',
      'beskeder': '💬 Beskeder',
      'apps': '📦 Apps',
    };

    const groups: Record<string, Guide[]> = {};
    
    guides.forEach(guide => {
      const category = guide.category || 'hverdag';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(guide);
    });

    // Sort categories in a logical order
    const categoryOrder = ['hverdag', 'sikkerhed', 'batteri', 'icloud', 'beskeder', 'apps'];
    const sortedGroups = categoryOrder
      .filter(cat => groups[cat] && groups[cat].length > 0)
      .map(cat => ({
        category: cat,
        label: categoryLabels[cat] || cat,
        guides: groups[cat]
      }));

    return sortedGroups;
  };

  // Get recommended guides based on user's owned devices
  const getRecommendedGuides = (allGuides: Guide[]): Guide[] => {
    const ownedDevices = profile?.owned_devices || [];
    if (ownedDevices.length === 0) return [];

    // Map device types to relevant categories
    const deviceToCategoryMap: Record<string, string[]> = {
      'iphone': ['hverdag', 'sikkerhed', 'beskeder', 'batteri'],
      'ipad': ['hverdag', 'sikkerhed', 'apps', 'batteri'],
      'mac': ['hverdag', 'sikkerhed', 'apps'],
      'apple-watch': ['hverdag', 'batteri'],
      'airpods': ['hverdag', 'batteri'],
    };

    // Get relevant categories based on owned devices
    const relevantCategories = new Set<string>();
    ownedDevices.forEach(device => {
      const categories = deviceToCategoryMap[device] || ['hverdag'];
      categories.forEach(cat => relevantCategories.add(cat));
    });

    // Filter guides that match the user's devices and haven't been read yet
    const recommended = allGuides
      .filter(guide => {
        const guideCategory = guide.category || 'hverdag';
        const isRelevant = relevantCategories.has(guideCategory);
        const notRead = !isGuideRead(guide.id);
        return isRelevant && notRead;
      })
      .slice(0, 3); // Max 3 recommendations

    return recommended;
  };

  // Guides list - add SEOHead for list view
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Mini-guides - MitTek | Trin-for-trin hjælp til iPhone, iPad og Mac"
        description="Nemme trin-for-trin guides med billeder til iPhone, iPad og Mac. Lær om sikkerhed, batteritips, iCloud og meget mere i dit eget tempo."
      />
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

          {/* Header with clear explanation */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Mini-guides</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
              Nemme trin-for-trin guides med billeder, der viser dig præcis hvad du skal gøre
            </p>
          </div>

          {/* Reading Progress Bar */}
          {guides.length > 0 && (
            <div className="mb-6 p-4 bg-card border border-border rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Din læsefremgang</span>
                <span className="text-sm font-semibold text-primary">
                  {guides.filter(g => isGuideRead(g.id)).length} af {guides.length} læst
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.round((guides.filter(g => isGuideRead(g.id)).length / guides.length) * 100)}%` 
                  }}
                />
              </div>
              {guides.filter(g => isGuideRead(g.id)).length === guides.length && (
                <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tillykke! Du har læst alle guides
                </p>
              )}
            </div>
          )}

          {/* Search Bar - larger and more visible */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Søg efter en guide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 min-h-[56px] text-base rounded-xl border-2 focus:border-primary"
            />
          </div>

          {/* Combined Filters Row */}
          <div className="mb-8 flex flex-wrap items-end gap-4">
            {/* Device Filter */}
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-3">Filtrer efter enhed:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'alle', label: 'Alle enheder', icon: '📱' },
                  { value: 'iphone', label: 'iPhone', icon: '📱' },
                  { value: 'ipad', label: 'iPad', icon: '📲' },
                  { value: 'mac', label: 'Mac', icon: '💻' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDeviceFilter(option.value as 'alle' | 'iphone' | 'ipad' | 'mac')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                      selectedDeviceFilter === option.value
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span className="mr-1.5">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Category Dropdown */}
            <div className="flex-shrink-0">
              <p className="text-sm font-medium text-muted-foreground mb-3">Filtrer efter emne:</p>
              <Select 
                value={selectedCategory} 
                onValueChange={(value: GuideCategory) => setSelectedCategory(value)}
              >
                <SelectTrigger className="w-[180px] min-h-[44px] rounded-xl border-2 bg-card">
                  <SelectValue placeholder="Vælg emne" />
                </SelectTrigger>
                <SelectContent className="bg-card border-2 rounded-xl z-50">
                  {[
                    { id: 'alle', label: 'Alle emner', icon: LayoutGrid },
                    { id: 'sikkerhed', label: 'Sikkerhed', icon: Shield },
                    { id: 'hverdag', label: 'Hverdag', icon: Home },
                    { id: 'batteri', label: 'Batteri', icon: BatteryIcon },
                    { id: 'icloud', label: 'iCloud', icon: Cloud },
                    { id: 'beskeder', label: 'Beskeder', icon: MessageSquare },
                    { id: 'apps', label: 'Apps', icon: AppWindow },
                  ].map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="min-h-[44px] cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {category.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

            {(() => {
            const allGuides: Guide[] = guides;
            const recommendedGuides = getRecommendedGuides(allGuides);

            // Filter guides by category, device, and search
            const filteredGuides = allGuides.filter(guide => {
              const guideCategory = guide.category || 'hverdag';
              
              const matchesCategory = selectedCategory === 'alle' || guideCategory === selectedCategory;
              const matchesSearch = searchQuery === '' || 
                guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (guide.description && guide.description.toLowerCase().includes(searchQuery.toLowerCase()));
              
              // Check if guide has steps for the selected device
              const matchesDevice = selectedDeviceFilter === 'alle' || guide.steps.some(step => {
                const deviceTypes = step.device_type as string[] | undefined;
                if (!deviceTypes || deviceTypes.length === 0) {
                  return true; // Universal step
                }
                return deviceTypes.includes(selectedDeviceFilter) || deviceTypes.includes('universal');
              });
              
              return matchesCategory && matchesSearch && matchesDevice;
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
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium mb-2">Vi fandt ingen guides</p>
                  <p className="text-muted-foreground mb-6">
                    Prøv et andet søgeord, f.eks. "batteri" eller "opdatering"
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('alle');
                    }}
                    className="min-h-[48px]"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Nulstil søgning
                  </Button>
                </div>
              );
            }

            // If showing all categories, group by category - Use Apple Books grid layout
            if (selectedCategory === 'alle' && searchQuery === '') {
              const groupedGuides = groupGuidesByCategory(filteredGuides);
              
              return (
                <div className="space-y-10">
                  {/* Recommended Section - Only show if user has devices configured */}
                  {recommendedGuides.length > 0 && (
                    <section className="mb-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">
                          Anbefalet til dig
                        </h2>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Baseret på dine enheder: {profile?.owned_devices?.map(d => {
                          const deviceLabels: Record<string, string> = {
                            'iphone': 'iPhone',
                            'ipad': 'iPad', 
                            'mac': 'Mac',
                            'apple-watch': 'Apple Watch',
                            'airpods': 'AirPods'
                          };
                          return deviceLabels[d] || d;
                        }).join(', ')}
                      </p>
                      
                      {/* Apple Books style grid for recommended */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {recommendedGuides.map((guide) => {
                          const IconComponent = getGuideIcon(guide.category);
                          
                          return (
                            <button
                              key={guide.id}
                              onClick={() => {
                                setSelectedGuide(guide);
                                setCurrentStep(0);
                                trackGuideView(guide.id, guide.title);
                              }}
                              className="group text-left"
                            >
                              {/* Book Cover */}
                              <div className={`aspect-[2/3] rounded-xl ${(guide.cover_image_url || getCoverImage(guide.slug, guide.category)) ? '' : 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5'} border-2 border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-primary/50 relative overflow-hidden`}>
                                {/* Cover Image or Fallback */}
                                {(guide.cover_image_url || getCoverImage(guide.slug, guide.category)) ? (
                                  <>
                                    <img 
                                      src={guide.cover_image_url || getCoverImage(guide.slug, guide.category) || ''} 
                                      alt={guide.title}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Recommended badge overlay */}
                                    <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded text-xs font-medium">
                                      Anbefalet
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full p-4">
                                    {/* Decorative corner */}
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-primary/10 rounded-bl-full" />
                                    
                                    <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                                      <IconComponent className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-primary/70 font-medium mb-1">Anbefalet</p>
                                      <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                                        {guide.title}
                                      </h4>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Device badges - bottom left */}
                                <DeviceBadges steps={guide.steps} className="absolute bottom-2 left-2 z-10" />
                                
                                {/* Spine effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
                              </div>
                              {/* Title below */}
                              <p className="mt-2 text-xs font-medium text-muted-foreground line-clamp-2 text-center">
                                {guide.title}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}
                  
                  {groupedGuides.map(group => (
                    <section key={group.category}>
                      {/* Category Header */}
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                        {group.label}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({group.guides.length})
                        </span>
                      </h2>
                      
                      {/* Apple Books style grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {group.guides.map((guide) => {
                          const IconComponent = getGuideIcon(guide.category);
                          const isRead = isGuideRead(guide.id);
                          
                          // Generate cover gradient based on category
                          const getCoverGradient = (category: string | undefined) => {
                            switch (category) {
                              case 'sikkerhed': return 'from-blue-500/20 via-blue-400/10 to-blue-300/5';
                              case 'batteri': return 'from-green-500/20 via-green-400/10 to-green-300/5';
                              case 'icloud': return 'from-purple-500/20 via-purple-400/10 to-purple-300/5';
                              case 'beskeder': return 'from-orange-500/20 via-orange-400/10 to-orange-300/5';
                              case 'apps': return 'from-pink-500/20 via-pink-400/10 to-pink-300/5';
                              default: return 'from-primary/20 via-primary/10 to-primary/5';
                            }
                          };
                          
                          return (
                            <button
                              key={guide.id}
                              onClick={() => {
                                setSelectedGuide(guide);
                                setCurrentStep(0);
                                trackGuideView(guide.id, guide.title);
                              }}
                              className="group text-left"
                            >
                              {/* Book Cover */}
                              <div className={`aspect-[2/3] rounded-xl ${(guide.cover_image_url || getCoverImage(guide.slug, guide.category)) ? '' : `bg-gradient-to-br ${getCoverGradient(guide.category)}`} border-2 ${isRead ? 'border-success/40' : 'border-border'} shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-primary/50 relative overflow-hidden`}>
                                {/* Cover Image or Fallback */}
                                {(guide.cover_image_url || getCoverImage(guide.slug, guide.category)) ? (
                                  <img 
                                    src={guide.cover_image_url || getCoverImage(guide.slug, guide.category) || ''} 
                                    alt={guide.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full p-4">
                                    {/* Decorative corner */}
                                    <div className={`absolute top-0 right-0 w-12 h-12 ${isRead ? 'bg-success/10' : 'bg-primary/10'} rounded-bl-full`} />
                                    
                                    <div className={`w-16 h-16 rounded-2xl ${isRead ? 'bg-success/15' : 'bg-primary/15'} flex items-center justify-center mb-4`}>
                                      {isRead ? (
                                        <CheckCircle2 className="h-8 w-8 text-success" />
                                      ) : (
                                        <IconComponent className="h-8 w-8 text-primary" />
                                      )}
                                    </div>
                                    <div className="text-center px-1">
                                      <h4 className="text-sm font-semibold text-foreground line-clamp-3 leading-tight">
                                        {guide.title}
                                      </h4>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Device badges - bottom left */}
                                <DeviceBadges steps={guide.steps} className="absolute bottom-2 left-2 z-10" />
                                
                                {/* Read badge - always show on top */}
                                {isRead && (
                                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center z-10">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                
                                {/* Spine effect */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isRead ? 'bg-success/30' : 'bg-primary/20'}`} />
                              </div>
                              {/* Title below */}
                              <p className={`mt-2 text-xs font-medium line-clamp-2 text-center ${isRead ? 'text-success' : 'text-muted-foreground'}`}>
                                {guide.title}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              );
            }

            // Apple Books grid when filtering or searching
            return (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Viser {filteredGuides.length} {filteredGuides.length === 1 ? 'guide' : 'guides'}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredGuides.map((guide) => {
                  const IconComponent = getGuideIcon(guide.category);
                  const isRead = isGuideRead(guide.id);
                  
                  const getCoverGradient = (category: string | undefined) => {
                    switch (category) {
                      case 'sikkerhed': return 'from-blue-500/20 via-blue-400/10 to-blue-300/5';
                      case 'batteri': return 'from-green-500/20 via-green-400/10 to-green-300/5';
                      case 'icloud': return 'from-purple-500/20 via-purple-400/10 to-purple-300/5';
                      case 'beskeder': return 'from-orange-500/20 via-orange-400/10 to-orange-300/5';
                      case 'apps': return 'from-pink-500/20 via-pink-400/10 to-pink-300/5';
                      default: return 'from-primary/20 via-primary/10 to-primary/5';
                    }
                  };
                  
                  return (
                    <button
                      key={guide.id}
                      onClick={() => {
                        setSelectedGuide(guide);
                        setCurrentStep(0);
                        trackGuideView(guide.id, guide.title);
                      }}
                      className="group text-left"
                    >
                      {/* Book Cover */}
                      <div className={`aspect-[2/3] rounded-xl ${(guide.cover_image_url || getCoverImage(guide.slug, guide.category)) ? '' : `bg-gradient-to-br ${getCoverGradient(guide.category)}`} border-2 ${isRead ? 'border-success/40' : 'border-border'} shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-primary/50 relative overflow-hidden`}>
                        {/* Cover Image or Fallback */}
                        {(guide.cover_image_url || getCoverImage(guide.slug, guide.category)) ? (
                          <img 
                            src={guide.cover_image_url || getCoverImage(guide.slug, guide.category) || ''} 
                            alt={guide.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-4">
                            <div className={`w-16 h-16 rounded-2xl ${isRead ? 'bg-success/15' : 'bg-primary/15'} flex items-center justify-center mb-4`}>
                              {isRead ? (
                                <CheckCircle2 className="h-8 w-8 text-success" />
                              ) : (
                                <IconComponent className="h-8 w-8 text-primary" />
                              )}
                            </div>
                            <div className="text-center px-1">
                              <h4 className="text-sm font-semibold text-foreground line-clamp-3 leading-tight">
                                {guide.title}
                              </h4>
                            </div>
                          </div>
                        )}
                        
                        {/* Device badges - bottom left */}
                        <DeviceBadges steps={guide.steps} className="absolute bottom-2 left-2 z-10" />
                        
                        {/* Read badge */}
                        {isRead && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center z-10">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                        
                        {/* Spine effect */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isRead ? 'bg-success/30' : 'bg-primary/20'}`} />
                      </div>
                      {/* Title below */}
                      <p className={`mt-2 text-xs font-medium line-clamp-2 text-center ${isRead ? 'text-success' : 'text-muted-foreground'}`}>
                        {guide.title}
                      </p>
                    </button>
                  );
                })}
                </div>
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
};

export default Guides;
