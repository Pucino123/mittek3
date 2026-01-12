import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MoreHorizontal, Mail, Edit, UserX, UserCheck, Loader2, Trash2 } from 'lucide-react';
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
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'plus' | 'pro'>(
    (currentPlan as 'basic' | 'plus' | 'pro') || 'basic'
  );

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
  const handleDeleteUser = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'delete_user', userId }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(`Bruger ${userEmail} slettet permanent`);
      setConfirmDeleteOpen(false);
      onActionComplete();
    } catch (error: any) {
      toast.error(error.message || 'Kunne ikke slette bruger');
    } finally {
      setIsLoading(false);
    }
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
            onClick={() => setConfirmDeleteOpen(true)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Slet Bruger Permanent</DialogTitle>
            <DialogDescription>
              Er du helt sikker på at du vil slette {userEmail}? 
              <br /><br />
              <strong className="text-destructive">Denne handling kan ikke fortrydes.</strong> Alle brugerdata, abonnementer og historik vil blive slettet permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Annuller
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Slet permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
