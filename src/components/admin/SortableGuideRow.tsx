import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { GripVertical, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  min_plan: string;
  sort_order: number;
}

interface SortableGuideRowProps {
  guide: Guide;
  onEdit: (guide: Guide) => void;
  onDelete: (guideId: string) => void;
  onTogglePublished: (guide: Guide) => void;
  onOpenSteps: (guide: Guide) => void;
}

export function SortableGuideRow({
  guide,
  onEdit,
  onDelete,
  onTogglePublished,
  onOpenSteps,
}: SortableGuideRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: guide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted' : ''}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
          aria-label="Træk for at omsortere"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{guide.title}</p>
          {guide.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {guide.description}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{guide.min_plan}</Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={guide.is_published ? 'default' : 'secondary'}
          className="cursor-pointer"
          onClick={() => onTogglePublished(guide)}
        >
          {guide.is_published ? 'Publiceret' : 'Kladde'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenSteps(guide)}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Trin
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(guide)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(guide.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
