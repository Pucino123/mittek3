import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Smartphone,
  Clock,
  AlertCircle,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeniorMode } from '@/contexts/SeniorModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MonthlyCheckinPrompt } from '@/components/dashboard/MonthlyCheckinPrompt';
import { differenceInDays } from 'date-fns';

import { CheckinRecommendations } from '@/components/dashboard/CheckinRecommendations';
import { SecurityCheckWidget } from '@/components/dashboard/SecurityCheckWidget';
import { AIChatTooltip } from '@/components/dashboard/AIChatTooltip';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';
import { OnboardingTracker } from '@/components/dashboard/OnboardingTracker';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useDashboardSettings } from '@/hooks/useDashboardSettings';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { AddToolCard } from '@/components/dashboard/AddToolCard';
import { AddToolModal } from '@/components/dashboard/AddToolModal';
import { DashboardOnboardingTip } from '@/components/dashboard/DashboardOnboardingTip';
import { EditableCategoryTitle } from '@/components/dashboard/EditableCategoryTitle';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LucideIcon } from 'lucide-react';

// Card definition type
interface CardDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  minPlan: 'basic' | 'plus' | 'pro';
  category: string;
}

// All available cards (flat list)
const allCards: CardDefinition[] = [
  // Start category
  { id: 'checkin', title: 'Månedligt Tjek', description: 'Tjek din enheds sundhed', icon: ClipboardCheck, href: '/checkin', color: 'bg-primary/10 text-primary', minPlan: 'basic', category: 'start' },
  { id: 'guides', title: 'Mini-guides', description: 'Trin-for-trin vejledninger', icon: BookOpen, href: '/guides', color: 'bg-info/10 text-info', minPlan: 'basic', category: 'start' },
  { id: 'help', title: 'Hjælp', description: 'Få personlig hjælp', icon: HelpCircle, href: '/help', color: 'bg-accent/10 text-accent', minPlan: 'basic', category: 'start' },
  { id: 'dictionary', title: 'Ordbogen', description: 'Forstå tekniske ord', icon: BookText, href: '/tools/dictionary', color: 'bg-info/10 text-info', minPlan: 'basic', category: 'start' },
  // Tools category
  { id: 'password-generator', title: 'Kode-generator', description: 'Lav sikre koder', icon: Key, href: '/tools/password-generator', color: 'bg-success/10 text-success', minPlan: 'basic', category: 'tools' },
  { id: 'battery-doctor', title: 'Batteri-Doktor', description: 'Hvorfor løber batteriet tør?', icon: Battery, href: '/tools/battery-doctor', color: 'bg-warning/10 text-warning', minPlan: 'basic', category: 'tools' },
  { id: 'cleaning', title: 'Oprydning', description: 'Få mere plads', icon: Trash2, href: '/tools/cleaning-guide', color: 'bg-success/10 text-success', minPlan: 'basic', category: 'tools' },
  { id: 'hardware', title: 'Hardware-Detektiv', description: 'Lær dine knapper', icon: Smartphone, href: '/tools/hardware', color: 'bg-primary/10 text-primary', minPlan: 'basic', category: 'tools' },
  // Safety category
  { id: 'scam-quiz', title: 'Svindel-Quiz', description: 'Test dig selv', icon: ShieldAlert, href: '/tools/scam-quiz', color: 'bg-destructive/10 text-destructive', minPlan: 'basic', category: 'safety' },
  { id: 'panic', title: 'Tryghedsknap', description: 'Usikker? Få hjælp', icon: AlertTriangle, href: '/panic', color: 'bg-destructive/10 text-destructive', minPlan: 'plus', category: 'safety' },
  { id: 'safety', title: 'Sikkerhedsskjold', description: 'Tjek mistænkelige beskeder', icon: Shield, href: '/safety', color: 'bg-primary/10 text-primary', minPlan: 'plus', category: 'safety' },
  { id: 'vault', title: 'Kode-mappe', description: 'Gem dine koder sikkert', icon: Lock, href: '/kode-mappe', color: 'bg-secondary text-secondary-foreground', minPlan: 'plus', category: 'safety' },
  // Extras category
  { id: 'wishlist', title: 'Ønskeseddel', description: 'Hvad vil du lære?', icon: Star, href: '/tools/wishlist', color: 'bg-accent/10 text-accent', minPlan: 'basic', category: 'extras' },
  { id: 'medical-id', title: 'Nød-ID', description: 'Dit digitale nødkort', icon: HeartPulse, href: '/tools/medical-id', color: 'bg-destructive/10 text-destructive', minPlan: 'basic', category: 'extras' },
  { id: 'guest-wifi', title: 'Gæste-net', description: 'Del Wi-Fi nemt', icon: Wifi, href: '/tools/guest-wifi', color: 'bg-info/10 text-info', minPlan: 'basic', category: 'extras' },
  { id: 'screenshot', title: 'Screenshot → AI', description: 'Få billeder forklaret', icon: Camera, href: '/screenshot-ai', color: 'bg-success/10 text-success', minPlan: 'plus', category: 'extras' },
];

