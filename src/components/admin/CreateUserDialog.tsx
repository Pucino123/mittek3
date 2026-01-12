import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateUserDialogProps {
  onUserCreated: () => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [planTier, setPlanTier] = useState<'basic' | 'plus' | 'pro'>('basic');

  const handleCreate = async () => {
    if (!email || !password || !displayName) {
      toast.error('Udfyld alle felter');
      return;
    }

    if (password.length < 6) {
      toast.error('Adgangskoden skal være mindst 6 tegn');
      return;
    }

    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-create-user', {
        body: { email, password, displayName, planTier }
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
      console.error('Error creating user:', error);
      toast.error(error.message || 'Kunne ikke oprette bruger');
    } finally {
      setIsCreating(false);
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
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="bruger@eksempel.dk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Adgangskode</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mindst 6 tegn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <Button 
            onClick={handleCreate} 
            disabled={isCreating} 
            className="w-full"
          >
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
