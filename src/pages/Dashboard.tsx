import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { 
  Shield, 
  ClipboardCheck, 
  BookOpen, 
  HelpCircle, 
  AlertTriangle, 
  Camera, 
  Lock,
  Settings,
  LogOut,
  ChevronRight,
  Wrench,
  Loader2,
  ShieldCheck,
  Key,
  BookText,
  Battery,
  Star,
  Trash2,
  Wifi,
  HeartPulse,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { useSeniorMode } from '@/contexts/SeniorModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MonthlyCheckinPrompt } from '@/components/dashboard/MonthlyCheckinPrompt';


import { CheckinRecommendations } from '@/components/dashboard/CheckinRecommendations';
import { SecurityCheckWidget } from '@/components/dashboard/SecurityCheckWidget';
import { AIChatTooltip } from '@/components/dashboard/AIChatTooltip';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ContextualHelpButton } from '@/components/help/ContextualHelpButton';
import { OnboardingTracker } from '@/components/dashboard/OnboardingTracker';

// Kategorier med kort - simpelt og overskueligt
const cardCategories = [
  {
    id: 'start',
    title: '🏠 Kom i gang',
    cards: [
      {
        id: 'checkin',
        title: 'Månedligt Tjek',
        description: 'Tjek din enheds sundhed',
        icon: ClipboardCheck,
        href: '/checkin',
        color: 'bg-primary/10 text-primary',
        minPlan: 'basic' as const,
      },
      {
        id: 'guides',
        title: 'Mini-guides',
        description: 'Trin-for-trin vejledninger',
        icon: BookOpen,
        href: '/guides',
        color: 'bg-info/10 text-info',
        minPlan: 'basic' as const,
      },
      {
        id: 'help',
        title: 'Hjælp',
        description: 'Få personlig hjælp',
        icon: HelpCircle,
        href: '/help',
        color: 'bg-accent/10 text-accent',
        minPlan: 'basic' as const,
      },
      {
        id: 'dictionary',
        title: 'Ordbogen',
        description: 'Forstå tekniske ord',
        icon: BookText,
        href: '/tools/dictionary',
        color: 'bg-info/10 text-info',
        minPlan: 'basic' as const,
      },
    ],
  },
  {
    id: 'tools',
    title: '🔧 Værktøjer',
    cards: [
      {
        id: 'password-generator',
        title: 'Kode-generator',
        description: 'Lav sikre koder',
        icon: Key,
        href: '/tools/password-generator',
        color: 'bg-success/10 text-success',
        minPlan: 'basic' as const,
      },
      {
        id: 'battery-doctor',
        title: 'Batteri-Doktor',
        description: 'Hvorfor løber batteriet tør?',
        icon: Battery,
        href: '/tools/battery-doctor',
        color: 'bg-warning/10 text-warning',
        minPlan: 'basic' as const,
      },
      {
        id: 'cleaning',
        title: 'Oprydning',
        description: 'Få mere plads',
        icon: Trash2,
        href: '/tools/cleaning-guide',
        color: 'bg-success/10 text-success',
        minPlan: 'basic' as const,
      },
      {
        id: 'hardware',
        title: 'Hardware-Detektiv',
        description: 'Lær dine knapper',
        icon: Smartphone,
        href: '/tools/hardware',
        color: 'bg-primary/10 text-primary',
        minPlan: 'basic' as const,
      },
    ],
  },
  {
    id: 'safety',
    title: '🛡️ Sikkerhed',
    cards: [
      {
        id: 'scam-quiz',
        title: 'Svindel-Quiz',
        description: 'Test dig selv',
        icon: ShieldAlert,
        href: '/tools/scam-quiz',
        color: 'bg-destructive/10 text-destructive',
        minPlan: 'basic' as const,
      },
      {
        id: 'panic',
        title: 'Tryghedsknap',
        description: 'Usikker? Få hjælp',
        icon: AlertTriangle,
        href: '/panic',
        color: 'bg-destructive/10 text-destructive',
        minPlan: 'plus' as const,
      },
      {
        id: 'safety',
        title: 'Sikkerhedsskjold',
        description: 'Tjek mistænkelige beskeder',
        icon: Shield,
        href: '/safety',
        color: 'bg-primary/10 text-primary',
        minPlan: 'plus' as const,
      },
      {
        id: 'vault',
        title: 'Kode-mappe',
        description: 'Gem dine koder sikkert',
        icon: Lock,
        href: '/kode-mappe',
        color: 'bg-secondary text-secondary-foreground',
        minPlan: 'plus' as const,
      },
    ],
  },
  {
    id: 'extras',
    title: '⭐ Ekstra',
    cards: [
      {
        id: 'wishlist',
        title: 'Ønskeseddel',
        description: 'Hvad vil du lære?',
        icon: Star,
        href: '/tools/wishlist',
        color: 'bg-accent/10 text-accent',
        minPlan: 'basic' as const,
      },
      {
        id: 'medical-id',
        title: 'Nød-ID',
        description: 'Dit digitale nødkort',
        icon: HeartPulse,
        href: '/tools/medical-id',
        color: 'bg-destructive/10 text-destructive',
        minPlan: 'basic' as const,
      },
      {
        id: 'guest-wifi',
        title: 'Gæste-net',
        description: 'Del Wi-Fi nemt',
        icon: Wifi,
        href: '/tools/guest-wifi',
        color: 'bg-info/10 text-info',
        minPlan: 'basic' as const,
      },
      {
        id: 'screenshot',
        title: 'Screenshot → AI',
        description: 'Få billeder forklaret',
        icon: Camera,
        href: '/screenshot-ai',
        color: 'bg-success/10 text-success',
        minPlan: 'plus' as const,
      },
    ],
  },
];

