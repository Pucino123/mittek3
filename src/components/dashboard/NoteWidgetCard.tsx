import { forwardRef, useState, useEffect } from 'react';
import { StickyNote, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NoteWidgetCardProps {
  isEditMode: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

export const NoteWidgetCard = forwardRef<HTMLDivElement, NoteWidgetCardProps>(
  ({ isEditMode, onRemove, isDragging, style, onExitEditMode }, ref) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [noteId, setNoteId] = useState<string | null>(null);

    // Fetch existing note on mount
    useEffect(() => {
      if (!user) return;

      const fetchNote = async () => {
        const { data } = await supabase
          .from('user_notes')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setContent(data.content || '');
          setNoteId(data.id);
        }
      };

      fetchNote();
    }, [user]);

    // Auto-save on blur
    const handleBlur = async () => {
      if (!user) return;

      setIsSaving(true);

      try {
        if (noteId) {
          await supabase
            .from('user_notes')
            .update({ content })
            .eq('id', noteId);
        } else {
          const { data } = await supabase
            .from('user_notes')
            .insert({ user_id: user.id, content })
            .select()
            .single();

          if (data) {
            setNoteId(data.id);
          }
        }

        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (error) {
        console.error('Failed to save note:', error);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div
        ref={ref}
        style={style}
        onClick={(e) => {
          // In edit mode, clicking the card exits wiggle mode (iOS-style)
          if (isEditMode) {
            const target = e.target as HTMLElement;
            // Only exit if not clicking the remove button or textarea
            if (!target.closest('button') && !target.closest('textarea')) {
              e.preventDefault();
              e.stopPropagation();
              onExitEditMode?.();
            }
          }
        }}
        className={cn(
          "card-interactive p-3 sm:p-4 flex flex-col relative h-full min-h-[180px] sm:min-h-[200px] md:min-h-[210px]",
          isEditMode && "animate-wiggle cursor-grab",
          isDragging && "opacity-50 scale-105 shadow-xl"
        )}
      >
        {/* Remove button in edit mode */}
        {isEditMode && onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -left-2 z-10 flex items-center justify-center bg-muted text-muted-foreground rounded-full shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
            style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', flexShrink: 0 }}
            aria-label="Fjern Mine Noter"
          >
            <X className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <StickyNote className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold leading-tight">Mine Noter</h3>
            </div>
          </div>
          
          {/* Save indicator */}
          <div className="shrink-0 h-5">
            {isSaving && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            )}
            
            {showSaved && !isSaving && (
              <div className="flex items-center gap-1 text-xs text-success">
                <Check className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>

        {/* Textarea - disable interaction in edit mode */}
        <Textarea
          placeholder="Skriv dine notater her..."
          value={content}
          onChange={(e) => !isEditMode && setContent(e.target.value)}
          onBlur={handleBlur}
          disabled={isEditMode}
          className={cn(
            "flex-1 min-h-[80px] resize-none text-sm",
            isEditMode && "pointer-events-none opacity-70"
          )}
        />
      </div>
    );
  }
);

NoteWidgetCard.displayName = 'NoteWidgetCard';
