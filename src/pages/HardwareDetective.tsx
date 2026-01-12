import { useState } from 'react';
import { BackButton } from '@/components/layout/BackButton';
import { DeviceSelector, DeviceType } from '@/components/ui/DeviceSelector';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Smartphone, 
  Power, 
  Volume2, 
  Cable, 
  BellOff,
  Battery,
  Camera,
  Fingerprint,
  Tablet,
  Monitor,
  Keyboard,
  Mouse,
  Usb,
  Search,
  Wrench,
  Hand,
  RotateCcw,
  BatteryWarning,
  MonitorOff,
  Wifi,
  Bluetooth,
  HardDrive,
  Thermometer,
  MousePointer,
  AlertTriangle,
  MessageCircleQuestion
} from 'lucide-react';
import { InteractiveTroubleshooter } from '@/components/hardware/InteractiveTroubleshooter';

interface HardwareItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ElementType;
}

// TroubleshootingItem interface moved below hardware arrays

const iphoneHardware: HardwareItem[] = [
  {
    id: 'power',
    question: 'Hvor tænder/slukker jeg?',
    answer: 'Knappen på højre side (Sideknappen). Hold den inde sammen med en lydknap i 3 sekunder for at slukke helt. Der kommer en skyder på skærmen du skal trække.',
    icon: Power,
  },
  {
    id: 'volume',
    question: 'Hvor skruer jeg op og ned for lyden?',
    answer: 'De to knapper på venstre side af telefonen. Den øverste skruer op, den nederste skruer ned. Du kan også bruge Indstillinger → Lyde & Følbarhed.',
    icon: Volume2,
  },
  {
    id: 'silent',
    question: 'Hvad gør den lille kontakt på siden?',
    answer: 'Det er Lydløs-kontakten (over lydknapperne). Hvis du kan se en orange/rød farve, er telefonen på lydløs. Skub den op for at slå lyd til igen.',
    icon: BellOff,
  },
  {
    id: 'port',
    question: 'Hvad er det lille stik i bunden?',
    answer: 'Det er Lightning-porten (ældre iPhones) eller USB-C (iPhone 15 og nyere). Her sætter du opladeren ind. Tip: Rens den forsigtigt med en tandstikker hvis opladeren ikke virker.',
    icon: Cable,
  },
  {
    id: 'camera',
    question: 'Hvor er kameraet?',
    answer: 'Hovedkameraet er på bagsiden (det store "øje"). Selfie-kameraet er øverst på forsiden, i notch/Dynamic Island. Pas på ikke at dække det med fingrene når du tager billeder!',
    icon: Camera,
  },
  {
    id: 'battery',
    question: 'Hvordan ser jeg batteriniveauet?',
    answer: 'Batteriikonet vises øverst til højre på skærmen. Gå til Indstillinger → Batteri for at se detaljeret batteribrug og -sundhed.',
    icon: Battery,
  },
  {
    id: 'faceid',
    question: 'Hvad er Face ID / Touch ID?',
    answer: 'Face ID (nyere iPhones): Kameraet øverst genkender dit ansigt. Touch ID (ældre iPhones): Hjem-knappen læser dit fingeraftryk. Bruges til at låse telefonen op og godkende køb.',
    icon: Fingerprint,
  },
];

const ipadHardware: HardwareItem[] = [
  {
    id: 'power',
    question: 'Hvor tænder/slukker jeg min iPad?',
    answer: 'Knappen øverst på iPad (i kanten). Hold den inde i 3 sekunder sammen med en lydknap for at slukke. På nyere iPads sidder knappen også øverst.',
    icon: Power,
  },
  {
    id: 'volume',
    question: 'Hvor er lydknapperne?',
    answer: 'På højre side (eller øverst, afhængigt af model). De to knapper styrer lydstyrken. Den øverste skruer op.',
    icon: Volume2,
  },
  {
    id: 'port',
    question: 'Hvad er stikket i bunden?',
    answer: 'USB-C (nyere iPads) eller Lightning (ældre iPads). Her tilsluttes oplader, tastatur eller andre tilbehør.',
    icon: Cable,
  },
  {
    id: 'homebutton',
    question: 'Har min iPad en Hjem-knap?',
    answer: 'Ældre iPads har en rund knap nederst på forsiden (Hjem-knappen). Nyere iPads har ingen knap - du swiper op fra bunden i stedet.',
    icon: Smartphone,
  },
  {
    id: 'pencil',
    question: 'Kan jeg bruge en pen til min iPad?',
    answer: 'Ja! Apple Pencil virker med de fleste iPads. Den ældre version oplades ved at sætte den i Lightning-porten. Den nyere version klikker magnetisk fast på kanten.',
    icon: Tablet,
  },
];

