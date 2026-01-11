import { useState, useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CheckinData {
  id: string;
  score: number;
  recommendations: string[];
  storage_free_gb: number | null;
  has_pending_update: boolean | null;
  sees_annoying_popups: boolean | null;
  unsure_about_messages: boolean | null;
  completed_at: string;
}

interface CheckinRecommendationsProps {
  checkinData?: CheckinData;
}

export function CheckinRecommendations({ checkinData }: CheckinRecommendationsProps) {
  const { user } = useAuth();
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  // Load completed items from localStorage
  useEffect(() => {
    if (!user || !checkinData) return;

    const storageKey = `checkin-completed-${user.id}-${checkinData.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCompletedItems(JSON.parse(saved));
      } catch {
        setCompletedItems([]);
      }
    }
  }, [user, checkinData]);

  if (!checkinData) return null;
  
  // Don't show this section if score is 100/100 (perfect)
  if (checkinData.score === 100) return null;

  // Use the recommendations stored in the database from the checkin
  const recommendations = checkinData.recommendations || [];

  const toggleItem = (rec: string) => {
    if (!user || !checkinData) return;

    const storageKey = `checkin-completed-${user.id}-${checkinData.id}`;
    const newCompleted = completedItems.includes(rec)
      ? completedItems.filter(item => item !== rec)
      : [...completedItems, rec];
    
    setCompletedItems(newCompleted);
    localStorage.setItem(storageKey, JSON.stringify(newCompleted));
  };

  const completedCount = completedItems.length;
  const totalCount = recommendations.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <div className="card-elevated p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base sm:text-lg">Dine næste skridt</h3>
        </div>
        {totalCount > 0 && (
          <span className="text-xs sm:text-sm text-muted-foreground">
            {completedCount}/{totalCount} gjort
          </span>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">Ingen anbefalinger - din enhed ser fin ud! ✨</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((rec, index) => {
            const isCompleted = completedItems.includes(rec);
            
            return (
              <li 
                key={index}
                onClick={() => toggleItem(rec)}
                className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
                  isCompleted 
                    ? 'bg-success/5 border border-success/20' 
                    : 'bg-muted/50 hover:bg-muted border border-transparent'
                }`}
              >
                <div 
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors aspect-square ${
                    isCompleted ? 'bg-success text-white' : 'bg-background border-2 border-muted-foreground/30'
                  }`}
                  style={{ minWidth: '24px', minHeight: '24px' }}
                >
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-sm sm:text-base leading-relaxed ${
                  isCompleted ? 'line-through text-muted-foreground' : ''
                }`}>
                  {rec}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {allCompleted && (
        <div className="mt-4 p-3 sm:p-4 rounded-xl bg-success/10 text-center">
          <p className="text-sm sm:text-base font-medium text-success">
            🎉 Flot klaret! Du har gennemført alle anbefalinger.
          </p>
        </div>
      )}
    </div>
  );
}