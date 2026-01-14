import { forwardRef, useState, useEffect, useRef } from 'react';
import { HeartHandshake, Save, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface LegacyData {
  contactName: string;
  contactPhone: string;
  instructions: string;
}

interface DigitalLegacyCardProps {
  isEditMode?: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

const STORAGE_KEY = 'mittek-digital-legacy';

export const DigitalLegacyCard = forwardRef<HTMLDivElement, DigitalLegacyCardProps>(
  ({ isEditMode, onRemove, isDragging, style, onExitEditMode }, ref) => {
    const [data, setData] = useState<LegacyData>({
      contactName: '',
      contactPhone: '',
      instructions: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [saved, setSaved] = useState(false);

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
          setData(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse legacy data', e);
        }
      }
    }, []);

    const handleSave = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    };

    const handleCardClick = (e: React.MouseEvent) => {
      if (isEditMode) {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input') && !target.closest('textarea')) {
          e.preventDefault();
          e.stopPropagation();
          if (Date.now() - editModeStartRef.current < 400) return;
          onExitEditMode?.();
        }
      }
    };

    const hasData = data.contactName || data.contactPhone || data.instructions;

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <HeartHandshake className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-semibold text-sm">Digital Arv</h3>
          </div>
          {hasData && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              Rediger
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isEditing || !hasData ? (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Betroet kontakt
                </label>
                <Input
                  placeholder="Navn"
                  value={data.contactName}
                  onChange={(e) => setData(prev => ({ ...prev, contactName: e.target.value }))}
                  className="h-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <Input
                placeholder="Telefon"
                value={data.contactPhone}
                onChange={(e) => setData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="h-7 text-xs"
                onClick={(e) => e.stopPropagation()}
              />
              <Textarea
                placeholder="Vigtige instrukser til dine pårørende..."
                value={data.instructions}
                onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
                className="text-xs min-h-[50px] resize-none"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                className="w-full h-7 text-xs gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
              >
                {saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
                {saved ? 'Gemt!' : 'Gem'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Kontakt: </span>
                <span className="font-medium">{data.contactName}</span>
                {data.contactPhone && (
                  <span className="text-muted-foreground"> ({data.contactPhone})</span>
                )}
              </div>
              {data.instructions && (
                <p className="text-muted-foreground line-clamp-3">{data.instructions}</p>
              )}
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
          🔒 Kun gemt lokalt på denne enhed
        </p>
      </div>
    );
  }
);

DigitalLegacyCard.displayName = 'DigitalLegacyCard';