// Admin card (rendered separately if user is admin)
const adminCard = {
  id: 'admin',
  title: 'Admin Panel',
  description: 'Administrer alt',
  icon: ShieldCheck,
  href: '/admin',
  color: 'bg-violet-500/10 text-violet-600',
};

const Dashboard = () => {
  const [isFixingAccount, setIsFixingAccount] = useState(false);
  const [checkinData, setCheckinData] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { seniorMode, toggleSeniorMode } = useSeniorMode();
  const { user, profile, hasAccess, signOut, isSubscriptionActive } = useAuth();
  const navigate = useNavigate();

  // Check if onboarding should be shown
  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [profile]);

  const handleCheckinStatus = useCallback((hasRecent: boolean, data?: any) => {
    if (hasRecent && data) {
      setCheckinData(data);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDevFix = async () => {
    setIsFixingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Ikke logget ind');
        return;
      }

      const response = await supabase.functions.invoke('dev-force-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast.success('Konto opgraderet til Admin/Pro!', {
        description: 'Genindlæs siden for at se ændringerne.',
      });
    } catch (error: any) {
      console.error('Dev fix error:', error);
      toast.error('Kunne ikke opdatere konto');
    } finally {
      setIsFixingAccount(false);
    }
  };

  const displayName = profile?.display_name || 'der';
  const isOwner = user?.email === 'kevin.therkildsen@icloud.com';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-18 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold">MitTek</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Senior Mode Toggle - iOS Style */}
            <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary">
              <IOSSwitch 
                id="senior-mode-dash" 
                checked={seniorMode}
                onCheckedChange={toggleSeniorMode}
              />
              <Label htmlFor="senior-mode-dash" className="text-sm font-medium cursor-pointer">
                Senior-tilstand
              </Label>
            </div>

            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-8 lg:py-10 overflow-x-hidden">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <Breadcrumb />
        </div>

        {/* Welcome Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Hej, {displayName} 👋
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mt-2">
            Hvad vil du gerne have hjælp med i dag?
          </p>
        </div>

        {/* Onboarding Progress Tracker - For new users */}
        <OnboardingTracker />

        {/* Monthly Checkin Prompt - Prominent for new users */}
        <MonthlyCheckinPrompt onHasRecentCheckin={handleCheckinStatus} />


        {/* Security Check Widget - Interactive "Am I Hacked?" */}
        <SecurityCheckWidget />

        {/* AI Recommendations from last checkin */}
        {checkinData && <CheckinRecommendations checkinData={checkinData} />}


        {/* Admin Card - Top of page for admins */}
        {profile?.is_admin && (
          <div className="mb-8">
            <Link
              to={adminCard.href}
              className="card-interactive p-5 sm:p-6 flex items-center gap-4 border-2 border-violet-500/30 max-w-md"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${adminCard.color} flex items-center justify-center shrink-0`}>
                <adminCard.icon className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold">{adminCard.title}</h3>
                <p className="text-muted-foreground text-sm">{adminCard.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-violet-600 shrink-0" />
            </Link>
          </div>
        )}

        {/* Categories with Cards */}
        <div className="space-y-10 sm:space-y-12">
          {cardCategories.map((category) => (
            <section key={category.id}>
              {/* Category Header - Large and clear */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
                {category.title}
              </h2>
              
              {/* Cards Grid - 4 per row on desktop */}
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {category.cards.map((card) => {
                  const hasCardAccess = hasAccess(card.minPlan);
                  
                  return (
                    <Link
                      key={card.id}
                      to={hasCardAccess ? card.href : '/settings/subscription'}
                      className={`card-interactive p-4 sm:p-5 flex flex-col ${!hasCardAccess ? 'opacity-60 grayscale-[20%]' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${card.color} flex items-center justify-center shrink-0 relative`}>
                          <card.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          {/* Lock overlay for locked cards */}
                          {!hasCardAccess && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                              <Lock className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        {!hasCardAccess && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                            Plus
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-base sm:text-lg font-semibold mb-1 leading-tight">{card.title}</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm flex-1 line-clamp-2">{card.description}</p>
                      
                      <div className="mt-3 flex items-center text-primary font-medium text-sm">
                        {hasCardAccess ? (
                          <>Åbn</>
                        ) : (
                          <>
                            <Lock className="mr-1 h-3 w-3" />
                            Kræver Plus
                          </>
                        )}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Floating AI Chat Widget - Only show if subscription is active */}
      {isSubscriptionActive && (
        <>
          <AIChatTooltip isSubscriptionActive={isSubscriptionActive} />
          {/* The actual chat widget is rendered globally in App.tsx via AIChatWidget component */}
        </>
      )}

      {/* Contextual Help Button */}
      <ContextualHelpButton />

      {/* Onboarding Wizard for new users */}
      <OnboardingWizard 
        open={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />

      {/* DEV: Fix Account Button - Only for owner */}
      {isOwner && (
        <button
          onClick={handleDevFix}
          disabled={isFixingAccount}
          className="fixed bottom-4 left-4 z-50 bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-xs font-medium shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          {isFixingAccount ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wrench className="h-4 w-4" />
          )}
          DEV: Fix My Account
        </button>
      )}
    </div>
  );
};

export default Dashboard;
