import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Calendar,
  Clock, 
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Shield,
  Monitor
} from 'lucide-react';

type BookingStep = 'date' | 'time' | 'payment' | 'success';

// Generate next 7 available days
const getAvailableDates = () => {
  const dates = [];
  const today = startOfToday();
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(today, i));
  }
  return dates;
};

// Generate time slots - only 19:00+ are available
const TIME_SLOTS = [
  { time: '09:00', available: false },
  { time: '10:00', available: false },
  { time: '11:00', available: false },
  { time: '12:00', available: false },
  { time: '13:00', available: false },
  { time: '14:00', available: false },
  { time: '15:00', available: false },
  { time: '16:00', available: false },
  { time: '17:00', available: false },
  { time: '18:00', available: false },
  { time: '19:00', available: true },
  { time: '19:30', available: true },
  { time: '20:00', available: true },
  { time: '20:30', available: true },
  { time: '21:00', available: true },
];

const PRICE_DKK = 199;

const SupportBooking = () => {
  useScrollRestoration();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const availableDates = getAvailableDates();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!user || !selectedDate || !selectedTime) return;
    
    setIsProcessing(true);
    
    // Simulate Stripe payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create booking in database with pending confirmation status
    const { error } = await supabase
      .from('support_bookings')
      .insert({
        user_id: user.id,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_time: selectedTime + ':00',
        status: 'pending', // Waiting for admin confirmation
        payment_status: 'paid',
        price_dkk: PRICE_DKK,
        stripe_payment_id: 'mock_pi_' + Date.now(), // Mock payment ID
      });

    if (error) {
      console.error('Booking error:', error);
      toast.error('Kunne ikke oprette booking. Prøv igen.');
      setIsProcessing(false);
      return;
    }

    toast.success('Booking bekræftet!', {
      description: 'Du modtager en bekræftelse på email.',
    });
    
    setStep('success');
    setIsProcessing(false);
  };

  // Date Selection Step
  if (step === 'date') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-18 items-center px-4">
            <BackButton />
          </div>
        </header>
        
        <main className="container py-6 md:py-8 px-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-4">
              <Breadcrumb />
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-info/10 text-info text-sm font-medium mb-4">
                <Calendar className="h-4 w-4" />
                Trin 1 af 3
              </div>
              <h1 className="text-2xl font-bold mb-2">Vælg en dag</h1>
              <p className="text-muted-foreground">
                Hvornår passer det dig at få hjælp?
              </p>
            </div>

            <div className="space-y-2">
              {availableDates.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateSelect(date)}
                  className="w-full card-elevated p-4 text-left hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">
                        {format(date, 'EEEE', { locale: da })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(date, 'd. MMMM yyyy', { locale: da })}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Time Selection Step
  if (step === 'time') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-18 items-center px-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('date')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbage
            </Button>
          </div>
        </header>
        
        <main className="container py-6 md:py-8 px-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-info/10 text-info text-sm font-medium mb-4">
                <Clock className="h-4 w-4" />
                Trin 2 af 3
              </div>
              <h1 className="text-2xl font-bold mb-2">Vælg et tidspunkt</h1>
              <p className="text-muted-foreground">
                {selectedDate && format(selectedDate, 'EEEE d. MMMM', { locale: da })}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`p-3 rounded-xl text-center transition-all ${
                    slot.available
                      ? 'card-elevated hover:border-primary/50 cursor-pointer'
                      : 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="font-medium">{slot.time}</span>
                  {!slot.available && (
                    <p className="text-xs text-muted-foreground mt-0.5">Optaget</p>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Tidspunkter før kl. 19:00 er desværre optaget
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Payment Step
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-18 items-center px-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('time')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbage
            </Button>
          </div>
        </header>
        
        <main className="container py-6 md:py-8 px-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-info/10 text-info text-sm font-medium mb-4">
                <CreditCard className="h-4 w-4" />
                Trin 3 af 3
              </div>
              <h1 className="text-2xl font-bold mb-2">Bekræft og betal</h1>
              <p className="text-muted-foreground">
                Gennemgå din booking
              </p>
            </div>

            {/* Booking Summary */}
            <div className="card-elevated p-6 mb-6">
              <h3 className="font-semibold mb-4">Din booking</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dato</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, 'd. MMMM yyyy', { locale: da })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tidspunkt</span>
                  <span className="font-medium">Kl. {selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Varighed</span>
                  <span className="font-medium">Op til 30 min</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{PRICE_DKK} DKK</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  inkl. moms
                </p>
              </div>
            </div>

            {/* Payment Button */}
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Behandler betaling...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Betal med Stripe
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Sikker betaling
              </span>
              <span>•</span>
              <span>Pengene tilbage hvis aflyst</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Success Step
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-success" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Booking bekræftet!</h1>
        <p className="text-muted-foreground mb-6">
          Din fjernsupport-session er booket til:
        </p>

        <div className="card-elevated p-6 mb-6 text-left">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center shrink-0">
              <Monitor className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="font-semibold">
                {selectedDate && format(selectedDate, 'EEEE d. MMMM', { locale: da })}
              </p>
              <p className="text-muted-foreground">
                Kl. {selectedTime}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Du modtager en påmindelse på email inden sessionen starter.
          Sessionen vil være tilgængelig fra dit dashboard.
        </p>

        <Button variant="hero" className="w-full" onClick={() => navigate('/dashboard')}>
          Tilbage til dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SupportBooking;
