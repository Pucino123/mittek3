import { useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardInfo {
  id: string;
  title: string;
  color: string;
}

interface CategoryInfo {
  id: string;
  title: string;
  cardIds: string[];
}

interface DashboardMiniMapProps {
  categories: CategoryInfo[];
  allCards: Map<string, CardInfo>;
  onReorderCategories: (categories: CategoryInfo[]) => void;
  onMoveCard?: (cardId: string, fromCategory: string, toCategory: string) => void;
}

// Individual card block in the minimap
function MiniCardBlock({ card }: { card: CardInfo }) {
  return (
    <div
      className="h-4 w-full rounded-sm text-[8px] font-medium truncate px-1 flex items-center bg-muted/50 border border-border/50"
      title={card.title}
    >
      {card.title}
    </div>
  );
}

// Sortable category row
function SortableCategoryRow({ 
  category, 
  cards 
}: { 
  category: CategoryInfo;
  cards: CardInfo[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border border-border rounded-lg p-2 mb-2 transition-colors",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded shrink-0"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="text-[10px] font-semibold truncate flex-1">{category.title}</span>
        <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded">
          {cards.length}
        </span>
      </div>
      
      {cards.length > 0 && (
        <div className="space-y-1 pl-4">
          {cards.slice(0, 4).map((card) => (
            <MiniCardBlock key={card.id} card={card} />
          ))}
          {cards.length > 4 && (
            <p className="text-[9px] text-muted-foreground pl-1">
              +{cards.length - 4} mere
            </p>
          )}
        </div>
      )}
      
      {cards.length === 0 && (
        <p className="text-[9px] text-muted-foreground italic pl-4">
          Tom kategori
        </p>
      )}
    </div>
  );
}

export function DashboardMiniMap({
  categories,
  allCards,
  onReorderCategories,
}: DashboardMiniMapProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get cards for each category
  const categoriesWithCards = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      cards: cat.cardIds
        .map(id => allCards.get(id))
        .filter((c): c is CardInfo => c !== undefined),
    }));
  }, [categories, allCards]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      
      const reordered = arrayMove(categories, oldIndex, newIndex);
      onReorderCategories(reordered);
    }
  };

  return (
    <div className="w-44 border-r border-border bg-muted/20 flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          Dashboard Layout
        </h3>
        <p className="text-[9px] text-muted-foreground mt-1">
          Træk for at flytte kategorier
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {categoriesWithCards.map((category) => (
              <SortableCategoryRow
                key={category.id}
                category={category}
                cards={category.cards}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Ingen kategorier endnu
          </p>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <p className="text-[9px] text-muted-foreground text-center">
          Live synkronisering aktiv
        </p>
      </div>
    </div>
  );
}
