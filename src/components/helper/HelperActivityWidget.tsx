import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, Clock, Bell, Loader2, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HelperActivityWidgetProps {
  personUserId: string;
  personName: string;
  latestCheckin: {
    completed_at: string;
    score: number;
  } | null;
}

export const HelperActivityWidget = ({
  personUserId,
  personName,
  latestCheckin,
}: HelperActivityWidgetProps) => {
  const [isSending, setIsSending] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success text-success-foreground';
    if (score >= 50) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Sikker';
    if (score >= 50) return 'Opmærksom';
    return 'Behøver hjælp';
  };

  const daysSinceCheckin = latestCheckin 
    ? differenceInDays(new Date(), new Date(latestCheckin.completed_at))
    : null;

  const showReminder = daysSinceCheckin !== null && daysSinceCheckin > 30;

  const handleSendReminder = async () => {
    setIsSending(true);
    try {
      // Get person's profile to get their email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('user_id', personUserId)
        .single();

      if (profileError || !profile?.email) {
        throw new Error('Kunne ikke finde brugerens email');
      }

      // Call the send-monthly-reminder function with specific user
      const { error } = await supabase.functions.invoke('send-monthly-reminder', {
        body: { targetUserId: personUserId },
      });

      if (error) throw error;

      toast.success(`Påmindelse sendt til ${profile.display_name || profile.email}`);
    } catch (error) {
      console.error('Reminder error:', error);
      toast.error('Kunne ikke sende påmindelse');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Aktivitet & Score</h3>
          <p className="text-sm text-muted-foreground">
            {personName}s seneste sikkerhedstjek
          </p>
        </div>
      </div>

      {latestCheckin ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {format(new Date(latestCheckin.completed_at), "d. MMMM yyyy", { locale: da })}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(latestCheckin.completed_at), { addSuffix: true, locale: da })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score:</span>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(latestCheckin.score)}`}>
                {latestCheckin.score}/100
              </span>
              <span className={`text-sm ${
                latestCheckin.score >= 80 ? 'text-success' :
                latestCheckin.score >= 50 ? 'text-warning' : 'text-destructive'
              }`}>
                {getScoreLabel(latestCheckin.score)}
              </span>
            </div>
          </div>

          {showReminder && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 text-warning mb-3">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Mere end 30 dage siden sidste tjek
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSendReminder}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Send påmindelse
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">Ingen tjek endnu</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 max-w-full"
            onClick={handleSendReminder}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2 flex-shrink-0" />
            ) : (
              <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            <span className="truncate">Send påmindelse</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default HelperActivityWidget;
