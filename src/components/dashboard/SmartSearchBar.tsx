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
  Laptop
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

const toolMappings: SearchResult[] = [
  {
    title: 'Batteri-Doktor',
    description: 'Få styr på batteriet og find ud af hvad der bruger strøm',
    href: '/tools/battery-doctor?device=iphone',
    hrefMac: '/tools/battery-doctor?device=mac',
    icon: Battery,
    color: 'bg-warning/10 text-warning',
    keywords: ['strøm', 'batteri', 'slukker', 'oplader', 'dør', 'hurtig', 'tom', 'procent', 'lader'],
    deviceSpecific: true,
  },
  {
    title: 'Oprydning',
    description: 'Få mere plads ved at slette unødvendige filer',
    href: '/tools/cleaning-guide?device=iphone',
    hrefMac: '/tools/cleaning-guide?device=mac',
    icon: Trash2,
    color: 'bg-success/10 text-success',
    keywords: ['langsom', 'fuld', 'plads', 'billeder', 'slet', 'ryd', 'hukommelse', 'lager', 'fyldt', 'langsomt'],
    deviceSpecific: true,
  },
  {
    title: 'Svindel-Quiz',
    description: 'Test dine evner mod svindlere og lær at spotte fup',
    href: '/tools/scam-quiz',
    icon: ShieldAlert,
    color: 'bg-destructive/10 text-destructive',
    keywords: ['svindel', 'falsk', 'sms', 'email', 'bank', 'fup', 'spam', 'mistænkelig', 'besked', 'phishing', 'scam'],
  },
  {
    title: 'Kode-generator',
    description: 'Lav sikre koder du faktisk kan huske',
    href: '/tools/password-generator',
    icon: Key,
    color: 'bg-success/10 text-success',
    keywords: ['kode', 'glemt', 'password', 'adgangskode', 'sikker', 'ny', 'logind', 'login'],
  },
  {
    title: 'Tryghedsknap',
    description: 'Få en rolig handlingsplan når du er usikker',
    href: '/panic',
    icon: AlertTriangle,
    color: 'bg-destructive/10 text-destructive',
    keywords: ['hjælp', 'nød', 'panik', 'usikker', 'ked', 'angst', 'nervøs', 'bange', 'hacked', 'hacket'],
  },
];

const SmartSearchBar = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
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
        for (const keyword of tool.keywords) {
          // Exact match
          if (keyword === queryWord) {
            score += 10;
          }
          // Starts with
          else if (keyword.startsWith(queryWord) || queryWord.startsWith(keyword)) {
            score += 5;
          }
          // Contains
          else if (keyword.includes(queryWord) || queryWord.includes(keyword)) {
            score += 2;
          }
        }
        
        // Also check title
        if (tool.title.toLowerCase().includes(queryWord)) {
          score += 3;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = tool;
      }
    }

    return highestScore >= 2 ? bestMatch : null;
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Simulate a brief search delay for UX
    setTimeout(() => {
      const match = findBestMatch(query);
      setResult(match);
      setIsSearching(false);
      
      // Track search with result count (1 if match found, 0 if not)
      trackSearch(query.trim(), match ? 1 : 0);
    }, 200);
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
  };

  // Get device-aware description
  const getDeviceDescription = (tool: SearchResult) => {
    if (!tool.deviceSpecific) return tool.description;
    return isMac 
      ? tool.description.replace('telefon', 'Mac').replace('Telefon', 'Mac')
      : tool.description;
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* Search Input */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Hvad driller? (f.eks. 'telefon langsom')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-12 pr-10 h-12 sm:h-14 text-base rounded-xl border-2 border-border focus:border-primary transition-colors w-full"
            />
            {query && (
              <button 
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <Button 
            onClick={handleSearch}
            size="lg"
            className="h-12 sm:h-14 px-4 sm:px-6 rounded-xl w-full sm:w-auto shrink-0"
            disabled={!query.trim() || isSearching}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Find løsning
          </Button>
        </div>
      </div>

      {/* Search Result */}
      {result && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-card border-2 border-primary/20 rounded-xl p-4 sm:p-5 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">Anbefalet løsning</span>
              </div>
              {result.deviceSpecific && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full">
                  {isMac ? (
                    <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground font-medium">
                    {isMac ? 'Mac' : 'iPhone'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${result.color} flex items-center justify-center shrink-0`}>
                  <result.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold truncate">
                    {result.title}
                    {result.deviceSpecific && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({isMac ? 'Mac' : 'iPhone'})
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{getDeviceDescription(result)}</p>
                </div>
              </div>
              
              <Button onClick={handleGoToTool} size="lg" className="rounded-xl w-full sm:w-auto shrink-0">
                Gå til værktøj
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No results message */}
      {query && !result && !isSearching && (
        <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-xl text-center">
          <p className="text-sm text-muted-foreground">
            Vi fandt desværre ikke noget. Prøv at søge efter "Batteri" eller "Kode".
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;
