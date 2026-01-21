import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackSearch } from '@/utils/analytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Battery, 
  Trash2, 
  ShieldAlert, 
  Key, 
  AlertTriangle,
  ChevronRight,
  X,
  Sparkles,
  Smartphone,
  Laptop,
  RefreshCw,
  Wifi,
  BookOpen,
  HelpCircle,
  ClipboardCheck,
  Camera
} from 'lucide-react';

interface SearchResult {
  title: string;
  description: string;
  href: string;
  hrefMac?: string; // Optional Mac-specific URL
  icon: React.ElementType;
  color: string;
  keywords: string[];
  deviceSpecific?: boolean;
}

// Extended tool mappings with more guides and natural language patterns
const toolMappings: SearchResult[] = [
  {
    title: 'Batteri-Doktor',
    description: 'Få styr på batteriet og find ud af hvad der bruger strøm',
    href: '/tools/battery-doctor?device=iphone',
    hrefMac: '/tools/battery-doctor?device=mac',
    icon: Battery,
    color: 'bg-warning/10 text-warning',
    keywords: ['strøm', 'batteri', 'slukker', 'oplader', 'dør', 'hurtig', 'tom', 'procent', 'lader', 'aflader', 'tømmer', 'holder', 'varmt', 'varm'],
    deviceSpecific: true,
  },
  {
    title: 'Oprydning',
    description: 'Få mere plads ved at slette unødvendige filer',
    href: '/tools/cleaning-guide?device=iphone',
    hrefMac: '/tools/cleaning-guide?device=mac',
    icon: Trash2,
    color: 'bg-success/10 text-success',
    keywords: ['langsom', 'fuld', 'plads', 'billeder', 'slet', 'ryd', 'hukommelse', 'lager', 'fyldt', 'langsomt', 'langsommere', 'langsomt', 'storage', 'rydde', 'fyldt'],
    deviceSpecific: true,
  },
  {
    title: 'Svindel-Quiz',
    description: 'Test dine evner mod svindlere og lær at spotte fup',
    href: '/tools/scam-quiz',
    icon: ShieldAlert,
    color: 'bg-destructive/10 text-destructive',
    keywords: ['svindel', 'falsk', 'sms', 'email', 'bank', 'fup', 'spam', 'mistænkelig', 'besked', 'phishing', 'scam', 'fidus', 'snyd', 'fusk'],
  },
  {
    title: 'Kode-generator',
    description: 'Lav sikre koder du faktisk kan huske',
    href: '/tools/password-generator',
    icon: Key,
    color: 'bg-success/10 text-success',
    keywords: ['kode', 'glemt', 'password', 'adgangskode', 'sikker', 'ny', 'logind', 'login', 'adgang', 'kodeord'],
  },
  {
    title: 'Tryghedsknap',
    description: 'Få en rolig handlingsplan når du er usikker',
    href: '/panic',
    icon: AlertTriangle,
    color: 'bg-destructive/10 text-destructive',
    keywords: ['hjælp', 'nød', 'panik', 'usikker', 'ked', 'angst', 'nervøs', 'bange', 'hacked', 'hacket', 'virus', 'malware', 'klikket', 'link'],
  },
  {
    title: 'Opdatering guide',
    description: 'Sådan opdaterer du din enhed sikkert',
    href: '/guides',
    icon: RefreshCw,
    color: 'bg-info/10 text-info',
    keywords: ['opdatering', 'opdatere', 'update', 'opdater', 'software', 'ios', 'version', 'ny', 'version', 'installere', 'pending'],
    deviceSpecific: true,
  },
  {
    title: 'Mini-guides',
    description: 'Trin-for-trin vejledninger til alt',
    href: '/guides',
    icon: BookOpen,
    color: 'bg-info/10 text-info',
    keywords: ['guide', 'guides', 'vejledning', 'hvordan', 'trin', 'tutorial', 'lære', 'forstå', 'forklaring'],
  },
  {
    title: 'Hjælp',
    description: 'Få personlig hjælp fra vores team',
    href: '/help',
    icon: HelpCircle,
    color: 'bg-accent/10 text-accent',
    keywords: ['hjælp', 'support', 'kontakt', 'spørgsmål', 'problem', 'fejl', 'virker', 'ikke'],
  },
  {
    title: 'Månedligt Tjek',
    description: 'Tjek din enheds sundhed',
    href: '/checkin',
    icon: ClipboardCheck,
    color: 'bg-primary/10 text-primary',
    keywords: ['tjek', 'check', 'sundhed', 'status', 'månedlig', 'sikkerhed', 'gennemgang'],
  },
  {
    title: 'Gæste-net',
    description: 'Del Wi-Fi nemt med gæster',
    href: '/tools/guest-wifi',
    icon: Wifi,
    color: 'bg-info/10 text-info',
    keywords: ['wifi', 'internet', 'net', 'gæst', 'del', 'kode', 'forbindelse', 'netværk', 'router'],
  },
  {
    title: 'Screenshot → AI',
    description: 'Få billeder forklaret af AI',
    href: '/screenshot-ai',
    icon: Camera,
    color: 'bg-success/10 text-success',
    keywords: ['billede', 'screenshot', 'foto', 'forklare', 'forstå', 'analysere', 'ai', 'skærmbillede'],
  },
  {
    title: 'Hardware-Detektiv',
    description: 'Hvad er knapperne på din enhed?',
    href: '/tools/hardware',
    icon: Smartphone,
    color: 'bg-primary/10 text-primary',
    keywords: ['knap', 'knapper', 'tænde', 'slukke', 'lydstyrke', 'hjem', 'power', 'side', 'fysisk', 'vil', 'ikke', 'virker'],
    deviceSpecific: true,
  },
];

