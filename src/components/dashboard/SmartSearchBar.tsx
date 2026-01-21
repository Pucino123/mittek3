import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackSearch } from '@/utils/analytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  Camera,
  Shield,
  Lock,
  Settings,
  Heart,
  Mail,
  Bell,
  Download,
  Share2,
  Eye,
  Zap,
  Globe,
  LucideIcon,
  Loader2
} from 'lucide-react';

interface SearchResult {
  title: string;
  description: string;
  href: string;
  hrefMac?: string;
  icon: React.ElementType;
  color: string;
  keywords: string[];
  deviceSpecific?: boolean;
  isGuide?: boolean;
}

// Icon mapping for database guides
const guideIconMap: Record<string, LucideIcon> = {
  'shield': Shield,
  'lock': Lock,
  'key': Key,
  'settings': Settings,
  'heart': Heart,
  'mail': Mail,
  'bell': Bell,
  'download': Download,
  'share': Share2,
  'eye': Eye,
  'zap': Zap,
  'globe': Globe,
  'wifi': Wifi,
  'battery': Battery,
  'trash': Trash2,
  'smartphone': Smartphone,
  'camera': Camera,
  'refresh': RefreshCw,
  'book': BookOpen,
  'help': HelpCircle,
  'alert': AlertTriangle,
};

// Static tool mappings
const staticToolMappings: SearchResult[] = [
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
    keywords: ['langsom', 'fuld', 'plads', 'billeder', 'slet', 'ryd', 'hukommelse', 'lager', 'fyldt', 'langsomt', 'langsommere', 'storage', 'rydde'],
    deviceSpecific: true,
  },
  {
    title: 'Svindel-Quiz',
    description: 'Test dine evner mod svindlere og lær at spotte fup',
    href: '/tools/scam-quiz',
    icon: ShieldAlert,
    color: 'bg-destructive/10 text-destructive',
    keywords: ['svindel', 'falsk', 'sms', 'email', 'bank', 'fup', 'spam', 'mistænkelig', 'besked', 'phishing', 'scam', 'fidus', 'snyd'],
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
    keywords: ['knap', 'knapper', 'tænde', 'slukke', 'lydstyrke', 'hjem', 'power', 'side', 'fysisk', 'virker'],
    deviceSpecific: true,
  },
];

// Primary action verbs - these are CRITICAL for intent matching
const primaryActionVerbs: Record<string, string[]> = {
  'opdater': ['opdatere', 'opdatering', 'update', 'opgrader', 'opgradere', 'installere', 'installer'],
  'slet': ['slette', 'fjern', 'fjerne', 'ryd', 'rydde', 'delete', 'remove'],
  'find': ['finde', 'finder', 'søg', 'søge', 'locate', 'track', 'spore'],
  'genstart': ['genstarte', 'restart', 'reboot', 'tænde', 'slukke'],
  'sikr': ['sikre', 'beskyt', 'beskytte', 'sikkerhed', 'secure'],
  'forbind': ['forbinde', 'tilslut', 'tilslutte', 'connect', 'koble'],
  'backup': ['sikkerhedskopi', 'sikkerhedskopiere', 'gem', 'gemme'],
  'del': ['dele', 'share', 'send', 'sende'],
  'blokér': ['blokere', 'bloker', 'block', 'stop', 'stoppe'],
  'ret': ['rette', 'fix', 'fiks', 'fikse', 'løs', 'løse', 'repair'],
};

// Negative keywords - if query contains these, EXCLUDE certain results
const exclusionRules: Record<string, string[]> = {
  'find min': ['opdater', 'update', 'slow', 'langsom', 'battery', 'batteri', 'slet'],
  'find my': ['opdater', 'update', 'slow', 'langsom', 'battery', 'batteri', 'slet'],
};

// Extract primary action verb from query
function extractActionVerb(query: string): string | null {
  const normalizedQuery = query.toLowerCase();
  for (const [verb, variants] of Object.entries(primaryActionVerbs)) {
    if (normalizedQuery.includes(verb) || variants.some(v => normalizedQuery.includes(v))) {
      return verb;
    }
  }
  return null;
}

