import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { GripVertical } from 'lucide-react';

interface EditableCategoryTitleProps {
  categoryId: string;
  defaultTitle: string;
  customTitle?: string;
  isEditMode: boolean;
  onTitleChange: (categoryId: string, newTitle: string) => void;
}

export function EditableCategoryTitle({
  categoryId,
  defaultTitle,
  customTitle,
  isEditMode,
  onTitleChange,
}: EditableCategoryTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(customTitle || defaultTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = customTitle || defaultTitle;

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

  const handleClick = () => {
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <GripVertical className="h-5 w-5 text-muted-foreground opacity-50" />
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-xl sm:text-2xl md:text-3xl font-bold h-auto py-1 px-2 max-w-xs"
          placeholder={defaultTitle}
        />
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2 mb-4 sm:mb-6 ${isEditMode ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
      onClick={handleClick}
    >
      {isEditMode && (
        <GripVertical className="h-5 w-5 text-muted-foreground animate-pulse" />
      )}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
        {displayTitle}
      </h2>
      {isEditMode && (
        <span className="text-xs text-muted-foreground ml-2">(klik for at omdøbe)</span>
      )}
    </div>
  );
}
