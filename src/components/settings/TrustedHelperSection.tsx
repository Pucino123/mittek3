import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IOSSwitch } from '@/components/ui/ios-switch';

import { 
  Users, 
  ChevronRight, 
  Mail, 
  X, 
  Loader2,
  UserCheck,
  Clock,
  CalendarClock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface TrustedHelper {
  id: string;
  helper_email: string;
  invitation_accepted: boolean;
  can_view_dashboard: boolean;
  can_view_checkins: boolean;
  can_view_tickets: boolean;
  can_view_notes: boolean;
  can_view_vault: boolean;
  expires_at: string | null;
}

type ExpirationOption = '7days' | '30days' | 'permanent';

export function TrustedHelperSection() {
  const { user } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [helpers, setHelpers] = useState<TrustedHelper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [canViewDashboard, setCanViewDashboard] = useState(true);
  const [canViewCheckins, setCanViewCheckins] = useState(true);
  const [canViewTickets, setCanViewTickets] = useState(false);
  const [canViewNotes, setCanViewNotes] = useState(false);
  const [canViewVault, setCanViewVault] = useState(false);
  const [expirationOption, setExpirationOption] = useState<ExpirationOption>('30days');

  useEffect(() => {
    if (!user) return;
    fetchHelpers();
  }, [user]);

  const fetchHelpers = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('trusted_helpers')
      .select('*')
      .eq('user_id', user.id);

    if (data && !error) {
      setHelpers(data);
    }
    setIsLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email) return;

    setIsSubmitting(true);

    try {
      // Get user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Ikke logget ind');
      }

      // Call the invite-helper edge function which sends the email
      const { data, error } = await supabase.functions.invoke('invite-helper', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          helper_email: email,
          can_view_dashboard: canViewDashboard,
          can_view_checkins: canViewCheckins,
          can_view_tickets: canViewTickets,
          can_view_notes: canViewNotes,
          can_view_vault: canViewVault,
          expiration_option: expirationOption,
        },
      });

      if (error) throw error;

      toast.success('Invitation sendt!', {
        description: `En invitation er sendt til ${email}`,
      });

      // Reset form
      setEmail('');
      setCanViewDashboard(true);
      setCanViewCheckins(true);
      setCanViewTickets(false);
      setCanViewNotes(false);
      setCanViewVault(false);
      setExpirationOption('30days');
      setShowInviteForm(false);
      
      // Refresh list
      fetchHelpers();
    } catch (error: any) {
      console.error('Invite error:', error);
      toast.error('Kunne ikke sende invitation', {
        description: error.message || 'Prøv igen senere',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveHelper = async (helperId: string) => {
    const { error } = await supabase
      .from('trusted_helpers')
      .delete()
      .eq('id', helperId);

    if (!error) {
      toast.success('Hjælper fjernet');
      fetchHelpers();
    } else {
      toast.error('Kunne ikke fjerne hjælper');
    }
  };

  if (isLoading) {
    return (
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div id="helper-section" className="card-elevated p-6 mb-6 scroll-mt-24 transition-all duration-500">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Mine Hjælpere
      </h3>
      
      <p className="text-muted-foreground mb-4">
        Inviter personer du stoler på til at hjælpe dig med at holde øje med din digitale sikkerhed.
      </p>

      {/* Existing helpers */}
      {helpers.length > 0 && (
        <div className="space-y-3 mb-4">
          {helpers.map((helper) => (
            <div 
              key={helper.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  helper.invitation_accepted ? 'bg-success/10' : 'bg-warning/10'
                }`}>
                  {helper.invitation_accepted ? (
                    <UserCheck className="h-5 w-5 text-success" />
                  ) : (
                    <Clock className="h-5 w-5 text-warning" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{helper.helper_email}</p>
                  <p className="text-sm text-muted-foreground">
                    {helper.invitation_accepted ? 'Aktiv hjælper' : 'Afventer accept'}
                    {helper.expires_at && !helper.invitation_accepted && (
                      <span className="ml-1">
                        · Udløber {format(new Date(helper.expires_at), 'd. MMM yyyy', { locale: da })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveHelper(helper.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      {showInviteForm ? (
        <form onSubmit={handleInvite} className="space-y-4 p-4 rounded-lg bg-muted">
          <div className="space-y-2">
            <Label htmlFor="helper-email">Hjælperens email</Label>
            <Input
              id="helper-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="f.eks. soren@email.dk"
              required
            />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Tilladelser</p>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="perm-dashboard" className="cursor-pointer">
                Må se min oversigt
              </Label>
              <IOSSwitch
                id="perm-dashboard"
                checked={canViewDashboard}
                onCheckedChange={setCanViewDashboard}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="perm-checkins" className="cursor-pointer">
                Må se mine tjek-resultater
              </Label>
              <IOSSwitch
                id="perm-checkins"
                checked={canViewCheckins}
                onCheckedChange={setCanViewCheckins}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="perm-tickets" className="cursor-pointer">
                Må se mine support-sager
              </Label>
              <IOSSwitch
                id="perm-tickets"
                checked={canViewTickets}
                onCheckedChange={setCanViewTickets}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="perm-notes" className="cursor-pointer">
                Må se mine noter
              </Label>
              <IOSSwitch
                id="perm-notes"
                checked={canViewNotes}
                onCheckedChange={setCanViewNotes}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="perm-vault" className="cursor-pointer block">
                  Må se Kode-mappe
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Giver adgang til dine gemte koder (kræver dit samtykke)
                </p>
              </div>
              <IOSSwitch
                id="perm-vault"
                checked={canViewVault}
                onCheckedChange={setCanViewVault}
              />
            </div>
            
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="expiration" className="cursor-pointer">
                    Invitation udløber
                  </Label>
                </div>
                <Select value={expirationOption} onValueChange={(v) => setExpirationOption(v as ExpirationOption)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Efter 7 dage</SelectItem>
                    <SelectItem value="30days">Efter 30 dage</SelectItem>
                    <SelectItem value="permanent">Aldrig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInviteForm(false)}
            >
              Annuller
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sender...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send invitation
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowInviteForm(true)}>
          {helpers.length > 0 ? 'Inviter ny hjælper' : 'Inviter en hjælper'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
