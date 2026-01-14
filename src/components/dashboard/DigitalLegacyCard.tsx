import { forwardRef, useState, useEffect, useRef } from 'react';
import { HeartHandshake, Save, Check, X, User, Phone, FileText, Key, Send, Loader2, Mail, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ToolDetailModal } from './ToolDetailModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface LegacyData {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  instructions: string;
  codeSentAt?: string;
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
    const { user } = useAuth();
    const [data, setData] = useState<LegacyData>({
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      instructions: ''
    });
    const [accessCode, setAccessCode] = useState('');
    const [saved, setSaved] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showSendForm, setShowSendForm] = useState(false);
    
    // Security: Track if code is already set (locked)
    const [isCodeLocked, setIsCodeLocked] = useState(false);
    const [isCheckingCodeStatus, setIsCheckingCodeStatus] = useState(true);

    // Track when edit mode started to prevent immediate exit
    const editModeStartRef = useRef<number>(0);

    useEffect(() => {
      if (isEditMode) {
        editModeStartRef.current = Date.now();
      }
    }, [isEditMode]);

    // Check if legacy code is already set in the database (read-only check)
    useEffect(() => {
      const checkCodeStatus = async () => {
        if (!user) {
          setIsCheckingCodeStatus(false);
          return;
        }

        try {
          // Only fetch whether the code exists, NOT the code itself
          const { data: profile } = await supabase
            .from('profiles')
            .select('legacy_access_code_hash, legacy_access_code_sent_at')
            .eq('user_id', user.id)
            .single();

          if (profile?.legacy_access_code_hash) {
            setIsCodeLocked(true);
            // Update local data with sent timestamp if available
            if (profile.legacy_access_code_sent_at) {
              setData(prev => ({
                ...prev,
                codeSentAt: profile.legacy_access_code_sent_at
              }));
            }
          }
        } catch (error) {
          console.error('Error checking code status:', error);
        } finally {
          setIsCheckingCodeStatus(false);
        }
      };

      checkCodeStatus();
    }, [user]);

    // Load from localStorage
    useEffect(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setData(prev => ({
            contactName: parsed.contactName || prev.contactName || '',
            contactPhone: parsed.contactPhone || '',
            contactEmail: parsed.contactEmail || '',
            instructions: parsed.instructions || '',
            codeSentAt: prev.codeSentAt || parsed.codeSentAt
          }));
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

    const handleSendCode = async () => {
      if (!user) {
        toast.error('Du skal være logget ind');
        return;
      }

      // Double-check that code is not already locked
      if (isCodeLocked) {
        toast.error('Koden er allerede sat og kan ikke ændres');
        return;
      }
      
      if (!accessCode || accessCode.length < 6) {
        toast.error('Adgangskoden skal være mindst 6 tegn');
        return;
      }
      
      if (!data.contactName || !data.contactEmail) {
        toast.error('Udfyld kontaktpersons navn og email først');
        return;
      }

      setIsSending(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Ikke logget ind');
        }

        // Fetch current vault items to include in backup
        const vaultItemsRaw = localStorage.getItem('mittek-vault-items-cache');
        let vaultItems: Array<{ title: string; secret: string; note?: string }> = [];
        
        if (vaultItemsRaw) {
          try {
            vaultItems = JSON.parse(vaultItemsRaw);
          } catch (e) {
            console.log('No cached vault items');
          }
        }

        const { data: result, error } = await supabase.functions.invoke('send-legacy-code', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            access_code: accessCode,
            contact_name: data.contactName,
            contact_email: data.contactEmail,
            instructions: data.instructions,
            vault_items: vaultItems.length > 0 ? vaultItems : undefined,
          },
        });

        if (error) throw error;

        // Mark code as locked - it can never be changed again
        setIsCodeLocked(true);

        // Update local data with sent timestamp
        const sentAt = new Date().toISOString();
        const updatedData = { ...data, codeSentAt: sentAt };
        setData(updatedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

        toast.success('Adgangskode sendt og låst!', {
          description: `Koden er sendt til ${data.contactEmail} og kan ikke ændres.`,
        });

        setAccessCode('');
        setShowSendForm(false);
      } catch (error: any) {
        console.error('Send error:', error);
        toast.error('Kunne ikke sende koden', {
          description: error.message || 'Prøv igen senere',
        });
      } finally {
        setIsSending(false);
      }
    };

    // Resend the existing code email (code is already in DB, we just trigger a new email)
    const handleResendEmail = async () => {
      if (!user) {
        toast.error('Du skal være logget ind');
        return;
      }
      
      if (!data.contactName || !data.contactEmail) {
        toast.error('Udfyld kontaktpersons navn og email først');
        return;
      }

      setIsResending(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Ikke logget ind');
        }

        const { error } = await supabase.functions.invoke('send-legacy-code', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            resend_only: true,
            contact_name: data.contactName,
            contact_email: data.contactEmail,
            instructions: data.instructions,
          },
        });

        if (error) throw error;

        // Update sent timestamp
        const sentAt = new Date().toISOString();
        const updatedData = { ...data, codeSentAt: sentAt };
        setData(updatedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

        toast.success('Email gensendt!', {
          description: `Koden er sendt igen til ${data.contactEmail}.`,
        });
      } catch (error: any) {
        console.error('Resend error:', error);
        toast.error('Kunne ikke gensende emailen', {
          description: error.message || 'Prøv igen senere',
        });
      } finally {
        setIsResending(false);
      }
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

    const hasData = data.contactName || data.contactPhone || data.contactEmail || data.instructions;
    const isComplete = data.contactName && data.contactEmail && isCodeLocked;

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
              <div className="text-center space-y-1">
                <div className={cn(
                  "w-12 h-12 mx-auto rounded-full flex items-center justify-center",
                  isComplete ? "bg-success/10" : "bg-warning/10"
                )}>
                  {isComplete ? (
                    <Lock className="h-6 w-6 text-success" />
                  ) : (
                    <FileText className="h-6 w-6 text-warning" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{data.contactName || 'Ikke udfyldt'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isCodeLocked ? 'Kode låst ✓' : 'Kode ikke sendt'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-1">
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
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </label>
              <Input
                placeholder="kontakt@email.dk"
                type="email"
                value={data.contactEmail}
                onChange={(e) => setData(prev => ({ ...prev, contactEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefonnummer (valgfrit)
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
                placeholder="Skriv instrukser til dine pårørende. F.eks. hvor de kan finde vigtige dokumenter eller andre oplysninger de skal bruge..."
                value={data.instructions}
                onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
                className="min-h-[80px] resize-none"
              />
            </div>

            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={handleSave}
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Gemt!' : 'Gem oplysninger'}
            </Button>

            {/* Send Code Section */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Hemmelig adgangskode</h4>
                </div>
                {isCodeLocked && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-0">
                    <Lock className="h-3 w-3 mr-1" />
                    Låst
                  </Badge>
                )}
              </div>

              {isCheckingCodeStatus ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tjekker status...
                </div>
              ) : isCodeLocked ? (
                // Code is already set and locked - show locked status with resend option
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-success bg-success/10 p-3 rounded-lg">
                    <Lock className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Kode er sat og låst</p>
                      <p className="text-xs text-success/80">
                        {data.codeSentAt 
                          ? `Sendt ${new Date(data.codeSentAt).toLocaleDateString('da-DK')}`
                          : 'Koden kan ikke ændres eller ses'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Resend email button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleResendEmail}
                    disabled={isResending || !data.contactEmail}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sender...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Gensend email til {data.contactEmail || 'modtager'}
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    🔒 Din hemmelige kode er sikkert gemt. Du kan gensende emailen til modtageren hvis de har mistet den.
                  </p>
                </div>
              ) : (
                // Code not yet set - show input form
                <>
                  <p className="text-sm text-muted-foreground">
                    Opret en hemmelig kode til din kontaktperson. Koden bruges til at få adgang til din Kode-mappe.
                  </p>

                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-warning">
                      <p className="font-medium">Vigtigt: Engangskode</p>
                      <p>Når du sender koden, kan den IKKE ændres. Vælg koden med omhu.</p>
                    </div>
                  </div>

                  {showSendForm ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Input
                          placeholder="Vælg en hemmelig kode (min. 6 tegn)"
                          type="password"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value.slice(0, 30))}
                          className="font-mono"
                          autoComplete="new-password"
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 Vælg en kode du kan huske, f.eks. et fælles minde.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowSendForm(false);
                            setAccessCode('');
                          }}
                          disabled={isSending}
                        >
                          Annuller
                        </Button>
                        <Button
                          size="sm"
                          className="gap-2 flex-1"
                          onClick={handleSendCode}
                          disabled={isSending || !accessCode || accessCode.length < 6 || !data.contactEmail}
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sender og låser...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send og lås permanent
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full gap-2"
                      onClick={() => setShowSendForm(true)}
                      disabled={!data.contactName || !data.contactEmail}
                    >
                      <Key className="h-4 w-4" />
                      Opret hemmelig kode
                    </Button>
                  )}
                  
                  {(!data.contactName || !data.contactEmail) && (
                    <p className="text-xs text-warning">
                      Udfyld kontaktpersons navn og email ovenfor først
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              🔒 Kontaktoplysninger gemmes lokalt. Koden gemmes krypteret og kan kun læses af backend.
            </p>
          </div>
        </ToolDetailModal>
      </>
    );
  }
);

DigitalLegacyCard.displayName = 'DigitalLegacyCard';