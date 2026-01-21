import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Monitor, Clock, Video, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RemoteSupportBookingCardProps {
  booking: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    cancellation_message?: string | null;
    cancelled_by?: string | null;
  };
  onRefresh?: () => void;
}

export function RemoteSupportBookingCard({ booking, onRefresh }: RemoteSupportBookingCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const formattedDate = format(new Date(booking.scheduled_date), 'EEEE d. MMMM', { locale: da });
  const formattedTime = booking.scheduled_time.slice(0, 5);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Afventer bekræftelse', color: 'bg-warning/10 text-warning' },
    confirmed: { label: 'Bekræftet', color: 'bg-info/10 text-info' },
    in_progress: { label: 'I gang', color: 'bg-success/10 text-success animate-pulse' },
    completed: { label: 'Afsluttet', color: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'Annulleret', color: 'bg-destructive/10 text-destructive' },
  };

  const status = statusLabels[booking.status] || statusLabels.pending;

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Angiv venligst en årsag');
      return;
    }

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('support_bookings')
        .update({
          status: 'cancelled',
          cancellation_message: cancelReason.trim(),
          cancelled_by: 'user',
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Booking annulleret', {
        description: 'Din booking er blevet annulleret.',
      });
      setCancelDialogOpen(false);
      setCancelReason('');
      onRefresh?.();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Kunne ikke annullere booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const wasCancelledByAdmin = booking.status === 'cancelled' && booking.cancelled_by === 'admin';

  return (
    <>
      <div className="card-elevated p-4 sm:p-5 bg-gradient-to-r from-info/5 to-primary/5 border-info/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center shrink-0">
            <Monitor className="h-6 w-6 text-info" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">Fjernsupport booket</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {booking.status === 'pending' 
                  ? 'Tidspunkt vises efter bekræftelse'
                  : `${formattedDate} kl. ${formattedTime}`
                }
              </span>
            </div>

            {/* Show admin cancellation reason */}
            {wasCancelledByAdmin && booking.cancellation_message && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Annulleret af tekniker</p>
                    <p className="text-sm text-muted-foreground mt-1">"{booking.cancellation_message}"</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {booking.status === 'confirmed' || booking.status === 'in_progress' ? (
                <Link to={`/support-hub/remote?booking=${booking.id}`}>
                  <Button variant="hero" size="sm">
                    <Video className="mr-2 h-4 w-4" />
                    Start session
                  </Button>
                </Link>
              ) : booking.status !== 'cancelled' ? (
                <p className="text-xs text-muted-foreground">
                  Vi kontakter dig inden sessionen starter
                </p>
              ) : null}
              
              {canCancel && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <X className="mr-1 h-4 w-4" />
                  Annuller
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuller booking</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil annullere denne fjernsupport-session? Fortæl os gerne hvorfor.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Årsag til annullering (fx tidspunkt passer ikke, problem løst, etc.)..."
            className="min-h-[100px]"
          />
          
          <DialogFooter className="flex-col gap-2">
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="flex-1">
                Fortryd
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelBooking}
                disabled={isCancelling || !cancelReason.trim()}
                className="flex-1"
              >
                {isCancelling ? 'Annullerer...' : 'Bekræft annullering'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center w-full">
              Bemærk: betalinger refunderes ikke ved annullering
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
