import { forwardRef, useState, useEffect, useRef } from 'react';
import { HeartHandshake, Save, Check, X, User, Phone, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ToolDetailModal } from './ToolDetailModal';

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
    const [saved, setSaved] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
      setTimeout(() => setSaved(false), 2000);
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
        setIsModalOpen(true);
      }
    };

    const hasData = data.contactName || data.contactPhone || data.instructions;
    const isComplete = data.contactName && data.contactPhone;

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
              aria-label="Fjern Digital Arv"
            >
              <X className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <HeartHandshake className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Digital Arv</h3>
              <p className="text-xs text-muted-foreground">Instrukser til pårørende</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 flex flex-col justify-center items-center">
            {hasData ? (
              <div className="text-center space-y-2">
                <div className={cn(
                  "w-12 h-12 mx-auto rounded-full flex items-center justify-center",
                  isComplete ? "bg-success/10" : "bg-warning/10"
                )}>
                  {isComplete ? (
                    <Check className="h-6 w-6 text-success" />
                  ) : (
                    <FileText className="h-6 w-6 text-warning" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{data.contactName || 'Ikke udfyldt'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isComplete ? 'Konfigureret' : 'Delvist udfyldt'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <HeartHandshake className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Ikke konfigureret</p>
              </div>
            )}
          </div>

          {/* Action hint */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              {hasData ? 'Tryk for at redigere →' : 'Tryk for at konfigurere →'}
            </span>
          </div>
        </div>

        {/* Detail Modal */}
        <ToolDetailModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title="Digital Arv"
          icon={HeartHandshake}
          iconColor="text-accent"
        >
          <p className="text-sm text-muted-foreground">
            Gem vigtige instrukser til dine pårørende, hvis noget skulle ske med dig.
          </p>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Betroet kontaktperson
              </label>
              <Input
                placeholder="Navn"
                value={data.contactName}
                onChange={(e) => setData(prev => ({ ...prev, contactName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefonnummer
              </label>
              <Input
                placeholder="Telefon"
                type="tel"
                value={data.contactPhone}
                onChange={(e) => setData(prev => ({ ...prev, contactPhone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Vigtige instrukser
              </label>
              <Textarea
                placeholder="Skriv instrukser til dine pårørende. F.eks. hvor de kan finde vigtige dokumenter, passwords, eller andre oplysninger de skal bruge..."
                value={data.instructions}
                onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
                className="min-h-[120px] resize-none"
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleSave}
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Gemt!' : 'Gem oplysninger'}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              🔒 Alle oplysninger gemmes kun lokalt på denne enhed
            </p>
          </div>
        </ToolDetailModal>
      </>
    );
  }
);

DigitalLegacyCard.displayName = 'DigitalLegacyCard';
