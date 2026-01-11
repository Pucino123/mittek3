import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles, ChevronRight, Share } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface WelcomeBannerProps {
  displayName: string;
  onClose: () => void;
}

export function WelcomeBanner({ displayName, onClose }: WelcomeBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome - trigger native prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        onClose();
      }
    } else {
      // iOS or other - show instructions modal
      setShowInstructions(true);
    }
  };

  return (
    <>
      <div className="mb-8 card-elevated p-6 bg-gradient-to-r from-primary/5 to-accent/5 relative animate-fade-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-background/50 transition-colors"
          aria-label="Luk"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">Velkommen til MitTek, {displayName}!</h2>
            <p className="text-muted-foreground mb-4">
              Din konto er nu klar. Start med at tage et Månedligt Tjek, eller udforsk vores guides.
            </p>
            <Button 
              variant="outline" 
              size="default"
              onClick={handleInstallClick}
              className="min-h-[44px]"
            >
              Gem app på startskærm
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PWA Installation Instructions Modal */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gem MitTek på din startskærm</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isIOS ? (
              <>
                <p className="text-muted-foreground">
                  Følg disse trin for at tilføje MitTek til din startskærm:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Tryk på Del-ikonet</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Ikonet ser sådan ud: <Share className="h-4 w-4" />
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Vælg "Føj til hjemmeskærm"</p>
                      <p className="text-sm text-muted-foreground">
                        Rul ned i menuen for at finde muligheden
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Tryk "Tilføj"</p>
                      <p className="text-sm text-muted-foreground">
                        MitTek vil nu være på din startskærm
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  For at tilføje MitTek til din startskærm:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Åbn din browsers menu</p>
                      <p className="text-sm text-muted-foreground">
                        Klik på de tre prikker øverst til højre
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Vælg "Installer app" eller "Tilføj til startskærm"</p>
                      <p className="text-sm text-muted-foreground">
                        Navnet kan variere afhængigt af din browser
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <Button onClick={() => setShowInstructions(false)} className="w-full">
            Forstået
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
