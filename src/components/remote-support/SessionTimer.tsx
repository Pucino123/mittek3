import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionTimerProps {
  timeRemaining: number;
  formattedTime: string;
}

export function SessionTimer({ timeRemaining, formattedTime }: SessionTimerProps) {
  const isLow = timeRemaining < 5 * 60 * 1000; // Less than 5 minutes
  const isCritical = timeRemaining < 2 * 60 * 1000; // Less than 2 minutes

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-semibold transition-colors",
        isCritical 
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : isLow 
            ? "bg-warning/20 text-warning"
            : "bg-muted text-foreground"
      )}
    >
      <Clock className="h-4 w-4" />
      <span>Tid tilbage: {formattedTime}</span>
    </div>
  );
}
