import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpCircle, 
  XCircle, 
  Shield, 
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const recommendations: Recommendation[] = [
  {
    id: 'update',
    title: 'Opdater din enhed',
    description: 'Sørg for at din iPhone/iPad er opdateret',
    icon: ArrowUpCircle,
    href: '/guides/update-ios',
    color: 'bg-info/10 text-info',
  },
  {
    id: 'popups',
    title: 'Stop irriterende popups',
    description: 'Lær at blokere uønskede beskeder',
    icon: XCircle,
    href: '/guides/stop-popups',
    color: 'bg-warning/10 text-warning',
  },
  {
    id: 'safety',
    title: 'Brug Sikkerhedsskjold',
    description: 'Tjek mistænkelige beskeder sikkert',
    icon: Shield,
    href: '/safety',
    color: 'bg-success/10 text-success',
  },
];

export function ActionableRecommendations() {
  const { user } = useAuth();
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load completed items from localStorage (simple persistence)
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`recommendations_completed_${user.id}`);
      if (stored) {
        try {
          setCompletedItems(new Set(JSON.parse(stored)));
        } catch {
          // Ignore parse errors
        }
      }
    }
    setIsLoading(false);
  }, [user]);

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      // Persist to localStorage
      if (user) {
        localStorage.setItem(
          `recommendations_completed_${user.id}`, 
          JSON.stringify(Array.from(newSet))
        );
      }
      
      return newSet;
    });
  };

  return (
    <div className="card-elevated p-4 sm:p-6 mb-6 sm:mb-8 overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold">Dine 3 næste ting</h3>
          <p className="text-sm text-muted-foreground truncate">Anbefalede handlinger for din sikkerhed</p>
        </div>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec) => {
          const isCompleted = completedItems.has(rec.id);
          
          return (
            <div
              key={rec.id}
              className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all ${
                isCompleted 
                  ? 'bg-muted/50' 
                  : 'hover:bg-muted'
              }`}
            >
              {/* Completion toggle */}
              <button
                onClick={(e) => toggleComplete(rec.id, e)}
                className={`w-7 h-7 min-w-[28px] min-h-[28px] rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                  isCompleted 
                    ? 'bg-success border-success text-success-foreground' 
                    : 'border-muted-foreground/30 hover:border-primary'
                }`}
                aria-label={isCompleted ? 'Marker som ikke udført' : 'Marker som udført'}
              >
                {isCompleted && <Check className="h-4 w-4" />}
              </button>
              
              <Link
                to={rec.href}
                className={`flex items-center gap-3 sm:gap-4 flex-1 min-w-0 group ${
                  isCompleted ? 'pointer-events-none' : ''
                }`}
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px] aspect-square rounded-xl ${rec.color} flex items-center justify-center shrink-0 ${
                  isCompleted ? 'opacity-50' : ''
                }`}>
                  <rec.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className={`flex-1 min-w-0 ${isCompleted ? 'opacity-50' : ''}`}>
                  <p className={`font-medium text-sm sm:text-base truncate ${isCompleted ? 'line-through' : ''}`}>{rec.title}</p>
                  <p className={`text-xs sm:text-sm text-muted-foreground truncate ${isCompleted ? 'line-through' : ''}`}>
                    {rec.description}
                  </p>
                </div>
                {!isCompleted && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 hidden sm:block" />
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
