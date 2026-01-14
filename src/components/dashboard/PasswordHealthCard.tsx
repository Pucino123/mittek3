import { forwardRef, useState, useEffect, useRef } from 'react';
import { ShieldCheck, ExternalLink, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';

interface PasswordHealthCardProps {
  isEditMode?: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

export const PasswordHealthCard = forwardRef<HTMLDivElement, PasswordHealthCardProps>(
  ({ isEditMode, onRemove, isDragging, style, onExitEditMode }, ref) => {
    const [testPassword, setTestPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Track when edit mode started to prevent immediate exit
    const editModeStartRef = useRef<number>(0);

    useEffect(() => {
      if (isEditMode) {
        editModeStartRef.current = Date.now();
      }
    }, [isEditMode]);

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

    const handleCheckBreach = () => {
      window.open('https://haveibeenpwned.com', '_blank', 'noopener,noreferrer');
    };

    // Simple strength calculation for status indicator
    const getOverallStatus = () => {
      if (!testPassword) return { color: 'bg-muted', label: 'Indtast kode', status: 'neutral' };
      
      let score = 0;
      if (testPassword.length >= 8) score += 1;
      if (testPassword.length >= 12) score += 1;
      if (/[A-Z]/.test(testPassword)) score += 1;
      if (/[a-z]/.test(testPassword)) score += 1;
      if (/[0-9]/.test(testPassword)) score += 1;
      if (/[^a-zA-Z0-9]/.test(testPassword)) score += 1;

      if (score <= 2) return { color: 'bg-destructive', label: 'Svag', status: 'weak' };
      if (score <= 4) return { color: 'bg-warning', label: 'OK', status: 'ok' };
      return { color: 'bg-success', label: 'Stærk', status: 'strong' };
    };

    const status = getOverallStatus();

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

        {/* Header with status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-success" />
            </div>
            <h3 className="font-semibold text-sm">Kode-sundhed</h3>
          </div>
          <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium text-white", status.color)}>
            {status.label}
          </div>
        </div>

        {/* Password test input */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Test en adgangskode
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Indtast kode..."
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="h-8 text-xs pr-8"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPassword(!showPassword);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          
          {testPassword && (
            <PasswordStrengthIndicator password={testPassword} />
          )}
        </div>

        {/* Breach check button */}
        <div className="mt-auto pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              handleCheckBreach();
            }}
          >
            <ExternalLink className="h-3 w-3" />
            Tjek om din mail er lækket
          </Button>
        </div>
      </div>
    );
  }
);

PasswordHealthCard.displayName = 'PasswordHealthCard';
