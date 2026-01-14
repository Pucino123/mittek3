import { forwardRef, useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, Eye, EyeOff, AlertTriangle, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { ToolDetailModal } from './ToolDetailModal';

interface PasswordHealthCardProps {
  isEditMode?: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

// SHA-1 hash function for k-anonymity check
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Check password against Have I Been Pwned API using k-anonymity
async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count: number }> {
  const hash = await sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' }
  });

  if (!response.ok) {
    throw new Error('Failed to check password');
  }

  const text = await response.text();
  const lines = text.split('\n');

  for (const line of lines) {
    const [hashSuffix, count] = line.split(':');
    if (hashSuffix.trim() === suffix) {
      return { breached: true, count: parseInt(count.trim(), 10) };
    }
  }

  return { breached: false, count: 0 };
}

export const PasswordHealthCard = forwardRef<HTMLDivElement, PasswordHealthCardProps>(
  ({ isEditMode, onRemove, isDragging, style, onExitEditMode }, ref) => {
    const [testPassword, setTestPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [breachResult, setBreachResult] = useState<{ breached: boolean; count: number } | null>(null);
    const [isCheckingBreach, setIsCheckingBreach] = useState(false);
    const [breachError, setBreachError] = useState<string | null>(null);

    // Track when edit mode started to prevent immediate exit
    const editModeStartRef = useRef<number>(0);
    const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (isEditMode) {
        editModeStartRef.current = Date.now();
      }
    }, [isEditMode]);

    // Auto-check password after typing stops (debounced)
    useEffect(() => {
      // Reset result when password changes
      setBreachResult(null);
      setBreachError(null);

      // Only check if password is at least 4 characters
      if (testPassword.length < 4) {
        return;
      }

      // Debounce the check
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      checkTimeoutRef.current = setTimeout(async () => {
        setIsCheckingBreach(true);
        try {
          const result = await checkPasswordBreach(testPassword);
          setBreachResult(result);
        } catch (error) {
          console.error('Failed to check breach:', error);
          setBreachError('Kunne ikke tjekke adgangskoden');
        } finally {
          setIsCheckingBreach(false);
        }
      }, 800);

      return () => {
        if (checkTimeoutRef.current) {
          clearTimeout(checkTimeoutRef.current);
        }
      };
    }, [testPassword]);

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

    // Simple strength calculation for status indicator
    const getOverallStatus = () => {
      if (!testPassword) return { color: 'bg-muted', textColor: 'text-muted-foreground', label: 'Ikke testet', status: 'neutral' };
      
      let score = 0;
      if (testPassword.length >= 8) score += 1;
      if (testPassword.length >= 12) score += 1;
      if (/[A-Z]/.test(testPassword)) score += 1;
      if (/[a-z]/.test(testPassword)) score += 1;
      if (/[0-9]/.test(testPassword)) score += 1;
      if (/[^a-zA-Z0-9]/.test(testPassword)) score += 1;

      if (score <= 2) return { color: 'bg-destructive', textColor: 'text-destructive', label: 'Svag', status: 'weak' };
      if (score <= 4) return { color: 'bg-warning', textColor: 'text-warning', label: 'OK', status: 'ok' };
      return { color: 'bg-success', textColor: 'text-success', label: 'Stærk', status: 'strong' };
    };

    const status = getOverallStatus();

    // Combined status considering breach result
    const getCombinedStatus = () => {
      if (breachResult?.breached) {
        return { color: 'bg-destructive', textColor: 'text-destructive', label: 'Lækket!', status: 'breached' };
      }
      return status;
    };

    const combinedStatus = getCombinedStatus();

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
              aria-label="Fjern Kode-sundhed"
            >
              <X className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Kode-sundhed</h3>
              <p className="text-xs text-muted-foreground">Test dine adgangskoder</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-2",
              combinedStatus.status === 'neutral' ? 'bg-muted' : `${combinedStatus.color}/10`
            )}>
              {combinedStatus.status === 'weak' || combinedStatus.status === 'breached' ? (
                <AlertTriangle className="h-8 w-8 text-destructive" />
              ) : combinedStatus.status === 'strong' ? (
                <CheckCircle className="h-8 w-8 text-success" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className={cn("text-sm font-medium", combinedStatus.textColor)}>{combinedStatus.label}</p>
          </div>

          {/* Action hint */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">Tryk for at teste →</span>
          </div>
        </div>

        {/* Detail Modal */}
        <ToolDetailModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title="Kode-sundhed"
          icon={ShieldCheck}
          iconColor="text-success"
        >
          <p className="text-sm text-muted-foreground">
            Test styrken af dine adgangskoder og tjek om de er blevet lækket i et databrud.
          </p>

          {/* Password test */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test en adgangskode</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Indtast en adgangskode..."
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {testPassword && (
                <div className="mt-2">
                  <PasswordStrengthIndicator password={testPassword} />
                </div>
              )}
            </div>

            {/* Strength indicator */}
            {testPassword && (
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-3",
                status.status === 'weak' ? 'bg-destructive/10' :
                status.status === 'ok' ? 'bg-warning/10' : 'bg-success/10'
              )}>
                {status.status === 'weak' ? (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                ) : status.status === 'strong' ? (
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-warning shrink-0" />
                )}
                <div>
                  <p className={cn("font-medium text-sm", status.textColor)}>
                    {status.status === 'weak' ? 'Svag adgangskode' :
                     status.status === 'ok' ? 'OK adgangskode' : 'Stærk adgangskode'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {status.status === 'weak' ? 'Tilføj store bogstaver, tal og specialtegn' :
                     status.status === 'ok' ? 'Tilføj flere tegn for bedre sikkerhed' : 'Godt arbejde! Denne kode er sikker'}
                  </p>
                </div>
              </div>
            )}

            {/* Breach check result */}
            {testPassword && testPassword.length >= 4 && (
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-3",
                isCheckingBreach ? 'bg-muted' :
                breachError ? 'bg-warning/10' :
                breachResult?.breached ? 'bg-destructive/10' : 'bg-success/10'
              )}>
                {isCheckingBreach ? (
                  <>
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Tjekker databrud...</p>
                      <p className="text-xs text-muted-foreground">Via Have I Been Pwned</p>
                    </div>
                  </>
                ) : breachError ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-warning">{breachError}</p>
                      <p className="text-xs text-muted-foreground">Prøv igen senere</p>
                    </div>
                  </>
                ) : breachResult?.breached ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-destructive">Adgangskode er lækket!</p>
                      <p className="text-xs text-muted-foreground">
                        Fundet {breachResult.count.toLocaleString('da-DK')} gange i databrud. Brug den ikke!
                      </p>
                    </div>
                  </>
                ) : breachResult ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-success">Ikke fundet i databrud</p>
                      <p className="text-xs text-muted-foreground">Denne adgangskode er ikke i kendte læk</p>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Privacy note */}
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Din adgangskode sendes aldrig til servere. Vi bruger k-anonymity via Have I Been Pwned's sikre API.
          </p>
        </ToolDetailModal>
      </>
    );
  }
);

PasswordHealthCard.displayName = 'PasswordHealthCard';
