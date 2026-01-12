import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface HelpContent {
  title: string;
  description: string;
  tips: string[];
  link?: { label: string; href: string };
}

const helpContentMap: Record<string, HelpContent> = {
  '/dashboard': {
    title: 'Dit overblik',
    description: 'Her er dit overblik. Under "Dine Værktøjer" finder du dine hjælpemidler.',
    tips: [
      'Tryk på et værktøj for at åbne det',
      'Hold fingeren nede på en knap for at flytte rundt på dem',
      'Brug AI-chatten nederst, hvis du har spørgsmål',
    ],
  },
  '/settings': {
    title: 'Indstillinger',
    description: 'Her kan du styre din konto og se dit abonnement.',
    tips: [
      'Se og administrer dit abonnement',
      'Inviter en hjælper (Trusted Helper) til at hjælpe dig',
      'Opdater dine kontaktoplysninger',
    ],
  },
  '/tools/medical-id': {
    title: 'Dit Nød-ID',
    description: 'Sæt dine helbredsoplysninger op så reddere kan se dem.',
    tips: [
      'Tilføj din medicin og allergier',
      'Vælg en nødkontakt fra din telefonbog',
      'Husk at slå "Vis på låst skærm" til',
    ],
  },
  '/panic': {
    title: 'Tryghedsknappen',
    description: 'Få hurtig hjælp hvis du er udsat for svindel.',
    tips: [
      'Vælg hvad der er sket for at få den rigtige hjælp',
      'Du kan ringe direkte til bank, politi eller din hjælper',
      'Du får en handlingsplan med præcise trin',
    ],
  },
  '/tools/cleaning-guide': {
    title: 'Rengøringsguide',
    description: 'Hold din enhed hurtig og ryddelig.',
    tips: [
      'Start med de opgaver der frigør mest plads',
      'Sæt flueben når du har gjort en opgave færdig',
      'Gentag rengøringen hver 2-3 måned',
    ],
  },
  '/tools/guest-wifi': {
    title: 'Del WiFi med gæster',
    description: 'Lær at dele din WiFi nemt med Apple-deling.',
    tips: [
      'Din gæst skal stå tæt ved dig',
      'Begge enheder skal have WiFi og Bluetooth slået til',
      'Det virker kun mellem Apple-enheder',
    ],
  },
  '/tools/password-generator': {
    title: 'Adgangskode-generator',
    description: 'Opret stærke adgangskoder du kan huske.',
    tips: [
      'De tre ord danner en sætning du kan visualisere',
      'Tallet gør koden unik for hver side',
      'Gem koden i din kode-mappe bagefter',
    ],
    link: { label: 'Åbn kode-mappe', href: '/kode-mappe' },
  },
  '/battery-doctor': {
    title: 'Batteri-Doktor',
    description: 'Tjek og forbedr dit batteris sundhed.',
    tips: [
      'Batterikapacitet under 80% kan betyde det er tid til udskiftning',
      'Undgå at lade til 100% hver gang - 80% er bedre',
      'Hold telefonen kølig for at bevare batteriet',
    ],
  },
  '/hardware-detective': {
    title: 'Hardware-Detektiv',
    description: 'Find og løs problemer med din enhed.',
    tips: [
      'Vælg din enhed først for relevante løsninger',
      'Prøv de nemme løsninger først',
      'Genstart din enhed som første forsøg',
    ],
  },
  '/checkin': {
    title: 'Månedligt tjek',
    description: 'Hold din enhed sund med regelmæssige tjek.',
    tips: [
      'Svar ærligt på spørgsmålene for bedste resultat',
      'Det tager kun 2-3 minutter',
      'Du får personlige anbefalinger bagefter',
    ],
  },
  '/security-check': {
    title: 'Sikkerhedstjek',
    description: 'Tjek om dine indstillinger er sikre.',
    tips: [
      'Grønne flueben betyder alt er godt',
      'Følg vejledningen for at rette problemer',
      'Kør tjekket igen efter du har ændret indstillinger',
    ],
  },
  '/kode-mappe': {
    title: 'Din krypterede kode-mappe',
    description: 'Gem alle dine adgangskoder sikkert ét sted.',
    tips: [
      'Alt er krypteret - kun du kan se det',
      'Brug en adgangskode du kan huske',
      'Organiser i mapper for nemmere overblik',
    ],
  },
  '/safety': {
    title: 'Sikkerhedsskjoldet',
    description: 'Her ser du, om din enhed er opdateret og sikker. Vi tjekker automatisk for dig.',
    tips: [
      'Upload et screenshot af en mistænkelig besked',
      'AI\'en analyserer om det er svindel',
      'Du får en klar vurdering: trygt eller farligt',
    ],
  },
  '/guides': {
    title: 'Mini-guides',
    description: 'Her finder du trin-for-trin vejledninger, der hjælper dig med hverdagens IT-udfordringer.',
    tips: [
      'Brug søgefeltet øverst til at finde guides',
      'Vælg en kategori for at filtrere',
      'Klik på en guide for at se alle trin med billeder',
    ],
  },
  '/help': {
    title: 'Hjælp & Support',
    description: 'Her kan du skrive til os, hvis du har problemer.',
    tips: [
      'Du kan se dine tidligere sager her',
      'Du får svar fra os i din indbakke',
      'Beskriv dit problem så tydeligt som muligt',
    ],
  },
  '/tools/scam-quiz': {
    title: 'Svindel-Quiz',
    description: 'Test din evne til at spotte svindel.',
    tips: [
      'Læs scenariet grundigt før du svarer',
      'Tænk over om afsenderen virker ægte',
      'Banker beder aldrig om din kode via SMS',
    ],
  },
  '/tools/screenshot-ai': {
    title: 'Skærmbillede-AI',
    description: 'Få forklaret hvad du ser på skærmen.',
    tips: [
      'Tag et screenshot af det du vil have forklaret',
      'Upload billedet her',
      'AI\'en forklarer hvad du ser i simple ord',
    ],
  },
};

const defaultHelp: HelpContent = {
  title: 'Brug for hjælp?',
  description: 'Vi er her for at hjælpe dig.',
  tips: [
    'Følg trinene på skærmen',
    'Brug AI-chatten i højre hjørne for spørgsmål',
    'Gå tilbage til dashboard hvis du vil prøve noget andet',
  ],
};

interface ToolPageHelpButtonProps {
  inline?: boolean;
}

export function ToolPageHelpButton({ inline = false }: ToolPageHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Get help content for current path
  const helpContent = helpContentMap[location.pathname] || defaultHelp;

  return (
    <>
      {/* Badge button - small notification-style on icon, larger on desktop */}
      <button
        onClick={() => setIsOpen(true)}
        className={`${inline ? 'relative' : 'absolute -top-1 -right-1'} z-40 w-6 h-6 md:w-7 md:h-7 min-h-0 min-w-0 p-0 rounded-full bg-secondary text-secondary-foreground shadow-md border border-border inline-flex items-center justify-center leading-none transition-all duration-200 hover:scale-110`}
        aria-label="Hjælp om denne side"
      >
        <HelpCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </button>

      {/* Help Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              {helpContent.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              {helpContent.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Tips List */}
            <ul className="space-y-3">
              {helpContent.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-foreground">{tip}</span>
                </li>
              ))}
            </ul>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {helpContent.link && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = helpContent.link!.href;
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {helpContent.link.label}
                </Button>
              )}
              
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setIsOpen(false)}
              >
                Luk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