// Check if a result should be excluded based on query context
function shouldExcludeResult(query: string, resultTitle: string): boolean {
  const normalizedQuery = query.toLowerCase();
  const normalizedTitle = resultTitle.toLowerCase();
  
  // If query contains action verb "opdater" and result is "Find min iPhone" - exclude it
  if ((normalizedQuery.includes('opdater') || normalizedQuery.includes('update')) && 
      normalizedTitle.includes('find')) {
    return true;
  }
  
  // If query is about "find min" something, only match location-related results
  if (normalizedQuery.includes('find min') || normalizedQuery.includes('find my')) {
    const actionVerb = extractActionVerb(normalizedQuery.replace('find min', '').replace('find my', ''));
    if (actionVerb && actionVerb !== 'find') {
      return true;
    }
  }
  
  return false;
}

// Generate keywords from guide title and description
function generateKeywordsFromGuide(title: string, description: string | null, category: string | null): string[] {
  const keywords: string[] = [];
  
  // Split title into words and add them
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  keywords.push(...titleWords);
  
  // Add description words
  if (description) {
    const descWords = description.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    keywords.push(...descWords);
  }
  
  // Add category
  if (category) {
    keywords.push(category.toLowerCase());
  }
  
  // Add action verbs based on title content
  for (const [verb, variants] of Object.entries(primaryActionVerbs)) {
    for (const word of titleWords) {
      if (word.includes(verb) || variants.some(v => word.includes(v))) {
        keywords.push(verb);
        keywords.push(...variants);
        break;
      }
    }
  }
  
  // Add common Danish synonyms/related words based on common patterns
  const synonymMap: Record<string, string[]> = {
    'opdater': ['update', 'opdatering', 'ny', 'version', 'software'],
    'sikker': ['sikkerhed', 'beskyt', 'beskyttelse', 'privat'],
    'wifi': ['internet', 'net', 'netværk', 'forbindelse'],
    'kode': ['password', 'adgangskode', 'pin'],
    'slet': ['fjern', 'ryd', 'rydde'],
    'langsom': ['hurtig', 'speed', 'hastighed', 'langsomt', 'slow'],
    'batteri': ['strøm', 'power', 'oplade', 'oplader'],
    'plads': ['lager', 'storage', 'fuld', 'fyldt'],
  };
  
  for (const word of titleWords) {
    if (synonymMap[word]) {
      keywords.push(...synonymMap[word]);
    }
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}

// Get icon component from guide icon string
function getGuideIcon(iconName: string | null): LucideIcon {
  if (!iconName) return BookOpen;
  const normalizedName = iconName.toLowerCase().replace(/[^a-z]/g, '');
  return guideIconMap[normalizedName] || BookOpen;
}

// Get color class based on category
function getGuideColor(category: string | null): string {
  const colorMap: Record<string, string> = {
    'sikkerhed': 'bg-destructive/10 text-destructive',
    'privatliv': 'bg-warning/10 text-warning',
    'hverdag': 'bg-info/10 text-info',
    'opdatering': 'bg-success/10 text-success',
    'batteri': 'bg-warning/10 text-warning',
    'lager': 'bg-success/10 text-success',
  };
  
  if (!category) return 'bg-info/10 text-info';
  return colorMap[category.toLowerCase()] || 'bg-info/10 text-info';
}

interface SmartSearchBarProps {
  compact?: boolean;
}

const SmartSearchBar = ({ compact = false }: SmartSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allMappings, setAllMappings] = useState<SearchResult[]>(staticToolMappings);
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const devicePreference = profile?.device_preference || 'iphone';
  const isMac = devicePreference === 'mac';

  // Fetch published guides from database
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const { data: guides, error } = await supabase
          .from('guides')
          .select('id, title, description, slug, category, icon')
          .eq('is_published', true)
          .order('sort_order', { ascending: true });
        
        if (error) {
          console.error('Error fetching guides:', error);
          setIsLoadingGuides(false);
          return;
        }
        
        if (guides && guides.length > 0) {
          const guideResults: SearchResult[] = guides.map(guide => ({
            title: guide.title,
            description: guide.description || 'Trin-for-trin vejledning',
            href: guide.slug ? `/guides/${guide.slug}` : `/guides?id=${guide.id}`,
            icon: getGuideIcon(guide.icon),
            color: getGuideColor(guide.category),
            keywords: generateKeywordsFromGuide(guide.title, guide.description, guide.category),
            isGuide: true,
          }));
          
          // Combine static tools with database guides
          setAllMappings([...staticToolMappings, ...guideResults]);
        }
      } catch (err) {
        console.error('Error fetching guides:', err);
      } finally {
        setIsLoadingGuides(false);
      }
    };
    
    fetchGuides();
  }, []);

  const findBestMatch = useCallback((searchQuery: string): SearchResult | null => {
    if (!searchQuery.trim()) return null;

    const normalizedQuery = searchQuery.toLowerCase().trim();
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length >= 2);
    
    // Extract the primary action from the query
    const queryAction = extractActionVerb(normalizedQuery);

    let bestMatch: SearchResult | null = null;
    let highestScore = 0;

    for (const tool of allMappings) {
      // Skip results that should be excluded based on query context
      if (shouldExcludeResult(normalizedQuery, tool.title)) {
        continue;
      }
      
      let score = 0;
      
      // CRITICAL: If query has an action verb, strongly prioritize results with matching action
      if (queryAction) {
        const resultHasMatchingAction = tool.keywords.some(k => 
          k.includes(queryAction) || 
          primaryActionVerbs[queryAction]?.some(v => k.includes(v))
        ) || tool.title.toLowerCase().includes(queryAction);
        
        if (resultHasMatchingAction) {
          score += 25; // Strong boost for matching action verb
        } else {
          // Penalize results that don't match the action
          score -= 10;
        }
      }
      
      // Check keywords
      for (const queryWord of queryWords) {
        if (queryWord.length < 3) continue;
        
        // Skip device names for primary matching (they're too generic)
        if (['iphone', 'ipad', 'mac', 'telefon', 'computer', 'min', 'mit', 'jeg', 'har'].includes(queryWord)) {
          continue;
        }
        
        for (const keyword of tool.keywords) {
          if (keyword === queryWord) {
            score += 10;
          } else if (keyword.startsWith(queryWord) || queryWord.startsWith(keyword)) {
            score += 6;
          } else if (keyword.includes(queryWord) || queryWord.includes(keyword)) {
            score += 3;
          } else if (Math.abs(keyword.length - queryWord.length) <= 2 && 
                     keyword.slice(0, 3) === queryWord.slice(0, 3)) {
            score += 2;
          }
        }
      }
      
      // Title match bonus (but exclude generic device names)
      for (const queryWord of queryWords) {
        if (queryWord.length < 3) continue;
        if (['iphone', 'ipad', 'mac', 'min', 'mit', 'jeg', 'har'].includes(queryWord)) continue;
        
        if (tool.title.toLowerCase().includes(queryWord)) {
          score += 4;
        }
        
        if (tool.description.toLowerCase().includes(queryWord)) {
          score += 2;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = tool;
      }
    }

    // Require higher threshold for confident match
    return highestScore >= 5 ? bestMatch : null;
  }, [allMappings]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    setTimeout(() => {
      const match = findBestMatch(query);
      setResult(match);
      setIsSearching(false);
      
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
      const targetHref = (isMac && result.hrefMac) ? result.hrefMac : result.href;
      navigate(targetHref);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResult(null);
    setHasSearched(false);
  };

  const getDeviceDescription = (tool: SearchResult) => {
    if (!tool.deviceSpecific) return tool.description;
    return isMac 
      ? tool.description.replace('telefon', 'Mac').replace('Telefon', 'Mac')
      : tool.description;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Beskriv dit problem..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-12 pr-10 h-12 md:h-14 text-base rounded-xl border-2 border-border focus:border-primary transition-colors w-full shadow-sm"
            />
            {query && (
              <button 
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Find</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search Result */}
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
                  {result.isGuide && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-info/10 text-info rounded-full font-medium">
                      Guide
                    </span>
                  )}
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

      {/* No results message */}
      {hasSearched && query && !result && !isSearching && (
        <div className="mt-3 p-3 bg-muted/50 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">
            Ingen match. Prøv "opdatering", "batteri" eller "sikkerhed".
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;