import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Smartphone, Monitor, AlertTriangle } from 'lucide-react';

interface CopyHelpModalProps {
  trigger?: React.ReactNode;
}

export function CopyHelpModal({ trigger }: CopyHelpModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'iphone' | 'computer' | null>(null);

  const defaultTrigger = (
    <button className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
      <HelpCircle className="h-3.5 w-3.5" />
      Hjælp til at kopiere?
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSelectedDevice(null);
    }}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Sådan kopierer du tekst
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Device selector */}
          {!selectedDevice ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-center">
                Hvilken enhed bruger du?
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedDevice('iphone')}
                  className="card-interactive p-6 text-center flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Smartphone className="h-7 w-7 text-primary" />
                  </div>
                  <span className="font-medium">iPhone/iPad</span>
                </button>
                
                <button
                  onClick={() => setSelectedDevice('computer')}
                  className="card-interactive p-6 text-center flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-info/10 flex items-center justify-center">
                    <Monitor className="h-7 w-7 text-info" />
                  </div>
                  <span className="font-medium">Computer</span>
                </button>
              </div>
            </div>
          ) : selectedDevice === 'iphone' ? (
            <div className="space-y-4 animate-fade-in">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDevice(null)}
                className="mb-2"
              >
                ← Tilbage
              </Button>
              
              {/* iPhone steps */}
              <div className="space-y-4">
                <div className="card-elevated p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</span>
                    Find teksten
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Åbn beskeden eller emailen du vil tjekke.
                  </p>
                </div>
                
                <div className="card-elevated p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</span>
                    Hold fingeren nede
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Tryk og <strong>hold fingeren</strong> på teksten i 1-2 sekunder. Der kommer en menu frem.
                  </p>
                  {/* Visual representation */}
                  <div className="bg-muted rounded-lg p-4 flex flex-col items-center">
                    <div className="w-32 h-20 bg-background rounded-lg border-2 border-dashed border-primary flex items-center justify-center relative">
                      <span className="text-xs text-muted-foreground">Besked tekst</span>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">👆 Hold fingeren her</p>
                  </div>
                </div>
                
                <div className="card-elevated p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</span>
                    Tryk på "Kopiér"
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Når menuen kommer frem, tryk på <strong>"Kopiér"</strong> eller <strong>"Kopier alt"</strong>.
                  </p>
                  <div className="bg-muted rounded-lg p-3 flex justify-center gap-2">
                    <span className="px-3 py-1.5 bg-background rounded-lg text-xs font-medium border">Slå op</span>
                    <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Kopiér</span>
                    <span className="px-3 py-1.5 bg-background rounded-lg text-xs font-medium border">Del</span>
                  </div>
                </div>
                
                <div className="card-elevated p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center text-sm font-bold text-success">4</span>
                    Indsæt her
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Gå tilbage til denne app og <strong>hold fingeren</strong> på tekstfeltet. Tryk så på "Indsæt".
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDevice(null)}
                className="mb-2"
              >
                ← Tilbage
              </Button>
              
              {/* Computer steps */}
              <div className="space-y-4">
                <div className="card-elevated p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-info/10 flex items-center justify-center text-sm font-bold text-info">1</span>
                    Marker teksten
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Klik og træk med musen hen over teksten for at markere den. Teksten bliver blå.
                  </p>
                </div>
                
                <div className="card-elevated p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-info/10 flex items-center justify-center text-sm font-bold text-info">2</span>
                    Kopiér teksten
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Tryk på disse taster <strong>samtidig</strong>:
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1.5 bg-muted rounded-lg font-mono text-xs border">Ctrl</span>
                      <span className="text-muted-foreground">+</span>
                      <span className="px-3 py-1.5 bg-muted rounded-lg font-mono text-xs border">C</span>
                      <span className="text-muted-foreground text-xs ml-2">(Windows)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1.5 bg-muted rounded-lg font-mono text-xs border">⌘ Cmd</span>
                      <span className="text-muted-foreground">+</span>
                      <span className="px-3 py-1.5 bg-muted rounded-lg font-mono text-xs border">C</span>
                      <span className="text-muted-foreground text-xs ml-2">(Mac)</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-elevated p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center text-sm font-bold text-success">3</span>
                    Indsæt her
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Klik i tekstfeltet ovenfor og tryk:
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1.5 bg-muted rounded-lg font-mono text-xs border">Ctrl</span>
                      <span className="text-muted-foreground">+</span>
                      <span className="px-3 py-1.5 bg-muted rounded-lg font-mono text-xs border">V</span>
                      <span className="text-muted-foreground text-xs ml-2">(Windows)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1.5 bg-muted rounded-lg font-mono text-xs border">⌘ Cmd</span>
                      <span className="text-muted-foreground">+</span>
                      <span className="px-3 py-1.5 bg-muted rounded-lg font-mono text-xs border">V</span>
                      <span className="text-muted-foreground text-xs ml-2">(Mac)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Safety warning - always visible when device is selected */}
          {selectedDevice && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3 animate-fade-in">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Sikkerhedstip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Kopiér aldrig følsomme oplysninger (som kodeord) fra ukendte beskeder – de kan være svindel!
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
