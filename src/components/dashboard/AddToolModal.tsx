import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, RotateCcw } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface HiddenCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

interface AddToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hiddenCards: HiddenCard[];
  onAddCard: (cardId: string) => void;
  onResetAll: () => void;
}

export function AddToolModal({ 
  open, 
  onOpenChange, 
  hiddenCards, 
  onAddCard,
  onResetAll 
}: AddToolModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Tilføj værktøj
          </DialogTitle>
          <DialogDescription>
            Vælg et værktøj at tilføje til dit dashboard
          </DialogDescription>
        </DialogHeader>

        {hiddenCards.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Alle værktøjer er allerede på dit dashboard
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Luk
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-2 pr-4">
                {hiddenCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      onAddCard(card.id);
                      if (hiddenCards.length === 1) {
                        onOpenChange(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{card.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{card.description}</p>
                    </div>
                    <Plus className="h-5 w-5 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t flex justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onResetAll}
                className="text-muted-foreground"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Nulstil alle
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Luk
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}