const macHardware: HardwareItem[] = [
  {
    id: 'power',
    question: 'Hvor er tænd-knappen?',
    answer: 'På MacBooks: Øverst til højre på tastaturet (kan også være Touch ID-knappen). På iMac: Bag på computeren i nederste venstre hjørne. På Mac Mini: Bag på enheden.',
    icon: Power,
  },
  {
    id: 'trackpad',
    question: 'Hvad er Trackpad?',
    answer: 'Den store plade under tasterne på MacBook. Den fungerer som din mus. Tryk for at klikke, brug to fingre til at scrolle. Du kan også tilslutte en ekstern mus.',
    icon: Mouse,
  },
  {
    id: 'ports',
    question: 'Hvilke stik har min Mac?',
    answer: 'USB-C/Thunderbolt (ovale stik til opladning og tilbehør), HDMI (til skærm), SD-kortlæser, og evt. MagSafe (magnetisk oplader). Ældre Macs har også USB-A (de firkantede).',
    icon: Usb,
  },
  {
    id: 'keyboard',
    question: 'Hvilke specielle taster har Mac-tastaturet?',
    answer: 'Command (⌘) = Macs vigtigste tast (som Ctrl på Windows). Option (⌥) = Alt. Fn = Funktionstaster. Øverste række har genveje til lyd, lysstyrke m.m.',
    icon: Keyboard,
  },
  {
    id: 'touchid',
    question: 'Hvad er Touch ID på Mac?',
    answer: 'Knappen øverst til højre på tastaturet med fingeraftrykslæser. Bruges til at låse Mac op, godkende køb og indtaste adgangskoder automatisk.',
    icon: Fingerprint,
  },
  {
    id: 'display',
    question: 'Hvordan tilslutter jeg en ekstern skærm?',
    answer: 'Brug et USB-C til HDMI kabel (eller adapter). Sæt det i USB-C porten på din Mac og HDMI-stikket i skærmen. Mac finder automatisk skærmen.',
    icon: Monitor,
  },
];

interface TroubleshootingItem {
  id: string;
  problem: string;
  symptom: string;
  explanation: string;
  technicalNote?: string;
  quickFix: string[];
  icon: React.ElementType;
  severity: 'low' | 'medium' | 'high';
  deviceTypes: ('iphone' | 'ipad' | 'mac' | 'all')[];
}

// Remove references to external repair guides in technicalNote

