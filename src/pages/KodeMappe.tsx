import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/layout/BackButton';
import { 
  Shield, 
  Lock, 
  Plus, 
  Eye, 
  EyeOff, 
  Folder, 
  Key,
  Wifi,
  CreditCard,
  Smartphone,
  AlertTriangle,
  ChevronRight,
  X,
  Mail,
  ArrowLeft,
  Loader2,
  Download,
  FileText,
  HeartHandshake,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';
import { 
  generateSalt, 
  deriveKey, 
  encrypt, 
  decrypt,
} from '@/utils/encryption';

interface VaultItem {
  id: string;
  title: string;
  secret: string;
  note?: string;
  folder_id?: string;
}

const folderIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  bank: CreditCard,
  apple: Smartphone,
  mitid: Key,
  router: Wifi,
  default: Folder,
};

const KodeMappe = () => {
  useScrollRestoration();
  const [searchParams] = useSearchParams();
  const isHelperMode = searchParams.get('helper') === 'true';
  const helperOwnerId = searchParams.get('owner');

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [salt, setSalt] = useState<string>('');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', secret: '', note: '' });
  
  // Security: Failed attempt tracking
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  // Password reset state
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'success'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Helper access state
  const [helperAccessCode, setHelperAccessCode] = useState('');
  const [helperUnlocking, setHelperUnlocking] = useState(false);
  const [ownerName, setOwnerName] = useState<string>('');
  const [hasHelperPermission, setHasHelperPermission] = useState(false);

  const { user, hasAccess } = useAuth();
  const { toast } = useToast();

  // Auto-lock timer
  useEffect(() => {
    if (isUnlocked) {
      const timer = setTimeout(() => {
        handleLock();
        toast({
          title: 'Kode-mappe låst',
          description: 'Din Kode-mappe blev automatisk låst efter 5 minutters inaktivitet.',
        });
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, [isUnlocked]);

  // Check if vault is set up (or helper mode)
  useEffect(() => {
    const checkSetup = async () => {
      if (!user) return;

      // If in helper mode, check permission and load owner info
      if (isHelperMode && helperOwnerId) {
        const { data: helperData } = await supabase
          .from('trusted_helpers')
          .select('can_view_vault, user_id')
          .eq('helper_user_id', user.id)
          .eq('user_id', helperOwnerId)
          .eq('invitation_accepted', true)
          .maybeSingle();

        if (helperData?.can_view_vault) {
          setHasHelperPermission(true);
          
          // Get owner's display name
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', helperOwnerId)
            .single();
          
          setOwnerName(ownerProfile?.display_name || ownerProfile?.email?.split('@')[0] || 'Bruger');
        }
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('vault_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsSetup(!!data);
      if (data) {
        setSalt(data.salt);
      }
      setIsLoading(false);
    };

    checkSetup();
  }, [user, isHelperMode, helperOwnerId]);

  // Password strength validation
  const validatePasswordStrength = (pwd: string): { valid: boolean; message: string } => {
    if (pwd.length < 8) {
      return { valid: false, message: 'Adgangskoden skal være mindst 8 tegn.' };
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, message: 'Adgangskoden skal indeholde mindst ét tal.' };
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      return { valid: false, message: 'Adgangskoden skal indeholde mindst ét bogstav.' };
    }
    return { valid: true, message: '' };
  };

  // Password reset handlers
  const handleRequestReset = async () => {
    if (!resetEmail) {
      setResetError('Indtast din email');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const { data, error } = await supabase.functions.invoke('vault-password-reset', {
        body: { action: 'request', email: resetEmail }
      });

      if (error) throw error;

      setResetStep('code');
      toast({
        title: 'Email sendt',
        description: 'Tjek din indbakke for nulstillingskoden.',
      });
    } catch (err: any) {
      setResetError(err.message || 'Kunne ikke sende email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!resetCode || resetCode.length < 8) {
      setResetError('Indtast den 8-tegns kode fra emailen');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      // First verify
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('vault-password-reset', {
        body: { action: 'verify', token: resetCode }
      });

      if (verifyError) throw verifyError;
      if (!verifyData.valid) {
        setResetError(verifyData.error || 'Ugyldig kode');
        setResetLoading(false);
        return;
      }

      // Then reset
      const { data: resetData, error: resetError } = await supabase.functions.invoke('vault-password-reset', {
        body: { action: 'reset', token: resetCode }
      });

      if (resetError) throw resetError;

      setResetStep('success');
      setIsSetup(false);
      toast({
        title: 'Kode-mappe nulstillet',
        description: 'Du kan nu oprette en ny adgangskode.',
      });
    } catch (err: any) {
      setResetError(err.message || 'Kunne ikke nulstille');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseReset = () => {
    setShowResetFlow(false);
    setResetStep('email');
    setResetEmail('');
    setResetCode('');
    setResetError(null);
  };

  const handleSetup = async () => {
    if (!user) return;
    if (passphrase !== confirmPassphrase) {
      setError('Adgangskoderne matcher ikke.');
      return;
    }
    
    const validation = validatePasswordStrength(passphrase);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsLoading(true);
    const newSalt = generateSalt();

    const { error: dbError } = await supabase.from('vault_settings').insert({
      user_id: user.id,
      salt: newSalt,
    });

    if (dbError) {
      setError('Kunne ikke oprette Kode-mappe. Prøv igen.');
      setIsLoading(false);
      return;
    }

    const key = await deriveKey(passphrase, newSalt);
    setCryptoKey(key);
    setSalt(newSalt);
    setIsSetup(true);
    setIsUnlocked(true);
    setIsLoading(false);
    setPassphrase('');
    setConfirmPassphrase('');
  };

  const handleUnlock = async () => {
    if (!user || !salt) return;
    
    // Check if locked out
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      setError(`For mange forsøg. Vent venligst ${remainingMinutes} minut${remainingMinutes > 1 ? 'ter' : ''}.`);
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      const key = await deriveKey(passphrase, salt);
      
      // Load encrypted items
      const { data } = await supabase
        .from('vault_items')
        .select('*')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        // Try to decrypt each item individually - robust approach
        const decryptedItems: VaultItem[] = [];
        let decryptionSucceeded = false;
        let failedCount = 0;
        
        for (const item of data) {
          try {
            const decryptedTitle = await decrypt(item.title_encrypted, item.iv, key);
            const decryptedSecret = await decrypt(item.secret_encrypted, item.iv, key);
            const decryptedNote = item.note_encrypted 
              ? await decrypt(item.note_encrypted, item.iv, key) 
              : undefined;
            
            decryptedItems.push({
              id: item.id,
              title: decryptedTitle,
              secret: decryptedSecret,
              note: decryptedNote,
              folder_id: item.folder_id || undefined,
            });
            decryptionSucceeded = true;
          } catch (itemError) {
            console.warn(`Failed to decrypt item ${item.id}:`, itemError);
            failedCount++;
            // Continue trying other items
          }
        }
        
        // If we couldn't decrypt ANY items, the password is wrong
        if (!decryptionSucceeded && data.length > 0) {
          throw new Error('Decryption failed - wrong password');
        }
        
        setItems(decryptedItems);
        setCryptoKey(key);
        
        // Warn about corrupted items
        if (failedCount > 0) {
          toast({
            title: `${failedCount} kode${failedCount > 1 ? 'r' : ''} kunne ikke læses`,
            description: 'Nogle ældre poster kan være beskadiget. Nye koder vil fungere normalt.',
            variant: 'destructive',
          });
        }
        
        // Cache items for Digital Arv backup
        localStorage.setItem('mittek-vault-items-cache', JSON.stringify(
          decryptedItems.map(i => ({ title: i.title, secret: i.secret, note: i.note }))
        ));
      } else {
        // No items yet, just set the key
        setCryptoKey(key);
        setItems([]);
      }

      // Reset failed attempts on successful unlock
      setFailedAttempts(0);
      setLockoutUntil(null);
      setIsUnlocked(true);
      setPassphrase('');
    } catch (e) {
      // Track failed attempts
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(lockoutTime);
        setError(`For mange forkerte forsøg. Prøv igen om 5 minutter.`);
      } else {
        const remaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
        setError(`Forkert adgangskode. ${remaining} forsøg tilbage.`);
      }
    }

    setIsLoading(false);
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setCryptoKey(null);
    setItems([]);
    setShowSecret({});
    // Keep failed attempts across locks for extra security
  };

  const handleAddItem = async () => {
    if (!user || !cryptoKey) return;
    if (!newItem.title || !newItem.secret) {
      toast({
        title: 'Udfyld alle felter',
        description: 'Titel og hemmelighed er påkrævet.',
        variant: 'destructive',
      });
      return;
    }

    // Generate a single IV to use for all fields
    const sharedIv = new Uint8Array(12);
    crypto.getRandomValues(sharedIv);

    // Encrypt all fields with the SAME IV
    const { ciphertext: titleEncrypted, iv } = await encrypt(newItem.title, cryptoKey, sharedIv);
    const { ciphertext: secretEncrypted } = await encrypt(newItem.secret, cryptoKey, sharedIv);
    const noteEncrypted = newItem.note 
      ? (await encrypt(newItem.note, cryptoKey, sharedIv)).ciphertext 
      : null;

    const { data, error: dbError } = await supabase.from('vault_items').insert({
      user_id: user.id,
      title_encrypted: titleEncrypted,
      secret_encrypted: secretEncrypted,
      note_encrypted: noteEncrypted,
      iv,
    }).select().single();

    if (dbError) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke gemme. Prøv igen.',
        variant: 'destructive',
      });
      return;
    }

    setItems([...items, {
      id: data.id,
      title: newItem.title,
      secret: newItem.secret,
      note: newItem.note || undefined,
    }]);
    setNewItem({ title: '', secret: '', note: '' });
    setShowAddItem(false);
    toast({
      title: 'Gemt!',
      description: 'Din kode er nu sikkert gemt.',
    });
  };

  const toggleShowSecret = (id: string) => {
    setShowSecret((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    // Auto-hide after 10 seconds
    if (!showSecret[id]) {
      setTimeout(() => {
        setShowSecret((prev) => ({ ...prev, [id]: false }));
      }, 10000);
    }
  };

  // Export vault data as professional PDF
  const handleExportBackup = async () => {
    if (items.length === 0) {
      toast({
        title: 'Ingen koder at eksportere',
        description: 'Du har ingen gemte koder endnu.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      // Header background
      doc.setFillColor(30, 64, 175); // Primary blue
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Logo/Brand text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('MitTek', pageWidth / 2, 22, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Sikkerhed & Digitalt Overblik', pageWidth / 2, 32, { align: 'center' });
      
      // Document title
      doc.setFontSize(10);
      doc.text('KODE-MAPPE BACKUP', pageWidth / 2, 40, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Info section
      let yPos = 55;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const exportDate = new Date().toLocaleDateString('da-DK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.text(`Eksporteret: ${exportDate}`, margin, yPos);
      doc.text(`Antal koder: ${items.length}`, margin, yPos + 6);
      
      // Warning box
      yPos += 18;
      doc.setFillColor(254, 243, 199); // Warning yellow background
      doc.setDrawColor(234, 179, 8); // Warning yellow border
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 20, 3, 3, 'FD');
      
      doc.setFontSize(9);
      doc.setTextColor(161, 98, 7); // Warning text color
      doc.setFont('helvetica', 'bold');
      doc.text('FORTROLIGT DOKUMENT', margin + 5, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.text('Denne fil indeholder dine adgangskoder. Opbevar den sikkert og slet den efter brug.', margin + 5, yPos + 14);
      
      doc.setTextColor(0, 0, 0);
      yPos += 30;
      
      // Table header
      doc.setFillColor(30, 64, 175);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      const colWidths = [12, 45, 55, 58];
      let xPos = margin + 3;
      doc.text('#', xPos, yPos + 7);
      xPos += colWidths[0];
      doc.text('Titel', xPos, yPos + 7);
      xPos += colWidths[1];
      doc.text('Kode/Adgangskode', xPos, yPos + 7);
      xPos += colWidths[2];
      doc.text('Note', xPos, yPos + 7);
      
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Table rows
      items.forEach((item, index) => {
        const rowHeight = 12;
        
        // Check if we need a new page
        if (yPos + rowHeight > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPos, pageWidth - (margin * 2), rowHeight, 'F');
        }
        
        // Draw row border
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, yPos, pageWidth - (margin * 2), rowHeight, 'S');
        
        // Row content
        xPos = margin + 3;
        doc.text((index + 1).toString(), xPos, yPos + 8);
        xPos += colWidths[0];
        
        // Truncate text if too long
        const truncate = (text: string, maxLen: number) => 
          text.length > maxLen ? text.substring(0, maxLen - 2) + '..' : text;
        
        doc.text(truncate(item.title, 22), xPos, yPos + 8);
        xPos += colWidths[1];
        
        doc.setFont('helvetica', 'bold');
        doc.text(truncate(item.secret, 28), xPos, yPos + 8);
        doc.setFont('helvetica', 'normal');
        xPos += colWidths[2];
        
        doc.text(truncate(item.note || '-', 30), xPos, yPos + 8);
        
        yPos += rowHeight;
      });
      
      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('FORTROLIGT DOKUMENT', margin, pageHeight - 12);
        doc.text(`Side ${i} af ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.text('Genereret af MitTek', pageWidth - margin, pageHeight - 12, { align: 'right' });
      }
      
      // Save the PDF
      const fileName = `mittek-kode-backup-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: 'PDF eksporteret',
        description: 'Din backup-fil er blevet downloadet. Opbevar den sikkert!',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Fejl ved eksport',
        description: 'Kunne ikke generere PDF. Prøv igen.',
        variant: 'destructive',
      });
    }
  };

  // Check plan access
  if (!hasAccess('plus')) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-16 sm:h-18 items-center px-4">
            <BackButton />
          </div>
        </header>

        <main className="container py-8 sm:py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Kode-mappe</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
              Kode-mappe er kun tilgængelig for Plus og Pro medlemmer. 
              Opgrader for at gemme dine vigtige koder sikkert og krypteret.
            </p>
            <Link to="/pricing">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                Se priser og opgrader
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading && isSetup === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Setup screen
  if (isSetup === false) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-16 sm:h-18 items-center px-4">
            <BackButton />
          </div>
        </header>

        <main className="container py-8 sm:py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <ToolPageHelpButton />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Opsæt Kode-mappe</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Vælg en adgangskode til din sikre Kode-mappe
              </p>
            </div>

            <div className="card-elevated p-4 sm:p-6 mb-4 sm:mb-6 bg-warning/5 border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning text-sm">Vigtigt</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Hvis du glemmer denne adgangskode, kan vi ikke gendanne dine data. 
                    Vælg en adgangskode du kan huske.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-elevated p-5 sm:p-8">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passphrase">Adgangskode til Kode-mappe</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Mindst 8 tegn med tal og bogstaver"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mindst 8 tegn, ét tal og ét bogstav for ekstra sikkerhed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Gentag adgangskode</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Gentag din adgangskode"
                    className="h-12"
                  />
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleSetup}
                  disabled={isLoading}
                >
                  Opret Kode-mappe
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Unlock screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-16 sm:h-18 items-center px-4">
            <BackButton />
          </div>
        </header>

        <main className="container py-8 sm:py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <ToolPageHelpButton />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Kode-mappe</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Indtast din adgangskode for at låse op
              </p>
            </div>

            <div className="card-elevated p-5 sm:p-8">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unlock-passphrase">Adgangskode</Label>
                  <Input
                    id="unlock-passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Din Kode-mappe adgangskode"
                    className="h-12"
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  />
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleUnlock}
                  disabled={isLoading || !passphrase}
                >
                  {isLoading ? 'Låser op...' : 'Lås op'}
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground text-sm"
                  onClick={() => setShowResetFlow(true)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Glemt adgangskode?
                </Button>
              </div>

              {/* Password Reset Modal */}
              {showResetFlow && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="card-elevated p-5 sm:p-6 w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-semibold">Nulstil Kode-mappe</h2>
                      <button onClick={handleCloseReset} className="p-2 [@media(hover:hover)]:hover:bg-muted rounded-lg">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {resetStep === 'email' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-warning text-sm">Vigtigt!</p>
                              <p className="text-xs text-muted-foreground">
                                Denne handling vil slette alle dine gemte koder. Du vil skulle tilføje dem igen.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Din email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="din@email.dk"
                            className="h-12"
                          />
                        </div>

                        {resetError && (
                          <p className="text-sm text-destructive">{resetError}</p>
                        )}

                        <Button 
                          variant="hero" 
                          size="lg" 
                          className="w-full"
                          onClick={handleRequestReset}
                          disabled={resetLoading}
                        >
                          {resetLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sender...
                            </>
                          ) : (
                            'Send nulstillingskode'
                          )}
                        </Button>
                      </div>
                    )}

                    {resetStep === 'code' && (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Indtast den 8-tegns kode vi har sendt til din email.
                        </p>

                        <div className="space-y-2">
                          <Label htmlFor="reset-code">Nulstillingskode</Label>
                          <Input
                            id="reset-code"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                            placeholder="XXXXXXXX"
                            className="h-12 text-center font-mono text-lg tracking-widest"
                            maxLength={8}
                          />
                        </div>

                        {resetError && (
                          <p className="text-sm text-destructive">{resetError}</p>
                        )}

                        <Button 
                          variant="hero" 
                          size="lg" 
                          className="w-full"
                          onClick={handleVerifyAndReset}
                          disabled={resetLoading || resetCode.length < 8}
                        >
                          {resetLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Nulstiller...
                            </>
                          ) : (
                            'Nulstil Kode-mappe'
                          )}
                        </Button>

                        <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => setResetStep('email')}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Tilbage
                        </Button>
                      </div>
                    )}

                    {resetStep === 'success' && (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                          <Key className="h-8 w-8 text-success" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Nulstilling fuldført!</h3>
                          <p className="text-muted-foreground text-sm">
                            Din Kode-mappe er blevet nulstillet. Du kan nu oprette en ny adgangskode.
                          </p>
                        </div>
                        <Button 
                          variant="hero" 
                          size="lg" 
                          className="w-full"
                          onClick={handleCloseReset}
                        >
                          Opret ny adgangskode
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main vault view
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-16 sm:h-18 items-center justify-between px-4">
          <BackButton />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportBackup} className="hidden sm:flex">
              <Download className="mr-2 h-4 w-4" />
              Eksporter backup
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportBackup} className="sm:hidden">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLock} className="hidden sm:flex">
              <Lock className="mr-2 h-4 w-4" />
              Lås
            </Button>
            <Button variant="outline" size="icon" onClick={handleLock} className="sm:hidden">
              <Lock className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Kode-mappe</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Dine koder er sikkert krypteret</p>
            </div>
            <Button variant="hero" onClick={() => setShowAddItem(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              Tilføj kode
            </Button>
          </div>

          {/* Add item modal */}
          {showAddItem && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card-elevated p-5 sm:p-6 w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold">Tilføj ny kode</h2>
                  <button onClick={() => setShowAddItem(false)} className="p-2 [@media(hover:hover)]:hover:bg-muted rounded-lg">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      placeholder="F.eks. Wi-Fi hjemme"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secret">Kode/Hemmelighed</Label>
                    <Input
                      id="secret"
                      value={newItem.secret}
                      onChange={(e) => setNewItem({ ...newItem, secret: e.target.value })}
                      placeholder="Din kode eller adgangskode"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note (valgfri)</Label>
                    <Input
                      id="note"
                      value={newItem.note}
                      onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
                      placeholder="F.eks. routerens placering"
                      className="h-12"
                    />
                  </div>

                  <Button variant="hero" size="lg" className="w-full" onClick={handleAddItem}>
                    Gem kode
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Items list */}
          {items.length === 0 ? (
            <div className="card-elevated p-8 sm:p-12 text-center">
              <Key className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Ingen koder endnu</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                Tilføj din første kode for at komme i gang
              </p>
              <Button variant="outline" onClick={() => setShowAddItem(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tilføj kode
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {items.map((item) => (
                <div key={item.id} className="card-elevated p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{item.title}</h3>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm sm:text-base text-muted-foreground truncate">
                          {showSecret[item.id] ? item.secret : '••••••••••'}
                        </p>
                        <button
                          onClick={() => toggleShowSecret(item.id)}
                          className="p-1.5 [@media(hover:hover)]:hover:bg-muted rounded flex-shrink-0"
                        >
                          {showSecret[item.id] ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      {item.note && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{item.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      
    </div>
  );
};

export default KodeMappe;