// Default card order
const defaultCardOrder = allCards.map(c => c.id);

// Default category titles (used as fallback)
const defaultCategoryTitles: Record<string, string> = {
  start: '🏠 Kom i gang',
  tools: '🔧 Værktøjer',
  safety: '🛡️ Sikkerhed',
  extras: '⭐ Ekstra',
};

// Legacy alias for backwards compatibility
const categoryTitles = defaultCategoryTitles;

// Admin card (rendered separately if user is admin)
const adminCard = {
  id: 'admin',
  title: 'Admin Panel',
  description: 'Administrer alt',
  icon: ShieldCheck,
  href: '/admin',
  color: 'bg-violet-500/10 text-violet-600',
};

// Sortable card wrapper
function SortableCard({ 
  card, 
  hasAccess, 
  isEditMode, 
  onRemove 
}: { 
  card: CardDefinition; 
  hasAccess: boolean; 
  isEditMode: boolean; 
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DashboardCard
        id={card.id}
        title={card.title}
        description={card.description}
        icon={card.icon}
        href={card.href}
        color={card.color}
        minPlan={card.minPlan}
        hasAccess={hasAccess}
        isEditMode={isEditMode}
        onRemove={onRemove}
        isDragging={isDragging}
      />
    </div>
  );
}

const Dashboard = () => {
  // Enable scroll restoration for dashboard
  useScrollRestoration();
  
  const [isFixingAccount, setIsFixingAccount] = useState(false);
  const [checkinData, setCheckinData] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const toolsSectionRef = useRef<HTMLDivElement>(null);
  
  const { seniorMode, toggleSeniorMode } = useSeniorMode();
  const { user, profile, hasAccess, signOut, isSubscriptionActive, subscription, refetchProfile } = useAuth();
  const navigate = useNavigate();
  
  const { 
    cardOrder, 
    hiddenCards,
    categoryTitles: customCategoryTitles,
    categoryOrder,
    customCategories,
    hideCard, 
    showCard, 
    updateCardOrder,
    updateCategoryTitle,
    updateCategoryOrder,
    addCustomCategory,
    deleteCategory,
    resetToDefault 
  } = useDashboardSettings();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate visible cards based on order and hidden status
  const visibleCards = useMemo(() => {
    const order = cardOrder || defaultCardOrder;
    return order
      .filter(id => !hiddenCards.includes(id))
      .map(id => allCards.find(c => c.id === id))
      .filter((c): c is CardDefinition => c !== undefined);
  }, [cardOrder, hiddenCards]);

  // Get hidden card definitions for the modal
  const hiddenCardDefinitions = useMemo(() => {
    return allCards.filter(c => hiddenCards.includes(c.id));
  }, [hiddenCards]);

  // Group cards by category for display
  const cardsByCategory = useMemo(() => {
    const grouped: Record<string, CardDefinition[]> = {};
    visibleCards.forEach(card => {
      if (!grouped[card.category]) {
        grouped[card.category] = [];
      }
      grouped[card.category].push(card);
    });
    return grouped;
  }, [visibleCards]);

  // Calculate trial days remaining
  const trialDaysRemaining = useMemo(() => {
    if (subscription?.status !== 'trialing' || !subscription?.trial_end) {
      return null;
    }
    const daysLeft = differenceInDays(new Date(subscription.trial_end), new Date());
    return Math.max(0, daysLeft);
  }, [subscription]);

  // Show trial expiration warning when 3 days or less remaining
  const [hasShownTrialWarning, setHasShownTrialWarning] = useState(false);
  
  useEffect(() => {
    if (trialDaysRemaining !== null && trialDaysRemaining <= 3 && !hasShownTrialWarning) {
      setHasShownTrialWarning(true);
      const daysText = trialDaysRemaining === 0 
        ? 'i dag' 
        : trialDaysRemaining === 1 
          ? 'i morgen' 
          : `om ${trialDaysRemaining} dage`;
      
      toast.warning(`Din prøveperiode udløber ${daysText}`, {
        description: 'Herefter trækkes dit første beløb automatisk.',
        duration: 10000,
        action: {
          label: 'Se abonnement',
          onClick: () => navigate('/settings/subscription'),
        },
      });
    }
  }, [trialDaysRemaining, hasShownTrialWarning, navigate]);

  // Check if onboarding should be shown
  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [profile]);

  // Exit edit mode with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode) {
        setIsEditMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode]);

  // Exit edit mode when clicking outside cards
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isEditMode) return;
      
      const target = e.target as HTMLElement;
      
      // Check if click is on the background, main, or container (not on cards)
      const isBackground = 
        target.tagName === 'MAIN' || 
        target.classList.contains('container') ||
        target.classList.contains('space-y-10') ||
        target.classList.contains('space-y-12') ||
        target.id === 'dashboard-wrapper';
      
      // Also check if click is NOT on a card or interactive element
      const isOnCard = target.closest('.card-interactive, [data-radix-collection-item], button, input');
      
      if (isBackground && !isOnCard) {
        setIsEditMode(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isEditMode]);

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

      // Refresh profile to get updated admin status
      await refetchProfile();

      toast.success('Konto opgraderet til Admin/Pro!', {
        description: 'Admin-panelet er nu tilgængeligt.',
      });
    } catch (error: any) {
      console.error('Dev fix error:', error);
      toast.error('Kunne ikke opdatere konto');
    } finally {
      setIsFixingAccount(false);
    }
  };

  // Long press handlers for entering edit mode
  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      setIsEditMode(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle drag end for both cards and categories
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Check if dragging categories
    if (activeId.startsWith('category-') && overId.startsWith('category-')) {
      const activeCategoryId = activeId.replace('category-', '');
      const overCategoryId = overId.replace('category-', '');
      
      const currentOrder = categoryOrder || Object.keys(defaultCategoryTitles);
      const oldIndex = currentOrder.indexOf(activeCategoryId);
      const newIndex = currentOrder.indexOf(overCategoryId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
        updateCategoryOrder(newOrder);
      }
      return;
    }

    // Dragging cards - check if moving between categories or within same category
    const activeCard = allCards.find(c => c.id === activeId);
    const overCard = allCards.find(c => c.id === overId);
    
    // Cross-category move: update the card's category
    if (activeCard && overCard && activeCard.category !== overCard.category) {
      // Find index in allCards to update category
      const updatedCards = [...allCards];
      const activeIndex = updatedCards.findIndex(c => c.id === activeId);
      if (activeIndex !== -1) {
        updatedCards[activeIndex] = { ...updatedCards[activeIndex], category: overCard.category };
      }
    }
    
    // Update card order (supports cross-category movement via visual position)
    const currentCardOrder = cardOrder || defaultCardOrder;
    const oldIndex = currentCardOrder.indexOf(activeId);
    const newIndex = currentCardOrder.indexOf(overId);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(currentCardOrder, oldIndex, newIndex);
      updateCardOrder(newOrder);
    }
  };

  // Handle card removal
  const handleRemoveCard = (cardId: string) => {
    hideCard(cardId);
    toast.success('Værktøj skjult', {
      description: 'Du kan tilføje det igen via + knappen',
      duration: 3000,
    });
  };

  // Handle adding card back
  const handleAddCard = (cardId: string) => {
    showCard(cardId);
    toast.success('Værktøj tilføjet');
  };

  // Handle reset all
  const handleResetAll = () => {
    resetToDefault();
    setShowAddModal(false);
    toast.success('Dashboard nulstillet');
  };

  // Handle create new category
  const handleCreateCategory = (categoryName: string) => {
    addCustomCategory(categoryName);
    toast.success(`Kategori "${categoryName}" oprettet`, {
      description: 'Du kan nu trække værktøjer ind i den nye kategori',
    });
  };

  // Handle delete category (any category, not just custom)
  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory(categoryId);
    toast.success('Kategori slettet');
  };

  // Get current category order for sortable context
  const currentCategoryOrder = categoryOrder || Object.keys(defaultCategoryTitles);

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
            
            {/* Trial Indicator - becomes warning at ≤3 days */}
            {trialDaysRemaining !== null && (
              <Link 
                to="/pricing"
                className={cn(
                  "ml-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80",
                  trialDaysRemaining <= 3 
                    ? "bg-destructive/15 text-destructive animate-pulse" 
                    : "bg-warning/15 text-warning"
                )}
              >
                {trialDaysRemaining <= 3 ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span>
                  {trialDaysRemaining === 0 
                    ? "Udløber i dag!" 
                    : trialDaysRemaining === 1 
                      ? "1 dag tilbage" 
                      : `${trialDaysRemaining} dage tilbage`}
                </span>
              </Link>
            )}
          </Link>

          <div className="flex items-center gap-4">
            {/* Edit Mode Indicator */}
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(false)}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Færdig
              </Button>
            )}

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

        {/* Tools Section Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 md:gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold">Dine værktøjer</h2>
            <ToolPageHelpButton inline />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditMode ? 'Træk for at flytte • Tryk X for at skjule' : 'Hold nede for at tilpasse'}
          </p>
        </div>

        {/* Categories with Cards */}
        <div ref={toolsSectionRef}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {/* Sortable context for categories (vertical list) */}
            <SortableContext
              items={currentCategoryOrder.map(id => `category-${id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-10 sm:space-y-12" id="dashboard-wrapper">
                {currentCategoryOrder.map((categoryId) => {
                  const categoryCards = cardsByCategory[categoryId];
                  // Also check custom categories that might be empty but should still render
                  const isCustomCategory = categoryId.startsWith('custom_');
                  const customCategoryData = customCategories.find(c => c.id === categoryId);
                  
                  // Skip if no cards AND not a custom category
                  if ((!categoryCards || categoryCards.length === 0) && !isCustomCategory) return null;
                  
                  const defaultTitle = customCategoryData?.title || defaultCategoryTitles[categoryId] || categoryId;
                  const customTitle = customCategoryTitles[categoryId];

                  return (
                    <section key={categoryId}>
                      {/* Category Header - Editable in edit mode, with drag & delete for custom */}
                      <EditableCategoryTitle
                        categoryId={categoryId}
                        defaultTitle={defaultTitle}
                        customTitle={customTitle}
                        isEditMode={isEditMode}
                        isCustomCategory={isCustomCategory}
                        onTitleChange={updateCategoryTitle}
                        onDelete={handleDeleteCategory}
                      />
                    
                      {/* Cards Grid - 4 per row on desktop */}
                      {categoryCards && categoryCards.length > 0 ? (
                        <SortableContext
                          items={categoryCards.map(c => c.id)}
                          strategy={rectSortingStrategy}
                        >
                          <div 
                            className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4"
                            onMouseDown={handleLongPressStart}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            onTouchStart={handleLongPressStart}
                            onTouchEnd={handleLongPressEnd}
                          >
                            {categoryCards.map((card) => (
                              <SortableCard
                                key={card.id}
                                card={card}
                                hasAccess={hasAccess(card.minPlan)}
                                isEditMode={isEditMode}
                                onRemove={() => handleRemoveCard(card.id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      ) : (
                        isEditMode && isCustomCategory && (
                          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground">
                            <p>Træk værktøjer hertil</p>
                          </div>
                        )
                      )}
                    </section>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Add Tool Card - Always at the end */}
        <div className="mt-10 sm:mt-12">
          <AddToolCard 
            onClick={() => setShowAddModal(true)} 
            isEditMode={isEditMode}
          />
        </div>
      </main>

      {/* Add Tool Modal */}
      <AddToolModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        hiddenCards={hiddenCardDefinitions}
        onAddCard={handleAddCard}
        onResetAll={handleResetAll}
        onCreateCategory={handleCreateCategory}
      />

      {/* Floating AI Chat Widget - Only show if subscription is active */}
      {isSubscriptionActive && (
        <>
          <AIChatTooltip isSubscriptionActive={isSubscriptionActive} />
          {/* The actual chat widget is rendered globally in App.tsx via AIChatWidget component */}
        </>
      )}

      {/* Contextual Help Button removed - users should use the inline help button */}

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

      {/* Onboarding Tip for first-time users */}
      <DashboardOnboardingTip targetRef={toolsSectionRef} />
    </div>
  );
};

export default Dashboard;