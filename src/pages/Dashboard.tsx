import { useState, useCallback, useEffect, useMemo, useRef, forwardRef } from 'react';
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
  Check,
  ChevronRight,
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
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  MeasuringStrategy,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, StickyNote } from 'lucide-react';
import { NoteWidgetCard } from '@/components/dashboard/NoteWidgetCard';

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
  isWidget?: boolean; // For inline widget cards like Notes
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
  // Tool Library cards (hidden by default, accessible via "Tilføj værktøj")
  { id: 'notes', title: 'Mine Noter', description: 'Private notater kun til dig', icon: StickyNote, href: '', color: 'bg-warning/10 text-warning', minPlan: 'basic', category: 'tools', isWidget: true },
];

// Standard Suite: The 16 tools visible by default on the dashboard
// Tools NOT in this list start hidden in the Tool Library
export const STANDARD_TOOL_IDS = [
  'checkin', 'guides', 'help', 'dictionary',           // Kom i gang
  'password-generator', 'battery-doctor', 'cleaning', 'hardware', // Værktøjer
  'scam-quiz', 'panic', 'safety', 'vault',             // Sikkerhed
  'wishlist', 'medical-id', 'guest-wifi', 'screenshot' // Ekstra
];

// Tools that start in the Tool Library (not shown by default)
export const getDefaultHiddenCards = (): string[] => {
  return allCards
    .filter(card => !STANDARD_TOOL_IDS.includes(card.id))
    .map(card => card.id);
};

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

// Haptic feedback utility with iOS-style patterns
const haptics = {
  tick: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  soft: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
  },
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
};

// iOS-style spring animation config for Framer Motion
const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

// Smooth dnd-kit transition config (iOS-like)
const smoothTransition = {
  duration: 400,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
};

// Custom collision detection - uses pointer position for precise targeting
// Prevents the "too low" bug by centering on the pointer, not the card bottom
const pointerPrecisionCollision: CollisionDetection = (args) => {
  // First try pointerWithin - most precise, uses actual pointer position
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  
  // Fall back to closestCenter for edge cases
  return closestCenter(args);
};
// Sortable card wrapper with iOS-style gap insertion animations
function SortableCard({ 
  card, 
  hasAccess, 
  isEditMode, 
  onRemove,
  isBeingDragged,
  onExitEditMode,
}: { 
  card: CardDefinition; 
  hasAccess: boolean; 
  isEditMode: boolean; 
  onRemove: () => void;
  isBeingDragged: boolean;
  onExitEditMode: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: card.id, 
    disabled: !isEditMode,
  });

  // Calculate transform - dnd-kit handles the reflow automatically with rectSortingStrategy
  const getTransformStyle = () => {
    if (!transform) return undefined;
    return `translate3d(${transform.x}px, ${transform.y}px, 0)`;
  };

  // Tight, snappy spring transition - high stiffness, high damping (no bounce)
  // Uses a "critically damped" curve for instant settling
  const style: React.CSSProperties = {
    transform: getTransformStyle(),
    // Non-dragged items: fast, snappy transition with minimal overshoot
    // 200ms with ease-out gives instant, tight feel
    transition: isDragging 
      ? 'none' 
      : 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 150ms ease',
    opacity: isBeingDragged ? 0.3 : 1,
    zIndex: isDragging ? 10 : 1,
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      {...attributes} 
      {...listeners}
      style={style}
      className="relative h-full touch-none"
      data-sortable-item
      data-dragging={isDragging}
    >
      {/* Render widget card (inline component) or regular card */}
      {card.isWidget ? (
        <NoteWidgetCard
          isEditMode={isEditMode}
          onRemove={onRemove}
          isDragging={isDragging}
          onExitEditMode={onExitEditMode}
        />
      ) : (
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
          onExitEditMode={onExitEditMode}
        />
      )}
    </div>
  );
}

