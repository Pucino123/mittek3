import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MoreHorizontal, Mail, Edit, UserX, UserCheck, Loader2, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserActionsMenuProps {
  userId: string;
  userEmail: string;
  currentPlan: string | null;
  isActive: boolean;
  onActionComplete: () => void;
}

export function UserActionsMenu({ userId, userEmail, currentPlan, isActive, onActionComplete }: UserActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRemovePlanOpen, setConfirmRemovePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'plus' | 'pro'>(
    (currentPlan as 'basic' | 'plus' | 'pro') || 'basic'
  );

  // Delete error handling
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [canRetryViaEmail, setCanRetryViaEmail] = useState(false);

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'reset_password', userId }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`Password reset email sendt til ${userEmail}`);
    } catch (error: any) {
      toast.error(error.message || 'Kunne ikke sende password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'update_plan', userId, planTier: selectedPlan }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`Plan opdateret til ${selectedPlan.toUpperCase()}`);
      setEditPlanOpen(false);
      onActionComplete();
    } catch (error: any) {
      toast.error(error.message || 'Kunne ikke opdatere plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'toggle_status', userId }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(response.data.status === 'active' ? 'Bruger aktiveret' : 'Bruger deaktiveret');
      setConfirmDeactivateOpen(false);
      onActionComplete();
    } catch (error: any) {
      toast.error(error.message || 'Kunne ikke ændre brugerstatus');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlan = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'remove_plan', userId }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`Plan fjernet fra ${userEmail}`);
      setConfirmRemovePlanOpen(false);
      onActionComplete();
    } catch (error: any) {
      toast.error(error.message || 'Kunne ikke fjerne plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFromStripe = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Ikke logget ind');
        return;
      }

      const response = await supabase.functions.invoke('sync-user-subscription', {
        body: { userId, email: userEmail },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(response.data.message || 'Abonnement synkroniseret fra Stripe');
      onActionComplete();
    } catch (error: any) {
      toast.error(error.message || 'Kunne ikke synkronisere fra Stripe');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteUser = async (viaEmail = false) => {
    setIsLoading(true);
    setDeleteError(null);
    setCanRetryViaEmail(false);

    try {
      const body = viaEmail
        ? { action: 'delete_user_by_email' as const, email: userEmail }
        : { action: 'delete_user' as const, userId };

      const response = await supabase.functions.invoke('admin-manage-user', { body });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`Bruger ${userEmail} slettet permanent`);
      setConfirmDeleteOpen(false);
      onActionComplete();
    } catch (error: any) {
      const msg = error?.message || 'Kunne ikke slette bruger';
      setDeleteError(msg);

      // Check if it's a "user not found" or DB-related error that might succeed via email lookup
      const msgLc = msg.toLowerCase();
      const isNotFoundOrDbError =
        msgLc.includes('not found') ||
        msgLc.includes('database error') ||
        msgLc.includes('unexpected_failure') ||
        msgLc.includes('foreign key') ||
        msgLc.includes('constraint');

      // Only offer email fallback if we haven't already tried it and we have an email
      if (!viaEmail && userEmail && isNotFoundOrDbError) {
        setCanRetryViaEmail(true);
      }

      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = () => {
    setDeleteError(null);
    setCanRetryViaEmail(false);
    setConfirmDeleteOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleResetPassword}>
            <Mail className="mr-2 h-4 w-4" />
            Send password reset
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditPlanOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Rediger plan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSyncFromStripe} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Synk fra Stripe
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setConfirmDeactivateOpen(true)}
            className={isActive ? "text-destructive" : "text-green-600"}
          >
            {isActive ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Deaktiver konto
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Aktiver konto
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setConfirmRemovePlanOpen(true)}
            className="text-warning"
          >
            <UserX className="mr-2 h-4 w-4" />
            Fjern plan (ingen plan)
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={openDeleteDialog}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Slet bruger permanent
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Plan Dialog */}
      <Dialog open={editPlanOpen} onOpenChange={setEditPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger Plan</DialogTitle>
            <DialogDescription>
              Opdater abonnement for {userEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'basic' | 'plus' | 'pro')}>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanOpen(false)}>
              Annuller
            </Button>
            <Button onClick={handleUpdatePlan} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gem ændringer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Deactivate Dialog */}
      <Dialog open={confirmDeactivateOpen} onOpenChange={setConfirmDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isActive ? 'Deaktiver Konto' : 'Aktiver Konto'}</DialogTitle>
            <DialogDescription>
              {isActive 
                ? `Er du sikker på at du vil deaktivere ${userEmail}? Brugeren vil ikke kunne logge ind.`
                : `Er du sikker på at du vil aktivere ${userEmail}? Brugeren vil kunne logge ind igen.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeactivateOpen(false)}>
              Annuller
            </Button>
            <Button 
              variant={isActive ? "destructive" : "default"}
              onClick={handleToggleStatus} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isActive ? 'Deaktiver' : 'Aktiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Slet Bruger Permanent
            </DialogTitle>
            <DialogDescription>
              Er du helt sikker på at du vil slette <strong>{userEmail}</strong>?
              <br /><br />
              <span className="text-destructive font-medium">
                Denne handling kan ikke fortrydes.
              </span>{' '}
              Alle brugerdata, abonnementer, uploads og historik vil blive slettet permanent.
            </DialogDescription>
          </DialogHeader>

          {/* Error display with retry option */}
          {deleteError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm space-y-2">
              <div className="flex items-start gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{deleteError}</span>
              </div>

              {canRetryViaEmail && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDeleteUser(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Prøv sletning via email-opslag
                </Button>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Annuller
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleDeleteUser(false)} 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Slet permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Plan Dialog */}
      <Dialog open={confirmRemovePlanOpen} onOpenChange={setConfirmRemovePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-warning">Fjern Plan</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil fjerne planen fra {userEmail}? 
              <br /><br />
              Brugeren vil ikke længere have adgang til betalte funktioner.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemovePlanOpen(false)}>
              Annuller
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRemovePlan} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
              Fjern plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
