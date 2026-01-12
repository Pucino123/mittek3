import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditableCategoryTitleProps {
  categoryId: string;
  defaultTitle: string;
  customTitle?: string;
  isEditMode: boolean;
  isCustomCategory?: boolean;
  onTitleChange: (categoryId: string, newTitle: string) => void;
  onDelete?: (categoryId: string) => void;
}

export function EditableCategoryTitle({
  categoryId,
  defaultTitle,
  customTitle,
  isEditMode,
  isCustomCategory = false,
  onTitleChange,
  onDelete,
}: EditableCategoryTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(customTitle || defaultTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = customTitle || defaultTitle;

  // Sortable hook for category drag
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `category-${categoryId}`,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset editing state when exiting edit mode
  useEffect(() => {
    if (!isEditMode) {
      setIsEditing(false);
    }
  }, [isEditMode]);

  const handleClick = (e: React.MouseEvent) => {
    // Don't open edit if clicking delete or drag handle
    const target = e.target as HTMLElement;
    if (target.closest('.delete-btn') || target.closest('.drag-handle')) return;
    
    if (isEditMode && !isEditing) {
      setEditValue(displayTitle);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    // If empty or same as default, use default
    if (!trimmedValue || trimmedValue === defaultTitle) {
      onTitleChange(categoryId, ''); // Empty string means use default
    } else {
      onTitleChange(categoryId, trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(displayTitle);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && isCustomCategory) {
      onDelete(categoryId);
    }
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 mb-4 sm:mb-6">
        <div className="drag-handle cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-xl sm:text-2xl md:text-3xl font-bold h-auto py-1 px-2 max-w-xs"
          placeholder={defaultTitle}
        />
        {isCustomCategory && onDelete && (
          <button
            className="delete-btn p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            onClick={handleDelete}
            title="Slet kategori"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 mb-4 sm:mb-6 ${isEditMode ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
      onClick={handleClick}
    >
      {isEditMode && (
        <div 
          className="drag-handle cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground animate-pulse" />
        </div>
      )}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
        {displayTitle}
      </h2>
      {isEditMode && (
        <>
          <span className="text-xs text-muted-foreground ml-2">(klik for at omdøbe)</span>
          {isCustomCategory && onDelete && (
            <button
              className="delete-btn p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors ml-2"
              onClick={handleDelete}
              title="Slet kategori"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