// Static card for DragOverlay - iOS-style lifted appearance
const DragOverlayCard = forwardRef<HTMLDivElement, { card: CardDefinition; hasAccess: boolean }>(
  ({ card, hasAccess }, ref) => {
    return (
      <motion.div 
        ref={ref}
        className="pointer-events-none drag-overlay-glow"
        initial={{ scale: 1, opacity: 0.9, rotate: 0 }}
        animate={{ 
          scale: 1.05,
          opacity: 1,
          rotate: [0, -1.5, 1.5, -1.5, 1.5, 0],
        }}
        transition={{
          scale: springTransition,
          opacity: { duration: 0.15 },
          rotate: {
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
          },
        }}
        style={{
          width: '100%',
          maxWidth: '280px',
          height: '210px',
          zIndex: 9999,
        }}
      >
        {/* Render widget card or regular card */}
        {card.isWidget ? (
          <NoteWidgetCard
            isEditMode={true}
            isDragging={false}
            style={{
              height: '100%',
              transform: 'none',
            }}
          />
        ) : (
          <DashboardCard
            id={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
            href={card.href}
            color={card.color}
            minPlan={card.minPlan}
            hasAccess={hasAccess}
            isEditMode={true}
            isDragging={false}
            style={{
              height: '100%',
              transform: 'none',
            }}
          />
        )}
      </motion.div>
    );
  }
);
DragOverlayCard.displayName = 'DragOverlayCard';


// Droppable zone for empty categories with spring animation
function EmptyCategoryDropZone({ categoryId, isOver }: { categoryId: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: `dropzone-${categoryId}`,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: isOver ? 1.02 : 1,
        borderColor: isOver ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)',
        backgroundColor: isOver ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.2)',
      }}
      transition={springTransition}
      className="border-2 border-dashed rounded-xl p-8 text-center min-h-[140px] flex items-center justify-center"
    >
      <motion.p 
        className="text-sm font-medium"
        animate={{ 
          color: isOver ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          scale: isOver ? 1.05 : 1,
        }}
        transition={springTransition}
      >
        {isOver ? "Slip for at placere her" : "Træk værktøjer hertil"}
      </motion.p>
    </motion.div>
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
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const toolsSectionRef = useRef<HTMLDivElement>(null);
  
  // Undo history stack (full snapshots for robust restore)
  type DashboardSnapshot = {
    card_order: string[] | null;
    hidden_cards: string[];
    card_categories: Record<string, string>;
  };

  type UndoAction =
    | { type: 'move'; snapshot: DashboardSnapshot }
    | { type: 'delete'; cardId: string; snapshot: DashboardSnapshot };

  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  
  const { seniorMode, toggleSeniorMode } = useSeniorMode();
  const { user, profile, isAdmin, hasAccess, signOut, isSubscriptionActive, subscription, refetchProfile } = useAuth();
  const navigate = useNavigate();

  
  const { 
    cardOrder, 
    hiddenCards,
    categoryTitles: customCategoryTitles,
    categoryOrder,
    customCategories,
    cardCategories,
    hideCard, 
    showCard,
    updateCardOrder,
    updateCardCategoryAndOrder,
    restoreSnapshot,
    updateCategoryTitle,
    updateCategoryOrder,
    addCustomCategory,
    deleteCategory,
    resetToDefault 
  } = useDashboardSettings();

  // DnD sensors - optimized for iOS-like feel with reduced sensitivity
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 12, // Increased from 8 for less sensitive activation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Reduced delay for faster response
        tolerance: 8, // Increased tolerance for more forgiving touch
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get effective category for a card (user override or default)
  const getCardCategory = useCallback((cardId: string): string => {
    // Check user-persisted category first, then fall back to default
    if (cardCategories[cardId]) {
      return cardCategories[cardId];
    }
    const card = allCards.find(c => c.id === cardId);
    return card?.category || 'extras';
  }, [cardCategories]);

  // Calculate visible cards based on order and hidden status
  const visibleCards = useMemo(() => {
    const order = cardOrder || defaultCardOrder;
    return order
      .filter(id => !hiddenCards.includes(id))
      .map(id => {
        const card = allCards.find(c => c.id === id);
        if (!card) return undefined;
        // Apply user's category override
        const effectiveCategory = getCardCategory(card.id);
        return { ...card, category: effectiveCategory };
      })
      .filter((c): c is CardDefinition => c !== undefined);
  }, [cardOrder, hiddenCards, getCardCategory]);

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
      haptics.tick(); // Haptic on enter edit mode
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Track previous over ID for haptic on change
  const prevOverIdRef = useRef<string | null>(null);

  // Handle drag start - track active dragged item for overlay
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(String(active.id));
    saveUndoState(); // Save state before drag for undo
    haptics.tick(); // Haptic on drag start
    
    // Prevent page scrolling on touch devices during drag
    document.body.classList.add('dragging-active');
  };

  // Handle drag over for visual feedback on empty zones
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    const overId = over?.id ? String(over.id) : null;
    
    // Haptic feedback when hovering over a new target
    if (overId && overId !== prevOverIdRef.current) {
      haptics.soft();
      prevOverIdRef.current = overId;
    }
    
    if (over?.id && String(over.id).startsWith('dropzone-')) {
      setActiveDropZone(String(over.id).replace('dropzone-', ''));
    } else {
      setActiveDropZone(null);
    }
  };

  // Handle drag end for both cards and categories
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Clear drag states and re-enable scrolling
    setActiveDropZone(null);
    setActiveDragId(null);
    prevOverIdRef.current = null;
    document.body.classList.remove('dragging-active');

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Don't do anything if dropped on itself
    if (activeId === overId) return;
    
    // Haptic feedback on successful drop
    haptics.success();

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

    // Handle drop on empty category zone
    if (overId.startsWith('dropzone-')) {
      const targetCategoryId = overId.replace('dropzone-', '');
      const currentCardOrder = cardOrder || defaultCardOrder;
      
      // Move card to target category
      updateCardCategoryAndOrder(activeId, targetCategoryId, currentCardOrder);
      toast.success('Værktøj flyttet', {
        description: `Flyttet til ny kategori`,
        duration: 2000,
      });
      return;
    }

    // Dragging cards onto other cards
    const currentCardOrder = cardOrder || defaultCardOrder;
    const oldIndex = currentCardOrder.indexOf(activeId);
    const newIndex = currentCardOrder.indexOf(overId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Get effective categories for both cards
    const activeCardCategory = getCardCategory(activeId);
    const overCardCategory = getCardCategory(overId);
    
    // Calculate new order
    const newOrder = arrayMove(currentCardOrder, oldIndex, newIndex);
    
    // Check if this is a cross-category move
    if (activeCardCategory !== overCardCategory) {
      // Cross-category move: update both category AND order in one call
      updateCardCategoryAndOrder(activeId, overCardCategory, newOrder);
      toast.success('Værktøj flyttet', {
        description: `Flyttet til ny kategori`,
        duration: 2000,
      });
    } else {
      // Same category: just update order
      updateCardOrder(newOrder);
    }
  };

  // Handle card removal - save full snapshot for undo
  const handleRemoveCard = (cardId: string) => {
    const sanitizedCategories = Object.fromEntries(
      Object.entries(cardCategories).filter(([k, v]) => Boolean(k?.trim()) && Boolean(v?.trim()))
    ) as Record<string, string>;

    const snapshot: DashboardSnapshot = {
      card_order: cardOrder ? [...cardOrder] : null,
      hidden_cards: [...hiddenCards],
      card_categories: sanitizedCategories,
    };

    setUndoStack(prev => [
      ...prev.slice(-9),
      { type: 'delete' as const, cardId, snapshot },
    ]);

    hideCard(cardId);
    haptics.tick();

    toast.success('Værktøj skjult', {
      description: 'Klik for at fortryde',
      duration: 5000,
      action: {
        label: 'Fortryd',
        onClick: () => {
          restoreSnapshot(snapshot);
          setUndoStack(prev => prev.filter(a => !(a.type === 'delete' && a.cardId === cardId)));
          haptics.success();
          toast.success('Værktøj gendannet', { duration: 2000 });
        },
      },
    });
  };

  // Handle adding card back - place in last category
  const handleAddCard = (cardId: string) => {
    // Get the last category in the current order
    const lastCategoryId = currentCategoryOrder[currentCategoryOrder.length - 1];
    
    // Show the card and assign it to the last category
    showCard(cardId, lastCategoryId);
    
    haptics.success();
    toast.success('Værktøj tilføjet', {
      description: `Placeret i bunden af dit dashboard`,
      duration: 2000,
    });
  };

  // Undo functionality - restore full snapshots for BOTH move and delete
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      toast.info('Ingen handlinger at fortryde', { duration: 1500 });
      return;
    }

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    restoreSnapshot(lastAction.snapshot);

    if (lastAction.type === 'delete') {
      haptics.success();
      toast.success('Værktøj gendannet', { duration: 2000 });
    } else {
      haptics.tick();
      toast.success('Handling fortrudt', { duration: 2000 });
    }
  }, [undoStack, restoreSnapshot]);

  // Save snapshot before drag operations (move type)
  const saveUndoState = useCallback(() => {
    const sanitizedCategories = Object.fromEntries(
      Object.entries(cardCategories).filter(([k, v]) => Boolean(k?.trim()) && Boolean(v?.trim()))
    ) as Record<string, string>;

    const snapshot: DashboardSnapshot = {
      card_order: cardOrder ? [...cardOrder] : null,
      hidden_cards: [...hiddenCards],
      card_categories: sanitizedCategories,
    };

    setUndoStack(prev => [
      ...prev.slice(-9),
      { type: 'move' as const, snapshot },
    ]);
  }, [cardCategories, cardOrder, hiddenCards]);

  // Keyboard undo listener (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // Shake gesture detection for mobile undo
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = 0;
    const SHAKE_THRESHOLD = 15;
    const SHAKE_TIMEOUT = 1000;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acceleration = e.accelerationIncludingGravity;
      if (!acceleration) return;

      const currentTime = Date.now();
      if (currentTime - lastTime < 100) return;

      const deltaX = Math.abs((acceleration.x || 0) - lastX);
      const deltaY = Math.abs((acceleration.y || 0) - lastY);
      const deltaZ = Math.abs((acceleration.z || 0) - lastZ);

      if ((deltaX > SHAKE_THRESHOLD && deltaY > SHAKE_THRESHOLD) ||
          (deltaX > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD) ||
          (deltaY > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD)) {
        
        if (currentTime - lastTime > SHAKE_TIMEOUT) {
          handleUndo();
        }
      }

      lastX = acceleration.x || 0;
      lastY = acceleration.y || 0;
      lastZ = acceleration.z || 0;
      lastTime = currentTime;
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion);
      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  }, [handleUndo]);

  // Handle reset all
  const handleResetAll = () => {
    resetToDefault();
    setShowAddModal(false);
    setUndoStack([]);
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
  // SAFE: Moves all cards from the category to the hidden pool
  const handleDeleteCategory = (categoryId: string) => {
    saveUndoState();
    
    // Find all card IDs that belong to this category
    const categoryCards = cardsByCategory[categoryId] || [];
    const cardIdsToHide = categoryCards.map(card => card.id);
    
    // Delete category and move its cards to hidden pool
    deleteCategory(categoryId, cardIdsToHide);
    
    toast.success('Kategori slettet', {
      description: cardIdsToHide.length > 0 
        ? `${cardIdsToHide.length} værktøj${cardIdsToHide.length > 1 ? 'er' : ''} flyttet til skjulte`
        : undefined,
    });
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

            {/* Admin shortcut - only for admins */}
            {isAdmin && (
              <>
                <Link to="/admin" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
                <Link to="/admin" className="sm:hidden">
                  <Button variant="ghost" size="icon" aria-label="Admin Panel">
                    <ShieldCheck className="h-5 w-5" />
                  </Button>
                </Link>
              </>
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

      <main className="container py-6 sm:py-8 lg:py-10 overflow-x-hidden scroll-momentum">
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



        {/* Tools Section Header with Done button on right */}
        <div className="flex items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 md:gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold">Dine værktøjer</h2>
              <ToolPageHelpButton inline />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditMode ? 'Træk for at flytte • Tryk X for at skjule' : 'Hold nede for at tilpasse'}
            </p>
          </div>
          
          {/* Done button - appears when in edit mode, positioned on the right */}
          {isEditMode && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditMode(false)}
              className="gap-2 shrink-0"
            >
              <Check className="h-4 w-4" />
              Færdig
            </Button>
          )}
        </div>
        {/* Categories with Cards */}
        <div ref={toolsSectionRef}>
          <DndContext
            sensors={sensors}
            collisionDetection={pointerPrecisionCollision}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              // Cleanup on drag cancel
              setActiveDropZone(null);
              setActiveDragId(null);
              prevOverIdRef.current = null;
              document.body.classList.remove('dragging-active');
            }}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
          >
            {/* Single unified SortableContext for all cards - enables cross-category dragging */}
            <SortableContext
              items={[
                ...currentCategoryOrder.map(id => `category-${id}`),
                ...visibleCards.map(c => c.id)
              ]}
              strategy={rectSortingStrategy}
            >
              <div className="space-y-10 sm:space-y-12" id="dashboard-wrapper">
                {currentCategoryOrder.map((categoryId) => {
                  const categoryCards = cardsByCategory[categoryId] || [];
                  // Also check custom categories that might be empty but should still render
                  const isCustomCategory = categoryId.startsWith('custom_');
                  const customCategoryData = customCategories.find(c => c.id === categoryId);
                  
                  // In edit mode, show ALL categories including empty ones for drop targets
                  // Outside edit mode, skip empty non-custom categories
                  if (categoryCards.length === 0 && !isCustomCategory && !isEditMode) return null;
                  
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
                        <div 
                          className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 auto-rows-fr items-stretch"
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
                              isBeingDragged={activeDragId === card.id}
                              onExitEditMode={() => setIsEditMode(false)}
                            />
                          ))}
                        </div>
                      ) : (
                        // Show drop zone for empty categories in edit mode
                        isEditMode && (
                          <EmptyCategoryDropZone 
                            categoryId={categoryId} 
                            isOver={activeDropZone === categoryId}
                          />
                        )
                      )}
                    </section>
                  );
                })}
              </div>
            </SortableContext>

            {/* DragOverlay - renders a floating copy with iOS spring animation */}
            <DragOverlay 
              dropAnimation={{
                duration: 300,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
              }}
              style={{ zIndex: 9999 }}
            >
              {activeDragId && (() => {
                const card = visibleCards.find(c => c.id === activeDragId);
                if (!card) return null;
                return (
                  <DragOverlayCard 
                    card={card} 
                    hasAccess={hasAccess(card.minPlan)} 
                  />
                );
              })()}
            </DragOverlay>
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