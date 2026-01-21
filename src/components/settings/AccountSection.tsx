import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Camera, Loader2, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Profile {
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface AccountSectionProps {
  profile: Profile | null;
  user: SupabaseUser | null;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  isUploadingAvatar: boolean;
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  refetchProfile: () => Promise<void>;
}

export function AccountSection({
  profile,
  user,
  avatarInputRef,
  isUploadingAvatar,
  handleAvatarUpload,
  refetchProfile,
}: AccountSectionProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const handleEditName = () => {
    setEditedName(profile?.display_name || '');
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) {
      toast.error('Navnet må ikke være tomt');
      return;
    }

    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: editedName.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      await refetchProfile();
      setIsEditingName(false);
      toast.success('Navn opdateret');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Kunne ikke gemme navnet');
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="card-elevated p-6 mb-6">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative group">
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Profilbillede" 
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
          )}
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isUploadingAvatar ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {/* Name & Email */}
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Dit navn"
                className="h-10 text-base font-semibold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSaveName}
                disabled={isSavingName}
                className="h-10 w-10 shrink-0"
              >
                {isSavingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 text-success" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={isSavingName}
                className="h-10 w-10 shrink-0"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg truncate">
                {profile?.display_name || 'Bruger'}
              </h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEditName}
                className="h-8 w-8 shrink-0"
                aria-label="Rediger navn"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}
          <p className="text-muted-foreground truncate">{profile?.email}</p>
        </div>
      </div>
    </div>
  );
}
