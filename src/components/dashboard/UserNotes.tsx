import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function UserNotes() {
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
        // Update existing note
        await supabase
          .from('user_notes')
          .update({ content })
          .eq('id', noteId);
      } else {
        // Create new note
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
    <div className="card-elevated p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <StickyNote className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold">Mine Noter</h3>
            <p className="text-sm text-muted-foreground truncate">Private notater kun til dig</p>
          </div>
        </div>
        
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Gemmer...</span>
          </div>
        )}
        
        {showSaved && !isSaving && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">Gemt</span>
          </div>
        )}
      </div>

      <Textarea
        placeholder="Skriv dine private notater her..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        className="min-h-[100px] sm:min-h-[120px] resize-none w-full"
      />
    </div>
  );
}
