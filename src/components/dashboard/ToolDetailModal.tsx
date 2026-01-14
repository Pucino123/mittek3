import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function ToolDetailModal({
  open,
  onOpenChange,
  title,
  icon: Icon,
  iconColor = 'text-primary',
  children,
  className
}: ToolDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-lg max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        {/* Custom header with close button */}
        <div className="flex items-center justify-between mb-4">
          <DialogHeader className="p-0 space-y-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconColor.replace('text-', 'bg-').replace(')', '/10)'))}>
                <Icon className={cn("h-4 w-4", iconColor)} />
              </div>
              {title}
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Luk</span>
          </Button>
        </div>

        {/* Tool content */}
        <div className="space-y-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
