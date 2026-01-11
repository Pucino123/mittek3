import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, HelpCircle, Smartphone, Check } from 'lucide-react';

interface ScreenshotHelpModalProps {
  trigger?: React.ReactNode;
  variant?: 'link' | 'button' | 'icon';
}

export function ScreenshotHelpModal({ trigger, variant = 'link' }: ScreenshotHelpModalProps) {
  const [open, setOpen] = useState(false);
  const [hasHomeButton, setHasHomeButton] = useState<boolean | null>(null);

  const defaultTrigger = () => {
    switch (variant) {
      case 'button':
        return (
          <Button variant="outline" size="sm" className="gap-2">
            <Camera className="h-4 w-4" />
            Hjælp til skærmbillede
          </Button>
        );
      case 'icon':
        return (
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Hjælp til skærmbillede">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        );
      default:
        return (
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" />
            Hjælp til skærmbillede
          </button>
        );
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setHasHomeButton(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Sådan tager du et skærmbillede
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Device selection */}
          {hasHomeButton === null ? (
            <div className="space-y-4 animate-fade-in">
              <p className="text-center text-muted-foreground">
                Har din iPhone en rund Hjem-knap i bunden?
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Face ID phone (no home button) */}
                <button
                  onClick={() => setHasHomeButton(false)}
                  className="card-interactive p-4 text-center flex flex-col items-center gap-3"
                >
                  <div className="relative w-16 h-28 bg-muted rounded-2xl border-2 border-foreground/20 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-muted-foreground/50" />
                    {/* Notch indicator for Face ID */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-foreground/20 rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Nej</p>
                    <p className="text-xs text-muted-foreground">Nyere model</p>
                  </div>
                </button>
                
                {/* Home button phone */}
                <button
                  onClick={() => setHasHomeButton(true)}
                  className="card-interactive p-4 text-center flex flex-col items-center gap-3"
                >
                  <div className="relative w-16 h-28 bg-muted rounded-2xl border-2 border-foreground/20 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-muted-foreground/50" />
                    {/* Home button indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-foreground/20 rounded-full border-2 border-foreground/30" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ja</p>
                    <p className="text-xs text-muted-foreground">Ældre model</p>
                  </div>
                </button>
              </div>
            </div>
          ) : hasHomeButton ? (
            /* Home Button iPhone Instructions */
            <div className="space-y-4 animate-fade-in">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHasHomeButton(null)}
                className="mb-2"
              >
                ← Vælg anden model
              </Button>
              
              {/* Visual illustration - Home Button iPhone */}
              <div className="flex justify-center">
                <div className="relative w-32 h-56 bg-muted rounded-3xl border-4 border-foreground/20 flex items-center justify-center">
                  <Smartphone className="h-16 w-16 text-muted-foreground/50" />
                  
                  {/* Home button - highlighted */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border-4 border-primary animate-pulse flex items-center justify-center">
                      <span className="text-primary font-bold text-xs">1</span>
                    </div>
                  </div>
                  
                  {/* Side button - highlighted */}
                  <div className="absolute -right-3 top-16 flex flex-col gap-1">
                    <div className="relative w-2 h-8 bg-primary rounded-r-full animate-pulse">
                      <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">2</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-elevated p-4 bg-primary/5 border-primary/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Gør dette:
                </h3>
                <p className="text-foreground">
                  Tryk på <strong>Hjem-knappen</strong> <span className="text-primary">(1)</span> og <strong>Tænd-knappen på siden</strong> <span className="text-primary">(2)</span> <strong>samtidig</strong>.
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  Slip begge knapper med det samme. Du hører et kamera-klik!
                </p>
              </div>
            </div>
          ) : (
            /* Face ID iPhone Instructions */
            <div className="space-y-4 animate-fade-in">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHasHomeButton(null)}
                className="mb-2"
              >
                ← Vælg anden model
              </Button>
              
              {/* Visual illustration - Face ID iPhone */}
              <div className="flex justify-center">
                <div className="relative w-32 h-56 bg-muted rounded-3xl border-4 border-foreground/20 flex items-center justify-center">
                  <Smartphone className="h-16 w-16 text-muted-foreground/50" />
                  
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/10 rounded-full" />
                  
                  {/* Volume up button - highlighted */}
                  <div className="absolute -left-3 top-12 flex flex-col gap-1">
                    <div className="relative w-2 h-6 bg-primary rounded-l-full animate-pulse">
                      <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">1</span>
                    </div>
                    <div className="w-2 h-6 bg-muted-foreground/30 rounded-l-full" />
                    <div className="w-2 h-6 bg-muted-foreground/30 rounded-l-full" />
                  </div>
                  
                  {/* Side button - highlighted */}
                  <div className="absolute -right-3 top-16 flex flex-col gap-1">
                    <div className="relative w-2 h-10 bg-primary rounded-r-full animate-pulse">
                      <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">2</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-elevated p-4 bg-primary/5 border-primary/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Gør dette:
                </h3>
                <p className="text-foreground">
                  Tryk på <strong>Lyd-Op knappen</strong> <span className="text-primary">(1)</span> og <strong>Tænd-knappen</strong> <span className="text-primary">(2)</span> <strong>samtidig</strong>.
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  Slip begge knapper med det samme. Du hører et kamera-klik!
                </p>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Billedet gemmes automatisk i dit Fotos-album.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