const troubleshootingItems: TroubleshootingItem[] = [
  // === UNIVERSAL ISSUES ===
  {
    id: 'ghost-touch',
    problem: 'Skærmen trykker af sig selv (Ghost Touch)',
    symptom: '👻 Apps åbner uden du rører skærmen. Bogstaver skrives af sig selv. Skærmen "hopper" rundt.',
    explanation: 'Skyldes ofte snavs under skærmbeskytteren, defekt oplader der sender elektrisk støj gennem skærmen, eller fysisk skade på skærmen/digitizeren.',
    technicalNote: '⚠️ Teknisk info: Ghost touch kan skyldes et beskadiget flex-kabel mellem skærm og logicboard, eller en defekt touch-controller IC. Hvis problemet opstod efter et tab, er skærmen sandsynligvis beskadiget og skal skiftes af en tekniker.',
    quickFix: [
      'Tag opladerkablet ud - lad enheden køre på batteri i 5 min',
      'Fjern skærmbeskytter og cover helt',
      'Rens skærmen med en let fugtig mikrofiberklud (ikke våd!)',
      'Lav Hard Reset: Tryk Lyd Op → slip → Tryk Lyd Ned → slip → Hold Sideknap 10-15 sek',
      'Prøv KUN med original Apple-oplader',
      '🔧 Hvis problemet fortsætter efter alle trin: Skærmen er sandsynligvis beskadiget → Book tid hos Apple eller autoriseret reparatør'
    ],
    icon: Hand,
    severity: 'medium',
    deviceTypes: ['iphone', 'ipad'],
  },
  {
    id: 'battery-drops',
    problem: 'Batteriet springer i procent / Slukker på 30%',
    symptom: '🔋 Batteriprocenten falder pludseligt (fx 45% → 12%). Enheden slukker selvom den viser strøm.',
    explanation: 'Batteriets software-kalibrering er forvirret, eller batteriet er fysisk slidt efter mange opladecyklusser.',
    technicalNote: '⚠️ Teknisk info: Lithium-ion batterier mister kapacitet over tid. Efter ~500 fulde cyklusser er batteriet typisk på 80%. Under 80% sundhed anbefales udskiftning. Batteribytning kræver specialværktøj.',
    quickFix: [
      'Tjek batterisundhed: Indstillinger → Batteri → Batterisundhed (under 80% = slidt)',
      'Kalibrering: Lad enheden løbe HELT tør til den slukker',
      'Lad den ligge slukket i 2-3 timer',
      'Oplad til 100% UDEN at tænde undervejs',
      'Lad den sidde i opladeren 1 time ekstra efter 100%',
      '🔧 Under 80% sundhed: Batteriet bør udskiftes hos Apple eller autoriseret reparatør'
    ],
    icon: BatteryWarning,
    severity: 'medium',
    deviceTypes: ['all'],
  },
  {
    id: 'frozen-screen',
    problem: 'Enheden frosset / Sort skærm',
    symptom: '🥶 Skærmen reagerer ikke på tryk. Kan ikke slukkes normalt. Skærmen er helt sort men vibrerer måske.',
    explanation: 'Oftest en software-fejl hvor systemet er gået ned. I sjældne tilfælde kan det være fysisk skade på skærmen eller display-kablet.',
    technicalNote: '⚠️ Teknisk info: Hvis Hard Reset ikke virker OG enheden ikke viser Apple-logo efter opladning, kan det skyldes: 1) Løst display-kabel, 2) Defekt LCD/OLED-panel, eller 3) Problem med logicboard. Kræver professionel diagnose.',
    quickFix: [
      'Hard Reset til iPhone 8+ / iPad med Face ID:',
      '1. Tryk Lyd OP én gang (slip)',
      '2. Tryk Lyd NED én gang (slip)',
      '3. Hold Sideknappen/Top-knappen NEDE i 10-15 sekunder',
      '4. Slip når Apple-logoet vises',
      'Sæt opladeren i og vent 15 min, prøv Hard Reset igen',
      '🔧 Ingen reaktion efter opladning + Hard Reset: Kan være skærm- eller hardware-skade → Kontakt reparatør'
    ],
    icon: RotateCcw,
    severity: 'medium',
    deviceTypes: ['iphone', 'ipad'],
  },
  {
    id: 'flickering',
    problem: 'Skærmen blinker / flimrer',
    symptom: '💡 Skærmen blinker hurtigt. Lysstyrken ændrer sig uventet. Billedet "hakker" eller får striber.',
    explanation: 'Kan skyldes software (auto-lysstyrke, True Tone) eller hardware (løst display-kabel, beskadiget skærm, defekt baggrundsbelysning).',
    technicalNote: '⚠️ Teknisk info: Flimren kan indikere: 1) Defekt LCD-driver IC, 2) Løst/beskadiget flex-kabel, 3) Baggrundsbelysning der svigter. Hvis problemet opstod efter et tab eller tryk, er det sandsynligvis hardware. Grønne/lyserøde striber = skærmskade.',
    quickFix: [
      'Slå auto-lysstyrke fra: Indstillinger → Tilgængelighed → Skærm og tekst → Automatisk lysstyrke OFF',
      'Slå True Tone fra: Indstillinger → Skærm → True Tone OFF',
      'Genstart enheden normalt',
      'Nulstil indstillinger (sletter IKKE data): Indstillinger → Generelt → Overfør/Nulstil → Nulstil alle indstillinger',
      '🔧 Striber, farvefejl, eller flimren efter tab: Skærmskade → Skal repareres hos tekniker'
    ],
    icon: MonitorOff,
    severity: 'medium',
    deviceTypes: ['iphone', 'ipad'],
  },
  {
    id: 'not-charging',
    problem: 'Enheden lader ikke op',
    symptom: '🔌 Ingen reaktion når opladerkablet sættes i. Lynet vises ikke. Lader meget langsomt.',
    explanation: 'Oftest snavs/fnug i porten, defekt kabel, eller svag opladerblok. Kan også være en defekt port.',
    technicalNote: '⚠️ Teknisk info: Lightning/USB-C porten er loddet direkte til logicboard på iPhones (svær reparation). På iPad er porten ofte et separat modul (nemmere). Vandskade kan korrodere porten indvendigt.',
    quickFix: [
      'Rens porten FORSIGTIGT med en træ-tandstik (ALDRIG metal!)',
      'Brug en blød børste eller trykluft til støv',
      'Prøv et ANDET kabel (gerne original Apple-kabel)',
      'Prøv en ANDEN opladerblok (mindst 20W til hurtig opladning)',
      'Prøv trådløs opladning hvis enheden understøtter det',
      '🔧 Ingen reaktion med flere kabler/opladere: Porten er defekt → Kontakt reparatør'
    ],
    icon: Cable,
    severity: 'high',
    deviceTypes: ['iphone', 'ipad'],
  },
  {
    id: 'no-sound',
    problem: 'Ingen lyd / Højttaleren virker ikke',
    symptom: '🔇 Kan ikke høre ringetoner, musik eller opkald. Vibration virker stadig.',
    explanation: 'Tjek om Lydløs-kontakten er aktiv. Kan også skyldes tilstoppede højttaler-åbninger eller Bluetooth-forbindelse.',
    quickFix: [
      'iPhone: Tjek Lydløs-kontakten på venstre side - orange = lydløs, skub OP',
      'Skru op for lyden med knapperne på siden',
      'Gå til Indstillinger → Bluetooth → slå fra',
      'Rens højttaleren i bunden forsigtigt med en blød børste',
      'Prøv at afspille en video på YouTube for at teste',
      'Genstart enheden'
    ],
    icon: Volume2,
    severity: 'low',
    deviceTypes: ['iphone', 'ipad'],
  },

  // === WI-FI ISSUES ===
  {
    id: 'wifi-not-connecting',
    problem: 'Wi-Fi forbinder ikke / Falder ud',
    symptom: '📶 Kan ikke finde netværket. Forbinder men mister forbindelsen. "Forkert adgangskode" selvom den er rigtig.',
    explanation: 'Kan skyldes router-problemer, forkerte netværksindstillinger, eller sjældent hardware-fejl i Wi-Fi-chippen.',
    technicalNote: '⚠️ Teknisk info: Wi-Fi og Bluetooth deler ofte samme chip (combo-chip). Hvis BÅDE Wi-Fi og Bluetooth fejler, kan chippen være defekt. Kræver mikroløddning at reparere.',
    quickFix: [
      'Slå Wi-Fi fra og til igen i Indstillinger',
      'Glem netværket: Indstillinger → Wi-Fi → [dit netværk] → Glem dette netværk → Forbind igen',
      'Genstart din router (tag stikket ud i 30 sek)',
      'Nulstil netværksindstillinger: Indstillinger → Generelt → Overfør/Nulstil → Nulstil netværksindstillinger',
      'Prøv at forbinde til et ANDET netværk (test om det er enheden eller routeren)',
      '🔧 Virker på andre netværk men ikke derhjemme: Router-problem. Virker ingensteds: Mulig hardware-fejl.'
    ],
    icon: Wifi,
    severity: 'medium',
    deviceTypes: ['all'],
  },
  {
    id: 'wifi-slow',
    problem: 'Wi-Fi er meget langsomt',
    symptom: '🐌 Sider loader langsomt. Video buffer konstant. Downloads tager evigheder.',
    explanation: 'Kan skyldes afstand til router, interferens fra andre enheder, eller for mange enheder på netværket.',
    quickFix: [
      'Flyt tættere på routeren og test hastigheden igen',
      'Genstart routeren (tag stikket ud i 30 sek)',
      'Forbind til 5GHz netværk i stedet for 2.4GHz hvis muligt',
      'Luk apps der bruger data i baggrunden',
      'Tjek om andre enheder i hjemmet bruger meget data (streaming, downloads)',
      'Kontakt din internetudbyder hvis problemet fortsætter'
    ],
    icon: Wifi,
    severity: 'low',
    deviceTypes: ['all'],
  },

  // === BLUETOOTH ISSUES ===
  {
    id: 'bluetooth-not-pairing',
    problem: 'Bluetooth parrer ikke / Finder ikke enhed',
    symptom: '🎧 Kan ikke finde AirPods/højtaler. Forbinder men mister forbindelsen. Dårlig lydkvalitet.',
    explanation: 'Bluetooth-enheder skal være i "parringstilstand". Gamle parringer kan skabe konflikt. Kan sjældent være hardware.',
    technicalNote: '⚠️ Teknisk info: Bluetooth-chippen sidder ofte på logicboard. Hvis Bluetooth er helt gråtonet i Indstillinger, kan chippen være defekt.',
    quickFix: [
      'Sæt Bluetooth-enheden i parringstilstand (se enhedens manual)',
      'Slå Bluetooth fra og til: Indstillinger → Bluetooth',
      'Glem gamle enheder: Indstillinger → Bluetooth → [enhed] → Glem denne enhed',
      'Genstart begge enheder',
      'Nulstil netværksindstillinger: Indstillinger → Generelt → Overfør/Nulstil → Nulstil netværksindstillinger',
      '🔧 Bluetooth gråtonet i Indstillinger: Hardware-fejl → Kontakt reparatør'
    ],
    icon: Bluetooth,
    severity: 'low',
    deviceTypes: ['all'],
  },

  // === MAC-SPECIFIC ISSUES ===
  {
    id: 'mac-slow',
    problem: 'Mac er langsom / Fryser',
    symptom: '🐢 Regnbuehjulet snurrer konstant. Apps tager lang tid at åbne. Blæseren kører hele tiden.',
    explanation: 'Ofte for mange apps åbne, fuld harddisk, eller gamle baggrundsprocesser der bruger ressourcer.',
    technicalNote: '⚠️ Teknisk info: Mac\'er med HDD (harddisk) er markant langsommere end SSD. Opgradering til SSD kan give nyt liv til ældre Macs. På nyere Macs er SSD loddet fast.',
    quickFix: [
      'Tjek lagring: Apple-menu → Om denne Mac → Lagring (brug under 90%)',
      'Luk unødvendige apps: Se Dock for apps med prik under',
      'Genstart Mac\'en (løser mange problemer)',
      'Tjek aktivitetsmonitor: Programmer → Hjælpeværktøjer → Aktivitetsmonitor → se hvad der bruger CPU',
      'Slet store filer/apps du ikke bruger',
      'Overvej at opgradere RAM eller SSD på ældre Macs'
    ],
    icon: HardDrive,
    severity: 'medium',
    deviceTypes: ['mac'],
  },
  {
    id: 'mac-overheating',
    problem: 'Mac bliver meget varm / Blæseren larmer',
    symptom: '🔥 Mac\'en er varm at røre. Blæseren kører højt. Ydelsen falder.',
    explanation: 'Normalt ved tunge opgaver, men kan skyldes blokerede ventilationsåbninger eller støv i blæseren.',
    technicalNote: '⚠️ Teknisk info: Termisk pasta mellem CPU og heatsink tørrer ud over tid (3-5 år). Udskiftning kræver åbning af Mac.',
    quickFix: [
      'Sørg for at ventilationsåbningerne er frie (ikke på dyner/puder)',
      'Luk tunge apps (video-redigering, spil, Chrome med mange faner)',
      'Tjek Aktivitetsmonitor for processer der bruger meget CPU',
      'Genstart Mac\'en',
      'Brug en køleplade/stand til MacBooks',
      '🔧 Konstant overophedning: Kan være støv i blæser eller gammel termisk pasta → Rengøring/service'
    ],
    icon: Thermometer,
    severity: 'medium',
    deviceTypes: ['mac'],
  },
  {
    id: 'mac-trackpad-issues',
    problem: 'Trackpad klikker ikke / Reagerer ikke',
    symptom: '🖱️ Kan ikke klikke. Cursoren hopper rundt. Trackpad føles "død".',
    explanation: 'Kan skyldes snavs, fugt, eller i sjældne tilfælde et hævet batteri der presser mod trackpad.',
    technicalNote: '⚠️ Teknisk info: VIGTIGT - Hvis trackpad\'en buler opad eller ikke kan trykkes ned, kan batteriet være hævet (farligt!). Stop med at bruge Mac\'en og kontakt straks Apple/reparatør.',
    quickFix: [
      'Tjek om trackpad\'en buler op (tegn på hævet batteri - STOP brug!)',
      'Rens trackpad med let fugtig klud',
      'Tjek indstillinger: Systemindstillinger → Trackpad',
      'Prøv "Tap to click" som alternativ: Systemindstillinger → Trackpad → Tryk for at klikke',
      'Genstart Mac\'en',
      '🔧 Bulet trackpad: Hævet batteri = FARLIGT → Kontakt Apple/reparatør STRAKS'
    ],
    icon: MousePointer,
    severity: 'high',
    deviceTypes: ['mac'],
  },
  {
    id: 'mac-external-display',
    problem: 'Ekstern skærm virker ikke',
    symptom: '🖥️ Skærmen viser intet. "Intet signal". Flimrer eller forkerte farver.',
    explanation: 'Ofte kabel/adapter-problemer, forkerte indstillinger, eller inkompatibel skærm.',
    quickFix: [
      'Tjek at kablet sidder ordentligt i begge ender',
      'Prøv et andet kabel eller adapter',
      'Vælg den rigtige indgang på skærmen (HDMI 1, HDMI 2, USB-C osv.)',
      'Gå til Systemindstillinger → Skærme → Registrer skærme',
      'Genstart Mac\'en med skærmen tilsluttet',
      'Tjek at skærmens opløsning understøttes af din Mac'
    ],
    icon: Monitor,
    severity: 'low',
    deviceTypes: ['mac'],
  },

  // === IPAD-SPECIFIC ISSUES ===
  {
    id: 'ipad-pencil-not-working',
    problem: 'Apple Pencil virker ikke',
    symptom: '✏️ Pencil parrer ikke. Streger registreres ikke. Batteri aflader hurtigt.',
    explanation: 'Pencil skal parres via Lightning/magnetisk. Kan være afladet eller defekt spids.',
    technicalNote: '⚠️ Teknisk info: Apple Pencil 1. gen har et batteri der ikke kan udskiftes. Efter ~500 opladninger falder kapaciteten markant. Apple Pencil 2 har bedre holdbarhed.',
    quickFix: [
      'Oplad Pencil: Gen 1 → Sæt i iPad Lightning. Gen 2 → Sæt magnetisk på iPad-siden',
      'Parr igen: Indstillinger → Bluetooth → Glem Apple Pencil → Sæt Pencil i/på iPad',
      'Tjek Pencil-batteri: Swipe ned fra øverste højre hjørne → Widgets',
      'Udskift spidsen hvis den er slidt (skrues af)',
      'Genstart iPad\'en',
      '🔧 Virker stadig ikke efter opladning: Pencil kan være defekt → Kontakt Apple'
    ],
    icon: Tablet,
    severity: 'low',
    deviceTypes: ['ipad'],
  },
  {
    id: 'ipad-keyboard-issues',
    problem: 'Smart/Magic Keyboard virker ikke',
    symptom: '⌨️ Tastatur registreres ikke. Taster virker ikke. Baggrundsbelysning er slukket.',
    explanation: 'Smart Connector skal være ren. Magic Keyboard skal være opladet og parret.',
    quickFix: [
      'Rens Smart Connector (de 3 prikker på iPad\'en) med en tør klud',
      'Rens kontaktpunkterne på tastaturet',
      'Fjern og sæt tastaturet på igen',
      'Magic Keyboard: Oplad via USB-C, tjek Bluetooth-parring',
      'Genstart iPad\'en',
      'Tjek Indstillinger → Generelt → Tastatur → Hardwaretastatur'
    ],
    icon: Keyboard,
    severity: 'low',
    deviceTypes: ['ipad'],
  },
];

