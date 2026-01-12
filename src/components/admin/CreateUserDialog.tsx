import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateUserDialogProps {
  onUserCreated: () => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [planTier, setPlanTier] = useState<'basic' | 'plus' | 'pro'>('basic');
  const [lastError, setLastError] = useState<string | null>(null);

  const canOfferPurge = useMemo(() => {
    if (!lastError) return false;
    const msg = lastError.toLowerCase();
    // Common auth duplicate messages
    return (
      msg.includes('already registered') ||
      msg.includes('already been registered') ||
      msg.includes('already exists') ||
      msg.includes('duplicate')
    );
  }, [lastError]);

  const handleCreate = async () => {
    if (!email || !password || !displayName) {
      toast.error('Udfyld alle felter');
      return;
    }

    if (password.length < 6) {
      toast.error('Adgangskoden skal være mindst 6 tegn');
      return;
    }

    setLastError(null);
    setIsCreating(true);
    try {
      const response = await supabase.functions.invoke('admin-create-user', {
        body: { email, password, displayName, planTier },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`Bruger ${email} oprettet med ${planTier.toUpperCase()} plan`);
      setOpen(false);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setPlanTier('basic');
      onUserCreated();
    } catch (error: any) {
      const message = error?.message || 'Kunne ikke oprette bruger';
      console.error('Error creating user:', error);
      setLastError(message);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePurgeExistingAndCreate = async () => {
    if (!email) {
      toast.error('Indtast email først');
      return;
    }

    setIsPurging(true);
    try {
      const response = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'delete_user_by_email', email },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success('Eksisterende konto slettet – prøver at oprette igen...');
      setLastError(null);

      // Now retry create
      await handleCreate();
    } catch (error: any) {
      console.error('Error purging existing user:', error);
      toast.error(error?.message || 'Kunne ikke slette eksisterende konto');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Opret Bruger
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opret Ny Bruger</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Navn</Label>
            <Input
              id="displayName"
              placeholder="Brugerens navn"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (lastError) setLastError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="bruger@eksempel.dk"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (lastError) setLastError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Adgangskode</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mindst 6 tegn"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (lastError) setLastError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={planTier} onValueChange={(v) => setPlanTier(v as 'basic' | 'plus' | 'pro')}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic (Gratis)</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lastError && (
            <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <div className="text-muted-foreground">{lastError}</div>

              {canOfferPurge && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={handlePurgeExistingAndCreate}
                  disabled={isCreating || isPurging}
                >
                  {isPurging ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sletter gammel konto...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Slet eksisterende konto og opret igen
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          <Button onClick={handleCreate} disabled={isCreating || isPurging} className="w-full">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opretter...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Opret Bruger
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
