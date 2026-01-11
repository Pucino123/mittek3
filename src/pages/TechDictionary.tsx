import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, Search, Smartphone, Shield, Cloud, MessageSquare, Wifi, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from '@/integrations/supabase/client';

interface DictionaryEntry {
  term: string;
  explanation: string;
  metaphor?: string;
  example?: string;
  category: string;
}

// Hardcoded dictionary entries - these are always available
const hardcodedEntries: DictionaryEntry[] = [
  // === GENERELT ===
  {
    term: 'Cloud',
    explanation: 'En tjeneste der gemmer dine filer på internettet i stedet for på din enhed.',
    metaphor: '☁️ Et digitalt arkivskab ude i byen. Sikrer dine billeder mod brand eller tyveri.',
    category: 'generelt',
  },
  {
    term: 'Cookie',
    explanation: 'En lille fil som hjemmesider gemmer på din enhed for at huske dig.',
    metaphor: '🍪 En digital billet, så butikken kan huske dig næste gang du besøger.',
    category: 'generelt',
  },
  {
    term: 'Browser',
    explanation: 'Programmet du bruger til at gå på internettet (Safari, Chrome, Firefox).',
    metaphor: '🪟 Vinduet du kigger ud på internettet igennem.',
    category: 'generelt',
  },
  {
    term: 'Opdatering',
    explanation: 'En ny version af dit program eller styresystem med forbedringer og sikkerhedsrettelser.',
    metaphor: '🔧 Renovering af sikkerheden. Lukker huller for tyve og reparerer fejl.',
    category: 'generelt',
  },
  {
    term: 'Cache',
    explanation: 'Midlertidig hukommelse der gør ting hurtigere ved at gemme ofte brugt data.',
    metaphor: '🧠 Telefonens korttidshukommelse. Husker ting for at spare tid.',
    category: 'generelt',
  },
  {
    term: 'App',
    explanation: 'Et program på din telefon eller tablet. Forkortelse for "application".',
    metaphor: '📱 Et lille værktøj eller en lille butik du kan besøge på din telefon.',
    example: 'Facebook, MobilePay og DR er alle apps.',
    category: 'generelt',
  },
  {
    term: 'Download',
    explanation: 'At hente en fil eller et program fra internettet til din enhed.',
    metaphor: '📥 At modtage en pakke fra internettet ind i din telefon eller computer.',
    category: 'generelt',
  },
  {
    term: 'Upload',
    explanation: 'At sende en fil fra din enhed op på internettet.',
    metaphor: '📤 At sende en pakke fra din telefon ud på internettet.',
    category: 'generelt',
  },
  {
    term: 'Swipe',
    explanation: 'At stryge fingeren hen over skærmen for at navigere.',
    example: 'Swipe til venstre for at slette beskeden.',
    category: 'generelt',
  },
  {
    term: 'Screenshot',
    explanation: 'Et billede af hvad der vises på din skærm lige nu. Også kaldet "skærmbillede".',
    metaphor: '📸 At tage et foto af din skærm for at huske eller dele noget.',
    category: 'generelt',
  },
  {
    term: 'Notifikation',
    explanation: 'En besked eller advarsel fra en app, der vises på din skærm.',
    metaphor: '🔔 Et lille klokkeslag der fortæller dig, at noget er sket.',
    category: 'generelt',
  },
  {
    term: 'Link',
    explanation: 'En adresse der fører dig til et sted på internettet.',
    metaphor: '🔗 En genvej eller sti der tager dig hen til en hjemmeside.',
    category: 'generelt',
  },
  {
    term: 'Siri',
    explanation: 'Apples stemmeassistent der kan hjælpe dig med opgaver ved at lytte til din stemme.',
    example: 'Sig "Hej Siri, ring til min datter" for at starte et opkald.',
    category: 'generelt',
  },
  {
    term: 'Kontrolcenter',
    explanation: 'En hurtigmenu du åbner ved at swipe ned fra øverste højre hjørne på din iPhone.',
    example: 'Åbn Kontrolcenter for hurtigt at slå WiFi til eller styre lysstyrken.',
    category: 'generelt',
  },
  {
    term: 'Lagerplads',
    explanation: 'Mængden af plads på din enhed til at gemme apps, billeder og andre data.',
    metaphor: '🏠 Hvor stort dit digitale hus er - og hvor mange ting du kan have.',
    example: 'Du har brugt 50 GB af 128 GB lagerplads.',
    category: 'generelt',
  },

  // === FORBINDELSE ===
  {
    term: 'Router',
    explanation: 'Boksen der giver dig trådløst internet derhjemme.',
    metaphor: '📬 Din digitale postkasse, der fordeler internettet i hjemmet til alle enheder.',
    category: 'forbindelse',
  },
  {
    term: 'WiFi',
    explanation: 'Trådløs forbindelse til internettet.',
    metaphor: '📡 Usynlige tråde der forbinder din telefon til internettet uden kabler.',
    category: 'forbindelse',
  },
  {
    term: 'Bluetooth',
    explanation: 'Trådløs forbindelse mellem enheder tæt på hinanden.',
    metaphor: '🎧 En usynlig snor mellem f.eks. din telefon og dine høretelefoner.',
    category: 'forbindelse',
  },
  {
    term: 'Hotspot',
    explanation: 'Når din telefon deler sin internetforbindelse med andre enheder.',
    metaphor: '📡 Din telefon bliver til en lille router der giver internet til andre.',
    category: 'forbindelse',
  },
  {
    term: 'Mobildata',
    explanation: 'Internet via dit telefonabonnement i stedet for WiFi.',
    example: 'Når du er væk hjemmefra bruger telefonen mobildata.',
    category: 'forbindelse',
  },

  // === SIKKERHED ===
  {
    term: 'Phishing',
    explanation: 'Svindel hvor nogen forsøger at narre dig til at give personlige oplysninger.',
    metaphor: '🎣 Digital fiskeri efter dine oplysninger med falske lokkemidler.',
    category: 'sikkerhed',
  },
  {
    term: 'Spam',
    explanation: 'Uønsket reklame eller beskeder, ofte via email.',
    metaphor: '📬 Digital reklamepost som ingen har bedt om.',
    category: 'sikkerhed',
  },
  {
    term: 'Password',
    explanation: 'En hemmelig kode der giver dig adgang til en konto.',
    metaphor: '🔑 Nøglen til din digitale hoveddør.',
    category: 'sikkerhed',
  },
  {
    term: 'Face ID',
    explanation: 'Apples ansigtsgenkendelsesteknologi der låser din iPhone op ved at scanne dit ansigt.',
    example: 'Hold telefonen op foran dit ansigt for at låse den op med Face ID.',
    category: 'sikkerhed',
  },
  {
    term: 'Touch ID',
    explanation: 'Apples fingeraftrykslæser der låser din enhed op med dit fingeraftryk.',
    example: 'Læg fingeren på Hjem-knappen for at bruge Touch ID.',
    category: 'sikkerhed',
  },
  {
    term: 'MitID',
    explanation: 'Danmarks digitale ID-løsning der bruges til at logge ind på offentlige tjenester og banker.',
    example: 'Du bruger MitID til at logge ind på netbanken.',
    category: 'sikkerhed',
  },
  {
    term: 'To-faktor-godkendelse',
    explanation: 'Ekstra sikkerhed hvor du både skal bruge password OG en kode fra SMS eller app.',
    metaphor: '🔐 To låse på din dør i stedet for én - meget sværere for tyve.',
    category: 'sikkerhed',
  },
  {
    term: 'Virus',
    explanation: 'Ondsindet software der kan skade din enhed eller stjæle dine oplysninger.',
    metaphor: '🦠 Digitale bakterier der forsøger at inficere din computer.',
    category: 'sikkerhed',
  },
  {
    term: 'Pop-up',
    explanation: 'Et vindue der pludselig dukker op på skærmen, ofte en reklame eller en advarsel.',
    metaphor: '📢 En irriterende sælger der hopper op foran dig på gaden.',
    category: 'sikkerhed',
  },

  // === ICLOUD ===
  {
    term: 'iCloud',
    explanation: 'Apples cloud-tjeneste der gemmer dine billeder, kontakter og filer sikkert.',
    metaphor: '☁️ Apples digitale bankboks i skyen for alle dine ting.',
    category: 'icloud',
  },
  {
    term: 'Backup',
    explanation: 'En sikkerhedskopi af dine filer og data, så du kan gendanne dem hvis noget går galt.',
    metaphor: '🗄️ En fotokopi af alt dit vigtige, gemt et sikkert sted.',
    example: 'Sørg for at lave backup før du opdaterer telefonen.',
    category: 'icloud',
  },
  {
    term: 'Synkronisering',
    explanation: 'At holde data ens på tværs af flere enheder automatisk.',
    example: 'Dine kontakter synkroniseres mellem iPhone og iPad via iCloud.',
    category: 'icloud',
  },
  {
    term: 'Gendannelse',
    explanation: 'At hente dine data tilbage fra en backup efter f.eks. at have købt ny telefon.',
    example: 'Efter at have sat din nye iPhone op, kan du gendanne fra iCloud-backup.',
    category: 'icloud',
  },

  // === BESKEDER ===
  {
    term: 'SMS',
    explanation: 'Short Message Service - en kort tekstbesked du sender fra din telefon.',
    example: 'Jeg sender lige en SMS til dig med adressen.',
    category: 'beskeder',
  },
  {
    term: 'iMessage',
    explanation: 'Apples gratis beskedtjeneste der sender beskeder over internettet i stedet for som SMS.',
    example: 'Blå bobler i Beskeder-appen betyder det er en iMessage.',
    category: 'beskeder',
  },
  {
    term: 'Emoji',
    explanation: 'Små billedsymboler du kan sende i beskeder (smileys, hjerter, dyr osv.).',
    example: '😊❤️👍 er populære emojis.',
    category: 'beskeder',
  },
  {
    term: 'Gruppesamtale',
    explanation: 'En beskedtråd med flere personer på én gang.',
    example: 'Opret en gruppesamtale med hele familien.',
    category: 'beskeder',
  },

  // === APPS ===
  {
    term: 'App Store',
    explanation: 'Apples butik hvor du henter apps til iPhone og iPad.',
    metaphor: '🏪 Et stort indkøbscenter kun for apps.',
    category: 'apps',
  },
  {
    term: 'Abonnement',
    explanation: 'En app eller tjeneste du betaler for løbende (hver måned eller år).',
    example: 'Netflix og Spotify er abonnementer.',
    category: 'apps',
  },
  {
    term: 'In-app køb',
    explanation: 'Køb du foretager inde i en app, f.eks. ekstra liv i et spil.',
    metaphor: '💳 Butikker inde i butikken der vil have flere penge.',
    category: 'apps',
  },
];

