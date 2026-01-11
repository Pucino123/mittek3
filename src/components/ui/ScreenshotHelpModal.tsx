import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, HelpCircle, Smartphone } from 'lucide-react';

interface ScreenshotHelpModalProps {
  trigger?: React.ReactNode;
  variant?: 'link' | 'button' | 'icon';
}

export function ScreenshotHelpModal({ trigger, variant = 'link' }: ScreenshotHelpModalProps) {
  const [open, setOpen] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          {/* iPhone illustration */}
          <div className="flex justify-center">
            <div className="relative w-32 h-56 bg-muted rounded-3xl border-4 border-foreground/20 flex items-center justify-center">
              <Smartphone className="h-16 w-16 text-muted-foreground/50" />
              
              {/* Side button indicators */}
              <div className="absolute -right-3 top-16 flex flex-col gap-1">
                <div className="w-2 h-8 bg-primary rounded-r-full animate-pulse" />
              </div>
              <div className="absolute -left-3 top-12 flex flex-col gap-1">
                <div className="w-2 h-6 bg-primary rounded-l-full animate-pulse" />
                <div className="w-2 h-6 bg-muted-foreground/30 rounded-l-full" />
                <div className="w-2 h-6 bg-muted-foreground/30 rounded-l-full" />
              </div>
            </div>
          </div>

          {/* FaceID instructions */}
          <div className="card-elevated p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">1</span>
              Nyere iPhones (med FaceID)
            </h3>
            <p className="text-muted-foreground">
              Tryk på <strong>Lyd-Op knappen</strong> (venstre side) og <strong>Tænd-knappen</strong> (højre side) <strong>samtidig</strong>.
            </p>
          </div>

          {/* Home button instructions */}
          <div className="card-elevated p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">2</span>
              Ældre iPhones (med Hjem-knap)
            </h3>
            <p className="text-muted-foreground">
              Tryk på <strong>Hjem-knappen</strong> (under skærmen) og <strong>Tænd-knappen</strong> (på siden) <strong>samtidig</strong>.
            </p>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Billedet gemmes automatisk i dit Fotos-album.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