interface SmartSearchBarProps {
  compact?: boolean; // For dashboard header use
}

const SmartSearchBar = ({ compact = false }: SmartSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Get user's device preference (default to iphone if not set)
  const devicePreference = profile?.device_preference || 'iphone';
  const isMac = devicePreference === 'mac';

  const findBestMatch = useCallback((searchQuery: string): SearchResult | null => {
    if (!searchQuery.trim()) return null;

    const normalizedQuery = searchQuery.toLowerCase().trim();
    const queryWords = normalizedQuery.split(/\s+/);

    let bestMatch: SearchResult | null = null;
    let highestScore = 0;

    for (const tool of toolMappings) {
      let score = 0;
      
      for (const queryWord of queryWords) {
        // Skip very short words like "jeg", "har", "min", "med"
        if (queryWord.length < 3) continue;
        
        for (const keyword of tool.keywords) {
          // Exact match
          if (keyword === queryWord) {
            score += 10;
          }
          // Starts with (fuzzy)
          else if (keyword.startsWith(queryWord) || queryWord.startsWith(keyword)) {
            score += 6;
          }
          // Contains (partial match)
          else if (keyword.includes(queryWord) || queryWord.includes(keyword)) {
            score += 3;
          }
          // Levenshtein-like: similar words (1 char difference tolerance)
          else if (Math.abs(keyword.length - queryWord.length) <= 2 && 
                   keyword.slice(0, 3) === queryWord.slice(0, 3)) {
            score += 2;
          }
        }
        
        // Also check title
        if (tool.title.toLowerCase().includes(queryWord)) {
          score += 4;
        }
        
        // Check description
        if (tool.description.toLowerCase().includes(queryWord)) {
          score += 2;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = tool;
      }
    }

    // Require minimum score for a match
    return highestScore >= 3 ? bestMatch : null;
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate a brief search delay for UX
    setTimeout(() => {
      const match = findBestMatch(query);
      setResult(match);
      setIsSearching(false);
      
      // Track search with result count (1 if match found, 0 if not)
      trackSearch(query.trim(), match ? 1 : 0);
    }, 150);
  }, [query, findBestMatch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleGoToTool = () => {
    if (result) {
      // Use device-specific URL if available and user is on Mac
      const targetHref = (isMac && result.hrefMac) ? result.hrefMac : result.href;
      navigate(targetHref);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResult(null);
    setHasSearched(false);
  };

  // Get device-aware description
  const getDeviceDescription = (tool: SearchResult) => {
    if (!tool.deviceSpecific) return tool.description;
    return isMac 
      ? tool.description.replace('telefon', 'Mac').replace('Telefon', 'Mac')
      : tool.description;
  };

  return (
    <div className="w-full">
      {/* Search Input - Compact version for dashboard header */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Beskriv dit problem..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-8 h-11 text-sm rounded-xl border-2 border-border focus:border-primary transition-colors w-full"
            />
            {query && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button 
            onClick={handleSearch}
            size="default"
            className="h-11 px-4 rounded-xl shrink-0"
            disabled={!query.trim() || isSearching}
          >
            <Sparkles className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Find</span>
          </Button>
        </div>
      </div>

      {/* Search Result - Compact card */}
      {result && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-card border border-primary/20 rounded-xl p-3 shadow-md overflow-hidden">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${result.color} flex items-center justify-center shrink-0`}>
                <result.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold truncate flex items-center gap-2">
                  {result.title}
                  {result.deviceSpecific && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                      {isMac ? <Laptop className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground truncate">{getDeviceDescription(result)}</p>
              </div>
              <Button onClick={handleGoToTool} size="sm" className="rounded-lg shrink-0 h-9 px-3">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No results message - Compact */}
      {hasSearched && query && !result && !isSearching && (
        <div className="mt-3 p-3 bg-muted/50 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">
            Ingen match. Prøv "batteri", "langsom" eller "opdatering".
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;