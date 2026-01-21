import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Monitor, Clock, ArrowRight, Video } from 'lucide-react';

interface RemoteSupportBookingCardProps {
  booking: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
  };
}

export function RemoteSupportBookingCard({ booking }: RemoteSupportBookingCardProps) {
  const formattedDate = format(new Date(booking.scheduled_date), 'EEEE d. MMMM', { locale: da });
  const formattedTime = booking.scheduled_time.slice(0, 5); // HH:MM

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Afventer bekræftelse', color: 'bg-warning/10 text-warning' },
    confirmed: { label: 'Bekræftet', color: 'bg-info/10 text-info' },
    in_progress: { label: 'I gang', color: 'bg-success/10 text-success animate-pulse' },
    completed: { label: 'Afsluttet', color: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'Annulleret', color: 'bg-destructive/10 text-destructive' },
  };

  const status = statusLabels[booking.status] || statusLabels.pending;

  return (
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

          {booking.status === 'confirmed' || booking.status === 'in_progress' ? (
            <Link to="/support-hub/remote">
              <Button variant="hero" size="sm">
                <Video className="mr-2 h-4 w-4" />
                Start session
              </Button>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">
              Vi kontakter dig inden sessionen starter
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
