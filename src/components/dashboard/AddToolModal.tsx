import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, RotateCcw, FolderPlus, Lock, ArrowRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface HiddenCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  minPlan?: 'basic' | 'plus' | 'pro';
}

interface AddToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hiddenCards: HiddenCard[];
  onAddCard: (cardId: string) => void;
  onResetAll: () => void;
  onCreateCategory?: (categoryName: string) => void;
  currentPlan?: 'basic' | 'plus' | 'pro';
}

// Plan tier hierarchy for access checking
const PLAN_TIERS = { basic: 0, plus: 1, pro: 2 } as const;

// Plan descriptions for tooltips
const PLAN_DESCRIPTIONS: Record<string, string> = {
  plus: 'Plus-planen inkluderer Kode-mappe, Screenshot AI, Sikkerhedsskjold og Tryghedsknap.',
  pro: 'Pro-planen inkluderer alt fra Plus samt ubegrænset support og prioritet i køen.',
};

export function AddToolModal({ 
  open, 
  onOpenChange, 
  hiddenCards, 
  onAddCard,
  onResetAll,
  onCreateCategory,
  currentPlan = 'basic'
}: AddToolModalProps) {
  const navigate = useNavigate();
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Check if user has access to a tool based on their plan
  const hasAccess = (minPlan?: 'basic' | 'plus' | 'pro') => {
    if (!minPlan) return true;
    return PLAN_TIERS[currentPlan] >= PLAN_TIERS[minPlan];
  };

  // Get label for required plan
  const getPlanLabel = (minPlan: 'basic' | 'plus' | 'pro') => {
    return minPlan === 'plus' ? 'Plus' : minPlan === 'pro' ? 'Pro' : '';
  };

  // Sort cards: unlocked first, then locked
  const sortedCards = useMemo(() => {
    return [...hiddenCards].sort((a, b) => {
      const aLocked = !hasAccess(a.minPlan);
      const bLocked = !hasAccess(b.minPlan);
      if (aLocked === bLocked) return 0;
      return aLocked ? 1 : -1;
    });
  }, [hiddenCards, currentPlan]);

  // Separate unlocked and locked cards
  const unlockedCards = useMemo(() => sortedCards.filter(c => hasAccess(c.minPlan)), [sortedCards]);
  const lockedCards = useMemo(() => sortedCards.filter(c => !hasAccess(c.minPlan)), [sortedCards]);

  const handleCreateCategory = () => {
    if (newCategoryName.trim() && onCreateCategory) {
      onCreateCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    onOpenChange(false);
  };

  const handleUpgrade = () => {
    handleClose();
    navigate('/pricing');
  };

  const renderCard = (card: HiddenCard, isLocked: boolean) => {
    const requiredPlan = card.minPlan && card.minPlan !== 'basic' ? getPlanLabel(card.minPlan) : null;
    const planDescription = card.minPlan ? PLAN_DESCRIPTIONS[card.minPlan] : '';
    
    const cardContent = (
      <button
        key={card.id}
        onClick={() => {
          if (!isLocked) {
            onAddCard(card.id);
            if (hiddenCards.length === 1) {
              handleClose();
            }
          }
        }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
          isLocked ? 'opacity-60 cursor-default' : 'hover:bg-muted cursor-pointer'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center shrink-0 relative`}>
          <card.icon className="h-5 w-5" />
          {isLocked && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-muted-foreground rounded-full flex items-center justify-center">
              <Lock className="h-3 w-3 text-background" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium truncate ${isLocked ? 'text-muted-foreground' : ''}`}>{card.title}</p>
            {requiredPlan && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                {requiredPlan}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{card.description}</p>
        </div>
        <Plus className={`h-5 w-5 shrink-0 ${isLocked ? 'text-muted-foreground' : 'text-primary'}`} />
      </button>
    );

    if (isLocked && planDescription) {
      return (
        <Tooltip key={card.id}>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="left" align="center" className="max-w-[280px] p-3">
            <p className="text-sm mb-2">{planDescription}</p>
            <Button 
              size="sm" 
              variant="default" 
              className="w-full gap-1"
              onClick={(e) => {
                e.stopPropagation();
                handleUpgrade();
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
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Tilføj værktøj
          </DialogTitle>
          <DialogDescription>
            Vælg et værktøj at tilføje til dit dashboard
          </DialogDescription>
        </DialogHeader>

        {/* Create New Category Section */}
        {onCreateCategory && (
          <div className="border-b pb-4 mb-2">
            {showNewCategoryInput ? (
              <div className="space-y-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Kategori navn..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCategory();
                    if (e.key === 'Escape') {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1"
                  >
                    Opret
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                    }}
                    className="flex-1"
                  >
                    Annuller
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowNewCategoryInput(true)}
              >
                <FolderPlus className="h-4 w-4" />
                Opret ny kategori
              </Button>
            )}
          </div>
        )}

        {hiddenCards.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Alle værktøjer er allerede på dit dashboard
            </p>
            <Button variant="outline" onClick={handleClose}>
              Luk
            </Button>
          </div>
        ) : (
          <>
            <TooltipProvider delayDuration={300}>
              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-1 pr-4">
                  {/* Unlocked cards first */}
                  {unlockedCards.map((card) => renderCard(card, false))}
                  
                  {/* Divider if there are both unlocked and locked cards */}
                  {unlockedCards.length > 0 && lockedCards.length > 0 && (
                    <div className="flex items-center gap-2 py-2 px-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Kræver opgradering
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  
                  {/* Locked cards */}
                  {lockedCards.map((card) => renderCard(card, true))}
                </div>
              </ScrollArea>
            </TooltipProvider>

            <div className="pt-4 border-t space-y-3">
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Luk
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  onResetAll();
                  handleClose();
                }}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Gendan standard layout
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
