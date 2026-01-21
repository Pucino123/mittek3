import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Loader2, 
  Check, 
  X, 
  Video, 
  RefreshCw,
  Clock,
  Calendar,
  User,
  Monitor,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface Booking {
  id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  price_dkk: number;
  created_at: string;
  admin_notes: string | null;
  user_email?: string;
  cancellation_message?: string | null;
  cancelled_by?: string | null;
}

export function BookingsManager() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelBookingTarget, setCancelBookingTarget] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('support_bookings')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (bookingsError) throw bookingsError;

      // Fetch user emails for each booking
      if (bookingsData) {
        const userIds = [...new Set(bookingsData.map(b => b.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, display_name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.email || p.display_name || 'Ukendt']));
        
        const enrichedBookings = bookingsData.map(b => ({
          ...b,
          user_email: profileMap.get(b.user_id) || 'Ukendt'
        }));

        setBookings(enrichedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Kunne ikke hente bookinger');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmBooking = async (bookingId: string) => {
    setIsConfirming(bookingId);
    try {
      // Get booking details for email
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const { error } = await supabase
        .from('support_bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;

      // Send confirmation email via edge function
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            bookingId,
            userEmail: booking.user_email,
            scheduledDate: booking.scheduled_date,
            scheduledTime: booking.scheduled_time,
          },
        });
        toast.success('Booking bekræftet!', {
          description: 'Bekræftelsesmail sendt til brugeren.'
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        toast.success('Booking bekræftet!', {
          description: 'Kunne ikke sende bekræftelsesmail.'
        });
      }
      
      fetchBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Kunne ikke bekræfte booking');
    } finally {
      setIsConfirming(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingTarget || !cancellationReason.trim()) return;
    
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('support_bookings')
        .update({ 
          status: 'cancelled',
          cancellation_message: cancellationReason.trim(),
          cancelled_by: 'admin'
        })
        .eq('id', cancelBookingTarget.id);

      if (error) throw error;

      // Send cancellation email via edge function
      try {
        await supabase.functions.invoke('send-booking-cancellation', {
          body: {
            bookingId: cancelBookingTarget.id,
            cancellationReason: cancellationReason.trim(),
          },
        });
        toast.success('Booking annulleret', {
          description: 'Annulleringsmail sendt til brugeren.'
        });
      } catch (emailError) {
        console.error('Error sending cancellation email:', emailError);
        toast.success('Booking annulleret', {
          description: 'Kunne ikke sende annulleringsmail, men brugeren vil se din besked på deres dashboard.'
        });
      }
      
      setCancelBookingTarget(null);
      setCancellationReason('');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Kunne ikke annullere booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const openRemoteSession = (bookingId: string) => {
    navigate(`/support-hub/remote?booking=${bookingId}&admin=true`);
  };

  const startSession = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('support_bookings')
        .update({ status: 'in_progress' })
        .eq('id', bookingId);

      if (error) throw error;
      
      toast.success('Session startet!', {
        description: 'Brugeren kan nu se "Start session" knappen.'
      });
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Kunne ikke starte session');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Afventer bekræftelse</Badge>;
      case 'confirmed':
        return <Badge className="bg-info text-info-foreground">Bekræftet</Badge>;
      case 'in_progress':
        return <Badge className="bg-success text-success-foreground animate-pulse">I gang</Badge>;
      case 'completed':
        return <Badge variant="secondary">Afsluttet</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulleret</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isSessionTime = (booking: Booking) => {
    const now = new Date();
    const sessionDate = new Date(booking.scheduled_date + 'T' + booking.scheduled_time);
    // Within 15 minutes of session time
    const diff = Math.abs(now.getTime() - sessionDate.getTime());
    return diff < 15 * 60 * 1000;
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const activeBookings = bookings.filter(b => b.status === 'in_progress');
  const pastBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingBookings.length}</p>
                <p className="text-xs text-muted-foreground">Afventer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                <p className="text-xs text-muted-foreground">Kommende</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeBookings.length}</p>
                <p className="text-xs text-muted-foreground">Aktive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Check className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pastBookings.length}</p>
                <p className="text-xs text-muted-foreground">Afsluttet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending confirmations */}
      {pendingBookings.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-warning">Afventer bekræftelse</CardTitle>
                <CardDescription>Disse bookinger skal bekræftes</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchBookings}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.user_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.scheduled_date), 'EEEE d. MMMM', { locale: da })} kl. {booking.scheduled_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCancelBookingTarget(booking)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => confirmBooking(booking.id)}
                      disabled={isConfirming === booking.id}
                    >
                      {isConfirming === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Bekræft
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All bookings table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alle bookinger</CardTitle>
              <CardDescription>Oversigt over fjernsupport-sessioner</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchBookings}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Opdater
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Ingen bookinger endnu</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bruger</TableHead>
                  <TableHead>Dato</TableHead>
                  <TableHead>Tid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pris</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className={booking.status === 'cancelled' && booking.cancelled_by === 'user' ? 'bg-destructive/5' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.user_email}</p>
                        {booking.status === 'cancelled' && booking.cancellation_message && (
                          <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="italic">
                              {booking.cancelled_by === 'user' ? 'Bruger: ' : 'Admin: '}
                              "{booking.cancellation_message}"
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.scheduled_date), 'd. MMM yyyy', { locale: da })}
                    </TableCell>
                    <TableCell>{booking.scheduled_time.slice(0, 5)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        {booking.cancelled_by === 'user' && (
                          <span className="text-[10px] text-destructive font-medium">Af bruger</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{booking.price_dkk} DKK</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {booking.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            variant="hero"
                            onClick={() => openRemoteSession(booking.id)}
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Åbn session
                          </Button>
                        )}
                        {booking.status === 'confirmed' && isSessionTime(booking) && (
                          <Button 
                            size="sm" 
                            variant="hero"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Start
                          </Button>
                        )}
                        {booking.status === 'confirmed' && !isSessionTime(booking) && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelBookingTarget(booking)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => setCancelBookingTarget(booking)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => confirmBooking(booking.id)}
                              disabled={isConfirming === booking.id}
                            >
                              {isConfirming === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Bekræft'
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Start session dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start fjernsupport-session</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 pt-4">
              <div className="card-elevated p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center shrink-0">
                    <Monitor className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedBooking.user_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedBooking.scheduled_date), 'EEEE d. MMMM', { locale: da })} kl. {selectedBooking.scheduled_time.slice(0, 5)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Når du starter sessionen, vil brugeren se en "Start session" knap på deres dashboard, 
                og I kan begynde fjernsupport-sessionen.
              </p>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedBooking(null)}
                >
                  Annuller
                </Button>
                <Button 
                  variant="hero"
                  className="flex-1"
                  onClick={() => startSession(selectedBooking.id)}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Start session
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel booking dialog */}
      <Dialog open={!!cancelBookingTarget} onOpenChange={() => {
        setCancelBookingTarget(null);
        setCancellationReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Annuller booking
            </DialogTitle>
            <DialogDescription>
              Skriv en kort besked til brugeren om hvorfor sessionen annulleres.
            </DialogDescription>
          </DialogHeader>
          {cancelBookingTarget && (
            <div className="space-y-4 pt-2">
              <div className="card-elevated p-3">
                <p className="text-sm font-medium">{cancelBookingTarget.user_email}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(cancelBookingTarget.scheduled_date), 'd. MMM yyyy', { locale: da })} kl. {cancelBookingTarget.scheduled_time.slice(0, 5)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Årsag til annullering</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="F.eks. 'Tekniker er desværre syg' eller 'Tidspunktet kolliderer med en anden session'"
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-3 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setCancelBookingTarget(null);
                      setCancellationReason('');
                    }}
                  >
                    Fortryd
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCancelBooking}
                    disabled={!cancellationReason.trim() || isCancelling}
                  >
                    {isCancelling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Annuller booking
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Bemærk: betalinger refunderes ikke ved annullering
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
