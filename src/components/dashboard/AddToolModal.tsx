import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, RotateCcw, FolderPlus, Lock } from 'lucide-react';
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

export function AddToolModal({ 
  open, 
  onOpenChange, 
  hiddenCards, 
  onAddCard,
  onResetAll,
  onCreateCategory,
  currentPlan = 'basic'
}: AddToolModalProps) {
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
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-2 pr-4">
                {hiddenCards.map((card) => {
                  const isLocked = !hasAccess(card.minPlan);
                  const requiredPlan = card.minPlan && card.minPlan !== 'basic' ? getPlanLabel(card.minPlan) : null;
                  
                  return (
                    <button
                      key={card.id}
                      onClick={() => {
                        onAddCard(card.id);
                        if (hiddenCards.length === 1) {
                          handleClose();
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
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
                })}
              </div>
            </ScrollArea>

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
