import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Plus, 
  Lock, 
  ArrowRight, 
  FolderPlus,
  Sparkles,
  Shield,
  Wrench,
  Heart,
  Zap,
  Grid3X3,
  RotateCcw,
  GripVertical,
  Layers,
  Save,
  Undo2,
  LucideIcon
} from 'lucide-react';

interface HiddenCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  minPlan?: 'basic' | 'plus' | 'pro';
  addedDate?: string;
  category?: string;
}

interface CategoryItem {
  id: string;
  title: string;
  cardIds: string[];
}

interface AppStoreToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hiddenCards: HiddenCard[];
  onAddCard: (cardId: string) => void;
  onResetAll: () => void;
  onCreateCategory?: (categoryName: string) => void;
  currentPlan?: 'basic' | 'plus' | 'pro';
  // Live dashboard builder props
  dashboardCategories?: CategoryItem[];
  onReorderCategories?: (categories: CategoryItem[]) => void;
  onRemoveFromDashboard?: (cardId: string) => void;
  allCardDefinitions?: HiddenCard[];
  onRenameCategory?: (categoryId: string, newTitle: string) => void;
  onAddToCategory?: (cardId: string, categoryId: string) => void;
  onReorderCardsInCategory?: (categoryId: string, cardIds: string[]) => void;
  onSaveLayout?: () => void;
  onMoveCardToCategory?: (cardId: string, fromCategoryId: string, toCategoryId: string) => void;
}

const PLAN_TIERS = { basic: 0, plus: 1, pro: 2 } as const;

const PLAN_DESCRIPTIONS: Record<string, string> = {
  plus: 'Plus-planen inkluderer Kode-mappe, Screenshot AI, Sikkerhedsskjold og Tryghedsknap.',
  pro: 'Pro-planen inkluderer alt fra Plus samt ubegrænset support og prioritet i køen.',
};

// Category definitions with icons
const CATEGORIES = [
  { id: 'all', label: 'Alle', icon: Grid3X3 },
  { id: 'sikkerhed', label: 'Sikkerhed', icon: Shield },
  { id: 'værktøjer', label: 'Værktøjer', icon: Wrench },
  { id: 'sundhed', label: 'Sundhed', icon: Heart },
  { id: 'produktivitet', label: 'Produktivitet', icon: Zap },
  { id: 'ny', label: 'Nye', icon: Sparkles },
];

// Smart categorization helper - maps keywords to categories
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  sikkerhed: ['health', 'sundhed', 'defender', 'lock', 'lås', 'sikker', 'shield', 'skjold', 'kode', 'password', 'hacket', 'scam', 'svindel', 'tryghed', 'panic'],
  værktøjer: ['generator', 'batteri', 'battery', 'oprydning', 'cleaning', 'hardware', 'ordbog', 'dictionary', 'noter', 'notes', 'speedtest', 'hastighed', 'wifi'],
  sundhed: ['medical', 'nød', 'id', 'heart', 'hjerte'],
  produktivitet: ['abonnement', 'subscription', 'tracker', 'overblik', 'arv', 'legacy'],
};

// Get category for a tool based on name/title keywords
function getCategoryForTool(tool: { title: string; category?: string }): string {
  const titleLower = tool.title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => titleLower.includes(kw))) {
      return category;
    }
  }
  
  // Fallback to the tool's original category or 'all'
  return tool.category?.toLowerCase() || 'all';
}

// Animated mini card within a category
function SortableMiniCard({
  card,
  onRemove,
}: {
  card: HiddenCard;
  onRemove?: (cardId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `mini-${card.id}`,
    data: { type: 'mini-card', cardId: card.id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        e.stopPropagation();
        if (onRemove) onRemove(card.id);
      }}
      className={`w-8 h-8 aspect-square rounded-lg flex items-center justify-center border cursor-pointer transition-all ${
        isDragging 
          ? 'opacity-30 border-dashed border-primary/50 bg-primary/5' 
          : 'bg-muted/60 border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive'
      }`}
      title={`${card.title} - Klik for at fjerne`}
    >
      <card.icon className={`h-4 w-4 ${isDragging ? 'opacity-50' : ''}`} />
    </motion.div>
  );
}

