import { useState, useEffect } from 'react';
import { CheckCircle, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

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

// Map recommendation keywords to guide IDs
const getGuideForRecommendation = (rec: string): { guideId: string; label: string } | null => {
  const lowerRec = rec.toLowerCase();
  
  // Update/opdatering related - software & system
  if (lowerRec.includes('opdater') || lowerRec.includes('software') || lowerRec.includes('version') || lowerRec.includes('ios') || lowerRec.includes('macos')) {
    return { guideId: 'update-ios', label: 'Se guide til opdatering' };
  }
  
  // App updates
  if (lowerRec.includes('app-opdatering') || lowerRec.includes('apps opdater')) {
    return { guideId: 'update-apps', label: 'Se guide til app-opdateringer' };
  }
  
  // Storage/plads related - use icloud-cleanup or delete-apps
  if (lowerRec.includes('plads') || lowerRec.includes('lagerplads') || lowerRec.includes('storage') || lowerRec.includes('fyldt')) {
    return { guideId: 'icloud-cleanup', label: 'Se guide til at frigøre plads' };
  }
  
  // Cleanup/delete related
  if (lowerRec.includes('ryd op') || lowerRec.includes('dublet') || lowerRec.includes('slet gamle')) {
    return { guideId: 'icloud-cleanup', label: 'Se guide til at rydde op' };
  }
  
  // Delete apps
  if (lowerRec.includes('slet app') || lowerRec.includes('fjern app') || lowerRec.includes('afinstaller')) {
    return { guideId: 'delete-apps', label: 'Se guide til at slette apps' };
  }
  
  // Popup related
  if (lowerRec.includes('popup') || lowerRec.includes('vinduer') || lowerRec.includes('reklamer') || lowerRec.includes('irriterende')) {
    return { guideId: 'stop-popups', label: 'Se guide til at stoppe popups' };
  }
  
  // Scam/spam/message related
  if (lowerRec.includes('svindel') || lowerRec.includes('scam') || lowerRec.includes('mistænkelig') || lowerRec.includes('falsk')) {
    return { guideId: 'recognize-scam-messages', label: 'Lær at genkende svindel' };
  }
  
  // Spam messages
  if (lowerRec.includes('spam') || lowerRec.includes('uønsket besked') || lowerRec.includes('blokér besked')) {
    return { guideId: 'block-spam-messages', label: 'Se guide til at blokere spam' };
  }
  
  // iCloud backup related
  if (lowerRec.includes('backup') || lowerRec.includes('sikkerhedskopi') || lowerRec.includes('sikkerhedskopier')) {
    return { guideId: 'icloud-backup', label: 'Se guide til iCloud backup' };
  }
  
  // iCloud general
  if (lowerRec.includes('icloud')) {
    return { guideId: 'icloud-backup', label: 'Se guide til iCloud' };
  }
  
  // iCloud photos
  if (lowerRec.includes('billeder i sky') || lowerRec.includes('fotos i icloud') || lowerRec.includes('gem billeder')) {
    return { guideId: 'icloud-photos', label: 'Se guide til iCloud Fotos' };
  }
  
  // Battery related
  if (lowerRec.includes('batteri') || lowerRec.includes('strøm') || lowerRec.includes('opladning') || lowerRec.includes('holder ikke')) {
    return { guideId: 'extend-battery-life', label: 'Se guide til bedre batteritid' };
  }
  
  // Security/password related
  if (lowerRec.includes('kodeord') || lowerRec.includes('password') || lowerRec.includes('adgangskode')) {
    return { guideId: 'enable-2fa', label: 'Se guide til sikkerhed' };
  }
  
  // Two-factor authentication
  if (lowerRec.includes('to-faktor') || lowerRec.includes('2fa') || lowerRec.includes('godkendelse') || lowerRec.includes('sikkerhed')) {
    return { guideId: 'enable-2fa', label: 'Se guide til to-faktor' };
  }
  
  // Find My related
  if (lowerRec.includes('find min') || lowerRec.includes('find my') || lowerRec.includes('tabt') || lowerRec.includes('mistet') || lowerRec.includes('stjålet')) {
    return { guideId: 'find-my-iphone', label: 'Se guide til Find Min' };
  }
  
  // Calls related
  if (lowerRec.includes('opkald') || lowerRec.includes('ukendte') || lowerRec.includes('telefon') || lowerRec.includes('ring')) {
    return { guideId: 'block-unknown-calls', label: 'Se guide til at blokere opkald' };
  }
  
  // iMessage setup
  if (lowerRec.includes('imessage') || lowerRec.includes('beskeder opsætning')) {
    return { guideId: 'imessage-setup', label: 'Se guide til iMessage' };
  }
  
  // Text size / accessibility
  if (lowerRec.includes('tekst') || lowerRec.includes('læse') || lowerRec.includes('skriftstørrelse') || lowerRec.includes('større')) {
    return { guideId: 'bigger-text', label: 'Se guide til større tekst' };
  }
  
  // Hard reset / frozen device
  if (lowerRec.includes('frossen') || lowerRec.includes('hænger') || lowerRec.includes('genstart') || lowerRec.includes('reagerer ikke')) {
    return { guideId: 'hard-reset', label: 'Se guide til genstart' };
  }
  
  // Organize apps
  if (lowerRec.includes('ryd op') && lowerRec.includes('app')) {
    return { guideId: 'organize-apps', label: 'Se guide til at organisere apps' };
  }
  
  // Download apps
  if (lowerRec.includes('hent app') || lowerRec.includes('installer app') || lowerRec.includes('download app')) {
    return { guideId: 'download-apps', label: 'Se guide til at hente apps' };
  }
  
  return null;
};

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

  const toggleItem = (rec: string, e: React.MouseEvent) => {
    // Don't toggle if clicking on a link
    if ((e.target as HTMLElement).closest('a')) return;
    
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
            const guide = getGuideForRecommendation(rec);
            
            return (
              <li 
                key={index}
                onClick={(e) => toggleItem(rec, e)}
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
                <div className="flex-1 min-w-0">
                  <span className={`text-sm sm:text-base leading-relaxed block ${
                    isCompleted ? 'line-through text-muted-foreground' : ''
                  }`}>
                    {rec}
                  </span>
                  {guide && !isCompleted && (
                    <Link 
                      to={`/guides?guide=${guide.guideId}`}
                      className="inline-flex items-center gap-1 mt-2 text-xs sm:text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {guide.label}
                    </Link>
                  )}
                </div>
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