import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  HelpCircle, 
  Plus,
  MessageSquare,
  CheckCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { BackButton } from '@/components/layout/BackButton';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categories = [
  { id: 'iphone', label: 'iPhone' },
  { id: 'ipad', label: 'iPad' },
  { id: 'mac', label: 'Mac' },
  { id: 'apple-id', label: 'Apple ID / iCloud' },
  { id: 'security', label: 'Sikkerhed' },
  { id: 'other', label: 'Andet' },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'Åben', color: 'bg-info/10 text-info' },
  in_progress: { label: 'I gang', color: 'bg-warning/10 text-warning' },
  resolved: { label: 'Løst', color: 'bg-success/10 text-success' },
  closed: { label: 'Lukket', color: 'bg-muted text-muted-foreground' },
};

const Help = () => {
  // Enable scroll restoration
  useScrollRestoration();
  
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tickets with React Query
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category || !subject || !message) return;

    setIsSubmitting(true);

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        category,
        subject,
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      toast.error('Kunne ikke oprette sag. Prøv igen.');
      setIsSubmitting(false);
      return;
    }

    // Add first message
    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message,
      });

    if (msgError) {
      toast.error('Kunne ikke gemme besked. Prøv igen.');
    } else {
      toast.success('Sag oprettet!', {
        description: 'Vi vender tilbage hurtigst muligt.',
      });
      
      // Invalidate and refetch tickets
      queryClient.invalidateQueries({ queryKey: ['support-tickets', user.id] });
      
      setShowNewTicket(false);
      setCategory('');
      setSubject('');
      setMessage('');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center px-4">
          <BackButton />
        </div>
      </header>

      <main className="container py-6 md:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Breadcrumb />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Hjælp</h1>
              <p className="text-sm md:text-base text-muted-foreground">Opret en sag og få personlig hjælp</p>
            </div>
            {!showNewTicket && (
              <Button variant="hero" onClick={() => setShowNewTicket(true)} className="w-full sm:w-auto min-h-[48px]">
                <Plus className="mr-2 h-5 w-5" />
                Ny sag
              </Button>
            )}
          </div>

          {showNewTicket ? (
            <div className="card-elevated p-5 sm:p-6 md:p-8">
              <h2 className="text-lg md:text-xl font-semibold mb-5 md:mb-6">Opret ny sag</h2>

              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm md:text-base">Kategori</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 md:h-14">
                      <SelectValue placeholder="Vælg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="py-3">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm md:text-base">Emne</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Kort beskrivelse af dit problem"
                    className="h-12 md:h-14 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm md:text-base">Besked</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Beskriv dit problem så detaljeret som muligt..."
                    className="min-h-32 md:min-h-40 text-base"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowNewTicket(false)}
                    className="w-full sm:w-auto min-h-[48px]"
                  >
                    Annuller
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    disabled={isSubmitting || !category || !subject || !message}
                    className="w-full sm:w-auto min-h-[48px]"
                  >
                    {isSubmitting ? 'Opretter...' : 'Opret sag'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Loading state */}
              {ticketsLoading && (
                <div className="card-elevated p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                </div>
              )}

              {/* Ticket list */}
              {!ticketsLoading && tickets.length > 0 && (
                <div className="space-y-3">
                  {tickets.map((ticket: any) => {
                    const status = statusLabels[ticket.status] || statusLabels.open;
                    return (
                      <Link
                        key={ticket.id}
                        to={`/help/${ticket.id}`}
                        className="card-elevated p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-5 w-5 text-info" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {categories.find(c => c.id === ticket.category)?.label || ticket.category}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {!ticketsLoading && tickets.length === 0 && (
                <div className="card-elevated p-12 text-center">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ingen åbne sager</h3>
                  <p className="text-muted-foreground mb-6">
                    Har du brug for hjælp? Opret en ny sag, så vender vi tilbage hurtigst muligt.
                  </p>
                  <Button variant="hero" onClick={() => setShowNewTicket(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    Opret ny sag
                  </Button>
                </div>
              )}

              {/* Quick help */}
              <div className="card-elevated p-6">
                <h3 className="font-semibold mb-4">Hurtig hjælp</h3>
                <div className="space-y-3">
                  <Link to="/guides" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <MessageSquare className="h-5 w-5 text-info" />
                    <span>Se vores mini-guides</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Link>
                  <Link to="/checkin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Tag et Månedligt Tjek</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Help;