// Droppable category item with inline editing and sortable cards
function DroppableCategoryItem({ 
  category, 
  allCards, 
  onRemoveCard,
  onRename,
  onReorderCards,
  isOver 
}: { 
  category: CategoryItem; 
  allCards: HiddenCard[];
  onRemoveCard?: (cardId: string) => void;
  onRename?: (categoryId: string, newTitle: string) => void;
  onReorderCards?: (categoryId: string, cardIds: string[]) => void;
  isOver?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(category.title);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  // Droppable for receiving tools
  const { setNodeRef: setDroppableRef, isOver: isOverDrop } = useDroppable({
    id: `category-drop-${category.id}`,
    data: { type: 'category', categoryId: category.id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get card info for display
  const categoryCards = category.cardIds
    .map(id => allCards.find(c => c.id === id))
    .filter(Boolean) as HiddenCard[];

  const handleTitleClick = () => {
    if (onRename) {
      setEditValue(category.title);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (onRename && editValue.trim()) {
      onRename(category.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(category.title);
      setIsEditing(false);
    }
  };

  // Combine refs
  const setRefs = (node: HTMLDivElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  // Sortable IDs for cards in this category
  const cardSortableIds = categoryCards.map(c => `mini-${c.id}`);

  return (
    <div
      ref={setRefs}
      style={style}
      className={`bg-card border rounded-lg p-2 mb-2 transition-colors ${
        isOver || isOverDrop ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded shrink-0"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 text-xs font-medium bg-transparent border-b border-primary outline-none px-0.5"
          />
        ) : (
          <span 
            className="text-xs font-medium truncate flex-1 cursor-pointer hover:text-primary transition-colors"
            onClick={handleTitleClick}
            title="Klik for at omdøbe"
          >
            {category.title}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground shrink-0">{categoryCards.length}</span>
      </div>
      
      {/* Sortable grid of tool cards with AnimatePresence */}
      {categoryCards.length > 0 && (
        <div className="flex flex-row flex-wrap gap-1 mt-1 pl-4">
          <SortableContext items={cardSortableIds} strategy={rectSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {categoryCards.map((card) => (
                <SortableMiniCard
                  key={card.id}
                  card={card}
                  onRemove={onRemoveCard}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </div>
      )}

      {/* Drop hint when empty */}
      {categoryCards.length === 0 && (
        <div className="pl-4 py-2">
          <span className="text-[10px] text-muted-foreground italic">Træk værktøjer hertil</span>
        </div>
      )}
    </div>
  );
}

// Draggable tool card for the main grid
function DraggableToolCard({ 
  card, 
  isLocked,
  requiredPlan,
  isNew,
  onAddCard,
  onUpgrade,
  planDescription
}: {
  card: HiddenCard;
  isLocked: boolean;
  requiredPlan: string | null;
  isNew: boolean;
  onAddCard: () => void;
  onUpgrade: () => void;
  planDescription: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ 
    id: `tool-${card.id}`,
    data: { type: 'tool', cardId: card.id },
    disabled: isLocked
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const cardContent = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isLocked) {
          onAddCard();
        }
      }}
      className={`group relative bg-card border border-border rounded-2xl p-4 transition-all duration-200 ${
        isLocked 
          ? 'opacity-60 cursor-default' 
          : isDragging
            ? 'cursor-grabbing shadow-xl scale-105'
            : 'hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] cursor-grab'
      }`}
    >
      {/* New badge */}
      {isNew && !isLocked && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="text-xs px-2 py-0.5 rounded-full bg-success text-success-foreground font-medium animate-pulse">
            Ny!
          </span>
        </div>
      )}

      {/* Lock badge */}
      {isLocked && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="w-6 h-6 bg-muted-foreground rounded-full flex items-center justify-center">
            <Lock className="h-3 w-3 text-background" />
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
        <card.icon className="h-7 w-7" />
      </div>

      {/* Content */}
      <h3 className={`font-semibold text-sm mb-1 ${isLocked ? 'text-muted-foreground' : ''}`}>
        {card.title}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {card.description}
      </p>

      {/* Action */}
      <div className="flex items-center justify-between">
        {requiredPlan ? (
          <span className={`text-xs px-2 py-0.5 rounded-full ${isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
            {requiredPlan}
          </span>
        ) : (
          <span />
        )}
        <Button 
          variant={isLocked ? "ghost" : "default"} 
          size="sm" 
          className={`h-7 px-3 text-xs ${isLocked ? 'pointer-events-none' : ''}`}
          disabled={isLocked}
        >
          {isLocked ? 'Låst' : 'Tilføj'}
        </Button>
      </div>
    </div>
  );

  if (isLocked && planDescription) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {cardContent}
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-[280px] p-3">
          <p className="text-sm mb-2">{planDescription}</p>
          <Button 
            size="sm" 
            variant="default" 
            className="w-full gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onUpgrade();
            }}
          >
            Opgrader nu
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}

export function AppStoreToolModal({ 
  open, 
  onOpenChange, 
  hiddenCards, 
  onAddCard,
  onResetAll,
  onCreateCategory,
  currentPlan = 'basic',
  dashboardCategories = [],
  onReorderCategories,
  onRemoveFromDashboard,
  allCardDefinitions = [],
  onRenameCategory,
  onAddToCategory,
  onReorderCardsInCategory,
  onSaveLayout,
  onMoveCardToCategory
}: AppStoreToolModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Active drag item for DragOverlay
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<'tool' | 'mini-card' | null>(null);
  
  // Undo history stack
  const historyRef = useRef<CategoryItem[][]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Define handleClose and handleSaveLayout before useEffect
  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setActiveDragId(null);
    setActiveDragType(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSaveLayout = useCallback(() => {
    if (onSaveLayout) {
      onSaveLayout();
    }
    toast.success('Layout gemt', {
      description: 'Dit dashboard layout er blevet gemt.',
    });
  }, [onSaveLayout]);

  // Undo to previous state
  const handleUndo = useCallback(() => {
    if (historyRef.current.length > 0 && onReorderCategories) {
      const previousState = historyRef.current.pop();
      if (previousState) {
        onReorderCategories(previousState);
        toast.info('Handling fortrudt');
      }
      setCanUndo(historyRef.current.length > 0);
    }
  }, [onReorderCategories]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape - close modal
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      
      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      
      // Enter - Save layout (only when not in input)
      if (e.key === 'Enter' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        handleSaveLayout();
        return;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose, handleUndo, handleSaveLayout]);

  // Save current state to history before making changes
  const saveToHistory = useCallback(() => {
    if (dashboardCategories.length > 0) {
      historyRef.current.push(JSON.parse(JSON.stringify(dashboardCategories)));
      // Keep max 20 history states
      if (historyRef.current.length > 20) {
        historyRef.current.shift();
      }
      setCanUndo(true);
    }
  }, [dashboardCategories]);

  // DnD sensors for dashboard builder
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start - store active item for overlay
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    setActiveDragId(activeData?.cardId || active.id.toString());
    setActiveDragType(activeData?.type || null);
  }, []);

  // Handle drag end - clear overlay
  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
    setActiveDragType(null);
  }, []);

  const hasAccess = (minPlan?: 'basic' | 'plus' | 'pro') => {
    if (!minPlan) return true;
    return PLAN_TIERS[currentPlan] >= PLAN_TIERS[minPlan];
  };

  const getPlanLabel = (minPlan: 'basic' | 'plus' | 'pro') => {
    return minPlan === 'plus' ? 'Plus' : minPlan === 'pro' ? 'Pro' : '';
  };

  const isNewTool = (addedDate?: string) => {
    if (!addedDate) return false;
    const added = new Date(addedDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - added.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Filter and sort cards using smart categorization
  const filteredCards = useMemo(() => {
    let cards = [...hiddenCards];

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(card => 
        card.title.toLowerCase().includes(query) || 
        card.description.toLowerCase().includes(query)
      );
    }

    // Filter by category using smart keyword matching
    if (selectedCategory === 'ny') {
      cards = cards.filter(card => isNewTool(card.addedDate));
    } else if (selectedCategory !== 'all') {
      cards = cards.filter(card => {
        const smartCategory = getCategoryForTool(card);
        return smartCategory === selectedCategory.toLowerCase();
      });
    }

    // Sort: unlocked first, then locked
    return cards.sort((a, b) => {
      const aLocked = !hasAccess(a.minPlan);
      const bLocked = !hasAccess(b.minPlan);
      if (aLocked === bLocked) return 0;
      return aLocked ? 1 : -1;
    });
  }, [hiddenCards, searchQuery, selectedCategory, currentPlan]);

  // Handle drag end for category reorder, tool dropping, and card reordering within categories
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Save to history before any change
    saveToHistory();

    // Mini-card reordering within same category
    if (activeData?.type === 'mini-card' && overData?.type === 'mini-card') {
      const activeCardId = activeData.cardId;
      const overCardId = overData.cardId;
      
      // Find which category contains these cards
      for (const cat of dashboardCategories) {
        const activeIdx = cat.cardIds.indexOf(activeCardId);
        const overIdx = cat.cardIds.indexOf(overCardId);
        
        if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
          const newCardIds = arrayMove(cat.cardIds, activeIdx, overIdx);
          if (onReorderCardsInCategory) {
            onReorderCardsInCategory(cat.id, newCardIds);
          }
          return;
        }
      }
      return;
    }

    // Mini-card dropped on a different category (cross-category move)
    if (activeData?.type === 'mini-card' && overId.startsWith('category-drop-')) {
      const targetCategoryId = overId.replace('category-drop-', '');
      const cardId = activeData.cardId;
      
      // Find source category
      const sourceCat = dashboardCategories.find(c => c.cardIds.includes(cardId));
      if (sourceCat && sourceCat.id !== targetCategoryId) {
        // Use onMoveCardToCategory if available, otherwise fallback
        if (onMoveCardToCategory) {
          onMoveCardToCategory(cardId, sourceCat.id, targetCategoryId);
        } else if (onRemoveFromDashboard && onAddToCategory) {
          onRemoveFromDashboard(cardId);
          onAddToCategory(cardId, targetCategoryId);
        }
      } else if (!sourceCat && onAddToCategory) {
        // Card from toolbox dropped on category
        onAddToCategory(cardId, targetCategoryId);
      }
      return;
    }

    // Tool dropped on category
    if (activeData?.type === 'tool' && overId.startsWith('category-drop-')) {
      const categoryId = overId.replace('category-drop-', '');
      const cardId = activeData.cardId;
      
      if (onAddToCategory) {
        onAddToCategory(cardId, categoryId);
      } else {
        // Fallback: just add the card
        onAddCard(cardId);
      }
      return;
    }

    // Category reorder
    if (active.id !== over.id && onReorderCategories && !activeId.startsWith('mini-') && !activeId.startsWith('tool-')) {
      const oldIndex = dashboardCategories.findIndex((c) => c.id === active.id);
      const newIndex = dashboardCategories.findIndex((c) => c.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(dashboardCategories, oldIndex, newIndex);
        onReorderCategories(reordered);
      }
    }
    
    // Clear drag overlay state
    setActiveDragId(null);
    setActiveDragType(null);
  }, [dashboardCategories, onReorderCategories, onAddToCategory, onAddCard, onReorderCardsInCategory, onRemoveFromDashboard, onMoveCardToCategory, saveToHistory]);

  const handleUpgrade = () => {
    handleClose();
    navigate('/pricing');
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim() && onCreateCategory) {
      onCreateCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    }
  };

  // All cards for lookup (both hidden and visible - using allCardDefinitions for full lookup)
  const allCardsLookup = useMemo(() => {
    const combined = new Map<string, HiddenCard>();
    // First add all card definitions from dashboard (includes visible cards)
    allCardDefinitions.forEach(c => combined.set(c.id, c));
    // Then add hidden cards (may overlap, that's fine)
    hiddenCards.forEach(c => combined.set(c.id, c));
    return combined;
  }, [hiddenCards, allCardDefinitions]);

  // Create sortable items for tools
  const toolSortableIds = useMemo(() => 
    filteredCards.map(card => `tool-${card.id}`),
  [filteredCards]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden">
        <TooltipProvider delayDuration={300}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex h-full">
              {/* Sidebar - Categories + Dashboard Layout */}
              <div className="w-52 md:w-60 border-r border-border bg-muted/30 flex flex-col">
                {/* Header */}
                <div className="p-3 border-b border-border">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Værktøjer
                  </h2>
                </div>

                {/* Category list */}
                <div className="p-2 space-y-0.5 border-b border-border">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Dashboard Layout Mini-Map - HIGHER UP, immediately after categories */}
                {dashboardCategories.length > 0 && onReorderCategories && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-2 pt-2 pb-1">
                      <h4 className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 px-1">
                        <Layers className="h-3 w-3" />
                        Dashboard Layout
                      </h4>
                    </div>
                    <ScrollArea className="flex-1 px-2">
                      <SortableContext
                        items={dashboardCategories.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {dashboardCategories.map((category) => (
                          <DroppableCategoryItem
                            key={category.id}
                            category={category}
                            allCards={Array.from(allCardsLookup.values())}
                            onRemoveCard={onRemoveFromDashboard}
                            onRename={onRenameCategory}
                            onReorderCards={onReorderCardsInCategory}
                          />
                        ))}
                      </SortableContext>
                    </ScrollArea>
                    <div className="px-2 py-1 text-[9px] text-muted-foreground text-center">
                      Træk værktøjer til kategorier
                    </div>
                  </div>
                )}

                {/* Footer actions */}
                <div className="p-2 border-t border-border space-y-1.5 mt-auto">
                  {/* Undo Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2 h-8 text-xs"
                    onClick={handleUndo}
                    disabled={!canUndo}
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Fortryd
                  </Button>
                  
                  {/* Save Layout Button */}
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full justify-center gap-2 h-8 text-xs"
                    onClick={handleSaveLayout}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Gem layout
                  </Button>

                  {onCreateCategory && (
                    <>
                      {showNewCategoryInput ? (
                        <div className="space-y-1.5">
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Navn..."
                            className="h-7 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateCategory();
                              if (e.key === 'Escape') {
                                setShowNewCategoryInput(false);
                                setNewCategoryName('');
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <Button size="sm" className="flex-1 h-6 text-xs" onClick={handleCreateCategory}>
                              Opret
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 px-2"
                              onClick={() => {
                                setShowNewCategoryInput(false);
                                setNewCategoryName('');
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 h-7 text-xs"
                          onClick={() => setShowNewCategoryInput(true)}
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                          Ny kategori
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      onResetAll();
                      handleClose();
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Nulstil layout
                  </Button>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar with search */}
                <div className="p-4 border-b border-border flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Søg i værktøjer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Tools grid */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {filteredCards.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-2">Ingen værktøjer fundet</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery 
                            ? `Ingen resultater for "${searchQuery}"`
                            : 'Alle værktøjer er allerede på dit dashboard'
                          }
                        </p>
                      </div>
                    ) : (
                      <SortableContext items={toolSortableIds}>
                        <div className="grid grid-cols-3 gap-4">
                          {filteredCards.map(card => {
                            const isLocked = !hasAccess(card.minPlan);
                            const requiredPlan = card.minPlan && card.minPlan !== 'basic' ? getPlanLabel(card.minPlan) : null;
                            const planDescription = card.minPlan ? PLAN_DESCRIPTIONS[card.minPlan] : '';
                            const isNew = isNewTool(card.addedDate);

                            return (
                              <DraggableToolCard
                                key={card.id}
                                card={card}
                                isLocked={isLocked}
                                requiredPlan={requiredPlan}
                                isNew={isNew}
                                onAddCard={() => {
                                  onAddCard(card.id);
                                  if (hiddenCards.length === 1) handleClose();
                                }}
                                onUpgrade={handleUpgrade}
                                planDescription={planDescription}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            {/* Drag Overlay - Portal rendered ghost that follows cursor */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
              <DragOverlay 
                dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
                modifiers={[]}
                zIndex={99999}
              >
                {activeDragId && activeDragType ? (
                  <div className="bg-card border-2 border-primary shadow-2xl rounded-xl p-3 flex items-center gap-3 opacity-95 pointer-events-none" style={{ minWidth: '160px' }}>
                    {(() => {
                      const card = allCardsLookup.get(activeDragId);
                      if (!card) return <span className="text-sm">Træk...</span>;
                      return (
                        <>
                          <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center shrink-0`}>
                            <card.icon className="h-5 w-5" />
                          </div>
                          <span className="font-semibold text-sm truncate max-w-[140px]">{card.title}</span>
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