const HardwareDetective = () => {
  useScrollRestoration();

  const [device, setDevice] = useState<DeviceType>('iphone');
  const [activeTab, setActiveTab] = useState('interactive');

  const getHardwareItems = () => {
    switch (device) {
      case 'iphone':
        return iphoneHardware;
      case 'ipad':
        return ipadHardware;
      case 'mac':
        return macHardware;
      default:
        return iphoneHardware;
    }
  };

  const getDeviceTitle = () => {
    switch (device) {
      case 'iphone':
        return 'iPhone';
      case 'ipad':
        return 'iPad';
      case 'mac':
        return 'Mac';
      default:
        return 'Enhed';
    }
  };

  const items = getHardwareItems();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center">
          <BackButton />
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-10 w-10 text-primary" />
              </div>
              <ToolPageHelpButton />
            </div>
            <h1 className="text-2xl font-bold mb-2">Hardware-Detektiven</h1>
            <p className="text-muted-foreground">
              Lær hvad knapperne gør - og løs typiske problemer
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="interactive" className="flex items-center gap-2">
                <MessageCircleQuestion className="h-4 w-4" />
                Interaktiv Guide
              </TabsTrigger>
              <TabsTrigger value="hardware" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Knapper & Stik
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Hurtig hjælp
              </TabsTrigger>
            </TabsList>

            {/* Interactive Tab */}
            <TabsContent value="interactive" className="mt-6">
              {/* Device Selector */}
              <div className="mb-6">
                <DeviceSelector value={device} onChange={setDevice} />
              </div>

              <InteractiveTroubleshooter device={device} />
            </TabsContent>

            {/* Hardware Tab */}
            <TabsContent value="hardware" className="mt-6">
              {/* Device Selector */}
              <div className="mb-6">
                <DeviceSelector value={device} onChange={setDevice} />
              </div>

              {/* Info Card */}
              <div className="card-elevated p-4 mb-6 bg-info/5 border border-info/20">
                <p className="text-sm text-center">
                  Lær hvad knapper og stik gør på din <span className="font-medium">{getDeviceTitle()}</span>
                </p>
              </div>

              {/* Hardware Accordion */}
              <Accordion type="single" collapsible className="space-y-3">
                {items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="card-elevated border-none px-0"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{item.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="pl-14">
                          <p className="text-muted-foreground leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>

            {/* Troubleshooting Tab */}
            <TabsContent value="troubleshooting" className="mt-6">
              {/* Device Selector for Troubleshooting */}
              <div className="mb-6">
                <DeviceSelector value={device} onChange={setDevice} />
              </div>

              {/* Info Card */}
              <div className="card-elevated p-4 mb-6 bg-warning/10 border border-warning/20">
                <p className="text-sm text-center">
                  <span className="font-medium">🛠️ Hurtig fejlfinding for {getDeviceTitle()}</span> - med tekniske noter
                </p>
              </div>

              {/* Troubleshooting Accordion - filtered by device */}
              <Accordion type="single" collapsible className="space-y-3">
                {troubleshootingItems
                  .filter(item => item.deviceTypes.includes('all') || item.deviceTypes.includes(device))
                  .map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="card-elevated border-none px-0"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center gap-4 text-left">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              item.severity === 'high' ? 'bg-destructive/10' : 
                              item.severity === 'medium' ? 'bg-warning/10' : 'bg-primary/10'
                            }`}>
                              <IconComponent className={`h-5 w-5 ${
                                item.severity === 'high' ? 'text-destructive' : 
                                item.severity === 'medium' ? 'text-warning' : 'text-primary'
                              }`} />
                            </div>
                            <div>
                              <span className="font-medium block">{item.problem}</span>
                              {item.severity === 'high' && (
                                <span className="text-xs text-destructive font-medium">⚠️ Kræver handling</span>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                          <div className="pl-14 space-y-4">
                            {/* Symptom */}
                            <div className="p-3 rounded-lg bg-secondary">
                              <p className="text-sm font-medium mb-1">Symptomer:</p>
                              <p className="text-sm text-muted-foreground">{item.symptom}</p>
                            </div>

                            {/* Explanation */}
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-sm font-medium mb-1">Hvorfor sker det?</p>
                              <p className="text-sm text-muted-foreground">{item.explanation}</p>
                            </div>

                            {/* Technical Note from iFixit */}
                            {item.technicalNote && (
                              <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-info" />
                                  Teknisk info
                                </p>
                                <p className="text-sm text-muted-foreground">{item.technicalNote}</p>
                              </div>
                            )}
                            
                            {/* Quick Fix - now as numbered steps */}
                            <div>
                              <p className="text-sm font-medium mb-3">⚡ Sådan fikser du det:</p>
                              <ol className="space-y-2">
                                {item.quickFix.map((step, idx) => (
                                  <li key={idx} className="flex gap-3 text-sm">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold aspect-square ${
                                      step.startsWith('🔧') ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary'
                                    }`} style={{ minWidth: '24px', minHeight: '24px' }}>
                                      {step.startsWith('🔧') ? '!' : idx + 1}
                                    </span>
                                    <span className={`pt-0.5 ${step.startsWith('🔧') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                      {step}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
              </Accordion>
            </TabsContent>
          </Tabs>

          {/* Help tip */}
          <div className="mt-8 p-4 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Har du et problem der ikke er her? Brug AI-assistenten nederst til højre!
            </p>
          </div>
        </div>
      </main>

      
    </div>
  );
};

export default HardwareDetective;