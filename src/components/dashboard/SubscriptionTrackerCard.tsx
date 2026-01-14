import { forwardRef, useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    const [showInput, setShowInput] = useState(false);
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
      setShowInput(false);
    };

    const handleRemove = (id: string) => {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
    };

    const handleCardClick = (e: React.MouseEvent) => {
      if (isEditMode) {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input')) {
          e.preventDefault();
          e.stopPropagation();
          if (Date.now() - editModeStartRef.current < 400) return;
          onExitEditMode?.();
        }
      }
    };

    return (
      <div
        ref={ref}
        style={style}
        onClick={handleCardClick}
        className={cn(
          "card-interactive p-3 sm:p-4 flex flex-col relative h-full min-h-[180px] sm:min-h-[200px] md:min-h-[210px]",
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
            className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Abonnementer</h3>
        </div>

        {/* Subscription list */}
        <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px]">
          {subscriptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ingen abonnementer endnu</p>
          ) : (
            subscriptions.map(sub => (
              <div key={sub.id} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1">{sub.name}</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{sub.price} kr</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(sub.id);
                    }}
                    className="p-0.5 hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add new subscription */}
        {showInput ? (
          <div className="mt-2 space-y-1.5">
            <Input
              placeholder="Navn (f.eks. Netflix)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-7 text-xs"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="Pris/md"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="h-7 text-xs flex-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button size="sm" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); handleAdd(); }}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setShowInput(true); }}
            className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Tilføj abonnement
          </button>
        )}

        {/* Total */}
        <div className="mt-2 pt-2 border-t flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Total pr. måned</span>
          <span className="font-bold text-sm text-primary">{totalMonthly} kr</span>
        </div>
      </div>
    );
  }
);

SubscriptionTrackerCard.displayName = 'SubscriptionTrackerCard';