const categoryLabels: Record<string, { label: string; icon: React.ElementType }> = {
  alle: { label: 'Alle', icon: BookOpen },
  generelt: { label: 'Generelt', icon: Smartphone },
  sikkerhed: { label: 'Sikkerhed', icon: Shield },
  icloud: { label: 'iCloud', icon: Cloud },
  beskeder: { label: 'Beskeder', icon: MessageSquare },
  forbindelse: { label: 'Forbindelse', icon: Wifi },
  apps: { label: 'Apps', icon: Smartphone },
};

const TechDictionary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [dbEntries, setDbEntries] = useState<DictionaryEntry[]>([]);

  // Fetch entries from database
  useEffect(() => {
    const fetchDbEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('glossary_terms')
          .select('term, definition, example, category');

        if (error) throw error;

        if (data) {
          const mapped = data.map(item => ({
            term: item.term,
            explanation: item.definition,
            example: item.example || undefined,
            category: item.category || 'generelt',
          }));
          setDbEntries(mapped);
        }
      } catch (error) {
        console.log('Using hardcoded entries only');
      }
    };

    fetchDbEntries();
  }, []);

  // Merge hardcoded and DB entries, prioritizing hardcoded (they have metaphors)
  const allEntries = useMemo(() => {
    const hardcodedTerms = new Set(hardcodedEntries.map(e => e.term.toLowerCase()));
    const uniqueDbEntries = dbEntries.filter(e => !hardcodedTerms.has(e.term.toLowerCase()));
    return [...hardcodedEntries, ...uniqueDbEntries].sort((a, b) => a.term.localeCompare(b.term, 'da'));
  }, [dbEntries]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(allEntries.map(e => e.category));
    return ['alle', ...Array.from(cats)].filter(c => categoryLabels[c]);
  }, [allEntries]);

  const filteredEntries = allEntries.filter(entry => {
    const matchesSearch = 
      entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'alle' || entry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group entries by first letter
  const groupedEntries = useMemo(() => {
    const groups: Record<string, DictionaryEntry[]> = {};
    filteredEntries.forEach(entry => {
      const firstLetter = entry.term.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  // Get all available letters
  const availableLetters = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => a.localeCompare(b, 'da'));
  }, [groupedEntries]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center">
          <Link to="/dashboard" className="flex items-center gap-2 text-primary font-medium">
            <ChevronLeft className="h-5 w-5" />
            Tilbage
          </Link>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4" />
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-info/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-8 w-8 text-info" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Tech-Ordbogen</h1>
            <p className="text-muted-foreground">
              {allEntries.length} tekniske ord forklaret i et sprog du kan forstå
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Hvad leder du efter?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-14 text-base"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide mb-4">
            <div className="flex gap-2 min-w-max">
              {categories.map(cat => {
                const catInfo = categoryLabels[cat];
                if (!catInfo) return null;
                const Icon = catInfo.icon;
                const isActive = selectedCategory === cat;
                
                return (
                  <Button
                    key={cat}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 gap-2 rounded-full transition-all min-h-[44px] px-4 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {catInfo.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Alphabet Navigation */}
          {availableLetters.length > 0 && !searchQuery && (
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-3 mb-4 -mx-4 px-4">
              <div className="flex flex-wrap gap-1 justify-center">
                {availableLetters.map(letter => (
                  <button
                    key={letter}
                    onClick={() => scrollToLetter(letter)}
                    className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dictionary entries grouped by letter */}
          {availableLetters.length > 0 ? (
            <div className="space-y-6">
              {availableLetters.map(letter => (
                <div key={letter} id={`letter-${letter}`}>
                  <h2 className="text-2xl font-bold text-primary mb-3 sticky top-16 bg-background/95 backdrop-blur py-2 z-5">
                    {letter}
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {groupedEntries[letter].map((entry, index) => (
                      <AccordionItem key={`${letter}-${entry.term}`} value={`item-${letter}-${index}`}>
                        <AccordionTrigger className="text-lg font-medium hover:no-underline py-4">
                          <div className="flex items-center gap-2 text-left">
                            {entry.term}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                              {categoryLabels[entry.category]?.label || entry.category}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-4">
                          <p className="text-muted-foreground text-base">{entry.explanation}</p>
                          
                          {entry.example && (
                            <div className="p-3 rounded-lg bg-muted/50 border border-border">
                              <p className="text-sm">
                                <span className="font-medium">Eksempel:</span> {entry.example}
                              </p>
                            </div>
                          )}
                          
                          {entry.metaphor && (
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                              <p className="font-medium text-primary">{entry.metaphor}</p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Ingen resultater for "{searchQuery}"
                {selectedCategory !== 'alle' && ` i kategorien "${categoryLabels[selectedCategory]?.label}"`}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('alle');
                }}
              >
                Nulstil søgning
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TechDictionary;