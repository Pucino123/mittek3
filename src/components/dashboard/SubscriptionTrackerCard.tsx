import { forwardRef, useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolDetailModal } from './ToolDetailModal';

interface Subscription {
  id: string;
  name: string;
  price: number;
}

interface SubscriptionTrackerCardProps {
  isEditMode?: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

const STORAGE_KEY = 'mittek-subscriptions';

export const SubscriptionTrackerCard = forwardRef<HTMLDivElement, SubscriptionTrackerCardProps>(
  ({ isEditMode, onRemove, isDragging, style, onExitEditMode }, ref) => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');

    // Track when edit mode started to prevent immediate exit
    const editModeStartRef = useRef<number>(0);

    useEffect(() => {
      if (isEditMode) {
        editModeStartRef.current = Date.now();
      }
    }, [isEditMode]);

    // Load from localStorage
    useEffect(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSubscriptions(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse subscriptions', e);
        }
      }
    }, []);

    // Save to localStorage
    useEffect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    }, [subscriptions]);

    const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

    const handleAdd = () => {
      if (!newName.trim() || !newPrice) return;
      const price = parseFloat(newPrice);
      if (isNaN(price) || price <= 0) return;
      
      setSubscriptions(prev => [
        ...prev,
        { id: crypto.randomUUID(), name: newName.trim(), price }
      ]);
      setNewName('');
      setNewPrice('');
    };

    const handleRemove = (id: string) => {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
    };

    const handleCardClick = (e: React.MouseEvent) => {
      if (isEditMode) {
        const target = e.target as HTMLElement;
        if (!target.closest('button')) {
          e.preventDefault();
          e.stopPropagation();
          if (Date.now() - editModeStartRef.current < 400) return;
          onExitEditMode?.();
        }
      } else {
        // Open modal when not in edit mode
        setIsModalOpen(true);
      }
    };

    return (
      <>
        {/* Dashboard Card (Summary View) */}
        <div
          ref={ref}
          style={style}
          onClick={handleCardClick}
          className={cn(
            "card-interactive p-3 sm:p-4 flex flex-col relative h-full min-h-[180px] sm:min-h-[200px] md:min-h-[210px] cursor-pointer",
            isEditMode && "animate-wiggle cursor-grab",
            isDragging && "opacity-50"
          )}
        >
          {/* Remove button in edit mode */}
          {isEditMode && onRemove && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="absolute -top-2 -left-2 z-10 flex items-center justify-center bg-muted text-muted-foreground rounded-full shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
              style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', flexShrink: 0 }}
              aria-label="Fjern Abonnementer"
            >
              <X className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Abonnementer</h3>
              <p className="text-xs text-muted-foreground">Hold styr på udgifter</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalMonthly} kr</p>
              <p className="text-xs text-muted-foreground">pr. måned</p>
            </div>
            {subscriptions.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {subscriptions.length} abonnement{subscriptions.length !== 1 ? 'er' : ''}
              </p>
            )}
          </div>

          {/* Action hint */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">Tryk for at redigere →</span>
          </div>
        </div>

        {/* Detail Modal */}
        <ToolDetailModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title="Abonnements-overblik"
          icon={CreditCard}
          iconColor="text-primary"
        >
          {/* Subscription list */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen abonnementer tilføjet endnu
              </p>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{sub.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{sub.price} kr/md</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(sub.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add new subscription */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm">Tilføj nyt abonnement</h4>
            <Input
              placeholder="Navn (f.eks. Netflix, Spotify)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Pris pr. måned"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1"
              />
              <Button onClick={handleAdd} disabled={!newName.trim() || !newPrice}>
                <Plus className="h-4 w-4 mr-1" />
                Tilføj
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t flex justify-between items-center">
            <span className="text-muted-foreground">Total pr. måned</span>
            <span className="text-2xl font-bold text-primary">{totalMonthly} kr</span>
          </div>
        </ToolDetailModal>
      </>
    );
  }
);

SubscriptionTrackerCard.displayName = 'SubscriptionTrackerCard';
