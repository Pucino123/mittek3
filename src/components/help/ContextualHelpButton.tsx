import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, X, ExternalLink, MessageCircle } from 'lucide-react';
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
    title: 'Sådan bruger du dit dashboard',
    description: 'Dit dashboard er din startside. Herfra kan du nemt finde alt, hvad du har brug for.',
    tips: [
      'Start med det månedlige tjek for at holde din enhed sund',
      'Brug mini-guides til at lære nye ting',
      'Brug Din Digitale Hjælper nederst, hvis du har spørgsmål',
    ],
  },
  '/guides': {
    title: 'Sådan søger du i guides',
    description: 'Vores guides hjælper dig trin-for-trin med billeder.',
    tips: [
      'Brug søgefeltet øverst til at finde guides',
      'Vælg kategori for at filtrere',
      'Klik på en guide for at se alle trin',
    ],
  },
  '/tools/scam-quiz': {
    title: 'Hvad er phishing?',
    description: 'Phishing er, når svindlere forsøger at narre dig til at give dem dine oplysninger.',
    tips: [
      'Banker og myndigheder beder aldrig om din kode',
      'Tjek altid afsenderens e-mail omhyggeligt',
      'Klik ikke på links i mistænkelige beskeder',
    ],
    link: { label: 'Læs mere om svindel', href: '/safety' },
  },
  '/safety': {
    title: 'Sådan bruger du sikkerhedsskjoldet',
    description: 'Her kan du få tjekket mistænkelige beskeder.',
    tips: [
      'Tag et screenshot af den besked, du er i tvivl om',
      'Upload billedet her, og vores AI analyserer det',
      'Du får en klar vurdering: trygt eller farligt',
    ],
  },
  '/checkin': {
    title: 'Det månedlige tjek',
    description: 'En hurtig gennemgang af din enheds sundhed.',
    tips: [
      'Svar på 3-5 simple spørgsmål',
      'Du får personlige anbefalinger bagefter',
      'Det tager kun 2-3 minutter',
    ],
  },
  '/kode-mappe': {
    title: 'Din krypterede kode-mappe',
    description: 'Gem alle dine adgangskoder sikkert ét sted.',
    tips: [
      'Alt er krypteret - kun du kan se det',
      'Brug en adgangskode, du kan huske',
      'Organiser i mapper for nemmere overblik',
    ],
  },
};

const defaultHelp: HelpContent = {
  title: 'Brug for hjælp?',
  description: 'Vi er her for at hjælpe dig.',
  tips: [
    'Brug Din Digitale Hjælper nederst på skærmen',
    'Se vores mini-guides for trin-for-trin hjælp',
    'Kontakt support, hvis du sidder fast',
  ],
  link: { label: 'Kontakt Support', href: '/help' },
};

export function ContextualHelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Get help content for current path
  const helpContent = helpContentMap[location.pathname] || defaultHelp;

  return (
    <>
      {/* Floating Help Button - left side on mobile, lower position */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-40 w-12 h-12 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border border-border hover:scale-105 bottom-24 right-6 md:bottom-24 md:right-6 max-md:bottom-4 max-md:left-3 max-md:right-auto max-md:w-11 max-md:h-11 max-md:rounded-[22px]"
        aria-label="Hjælp"
      >
        <HelpCircle className="h-6 w-6 max-md:h-5 max-md:w-5" />
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
