import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Phone,
  Wrench,
  Lightbulb
} from 'lucide-react';
import { DeviceType } from '@/components/ui/DeviceSelector';

interface TroubleshootingQuestion {
  id: string;
  question: string;
  helpText?: string;
  options: {
    label: string;
    nextStep: string | 'solution';
    emoji?: string;
  }[];
}

interface TroubleshootingSolution {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  technicalInfo?: string;
  steps: string[];
  needsRepair?: boolean;
  repairNote?: string;
}

interface TroubleshootingFlow {
  id: string;
  name: string;
  icon: string;
  description: string;
  startQuestion: string;
  questions: TroubleshootingQuestion[];
  solutions: TroubleshootingSolution[];
  deviceTypes: DeviceType[];
}

const troubleshootingFlows: TroubleshootingFlow[] = [
  // ============================================
  // MAC-SPECIFIKKE FLOWS
  // ============================================
  {
    id: 'mac-startup-issues',
    name: 'Mac starter ikke',
    icon: '💻',
    description: 'Din Mac vil ikke tænde eller sidder fast ved opstart',
    startQuestion: 'mac-startup-start',
    deviceTypes: ['mac'],
    questions: [
      {
        id: 'mac-startup-start',
        question: 'Hvad sker der når du trykker på tænd-knappen?',
        options: [
          { label: 'Ingenting - helt død', emoji: '💀', nextStep: 'mac-dead' },
          { label: 'Lyd/lys, men sort skærm', emoji: '⬛', nextStep: 'mac-black-screen' },
          { label: 'Sidder fast på Apple-logo', emoji: '🍎', nextStep: 'mac-apple-logo' },
          { label: 'Viser spørgsmålstegn-mappe', emoji: '❓', nextStep: 'mac-question-folder' },
        ],
      },
      {
        id: 'mac-dead',
        question: 'Er din Mac tilsluttet strøm?',
        helpText: 'Tjek at oplader-lyset er tændt (hvis din model har et)',
        options: [
          { label: 'Ja, oplader er tilsluttet', emoji: '🔌', nextStep: 'mac-dead-power' },
          { label: 'Nej, jeg prøver nu', emoji: '⚡', nextStep: 'solution-mac-charge' },
        ],
      },
      {
        id: 'mac-dead-power',
        question: 'Hvornår virkede den sidst?',
        options: [
          { label: 'I går / for nylig', emoji: '📅', nextStep: 'solution-mac-smc-reset' },
          { label: 'Efter væske-uheld', emoji: '💧', nextStep: 'solution-mac-water-damage' },
          { label: 'Efter at den faldt', emoji: '💥', nextStep: 'solution-mac-repair-needed' },
        ],
      },
      {
        id: 'mac-black-screen',
        question: 'Hører du startlyden eller ventilatorer?',
        options: [
          { label: 'Ja, lyd og ventilatorer', emoji: '🔊', nextStep: 'solution-mac-display-issue' },
          { label: 'Ingen lyd', emoji: '🔇', nextStep: 'solution-mac-smc-reset' },
        ],
      },
      {
        id: 'mac-apple-logo',
        question: 'Hvor længe har den vist Apple-logoet?',
        options: [
          { label: 'Over 30 minutter', emoji: '⏰', nextStep: 'solution-mac-safe-mode' },
          { label: 'Den genstarter i loop', emoji: '🔄', nextStep: 'solution-mac-recovery' },
          { label: 'Lige startet', emoji: '⏳', nextStep: 'solution-mac-wait' },
        ],
      },
      {
        id: 'mac-question-folder',
        question: 'Er mappen med spørgsmålstegn permanent?',
        helpText: 'Dette betyder at Mac ikke kan finde startdisken',
        options: [
          { label: 'Ja, forsvinder ikke', emoji: '❓', nextStep: 'solution-mac-startup-disk' },
          { label: 'Vises kort, så starter den', emoji: '✅', nextStep: 'solution-mac-select-startup' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-mac-charge',
        title: 'Oplad din Mac',
        severity: 'low',
        explanation: 'Mac-batteriet kan være helt fladt. Lad den oplade i mindst 30 minutter.',
        steps: [
          'Tilslut MagSafe eller USB-C opladeren',
          'Tjek at strømstikket sidder ordentligt i væggen',
          'Vent mindst 30 minutter før du prøver at tænde',
          'Hold tænd-knappen inde i 10 sekunder',
          'Hvis intet sker: Prøv en anden oplader eller stikkontakt',
        ],
      },
      {
        id: 'solution-mac-smc-reset',
        title: 'Nulstil SMC (System Management Controller)',
        severity: 'medium',
        explanation: 'SMC styrer strøm og hardware. En nulstilling kan løse opstartsproblemer.',
        technicalInfo: 'SMC kontrollerer batteri, ventilatorer, baggrundsbelysning og tænd-funktionen.',
        steps: [
          'For MacBook med Apple Silicon (M1/M2/M3): Sluk og vent 30 sekunder, tænd igen',
          'For Intel MacBook: Sluk Mac\'en helt',
          'Hold Shift + Control + Option + Tænd-knap i 10 sekunder',
          'Slip alle taster og vent 5 sekunder',
          'Tryk på tænd-knappen normalt',
          'For stationær Mac: Tag strømkablet ud i 15 sekunder',
        ],
      },
      {
        id: 'solution-mac-display-issue',
        title: 'Skærmen modtager ikke signal',
        severity: 'medium',
        explanation: 'Mac\'en kører, men skærmen viser ingenting. Prøv disse skridt.',
        steps: [
          'Tryk på en tast eller touchpad for at vække skærmen',
          'Juster lysstyrken med F1/F2 tasterne',
          'Hvis ekstern skærm: Tjek kablet og prøv en anden port',
          'Prøv PRAM-nulstilling: Hold Option+Command+P+R under opstart i 20 sek',
          'Tilslut en ekstern skærm for at teste om det er skærmen',
        ],
        needsRepair: true,
        repairNote: 'Hvis ekstern skærm virker, kan den interne skærm eller kablet være defekt',
      },
      {
        id: 'solution-mac-safe-mode',
        title: 'Start i Fejlsikret tilstand',
        severity: 'medium',
        explanation: 'Fejlsikret tilstand starter Mac\'en med kun det nødvendige.',
        steps: [
          'Sluk Mac\'en helt (hold tænd-knap i 10 sek)',
          'Apple Silicon: Hold tænd-knappen til "Indlæser startvalg" vises, vælg disk, hold Shift',
          'Intel Mac: Tænd og hold Shift-tasten med det samme',
          'Log ind (kan tage tid første gang)',
          'Genstart normalt bagefter - dette rydder caches',
        ],
      },
      {
        id: 'solution-mac-recovery',
        title: 'Brug Gendannelsestilstand',
        severity: 'high',
        explanation: 'Gendannelsestilstand giver adgang til reparationsværktøjer.',
        steps: [
          'Sluk Mac\'en helt',
          'Apple Silicon: Hold tænd-knappen til "Indlæser startvalg", vælg Indstillinger',
          'Intel Mac: Tænd og hold Command+R med det samme',
          'I Gendannelse: Vælg "Diskværktøj" → vælg din disk → "Førstehjælp"',
          'Hvis det ikke hjælper: Vælg "Geninstaller macOS"',
          'VIGTIGT: Tag backup først hvis muligt!',
        ],
        needsRepair: true,
        repairNote: 'Gentagne problemer kan indikere disk-fejl',
      },
      {
        id: 'solution-mac-wait',
        title: 'Vent tålmodigt',
        severity: 'low',
        explanation: 'Efter opdateringer kan Mac\'en tage lang tid om at starte. Vent mindst 30-60 minutter.',
        steps: [
          'Første opstart efter opdatering kan tage op til en time',
          'Lad Mac\'en stå uden at afbryde',
          'Tjek at strømmen er tilsluttet',
          'Hvis den stadig sidder fast efter 1 time: Prøv Fejlsikret tilstand',
        ],
      },
      {
        id: 'solution-mac-startup-disk',
        title: 'Startdisk kan ikke findes',
        severity: 'high',
        explanation: 'Mac\'en kan ikke finde operativsystemet. Dette kan betyde disk-problemer.',
        steps: [
          'Start i Gendannelsestilstand (se instruktioner ovenfor)',
          'Åbn Diskværktøj og kør Førstehjælp',
          'Hvis disken ikke vises: Harddisken kan være defekt',
          'Prøv at geninstallere macOS fra Gendannelse',
          'Overvej professionel dataredning hvis der er vigtige filer',
        ],
        needsRepair: true,
        repairNote: 'Defekt SSD/harddisk kræver udskiftning',
      },
      {
        id: 'solution-mac-select-startup',
        title: 'Vælg den korrekte startdisk',
        severity: 'low',
        explanation: 'Mac\'en ved ikke hvilken disk den skal starte fra.',
        steps: [
          'Gå til Systemindstillinger → Generelt → Startdisk',
          'Vælg din macOS-disk og klik "Genstart"',
          'Alternativt: Hold Option ved opstart for at vælge disk manuelt',
        ],
      },
      {
        id: 'solution-mac-water-damage',
        title: 'Væskeskade kræver professionel hjælp',
        severity: 'high',
        explanation: 'Væske i en Mac kan skade kredsløb. Handle hurtigt!',
        steps: [
          'STRAKS: Vend Mac\'en om så væske kan løbe ud',
          'Tør forsigtigt det ydre af',
          'LAD VÆRE med at tænde den!',
          'LAD VÆRE med at lægge den i ris (det hjælper ikke)',
          'Kontakt en reparatør HURTIGST MULIGT',
          'Jo hurtigere du handler, jo større chance for redning',
        ],
        needsRepair: true,
        repairNote: 'Væskeskade kræver professionel rensning og reparation',
      },
      {
        id: 'solution-mac-repair-needed',
        title: 'Mac\'en kræver reparation',
        severity: 'high',
        explanation: 'Fysisk skade kræver professionel diagnose.',
        steps: [
          'Book tid hos Apple eller autoriseret partner',
          'Beskriv præcis hvad der skete (fald, væske, etc.)',
          'Få et prisoverslag før du godkender reparation',
          'Overvej prisen vs. alder på Mac\'en',
        ],
        needsRepair: true,
        repairNote: 'Kontakt Apple Support eller besøg en Apple Store',
      },
    ],
  },
  {
    id: 'mac-performance',
    name: 'Mac er langsom',
    icon: '🐌',
    description: 'Din Mac føles træg, fryser eller ventilatorer kører konstant',
    startQuestion: 'mac-slow-start',
    deviceTypes: ['mac'],
    questions: [
      {
        id: 'mac-slow-start',
        question: 'Hvornår er din Mac langsom?',
        options: [
          { label: 'Altid, selv efter genstart', emoji: '🔄', nextStep: 'mac-always-slow' },
          { label: 'Kun efter længere brug', emoji: '⏰', nextStep: 'mac-slow-over-time' },
          { label: 'Kun med bestemte programmer', emoji: '📲', nextStep: 'solution-mac-app-heavy' },
          { label: 'Ventilatorer kører konstant', emoji: '💨', nextStep: 'mac-fans' },
        ],
      },
      {
        id: 'mac-always-slow',
        question: 'Hvor meget fri lagerplads har du?',
        helpText: 'Tjek i Æble-menu → Om denne Mac → Flere oplysninger → Lagring',
        options: [
          { label: 'Under 10 GB', emoji: '📦', nextStep: 'solution-mac-storage-full' },
          { label: 'Masser af plads', emoji: '✅', nextStep: 'mac-slow-memory' },
          { label: 'Ved ikke', emoji: '🤷', nextStep: 'solution-mac-check-storage' },
        ],
      },
      {
        id: 'mac-slow-memory',
        question: 'Hvor gammel er din Mac?',
        options: [
          { label: 'Under 3 år', emoji: '🆕', nextStep: 'solution-mac-activity-monitor' },
          { label: '3-6 år', emoji: '📅', nextStep: 'solution-mac-optimize' },
          { label: 'Over 6 år', emoji: '🏛️', nextStep: 'solution-mac-old' },
        ],
      },
      {
        id: 'mac-slow-over-time',
        question: 'Bliver den hurtigere efter genstart?',
        options: [
          { label: 'Ja, midlertidigt', emoji: '✅', nextStep: 'solution-mac-memory-leak' },
          { label: 'Nej, stadig langsom', emoji: '❌', nextStep: 'solution-mac-optimize' },
        ],
      },
      {
        id: 'mac-fans',
        question: 'Hvornår kører ventilatorerne?',
        options: [
          { label: 'Hele tiden, også ved inaktivitet', emoji: '🔥', nextStep: 'solution-mac-check-activity' },
          { label: 'Kun ved tunge opgaver', emoji: '💪', nextStep: 'solution-mac-fans-normal' },
          { label: 'Siden sidst jeg opdaterede', emoji: '⬇️', nextStep: 'solution-mac-indexing' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-mac-storage-full',
        title: 'Frigør diskplads',
        severity: 'medium',
        explanation: 'Mac\'en har brug for mindst 10-15 GB fri plads for at fungere ordentligt.',
        steps: [
          'Åbn Æble-menu → Om denne Mac → Flere oplysninger → Lagring',
          'Klik "Administrer..." for at se hvad der fylder',
          'Tøm Papirkurv (kan fylde meget!)',
          'Slet gamle iOS-sikkerhedskopier i iTunes/Finder',
          'Flyt billeder til iCloud eller ekstern disk',
          'Slet programmer du ikke bruger',
          'Brug programmet "CleanMyMac" eller lignende til at finde skjulte filer',
        ],
      },
      {
        id: 'solution-mac-check-storage',
        title: 'Tjek din lagerplads',
        severity: 'low',
        explanation: 'Først skal vi finde ud af hvor meget plads du har.',
        steps: [
          'Klik på Æble-ikonet øverst til venstre',
          'Vælg "Om denne Mac"',
          'Klik på "Flere oplysninger"',
          'Klik på "Lagring" i sidebaren',
          'Her ser du hvor meget der er brugt og frit',
          'Under 10 GB frit = problem!',
        ],
      },
      {
        id: 'solution-mac-activity-monitor',
        title: 'Find hvad der bruger ressourcer',
        severity: 'low',
        explanation: 'Aktivitetsovervågning viser hvilke programmer der bruger mest.',
        steps: [
          'Åbn "Aktivitetsovervågning" (søg i Spotlight: Cmd+Mellemrum)',
          'Klik på "CPU" fanen og sorter efter "% CPU"',
          'Se om noget bruger over 100% konstant',
          'Klik på "Hukommelse" fanen - tjek "Hukommelsestryk" grafen',
          'Grøn = OK, Gul = presset, Rød = problem',
          'Luk programmer der bruger for meget',
        ],
      },
      {
        id: 'solution-mac-optimize',
        title: 'Optimer din Mac',
        severity: 'low',
        explanation: 'Disse trin kan hjælpe med at gøre din Mac hurtigere.',
        steps: [
          'Genstart Mac\'en (rydder hukommelse)',
          'Reducer programmer der starter ved login: Systemindstillinger → Generelt → Loginobjekter',
          'Fjern unødvendige loginobjekter',
          'Opdater macOS: Systemindstillinger → Generelt → Softwareopdatering',
          'Luk browser-faner du ikke bruger (de bruger hukommelse!)',
          'Overvej at tilføje mere RAM (ældre Mac\'er) eller SSD',
        ],
      },
      {
        id: 'solution-mac-old',
        title: 'Din Mac er ved at være gammel',
        severity: 'medium',
        explanation: 'Mac\'er over 6 år kan have svært ved at køre nyeste software hurtigt.',
        technicalInfo: 'Ældre hardware kan ikke opgraderes, og nye macOS-versioner kræver mere.',
        steps: [
          'Overvej at bruge en ældre macOS-version der passer bedre',
          'Sluk for visuelle effekter: Tilgængelighed → Skærm → "Reducer bevægelse"',
          'Brug lettere alternativer til tunge programmer',
          'Overvej en ny Mac hvis budgettet tillader det',
          'Mac\'er holder typisk 7-10 år med god pleje',
        ],
      },
      {
        id: 'solution-mac-memory-leak',
        title: 'Et program læker hukommelse',
        severity: 'low',
        explanation: 'Nogle programmer frigiver ikke hukommelse ordentligt over tid.',
        steps: [
          'Genstart Mac\'en dagligt eller ugentligt',
          'Identificer synderen: Åbn Aktivitetsovervågning → Hukommelse',
          'Se hvilke apps der bruger mest over tid',
          'Opdater de problematiske apps',
          'Kontakt app-udvikleren hvis problemet fortsætter',
        ],
      },
      {
        id: 'solution-mac-app-heavy',
        title: 'Programmet kræver mange ressourcer',
        severity: 'low',
        explanation: 'Nogle programmer er naturligt ressourcekrævende.',
        steps: [
          'Video- og fotoredigering, 3D-arbejde og spil bruger mange ressourcer',
          'Luk andre programmer mens du bruger tunge apps',
          'Tjek minimumskrav for programmet',
          'Overvej at opgradere RAM eller skifte til en kraftigere Mac',
          'Brug "optimerede" versioner af filer når muligt',
        ],
      },
      {
        id: 'solution-mac-check-activity',
        title: 'Find hvad der kører i baggrunden',
        severity: 'medium',
        explanation: 'Noget kører sandsynligvis tungt i baggrunden.',
        steps: [
          'Åbn Aktivitetsovervågning (søg med Cmd+Mellemrum)',
          'Sorter efter CPU-forbrug',
          'Kig efter processer der konstant bruger meget',
          '"kernel_task" bruger meget = Mac\'en prøver at køle ned',
          'Ukendte processer med højt forbrug kan være malware - kør en scanning',
          'Luk eller afinstaller problematiske programmer',
        ],
      },
      {
        id: 'solution-mac-fans-normal',
        title: 'Ventilatorer ved tungt arbejde er normalt',
        severity: 'low',
        explanation: 'Mac\'en bruger ventilatorer til at køle processoren under belastning.',
        steps: [
          'Ved videoredigering, spil, etc. er det helt normalt',
          'Sørg for at ventilationsåbningerne ikke er blokeret',
          'Brug Mac\'en på en hård overflade (ikke dyne eller pude)',
          'Rens eventuel støv fra ventilationsgitre',
          'Høje temperaturer i rummet gør ventilatorer mere aktive',
        ],
      },
      {
        id: 'solution-mac-indexing',
        title: 'Spotlight indekserer efter opdatering',
        severity: 'low',
        explanation: 'Efter macOS-opdateringer genindekserer Spotlight alle filer, hvilket bruger ressourcer.',
        steps: [
          'Dette er normalt og stopper af sig selv',
          'Lad Mac\'en stå tændt natten over',
          'Tjek status: Klik på søgeluppen og se om der står "Indekserer..."',
          'Det kan tage flere timer første gang',
          'Brug Mac\'en normalt imens - det går bare lidt langsommere',
        ],
      },
    ],
  },
  {
    id: 'mac-keyboard-trackpad',
    name: 'Tastatur & Pegefelt',
    icon: '⌨️',
    description: 'Tastatur, pegefelt eller mus fungerer ikke korrekt',
    startQuestion: 'mac-input-start',
    deviceTypes: ['mac'],
    questions: [
      {
        id: 'mac-input-start',
        question: 'Hvad virker ikke?',
        options: [
          { label: 'Tastaturet reagerer ikke', emoji: '⌨️', nextStep: 'mac-keyboard-dead' },
          { label: 'Nogle taster virker ikke', emoji: '🔤', nextStep: 'mac-keys-stuck' },
          { label: 'Pegefeltet reagerer ikke', emoji: '👆', nextStep: 'mac-trackpad-dead' },
          { label: 'Mus forbinder ikke', emoji: '🖱️', nextStep: 'mac-mouse-issue' },
        ],
      },
      {
        id: 'mac-keyboard-dead',
        question: 'Er det et MacBook-tastatur eller eksternt?',
        options: [
          { label: 'Indbygget MacBook-tastatur', emoji: '💻', nextStep: 'solution-mac-builtin-keyboard' },
          { label: 'Eksternt USB/Bluetooth', emoji: '⌨️', nextStep: 'solution-mac-external-keyboard' },
        ],
      },
      {
        id: 'mac-keys-stuck',
        question: 'Hvilke taster virker ikke?',
        options: [
          { label: 'Tilfældige taster', emoji: '🎲', nextStep: 'solution-mac-clean-keyboard' },
          { label: 'En hel række', emoji: '📏', nextStep: 'solution-mac-keyboard-repair' },
          { label: 'Kun specielle taster (F1-F12, etc.)', emoji: '🔢', nextStep: 'solution-mac-function-keys' },
        ],
      },
      {
        id: 'mac-trackpad-dead',
        question: 'Hvornår stoppede pegefeltet med at virke?',
        options: [
          { label: 'Pludseligt', emoji: '⚡', nextStep: 'solution-mac-trackpad-restart' },
          { label: 'Efter væske på det', emoji: '💧', nextStep: 'solution-mac-trackpad-water' },
          { label: 'Klikker ikke ordentligt', emoji: '👆', nextStep: 'solution-mac-trackpad-click' },
        ],
      },
      {
        id: 'mac-mouse-issue',
        question: 'Hvilken type mus?',
        options: [
          { label: 'Apple Magic Mouse', emoji: '🍎', nextStep: 'solution-mac-magic-mouse' },
          { label: 'Anden Bluetooth-mus', emoji: '📶', nextStep: 'solution-mac-bt-mouse' },
          { label: 'USB-mus', emoji: '🔌', nextStep: 'solution-mac-usb-mouse' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-mac-builtin-keyboard',
        title: 'Fejlfind indbygget tastatur',
        severity: 'medium',
        explanation: 'MacBook-tastaturet kan have software- eller hardwareproblemer.',
        steps: [
          'Genstart Mac\'en først',
          'Nulstil SMC: Sluk, hold Shift+Control+Option+Tænd i 10 sek (Intel Mac)',
          'Apple Silicon: Sluk, vent 30 sek, tænd',
          'Start i Fejlsikret tilstand og test tastaturet',
          'Tjek for opdateringer: Systemindstillinger → Softwareopdatering',
          'Hvis stadig ikke virker: Kan være hardware-fejl',
        ],
        needsRepair: true,
        repairNote: 'MacBook-tastaturproblemer kan kræve udskiftning af topkasse',
      },
      {
        id: 'solution-mac-external-keyboard',
        title: 'Fejlfind eksternt tastatur',
        severity: 'low',
        explanation: 'Eksterne tastaturer har ofte simple løsninger.',
        steps: [
          'Bluetooth: Sluk og tænd tastaturet',
          'Fjern parring: Systemindstillinger → Bluetooth → Glem enhed',
          'Parr igen som ny enhed',
          'USB: Prøv en anden USB-port',
          'Prøv tastaturet på en anden computer',
          'Tjek batteriniveau (Bluetooth-tastaturer)',
        ],
      },
      {
        id: 'solution-mac-clean-keyboard',
        title: 'Rens tastaturet',
        severity: 'low',
        explanation: 'Støv og snavs kan forhindre taster i at virke.',
        steps: [
          'Sluk Mac\'en eller frakobl tastaturet',
          'Vend MacBook på hovedet og ryst forsigtigt',
          'Brug trykluft til at blæse mellem tasterne (hold dåsen lodret!)',
          'Brug en blød børste til at fjerne synligt snavs',
          'For fastsiddende taster: Fugtet klud med isopropylalkohol på tasten (ikke under!)',
          'Lad tørre helt før brug',
        ],
      },
      {
        id: 'solution-mac-keyboard-repair',
        title: 'Tastaturet kræver reparation',
        severity: 'high',
        explanation: 'Hvis en hel række taster ikke virker, er det sandsynligvis hardware.',
        steps: [
          'Prøv et eksternt USB-tastatur som midlertidig løsning',
          'Kontakt Apple Support for diagnose',
          'MacBook-tastaturer sidder fast i topkassen',
          'Reparation kan være dyr - få et prisoverslag først',
        ],
        needsRepair: true,
        repairNote: 'Tastaturudskiftning på MacBook kræver ofte ny topkasse',
      },
      {
        id: 'solution-mac-function-keys',
        title: 'Funktionstaster virker anderledes',
        severity: 'low',
        explanation: 'F1-F12 tasterne kan være sat til mediekontrol i stedet for funktioner.',
        steps: [
          'Gå til Systemindstillinger → Tastatur',
          'Find "Brug F1, F2 osv. som standard-funktionstaster"',
          'Slå det til eller fra efter behov',
          'Alternativt: Hold Fn-tasten for at skifte funktion midlertidigt',
          'Touch Bar (ældre MacBook Pro): Tjek Touch Bar-indstillinger',
        ],
      },
      {
        id: 'solution-mac-trackpad-restart',
        title: 'Genstart pegefelt',
        severity: 'low',
        explanation: 'Pegefeltet kan have frosset. En genstart hjælper ofte.',
        steps: [
          'Genstart Mac\'en',
          'Nulstil SMC (se instruktioner under tastatur)',
          'Nulstil NVRAM: Hold Option+Command+P+R under opstart i 20 sek',
          'Tjek Systemindstillinger → Pegefelt for indstillinger',
          'Sørg for at "Ignorer indbygget pegefelt når mus er tilsluttet" ikke er aktiv',
        ],
      },
      {
        id: 'solution-mac-trackpad-water',
        title: 'Væske på pegefeltet',
        severity: 'high',
        explanation: 'Væske kan beskadige pegefeltet og kræve reparation.',
        steps: [
          'Sluk Mac\'en med det samme',
          'Vend Mac\'en så væske kan løbe ud',
          'Tør forsigtigt ydersiden',
          'Lad den tørre i mindst 48 timer',
          'Test pegefeltet efter tørring',
          'Hvis det stadig ikke virker: Kontakt reparatør',
        ],
        needsRepair: true,
        repairNote: 'Væskeskade kan kræve udskiftning af pegefelt',
      },
      {
        id: 'solution-mac-trackpad-click',
        title: 'Pegefelt klikker ikke ordentligt',
        severity: 'medium',
        explanation: 'Klik-problemer kan skyldes indstillinger eller hardware.',
        steps: [
          'Gå til Systemindstillinger → Pegefelt',
          'Tjek "Tryk for at klikke" - slå det til som alternativ',
          'Juster klik-styrken under "Tryk & haptisk feedback"',
          'Force Touch pegefelter simulerer klik - de bevæger sig ikke fysisk',
          'Hvis batteriet er opsvulmet, kan det trykke på pegefeltet - STOP BRUG!',
        ],
        needsRepair: true,
        repairNote: 'Opsvulmet batteri er farligt og kræver øjeblikkelig service',
      },
      {
        id: 'solution-mac-magic-mouse',
        title: 'Apple Magic Mouse forbinder ikke',
        severity: 'low',
        explanation: 'Magic Mouse kan have batteriproblem eller behøve genparring.',
        steps: [
          'Sørg for at musen er opladet (lightning-port i bunden)',
          'Sluk og tænd musen med kontakten i bunden',
          'Fjern fra Bluetooth: Systemindstillinger → Bluetooth → Glem enhed',
          'Tilslut med Lightning-kabel for at parre igen',
          'Hvis den stadig ikke virker: Prøv SMC-nulstilling på Mac\'en',
        ],
      },
      {
        id: 'solution-mac-bt-mouse',
        title: 'Bluetooth-mus forbinder ikke',
        severity: 'low',
        explanation: 'Tredjepartsmus kan kræve særlig parring.',
        steps: [
          'Tjek batterier eller oplad musen',
          'Sæt musen i parringstilstand (se musens manual)',
          'På Mac: Systemindstillinger → Bluetooth → Søg efter enheder',
          'Fjern tidligere parringer og prøv igen',
          'Nogle mus har USB-dongle - brug den i stedet for Bluetooth',
        ],
      },
      {
        id: 'solution-mac-usb-mouse',
        title: 'USB-mus virker ikke',
        severity: 'low',
        explanation: 'USB-mus burde virke med det samme. Prøv disse skridt.',
        steps: [
          'Prøv en anden USB-port',
          'Prøv uden USB-hub (direkte i Mac)',
          'Prøv musen på en anden computer',
          'Genstart Mac\'en med musen tilsluttet',
          'Tjek om der er drivere der skal installeres (sjældent på Mac)',
        ],
      },
    ],
  },
  // ============================================
  // EKSISTERENDE FLOWS (iPhone/iPad)
  // ============================================
  {
    id: 'screen-issues',
    name: 'Skærmproblemer',
    icon: '📱',
    description: 'Skærmen fryser, blinker, eller trykker selv',
    startQuestion: 'screen-start',
    deviceTypes: ['iphone', 'ipad'],
    questions: [
      {
        id: 'screen-start',
        question: 'Hvad oplever du med skærmen?',
        options: [
          { label: 'Skærmen reagerer ikke på tryk', emoji: '🥶', nextStep: 'frozen-cause' },
          { label: 'Skærmen trykker af sig selv', emoji: '👻', nextStep: 'ghost-cause' },
          { label: 'Skærmen blinker eller flimrer', emoji: '💡', nextStep: 'flicker-cause' },
          { label: 'Skærmen er helt sort', emoji: '⬛', nextStep: 'black-cause' },
        ],
      },
      {
        id: 'frozen-cause',
        question: 'Hvornår blev skærmen frosset?',
        helpText: 'Prøv at huske hvad der skete lige før',
        options: [
          { label: 'Mens jeg brugte en app', emoji: '📲', nextStep: 'frozen-app' },
          { label: 'Efter jeg tændte den', emoji: '🔌', nextStep: 'frozen-boot' },
          { label: 'Det sker ofte/tilfældigt', emoji: '🔄', nextStep: 'frozen-random' },
          { label: 'Efter et tab/uheld', emoji: '💥', nextStep: 'solution-repair-needed' },
        ],
      },
      {
        id: 'frozen-app',
        question: 'Kan du stadig høre lyde fra enheden?',
        options: [
          { label: 'Ja, lyd virker', emoji: '🔊', nextStep: 'solution-hard-reset' },
          { label: 'Nej, helt tavs', emoji: '🔇', nextStep: 'solution-hard-reset' },
          { label: 'Ved ikke', emoji: '🤷', nextStep: 'solution-hard-reset' },
        ],
      },
      {
        id: 'frozen-boot',
        question: 'Sidder enheden fast på Apple-logoet?',
        options: [
          { label: 'Ja, logoet forsvinder ikke', emoji: '🍎', nextStep: 'solution-boot-loop' },
          { label: 'Nej, skærmen er bare sort', emoji: '⬛', nextStep: 'black-cause' },
          { label: 'Den blinker af og til', emoji: '💡', nextStep: 'solution-boot-loop' },
        ],
      },
      {
        id: 'frozen-random',
        question: 'Er enheden blevet opdateret for nylig?',
        options: [
          { label: 'Ja, lige efter opdatering', emoji: '⬇️', nextStep: 'solution-reset-settings' },
          { label: 'Nej, det er ikke nyt', emoji: '📅', nextStep: 'solution-hard-reset' },
          { label: 'Ved ikke', emoji: '🤷', nextStep: 'solution-hard-reset' },
        ],
      },
      {
        id: 'ghost-cause',
        question: 'Har du en skærmbeskytter eller cover på?',
        options: [
          { label: 'Ja, begge dele', emoji: '🛡️', nextStep: 'ghost-protector' },
          { label: 'Kun skærmbeskytter', emoji: '📄', nextStep: 'ghost-protector' },
          { label: 'Kun cover', emoji: '📦', nextStep: 'ghost-charger' },
          { label: 'Nej, ingen af delene', emoji: '❌', nextStep: 'ghost-charger' },
        ],
      },
      {
        id: 'ghost-protector',
        question: 'Fjern skærmbeskytteren helt. Fortsætter problemet?',
        helpText: 'Vent 1-2 minutter efter du har fjernet den',
        options: [
          { label: 'Problemet er væk!', emoji: '✅', nextStep: 'solution-new-protector' },
          { label: 'Samme problem stadig', emoji: '😕', nextStep: 'ghost-charger' },
        ],
      },
      {
        id: 'ghost-charger',
        question: 'Sidder opladeren i lige nu?',
        options: [
          { label: 'Ja, den lader', emoji: '🔌', nextStep: 'ghost-charger-test' },
          { label: 'Nej, kører på batteri', emoji: '🔋', nextStep: 'ghost-damage' },
        ],
      },
      {
        id: 'ghost-charger-test',
        question: 'Tag opladeren ud og vent 5 min. Fortsætter problemet?',
        helpText: 'Billige opladere kan sende elektrisk støj gennem skærmen',
        options: [
          { label: 'Problemet er væk!', emoji: '✅', nextStep: 'solution-new-charger' },
          { label: 'Samme problem stadig', emoji: '😕', nextStep: 'ghost-damage' },
        ],
      },
      {
        id: 'ghost-damage',
        question: 'Har enheden været tabt eller udsat for tryk/væske?',
        options: [
          { label: 'Ja, den har været tabt', emoji: '💥', nextStep: 'solution-repair-needed' },
          { label: 'Ja, den har fået væske', emoji: '💧', nextStep: 'solution-repair-needed' },
          { label: 'Nej, ingen uheld', emoji: '✅', nextStep: 'solution-ghost-software' },
        ],
      },
      {
        id: 'flicker-cause',
        question: 'Hvornår blinker skærmen?',
        options: [
          { label: 'Når jeg er udendørs/i sollys', emoji: '☀️', nextStep: 'flicker-brightness' },
          { label: 'Hele tiden, også indendørs', emoji: '🏠', nextStep: 'flicker-damage' },
          { label: 'Kun i bestemte apps', emoji: '📲', nextStep: 'solution-flicker-software' },
          { label: 'Efter et tab/uheld', emoji: '💥', nextStep: 'solution-repair-needed' },
        ],
      },
      {
        id: 'flicker-brightness',
        question: 'Er "Automatisk lysstyrke" slået til?',
        helpText: 'Find det i Indstillinger → Tilgængelighed → Skærm',
        options: [
          { label: 'Ja, det er slået til', emoji: '✅', nextStep: 'solution-disable-autobrightness' },
          { label: 'Nej, det er slået fra', emoji: '❌', nextStep: 'flicker-damage' },
          { label: 'Ved ikke hvordan jeg tjekker', emoji: '🤷', nextStep: 'solution-disable-autobrightness' },
        ],
      },
      {
        id: 'flicker-damage',
        question: 'Er der synlige skader på skærmen? (revner, mørke pletter, striber)',
        options: [
          { label: 'Ja, jeg kan se skader', emoji: '💔', nextStep: 'solution-repair-needed' },
          { label: 'Nej, skærmen ser fin ud', emoji: '✅', nextStep: 'solution-flicker-software' },
        ],
      },
      {
        id: 'black-cause',
        question: 'Hvad skete lige før skærmen blev sort?',
        options: [
          { label: 'Ingenting, den gik bare i sort', emoji: '🤷', nextStep: 'black-power' },
          { label: 'Batteriet var lavt', emoji: '🪫', nextStep: 'black-charging' },
          { label: 'Den blev tabt', emoji: '💥', nextStep: 'solution-repair-needed' },
          { label: 'Den blev våd', emoji: '💧', nextStep: 'solution-repair-needed' },
        ],
      },
      {
        id: 'black-power',
        question: 'Vibrerer eller laver enheden lyde når du trykker på knapper?',
        options: [
          { label: 'Ja, jeg kan høre/mærke noget', emoji: '📳', nextStep: 'solution-display-cable' },
          { label: 'Nej, helt død', emoji: '💀', nextStep: 'black-charging' },
        ],
      },
      {
        id: 'black-charging',
        question: 'Sæt opladeren i og vent 15 min. Hvad sker der?',
        helpText: 'Brug gerne original Apple-oplader hvis du har en',
        options: [
          { label: 'Lyn-ikonet vises', emoji: '⚡', nextStep: 'solution-dead-battery' },
          { label: 'Intet sker', emoji: '❌', nextStep: 'solution-charge-port' },
          { label: 'Skærmen tænder!', emoji: '✅', nextStep: 'solution-dead-battery' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-hard-reset',
        title: 'Lav en Hard Reset',
        severity: 'low',
        explanation: 'En hard reset tvinger enheden til at genstarte og løser de fleste fastfrosne skærme.',
        technicalInfo: 'Hard reset sletter IKKE dine data. Den genstarter blot systemet fuldstændigt.',
        steps: [
          'Tryk Lyd OP én gang og slip med det samme',
          'Tryk Lyd NED én gang og slip med det samme', 
          'Hold Sideknappen (tænd/sluk) nede i 10-15 sekunder',
          'Bliv ved med at holde selvom skærmen bliver sort',
          'Slip når Apple-logoet vises',
          'Vent på at enheden starter op normalt'
        ],
      },
      {
        id: 'solution-boot-loop',
        title: 'Enheden sidder fast ved opstart',
        severity: 'medium',
        explanation: 'Når enheden sidder fast på Apple-logoet, kan en gendannelse ofte hjælpe.',
        technicalInfo: 'Problemet skyldes ofte en fejl i systemsoftwaren. Prøv først en hard reset.',
        steps: [
          'Prøv først Hard Reset: Lyd Op → slip → Lyd Ned → slip → Hold Sideknap 15 sek',
          'Hvis det ikke virker, tilslut enheden til en computer med iTunes/Finder',
          'Sæt enheden i Gendannelsestilstand mens den er tilsluttet',
          'Vælg "Opdater" først (beholder dine data)',
          'Hvis opdatering fejler, vælg "Gendan" (sletter data!)',
          'Hvis intet virker, kontakt en tekniker'
        ],
        needsRepair: true,
        repairNote: 'Gentagne boot-loops kan være tegn på hardware-problemer',
      },
      {
        id: 'solution-reset-settings',
        title: 'Nulstil indstillinger efter opdatering',
        severity: 'low',
        explanation: 'Efter en systemopdatering kan gamle indstillinger skabe konflikter.',
        steps: [
          'Gå til Indstillinger → Generelt',
          'Scroll ned til "Overfør eller nulstil"',
          'Tryk "Nulstil" → "Nulstil alle indstillinger"',
          'Indtast din kode hvis du bliver bedt om det',
          'Bekræft nulstillingen',
          'OBS: Dette sletter IKKE apps eller data, kun indstillinger'
        ],
      },
      {
        id: 'solution-new-protector',
        title: 'Skærmbeskytteren var problemet',
        severity: 'low',
        explanation: 'Din skærmbeskytter forstyrrede skærmens berøringssensor. Det kan ske med billige eller dårligt monterede skærmbeskyttere.',
        steps: [
          'Godt klaret! Problemet var skærmbeskytteren',
          'Overvej at købe en kvalitets-skærmbeskytter (fx fra Apple eller PanzerGlass)',
          'Sørg for at rense skærmen grundigt før du monterer en ny',
          'Undgå luftbobler under monteringen',
          'Hvis problemet vender tilbage, fjern den igen'
        ],
      },
      {
        id: 'solution-new-charger',
        title: 'Opladeren sender støj til skærmen',
        severity: 'low',
        explanation: 'Billige eller defekte opladere kan sende elektrisk støj der får skærmen til at reagere forkert.',
        technicalInfo: 'Original Apple-oplader har bedre filtrering af elektrisk støj. Tredjepartsprodukter varierer i kvalitet.',
        steps: [
          'Stop med at bruge den oplader der skabte problemet',
          'Brug kun original Apple-oplader eller MFi-certificerede produkter',
          'MFi-logoet er en garanti for at produktet er testet med Apple-enheder',
          'Undgå meget billige opladere fra ukendte mærker',
          'Hvis du SKAL bruge en anden oplader, brug enheden ikke mens den lader'
        ],
      },
      {
        id: 'solution-ghost-software',
        title: 'Prøv softwareløsninger',
        severity: 'medium',
        explanation: 'Når fysiske årsager er udelukket, kan det være et softwareproblem.',
        technicalInfo: 'Berøringssensoren kalibreres løbende af systemet. Nogle gange kan en nulstilling hjælpe.',
        steps: [
          'Lav først en Hard Reset (Lyd Op → Lyd Ned → Hold Sideknap)',
          'Hvis problemet fortsætter: Gå til Indstillinger → Generelt → Overfør/Nulstil',
          'Vælg "Nulstil alle indstillinger" (sletter IKKE data)',
          'Vent på at enheden genstarter',
          'Test om problemet er løst',
          'Fortsætter det stadig? → Kontakt en tekniker, der kan være usynlig skade'
        ],
        needsRepair: true,
        repairNote: 'Hvis software-løsninger ikke virker, kan det være skærmens touch-controller',
      },
      {
        id: 'solution-disable-autobrightness',
        title: 'Slå automatisk lysstyrke fra',
        severity: 'low',
        explanation: 'Automatisk lysstyrke tilpasser sig konstant til omgivelserne, hvilket kan opfattes som flimren.',
        steps: [
          'Åbn Indstillinger',
          'Gå til "Tilgængelighed"',
          'Tryk på "Skærm og tekststørrelse"',
          'Scroll ned og find "Automatisk lysstyrke"',
          'Slå den FRA (grå)',
          'Du kan også slå True Tone fra under Indstillinger → Skærm'
        ],
      },
      {
        id: 'solution-flicker-software',
        title: 'Softwarerelateret flimren',
        severity: 'low',
        explanation: 'Når flimren kun sker i bestemte apps, er det ofte et softwareproblem.',
        steps: [
          'Opdater den app der skaber problemer (App Store → Opdateringer)',
          'Hvis det ikke hjælper, slet appen og installer den igen',
          'Opdater iOS: Indstillinger → Generelt → Softwareopdatering',
          'Prøv at slå "True Tone" fra: Indstillinger → Skærm → True Tone OFF',
          'Genstart enheden efter ændringerne'
        ],
      },
      {
        id: 'solution-dead-battery',
        title: 'Batteriet var helt fladt',
        severity: 'low',
        explanation: 'Når batteriet løber helt tørt, tager det lidt tid før enheden kan starte igen.',
        steps: [
          'Lad enheden sidde i opladeren i mindst 30 minutter',
          'Brug gerne en oplader på 20W eller mere for hurtigere opladning',
          'Prøv at starte enheden ved at holde sideknappen nede',
          'Hvis den ikke starter, prøv Hard Reset mens den sidder i opladeren',
          'Tip: Prøv at holde batteriniveauet over 20% fremover'
        ],
      },
      {
        id: 'solution-charge-port',
        title: 'Tjek ladeporten',
        severity: 'medium',
        explanation: 'Hvis enheden ikke reagerer på opladning, kan ladeporten være tilstoppet eller defekt.',
        technicalInfo: 'Fnug fra lommer samler sig ofte i porten over tid og blokerer forbindelsen.',
        steps: [
          'Brug et lommelygte/mobillampe til at kigge ind i porten',
          'Er der fnug eller snavs? Rens FORSIGTIGT med en tandstik af TRÆ',
          'Brug ALDRIG metal eller noget vådt!',
          'Prøv et andet oplader-kabel',
          'Prøv trådløs opladning hvis enheden understøtter det',
          'Ingen reaktion efter rensning? → Porten kan være defekt'
        ],
        needsRepair: true,
        repairNote: 'En defekt ladeport kræver professionel reparation',
      },
      {
        id: 'solution-display-cable',
        title: 'Skærmen kan være frakoblet',
        severity: 'high',
        explanation: 'Når enheden virker (lyde, vibration) men skærmen er sort, kan skærmkablet være løst eller beskadiget.',
        technicalInfo: 'Flex-kablet mellem skærm og hovedkort kan løsne sig efter tab eller blive beskadiget.',
        steps: [
          'Prøv først en Hard Reset (Lyd Op → Lyd Ned → Hold Sideknap)',
          'Tilslut opladeren og vent 15 minutter',
          'Prøv Hard Reset igen',
          'Hvis enheden stadig reagerer med lyd/vibration men sort skærm:',
          'Dette er sandsynligvis en hardware-fejl',
          'Kontakt en autoriseret reparatør for diagnose'
        ],
        needsRepair: true,
        repairNote: 'Kræver professionel åbning og diagnose af skærmforbindelsen',
      },
      {
        id: 'solution-repair-needed',
        title: 'Skaden kræver reparation',
        severity: 'high',
        explanation: 'Baseret på dine svar lyder det som om enheden har fysisk skade, der kræver professionel reparation.',
        technicalInfo: 'Tab og væskeskader kan påvirke skærmens digitizer, flex-kabler, eller touch-controller IC på bundkortet.',
        steps: [
          'Stop med at bruge enheden hvis problemet er alvorligt',
          'Tag backup af dine data hvis muligt (iCloud eller computer)',
          'Book tid hos Apple eller en autoriseret servicepartner',
          'Få en diagnose før du beslutter om reparation',
          'Overvej om reparationsprisen er værd det ift. enhedens alder',
          'Ved væskeskade: Sluk enheden straks og læg den IKKE i ris!'
        ],
        needsRepair: true,
        repairNote: 'Kontakt Apple Support eller en autoriseret Apple-serviceudbyder',
      },
    ],
  },
  {
    id: 'wifi-bluetooth',
    name: 'Wi-Fi & Bluetooth',
    icon: '📶',
    description: 'Forbindelsesproblemer med netværk eller enheder',
    startQuestion: 'connection-start',
    deviceTypes: ['iphone', 'ipad', 'mac'],
    questions: [
      {
        id: 'connection-start',
        question: 'Hvilket problem oplever du?',
        options: [
          { label: 'Wi-Fi forbinder ikke', emoji: '📶', nextStep: 'wifi-type' },
          { label: 'Wi-Fi er langsomt', emoji: '🐌', nextStep: 'solution-wifi-slow' },
          { label: 'Bluetooth parrer ikke', emoji: '🎧', nextStep: 'bluetooth-type' },
          { label: 'Bluetooth forbindelse falder', emoji: '📴', nextStep: 'bluetooth-drops' },
        ],
      },
      {
        id: 'wifi-type',
        question: 'Hvor sker problemet?',
        options: [
          { label: 'Kun hjemme', emoji: '🏠', nextStep: 'wifi-home' },
          { label: 'Alle steder', emoji: '🌍', nextStep: 'wifi-everywhere' },
          { label: 'Kun ét bestemt sted', emoji: '📍', nextStep: 'wifi-one-place' },
        ],
      },
      {
        id: 'wifi-home',
        question: 'Virker Wi-Fi på andre enheder i hjemmet?',
        options: [
          { label: 'Ja, andre enheder virker fint', emoji: '✅', nextStep: 'solution-wifi-forget' },
          { label: 'Nej, ingen enheder virker', emoji: '❌', nextStep: 'solution-router-restart' },
          { label: 'Ved ikke / har kun én enhed', emoji: '🤷', nextStep: 'solution-router-restart' },
        ],
      },
      {
        id: 'wifi-everywhere',
        question: 'Kan du se Wi-Fi netværk i listen?',
        helpText: 'Gå til Indstillinger → Wi-Fi og se om der vises netværk',
        options: [
          { label: 'Ja, de vises men forbinder ikke', emoji: '📶', nextStep: 'solution-wifi-reset-network' },
          { label: 'Nej, ingen netværk vises', emoji: '❌', nextStep: 'wifi-grayed' },
          { label: 'Wi-Fi er gråtonet/kan ikke slås til', emoji: '⚫', nextStep: 'solution-wifi-hardware' },
        ],
      },
      {
        id: 'wifi-grayed',
        question: 'Er Wi-Fi-knappen gråtonet i Indstillinger?',
        options: [
          { label: 'Ja, den er grå og kan ikke trykkes', emoji: '⚫', nextStep: 'solution-wifi-hardware' },
          { label: 'Nej, den virker normal', emoji: '✅', nextStep: 'solution-wifi-reset-network' },
        ],
      },
      {
        id: 'wifi-one-place',
        question: 'Har du prøvet at glemme og genforbinde til netværket?',
        options: [
          { label: 'Ja, det hjalp ikke', emoji: '😕', nextStep: 'solution-wifi-reset-network' },
          { label: 'Nej, det har jeg ikke prøvet', emoji: '❌', nextStep: 'solution-wifi-forget' },
        ],
      },
      {
        id: 'bluetooth-type',
        question: 'Hvad prøver du at forbinde til?',
        options: [
          { label: 'AirPods / Høretelefoner', emoji: '🎧', nextStep: 'bluetooth-headphones' },
          { label: 'Højttaler', emoji: '🔊', nextStep: 'bluetooth-speaker' },
          { label: 'Bil', emoji: '🚗', nextStep: 'bluetooth-car' },
          { label: 'Andet tilbehør', emoji: '⌨️', nextStep: 'bluetooth-other' },
        ],
      },
      {
        id: 'bluetooth-headphones',
        question: 'Er dine høretelefoner opladet og i parringstilstand?',
        helpText: 'AirPods: Åbn låget nær enheden. Andre: Se manualen for parringsknap',
        options: [
          { label: 'Ja, de er klar til parring', emoji: '✅', nextStep: 'solution-bluetooth-forget' },
          { label: 'Nej/Ved ikke hvordan', emoji: '🤷', nextStep: 'solution-bluetooth-pairing-mode' },
        ],
      },
      {
        id: 'bluetooth-speaker',
        question: 'Har du sat højttaleren i parringstilstand?',
        helpText: 'De fleste højtalere har en Bluetooth-knap man holder nede',
        options: [
          { label: 'Ja, den blinker/er klar', emoji: '✅', nextStep: 'solution-bluetooth-forget' },
          { label: 'Nej/Ved ikke hvordan', emoji: '🤷', nextStep: 'solution-bluetooth-pairing-mode' },
        ],
      },
      {
        id: 'bluetooth-car',
        question: 'Har du slettet parringen fra bilens system først?',
        helpText: 'Prøv at slette telefonen fra bilens Bluetooth-menu',
        options: [
          { label: 'Ja, slettet fra begge', emoji: '✅', nextStep: 'solution-bluetooth-car' },
          { label: 'Kun fra telefonen', emoji: '📱', nextStep: 'solution-bluetooth-car' },
          { label: 'Nej, ved ikke hvordan', emoji: '🤷', nextStep: 'solution-bluetooth-car' },
        ],
      },
      {
        id: 'bluetooth-other',
        question: 'Kan enheden findes af andre telefoner/tablets?',
        options: [
          { label: 'Ja, andre kan finde den', emoji: '✅', nextStep: 'solution-bluetooth-forget' },
          { label: 'Nej, ingen kan finde den', emoji: '❌', nextStep: 'solution-bluetooth-device-issue' },
          { label: 'Har ikke testet', emoji: '🤷', nextStep: 'solution-bluetooth-forget' },
        ],
      },
      {
        id: 'bluetooth-drops',
        question: 'Hvornår falder forbindelsen?',
        options: [
          { label: 'Når jeg går væk fra enheden', emoji: '🚶', nextStep: 'solution-bluetooth-range' },
          { label: 'Tilfældigt, også tæt på', emoji: '❓', nextStep: 'solution-bluetooth-interference' },
          { label: 'Når jeg bruger Wi-Fi samtidig', emoji: '📶', nextStep: 'solution-bluetooth-interference' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-wifi-forget',
        title: 'Glem og genforbind til netværket',
        severity: 'low',
        explanation: 'Gamle netværksindstillinger kan skabe konflikter. At "glemme" netværket og forbinde igen løser ofte problemet.',
        steps: [
          'Gå til Indstillinger → Wi-Fi',
          'Tryk på det blå (i) ud for dit netværk',
          'Tryk "Glem dette netværk"',
          'Bekræft ved at trykke "Glem"',
          'Vent 10 sekunder',
          'Vælg netværket igen og indtast adgangskoden på ny'
        ],
      },
      {
        id: 'solution-router-restart',
        title: 'Genstart din router',
        severity: 'low',
        explanation: 'Når ingen enheder kan forbinde, er problemet sandsynligvis routeren.',
        steps: [
          'Find din router (den boks hvor internettet kommer ind)',
          'Tag strømstikket ud',
          'Vent 30 sekunder',
          'Sæt stikket i igen',
          'Vent 2-3 minutter på at routeren starter helt op',
          'Prøv at forbinde igen',
          'Stadig problemer? Kontakt din internetudbyder'
        ],
      },
      {
        id: 'solution-wifi-reset-network',
        title: 'Nulstil netværksindstillinger',
        severity: 'medium',
        explanation: 'En fuld nulstilling af netværksindstillinger løser de fleste forbindelsesproblemer.',
        technicalInfo: 'Dette sletter alle gemte Wi-Fi netværk, Bluetooth-parringer og VPN-indstillinger.',
        steps: [
          'Gå til Indstillinger → Generelt',
          'Scroll ned til "Overfør eller nulstil"',
          'Tryk "Nulstil"',
          'Vælg "Nulstil netværksindstillinger"',
          'Indtast din kode',
          'Enheden genstarter',
          'Forbind til Wi-Fi igen med adgangskoden'
        ],
      },
      {
        id: 'solution-wifi-hardware',
        title: 'Mulig hardware-fejl',
        severity: 'high',
        explanation: 'Når Wi-Fi er gråtonet og ikke kan slås til, kan der være en hardware-fejl.',
        technicalInfo: 'Wi-Fi og Bluetooth deler typisk samme chip. Hvis begge fejler, kan chippen være defekt.',
        steps: [
          'Prøv først at genstarte enheden',
          'Prøv Hard Reset: Lyd Op → Lyd Ned → Hold Sideknap',
          'Tjek om Bluetooth også er gråtonet',
          'Opdater til nyeste iOS hvis muligt',
          'Hvis problemet fortsætter, kontakt en tekniker'
        ],
        needsRepair: true,
        repairNote: 'En defekt Wi-Fi/Bluetooth-chip kræver mikroløddning og professionel reparation',
      },
      {
        id: 'solution-wifi-slow',
        title: 'Forbedre Wi-Fi-hastigheden',
        severity: 'low',
        explanation: 'Langsomt Wi-Fi skyldes ofte afstand til routeren, interferens eller for mange enheder.',
        steps: [
          'Flyt tættere på routeren og test igen',
          'Genstart routeren (tag stikket ud i 30 sek)',
          'Forbind til 5GHz netværk hvis muligt (ofte hedder det "[netværk]_5G")',
          'Luk apps der bruger data i baggrunden',
          'Tjek om andre streamer eller downloader samtidig',
          'Overvej at placere routeren centralt i hjemmet'
        ],
      },
      {
        id: 'solution-bluetooth-forget',
        title: 'Glem og parr enheden igen',
        severity: 'low',
        explanation: 'Gamle parringer kan skabe konflikter. At starte forfra løser ofte problemet.',
        steps: [
          'Gå til Indstillinger → Bluetooth',
          'Find enheden på listen og tryk på (i)',
          'Tryk "Glem denne enhed"',
          'Sæt Bluetooth-enheden i parringstilstand igen',
          'Den skulle nu dukke op under "Andre enheder"',
          'Tryk på den for at parre'
        ],
      },
      {
        id: 'solution-bluetooth-pairing-mode',
        title: 'Sådan sætter du enheden i parringstilstand',
        severity: 'low',
        explanation: 'Bluetooth-enheder skal være i en særlig tilstand for at blive fundet.',
        steps: [
          'AirPods: Åbn låget, hold knappen bag på etuiet nede til lyset blinker hvidt',
          'De fleste høretelefoner: Hold tænd-knappen nede i 5-10 sek til et lys blinker',
          'Højtalere: Hold Bluetooth-knappen nede til du hører en lyd eller ser blink',
          'Tjek enhedens manual for specifikke instruktioner',
          'Sørg for at enheden er opladet',
          'Prøv at parre inden for 1 meter af din telefon/iPad'
        ],
      },
      {
        id: 'solution-bluetooth-car',
        title: 'Parring med bil',
        severity: 'low',
        explanation: 'Bil-Bluetooth kan være besværlig fordi begge enheder skal slette den gamle parring.',
        steps: [
          'På bilens skærm: Find Bluetooth-indstillinger og slet din telefon',
          'På telefonen: Indstillinger → Bluetooth → (i) → Glem denne enhed',
          'Genstart bilens infotainment-system (sluk/tænd bilen)',
          'Sæt bilen i parringstilstand via dens menu',
          'Find bilen i telefonens Bluetooth-liste',
          'Godkend paringskoden på begge enheder'
        ],
      },
      {
        id: 'solution-bluetooth-device-issue',
        title: 'Problemet kan være Bluetooth-enheden',
        severity: 'low',
        explanation: 'Hvis enheden ikke kan findes af nogen, kan den være defekt eller have lavt batteri.',
        steps: [
          'Tjek at enheden er opladet/har strøm',
          'Prøv at nulstille Bluetooth-enheden (se dens manual)',
          'Prøv at parre til en helt anden telefon/tablet',
          'Hvis ingen kan finde enheden, er den sandsynligvis defekt',
          'Kontakt producenten for garanti/reparation'
        ],
      },
      {
        id: 'solution-bluetooth-range',
        title: 'Bluetooth-rækkevidde',
        severity: 'low',
        explanation: 'Bluetooth har begrænset rækkevidde, typisk 10 meter, og vægge reducerer signalet.',
        steps: [
          'Hold dig inden for 10 meter af enheden',
          'Vægge og metalgenstande blokerer signalet',
          'Kroppen kan også blokere - prøv at have telefonen i den side der vender mod enheden',
          'Nogle billige Bluetooth-enheder har kortere rækkevidde',
          'Ved musik-afspilning: Prøv at have telefonen med dig i stedet for at lægge den'
        ],
      },
      {
        id: 'solution-bluetooth-interference',
        title: 'Reducer interferens',
        severity: 'low',
        explanation: 'Bluetooth og Wi-Fi bruger samme frekvensbånd og kan forstyrre hinanden.',
        technicalInfo: 'Begge bruger 2.4GHz båndet. Mikrobølgeovne og andre enheder kan også forstyrre.',
        steps: [
          'Forbind til 5GHz Wi-Fi hvis muligt (reducerer interferens)',
          'Flyt væk fra mikrobølgeovne når de er i brug',
          'Reducer antallet af aktive Bluetooth-forbindelser',
          'Genstart Bluetooth: Slå fra og til i Indstillinger',
          'Nulstil netværksindstillinger hvis problemet fortsætter'
        ],
      },
    ],
  },
  {
    id: 'battery-issues',
    name: 'Batteriproblemer',
    icon: '🔋',
    description: 'Batteriet drænes hurtigt eller opfører sig mærkeligt',
    startQuestion: 'battery-start',
    deviceTypes: ['iphone', 'ipad', 'mac'],
    questions: [
      {
        id: 'battery-start',
        question: 'Hvad oplever du med batteriet?',
        options: [
          { label: 'Batteriet drænes meget hurtigt', emoji: '⚡', nextStep: 'battery-drain-speed' },
          { label: 'Procenttallet springer rundt', emoji: '📊', nextStep: 'battery-jumping' },
          { label: 'Enheden slukker før 0%', emoji: '💀', nextStep: 'battery-shutdown' },
          { label: 'Enheden lader ikke op', emoji: '🔌', nextStep: 'charging-issue' },
        ],
      },
      {
        id: 'battery-drain-speed',
        question: 'Hvor hurtigt drænes batteriet?',
        options: [
          { label: 'Nogle timer ved normal brug', emoji: '⏰', nextStep: 'battery-health-check' },
          { label: 'Dør på under en time', emoji: '💨', nextStep: 'battery-health-check' },
          { label: 'Kun når jeg bruger bestemte apps', emoji: '📲', nextStep: 'solution-app-battery' },
        ],
      },
      {
        id: 'battery-health-check',
        question: 'Hvad viser din batterisundhed?',
        helpText: 'iPhone/iPad: Indstillinger → Batteri → Batterisundhed. Mac: Systemindstillinger → Batteri',
        options: [
          { label: 'Over 80%', emoji: '✅', nextStep: 'solution-battery-settings' },
          { label: 'Under 80%', emoji: '⚠️', nextStep: 'solution-battery-worn' },
          { label: 'Ved ikke hvordan jeg finder det', emoji: '🤷', nextStep: 'solution-check-battery-health' },
        ],
      },
      {
        id: 'battery-jumping',
        question: 'Hvornår springer procenttallet?',
        options: [
          { label: 'Når jeg bruger krævende apps', emoji: '📲', nextStep: 'solution-battery-calibrate' },
          { label: 'Tilfældigt hele tiden', emoji: '❓', nextStep: 'solution-battery-calibrate' },
          { label: 'Kun når det er koldt', emoji: '❄️', nextStep: 'solution-battery-cold' },
        ],
      },
      {
        id: 'battery-shutdown',
        question: 'Ved hvilken procentdel slukker enheden?',
        options: [
          { label: 'Omkring 20-30%', emoji: '🪫', nextStep: 'solution-battery-calibrate' },
          { label: 'Omkring 40-50%', emoji: '⚠️', nextStep: 'solution-battery-worn' },
          { label: 'Det varierer', emoji: '❓', nextStep: 'solution-battery-calibrate' },
        ],
      },
      {
        id: 'charging-issue',
        question: 'Hvad sker der når du sætter opladere i?',
        options: [
          { label: 'Intet - ingen reaktion', emoji: '❌', nextStep: 'solution-clean-port' },
          { label: 'Lader langsomt', emoji: '🐌', nextStep: 'solution-slow-charging' },
          { label: 'Lader, men stopper igen', emoji: '⚡', nextStep: 'solution-cable-issue' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-check-battery-health',
        title: 'Sådan tjekker du batterisundhed',
        severity: 'low',
        explanation: 'Batterisundhed fortæller dig hvor slidt dit batteri er.',
        steps: [
          'iPhone/iPad: Åbn Indstillinger',
          'Tryk på "Batteri"',
          'Tryk på "Batterisundhed og opladning"',
          'Se tallet ved "Maksimal kapacitet"',
          'Over 80% = OK. Under 80% = Bør udskiftes',
          'Mac: Systemindstillinger → Batteri → Batterisundhed'
        ],
      },
      {
        id: 'solution-battery-settings',
        title: 'Optimer batteriindstillinger',
        severity: 'low',
        explanation: 'Selvom dit batteri er sundt, kan indstillinger dræne det hurtigt.',
        steps: [
          'Slå "Lavstrømstilstand" til: Indstillinger → Batteri',
          'Reducer skærmens lysstyrke',
          'Slå "Hent i baggrunden" fra: Indstillinger → Generelt → Opdater i baggrund',
          'Tjek hvilke apps der bruger mest batteri under Indstillinger → Batteri',
          'Slå unødvendige lokalitetstjenester fra',
          'Sluk for Wi-Fi og Bluetooth når du ikke bruger dem'
        ],
      },
      {
        id: 'solution-battery-worn',
        title: 'Batteriet er slidt og bør udskiftes',
        severity: 'medium',
        explanation: 'Når batterisundheden er under 80%, mister det mærkbart kapacitet.',
        technicalInfo: 'Lithium-ion batterier har typisk 500-1000 opladecyklusser før de er slidt.',
        steps: [
          'Dit batteri er slidt og kan ikke holde strøm som før',
          'Du kan fortsætte med at bruge det, men vil opleve kortere batteritid',
          'Overvej at få batteriet udskiftet hos Apple eller autoriseret værksted',
          'Apple batteriskift koster typisk 600-1200 kr afhængigt af model',
          'Tredjepartshops kan være billigere men tjek anmeldelser først',
          'Et nyt batteri giver typisk følelsen af en ny enhed'
        ],
        needsRepair: true,
        repairNote: 'Batteriudskiftning anbefales hos autoriseret værksted',
      },
      {
        id: 'solution-app-battery',
        title: 'En app dræner dit batteri',
        severity: 'low',
        explanation: 'Nogle apps bruger meget strøm, især hvis de kører i baggrunden.',
        steps: [
          'Gå til Indstillinger → Batteri',
          'Scroll ned for at se hvilke apps der bruger mest',
          'For problematiske apps: Luk dem helt (swipe op fra bunden, swipe app væk)',
          'Overvej at slette apps du ikke bruger',
          'Opdater apps der bruger meget: Gamle versioner kan have bugs',
          'Slå "Opdater i baggrund" fra for strømkrævende apps'
        ],
      },
      {
        id: 'solution-battery-calibrate',
        title: 'Kalibrer batteriet',
        severity: 'low',
        explanation: 'Når procenttallet springer eller enheden slukker for tidligt, kan en kalibrering hjælpe.',
        technicalInfo: 'Batteriets software-estimat kan blive unøjagtigt over tid. Kalibrering synkroniserer det.',
        steps: [
          'Brug enheden normalt til den slukker af sig selv (0%)',
          'Lad den ligge slukket i 2-3 timer',
          'Tilslut opladeren UDEN at tænde enheden',
          'Lad den oplade til 100% uden afbrydelser',
          'Lad den sidde i opladeren 1-2 timer EFTER den når 100%',
          'Tag opladeren ud og brug normalt'
        ],
      },
      {
        id: 'solution-battery-cold',
        title: 'Batteriet reagerer på kulde',
        severity: 'low',
        explanation: 'Lithium-ion batterier fungerer dårligere i kulde. Dette er normalt.',
        technicalInfo: 'Ved temperaturer under 0°C kan batteriet miste 20-50% af sin kapacitet midlertidigt.',
        steps: [
          'Hold enheden varm i lommen eller tasken når du er ude',
          'Undgå at bruge enheden i stærk kulde',
          'Hvis procenttallet er droppet i kulden, opvarmes enheden gradvist',
          'Batteriet genvinder sin normale kapacitet når det varmes op',
          'Lad aldrig en kold enhed op - vent til den har stuetemperatur'
        ],
      },
      {
        id: 'solution-clean-port',
        title: 'Rens ladeporten',
        severity: 'low',
        explanation: 'Fnug og snavs samler sig i ladeporten og kan blokere forbindelsen.',
        steps: [
          'Sluk enheden først',
          'Brug en tandstik af TRÆ (ALDRIG metal!)',
          'Skrab forsigtigt langs bunden og siderne af porten',
          'Du vil ofte blive overrasket over hvor meget der kommer ud',
          'Brug en blød børste eller trykluft til finere støv',
          'Prøv opladeren igen'
        ],
      },
      {
        id: 'solution-slow-charging',
        title: 'Løs langsom opladning',
        severity: 'low',
        explanation: 'Langsom opladning skyldes ofte svag oplader eller baggrundsaktivitet.',
        steps: [
          'Brug en oplader på mindst 20W (Apple-standard for hurtig opladning)',
          'Den medfølgende 5W-oplader (på ældre enheder) er meget langsom',
          'Brug et originalt eller MFi-certificeret kabel',
          'Slå Lavstrømstilstand til under opladning',
          'Undgå at bruge enheden intensivt mens den lader',
          'Tjek at porten er ren'
        ],
      },
      {
        id: 'solution-cable-issue',
        title: 'Kablet kan være defekt',
        severity: 'low',
        explanation: 'Opladerkable slider hurtigt og kan have usynlige brud indvendigt.',
        steps: [
          'Prøv et ANDET kabel - dette er den mest almindelige fejl',
          'Tjek kablet for synlige skader nær stikkene',
          'Prøv at vrikke forsigtigt på kablet mens det sidder i - holder det forbindelsen?',
          'Brug et originalt Apple-kabel eller MFi-certificeret alternativ',
          'Prøv også en anden oplader-blok',
          'Hvis intet virker: Porten kan være defekt → kontakt tekniker'
        ],
        needsRepair: true,
        repairNote: 'Hvis flere kabler og opladere ikke virker, kan ladeporten være defekt',
      },
    ],
  },
  {
    id: 'sound-issues',
    name: 'Lydproblemer',
    icon: '🔊',
    description: 'Ingen lyd, forvrænget lyd eller mikrofon virker ikke',
    startQuestion: 'sound-start',
    deviceTypes: ['iphone', 'ipad', 'mac'],
    questions: [
      {
        id: 'sound-start',
        question: 'Hvad oplever du med lyden?',
        options: [
          { label: 'Ingen lyd ud af højttaleren', emoji: '🔇', nextStep: 'sound-no-output' },
          { label: 'Lyden er forvrænget/skrattende', emoji: '📢', nextStep: 'sound-distorted' },
          { label: 'Mikrofonen virker ikke', emoji: '🎤', nextStep: 'mic-issue' },
          { label: 'Høretelefoner forbinder ikke', emoji: '🎧', nextStep: 'headphone-issue' },
        ],
      },
      {
        id: 'sound-no-output',
        question: 'Er lyden på lydløs eller skruet helt ned?',
        helpText: 'Tjek lydknapperne på siden af enheden og Kontrolcenter',
        options: [
          { label: 'Lydstyrken er skruet op', emoji: '🔊', nextStep: 'sound-no-output-check' },
          { label: 'Den var på lydløs - nu virker det!', emoji: '✅', nextStep: 'solution-sound-mute-fixed' },
          { label: 'Ved ikke hvordan jeg tjekker', emoji: '🤷', nextStep: 'solution-check-volume' },
        ],
      },
      {
        id: 'sound-no-output-check',
        question: 'Hvornår forsvandt lyden?',
        options: [
          { label: 'Efter den blev våd', emoji: '💧', nextStep: 'solution-sound-water' },
          { label: 'Efter et tab', emoji: '💥', nextStep: 'solution-speaker-repair' },
          { label: 'Gradvist eller pludseligt uden årsag', emoji: '❓', nextStep: 'sound-bluetooth-check' },
        ],
      },
      {
        id: 'sound-bluetooth-check',
        question: 'Er Bluetooth slået til?',
        helpText: 'Enheden sender måske lyd til en Bluetooth-enhed i stedet',
        options: [
          { label: 'Ja, det er slået til', emoji: '📶', nextStep: 'solution-sound-bluetooth' },
          { label: 'Nej, det er slået fra', emoji: '❌', nextStep: 'solution-sound-restart' },
        ],
      },
      {
        id: 'sound-distorted',
        question: 'Hvornår blev lyden forvrænget?',
        options: [
          { label: 'Efter den blev våd', emoji: '💧', nextStep: 'solution-sound-water' },
          { label: 'Ved høj lydstyrke', emoji: '🔊', nextStep: 'solution-sound-lower-volume' },
          { label: 'Altid, uanset lydstyrke', emoji: '📢', nextStep: 'solution-speaker-clogged' },
        ],
      },
      {
        id: 'mic-issue',
        question: 'Hvornår opdagede du problemet?',
        options: [
          { label: 'Ved opkald - folk kan ikke høre mig', emoji: '📞', nextStep: 'mic-call-issue' },
          { label: 'Ved stemmebeskeder/optagelse', emoji: '🎙️', nextStep: 'mic-recording-issue' },
          { label: 'Siri forstår mig ikke', emoji: '🗣️', nextStep: 'mic-siri-issue' },
        ],
      },
      {
        id: 'mic-call-issue',
        question: 'Har du et cover der dækker mikrofonen?',
        helpText: 'Mikrofonen sidder i bunden ved siden af ladeporten',
        options: [
          { label: 'Ja, jeg fjerner det og prøver igen', emoji: '📱', nextStep: 'solution-mic-cover' },
          { label: 'Nej, ingen cover', emoji: '❌', nextStep: 'solution-mic-clean' },
        ],
      },
      {
        id: 'mic-recording-issue',
        question: 'Virker mikrofonen i andre apps?',
        options: [
          { label: 'Ja, kun problem i én app', emoji: '📲', nextStep: 'solution-mic-permission' },
          { label: 'Nej, ingen apps virker', emoji: '❌', nextStep: 'solution-mic-clean' },
        ],
      },
      {
        id: 'mic-siri-issue',
        question: 'Har Siri tilladelse til at bruge mikrofonen?',
        options: [
          { label: 'Ved ikke', emoji: '🤷', nextStep: 'solution-siri-mic-permission' },
          { label: 'Ja, men det virker stadig ikke', emoji: '❌', nextStep: 'solution-mic-clean' },
        ],
      },
      {
        id: 'headphone-issue',
        question: 'Hvilken type høretelefoner?',
        options: [
          { label: 'AirPods', emoji: '🎧', nextStep: 'solution-airpods-connection' },
          { label: 'Med kabel (stik)', emoji: '🔌', nextStep: 'solution-wired-headphones' },
          { label: 'Andre Bluetooth', emoji: '📶', nextStep: 'solution-bluetooth-headphones' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-sound-mute-fixed',
        title: 'Problemet løst!',
        severity: 'low',
        explanation: 'Enheden var på lydløs eller lydstyrken var skruet ned. Nu burde lyden virke.',
        steps: [
          'Husk at tjekke lydstyrken i Kontrolcenter (swipe ned fra højre hjørne)',
          'Den fysiske lydløs-knap på siden (iPhone) kan også mute alt',
          'Nogle apps har deres egen lydstyrke-indstilling',
          'Ved medier: Lydstyrkeknapperne justerer medielyd',
          'Ved opkald: Lydstyrkeknapperne justerer opkaldslyd'
        ],
      },
      {
        id: 'solution-check-volume',
        title: 'Sådan tjekker du lydstyrken',
        severity: 'low',
        explanation: 'Der er flere steder lyd kan være slået fra eller ned.',
        steps: [
          'Tryk på lydstyrke OP-knappen på siden af enheden',
          'Åbn Kontrolcenter: Swipe ned fra øverste højre hjørne (iPhone X+) eller op fra bunden (ældre)',
          'Se efter lydstyrke-slideren og træk den op',
          'iPhone: Tjek den lille knap over lydstyrkeknapperne - orange betyder lydløs',
          'Gå til Indstillinger → Lyde og følelse → Skru "Ringetone og advarsler" op'
        ],
      },
      {
        id: 'solution-sound-water',
        title: 'Vand i højttaleren',
        severity: 'medium',
        explanation: 'Vand i højttaleren kan midlertidigt påvirke lyden. Det meste vand fordamper af sig selv.',
        technicalInfo: 'Nyere iPhones er vandafvisende, men højttalerhuller kan holde på vand.',
        steps: [
          'Sluk IKKE enheden - lad den være tændt så varmen hjælper med at fordampe vandet',
          'Læg IKKE enheden i ris - det hjælper ikke og kan skade',
          'Hold enheden med højttaleren nedad',
          'Afspil musik ved høj lydstyrke for at vibrere vandet ud',
          'Eller brug "Water Eject" genvej fra Genveje-appen',
          'Vent 24-48 timer før du antager det er permanent'
        ],
      },
      {
        id: 'solution-sound-bluetooth',
        title: 'Lyd sendes til Bluetooth-enhed',
        severity: 'low',
        explanation: 'Din enhed sender sandsynligvis lyden til en Bluetooth-højttaler eller høretelefoner i nærheden.',
        steps: [
          'Åbn Kontrolcenter (swipe ned fra højre hjørne)',
          'Hold fingeren nede på musik-boksen',
          'Se om der står en Bluetooth-enhed ved lydikonet',
          'Tryk på højttalerikonet og vælg "iPhone" eller "iPad"',
          'Eller slå Bluetooth helt fra midlertidigt i Indstillinger → Bluetooth'
        ],
      },
      {
        id: 'solution-sound-restart',
        title: 'Genstart lydssystemet',
        severity: 'low',
        explanation: 'En genstart kan løse software-relaterede lydproblemer.',
        steps: [
          'Lav en fuld genstart af enheden',
          'iPhone: Hold Lyd Op + Sideknap, slide for at slukke',
          'Vent 30 sekunder og tænd igen',
          'Tjek om lyden virker nu',
          'Hvis ikke: Prøv at nulstille alle indstillinger (Indstillinger → Generelt → Nulstil)'
        ],
      },
      {
        id: 'solution-sound-lower-volume',
        title: 'Reducer lydstyrken',
        severity: 'low',
        explanation: 'Ved meget høj lydstyrke kan højttaleren forvrænge lyden. Dette er normalt.',
        steps: [
          'Skru lydstyrken ned til 70-80%',
          'Højttalere har fysiske grænser for hvor højt de kan spille rent',
          'Hvis forvrængningen fortsætter ved lavere lydstyrke, kan højttaleren være beskadiget',
          'Prøv at afspille forskellige lydkilder for at teste',
          'Fortsætter problemet? → Kontakt en tekniker'
        ],
      },
      {
        id: 'solution-speaker-clogged',
        title: 'Rens højttalergitrene',
        severity: 'low',
        explanation: 'Støv og snavs samler sig i højttalerhullerne over tid.',
        steps: [
          'Find højttalerhullerne i bunden af enheden',
          'Brug en blød, TØR tandbørste til at børste forsigtigt over hullerne',
          'Brug trykluft (svagt!) for at blæse snavs ud',
          'Brug ALDRIG nåle eller spidse genstande',
          'Brug ALDRIG væske til rengøring',
          'Fortsætter problemet? → Højttaleren kan være defekt'
        ],
        needsRepair: true,
        repairNote: 'Hvis rensning ikke hjælper, kan højttaleren være defekt og skal udskiftes',
      },
      {
        id: 'solution-speaker-repair',
        title: 'Højttaleren kan være beskadiget',
        severity: 'high',
        explanation: 'Et tab kan have beskadiget højttaleren eller dens forbindelse til bundkortet.',
        steps: [
          'Prøv først en genstart',
          'Test om lyden virker med høretelefoner - hvis ja, er det specifikt højttaleren',
          'Tjek om der er synlige skader på enheden',
          'Kontakt en reparatør for diagnose',
          'Højttalerreperaturer er typisk overkommelige'
        ],
        needsRepair: true,
        repairNote: 'Højttalerreperaturer koster typisk 400-800 kr hos professionelle',
      },
      {
        id: 'solution-mic-cover',
        title: 'Cover kan blokere mikrofonen',
        severity: 'low',
        explanation: 'Mange covers dækker utilsigtet mikrofon- eller højttalerhuller.',
        steps: [
          'Tag coveret af og test opkald igen',
          'Mikrofonen sidder i bunden ved ladeporten OG ved kameraet',
          'Hvis det virker uden cover, brug et andet cover med åbne huller',
          'Tjek at coveret passer til din specifikke model'
        ],
      },
      {
        id: 'solution-mic-clean',
        title: 'Rens mikrofonhullerne',
        severity: 'low',
        explanation: 'Mikrofonhullerne kan være tilstoppede med støv eller fnug.',
        technicalInfo: 'Der er typisk 3 mikrofoner: Bund (ved ladeport), front (ved ørehøjttaler), og bag (ved kamera).',
        steps: [
          'Find mikrofonhullerne (små huller i bunden og bagsiden)',
          'Brug en blød, tør tandbørste til forsigtigt at rense',
          'Brug trykluft forsigtigt',
          'Brug IKKE væske eller spidse genstande',
          'Test ved at optage en stemmebeskeder til dig selv',
          'Hvis intet virker, kontakt en tekniker'
        ],
        needsRepair: true,
        repairNote: 'Defekte mikrofoner kræver professionel reparation',
      },
      {
        id: 'solution-mic-permission',
        title: 'Tjek app-tilladelser',
        severity: 'low',
        explanation: 'Appen har muligvis ikke tilladelse til at bruge mikrofonen.',
        steps: [
          'Gå til Indstillinger → Anonymitet og sikkerhed → Mikrofon',
          'Find den app du har problemer med',
          'Sørg for at kontakten er slået TIL (grøn)',
          'Hvis den allerede er til, prøv at slå fra og til igen',
          'Genstart appen bagefter'
        ],
      },
      {
        id: 'solution-siri-mic-permission',
        title: 'Tjek Siri-indstillinger',
        severity: 'low',
        explanation: 'Siri har brug for mikrofonadgang og skal være aktiveret korrekt.',
        steps: [
          'Gå til Indstillinger → Siri og søgning',
          'Sørg for at "Lyt efter Hey Siri" er slået til (hvis ønsket)',
          'Prøv at slå Siri FRA, genstart enheden, og slå TIL igen',
          'Gennemgå Siri-opsætningen igen ved at slå til',
          'Test ved at sige "Hey Siri" eller holde sideknappen'
        ],
      },
      {
        id: 'solution-airpods-connection',
        title: 'AirPods forbindelsesproblemer',
        severity: 'low',
        explanation: 'AirPods kan nogle gange miste forbindelsen eller have problemer med parring.',
        steps: [
          'Læg AirPods i etuiet og luk låget i 30 sekunder',
          'Åbn låget nær din iPhone/iPad',
          'Hvis de ikke forbinder automatisk: Gå til Indstillinger → Bluetooth',
          'Tryk på (i) ved dine AirPods og "Glem denne enhed"',
          'Hold knappen bag på etuiet nede til lyset blinker hvidt',
          'Parr dem igen ved at åbne låget nær enheden'
        ],
      },
      {
        id: 'solution-wired-headphones',
        title: 'Kablede høretelefoner virker ikke',
        severity: 'low',
        explanation: 'Problemer med kablede høretelefoner skyldes ofte stikket eller adapteren.',
        steps: [
          'Nyere iPhones kræver Lightning-adapter til 3.5mm høretelefoner',
          'Prøv at tage stikket ud og sætte i igen - vrid forsigtigt',
          'Rens stikket med en tør klud',
          'Prøv et andet par høretelefoner for at teste',
          'Hvis andre høretelefoner virker, er dine defekte',
          'Hvis intet virker, kan stikket/adapteren være defekt'
        ],
      },
      {
        id: 'solution-bluetooth-headphones',
        title: 'Bluetooth-høretelefoner forbinder ikke',
        severity: 'low',
        explanation: 'Bluetooth-parring kan nogle gange kræve at starte forfra.',
        steps: [
          'Sørg for at høretelefonerne er i parringstilstand (se manual)',
          'Gå til Indstillinger → Bluetooth på din enhed',
          'Hvis de står på listen: Tryk (i) og "Glem denne enhed"',
          'Sæt høretelefonerne i parringstilstand igen',
          'Vent til de dukker op under "Andre enheder"',
          'Tryk på dem for at parre'
        ],
      },
    ],
  },
  {
    id: 'camera-issues',
    name: 'Kameraproblemer',
    icon: '📷',
    description: 'Kamera viser sort skærm, uskarpe billeder eller virker ikke',
    startQuestion: 'camera-start',
    deviceTypes: ['iphone', 'ipad'],
    questions: [
      {
        id: 'camera-start',
        question: 'Hvad er problemet med kameraet?',
        options: [
          { label: 'Skærmen er sort når jeg åbner kamera', emoji: '⬛', nextStep: 'camera-black' },
          { label: 'Billeder er uskarpe eller slørede', emoji: '🌫️', nextStep: 'camera-blurry' },
          { label: 'Kamera-appen crasher', emoji: '💥', nextStep: 'camera-crash' },
          { label: 'Blitzen virker ikke', emoji: '⚡', nextStep: 'flash-issue' },
        ],
      },
      {
        id: 'camera-black',
        question: 'Er det kun det ene kamera der ikke virker?',
        helpText: 'Prøv at skifte mellem front- og bagkamera',
        options: [
          { label: 'Kun bagkameraet er sort', emoji: '📷', nextStep: 'camera-back-issue' },
          { label: 'Kun frontkameraet er sort', emoji: '🤳', nextStep: 'camera-front-issue' },
          { label: 'Begge kameraer er sorte', emoji: '⬛', nextStep: 'solution-camera-restart' },
        ],
      },
      {
        id: 'camera-back-issue',
        question: 'Virker bagkameraet i andre apps? (fx FaceTime)',
        options: [
          { label: 'Ja, virker i andre apps', emoji: '✅', nextStep: 'solution-camera-app-issue' },
          { label: 'Nej, sort i alle apps', emoji: '❌', nextStep: 'camera-back-physical' },
        ],
      },
      {
        id: 'camera-back-physical',
        question: 'Har enheden været tabt eller udsat for noget?',
        options: [
          { label: 'Ja, den har været tabt', emoji: '💥', nextStep: 'solution-camera-repair' },
          { label: 'Ja, den har fået væske', emoji: '💧', nextStep: 'solution-camera-repair' },
          { label: 'Nej, ingen uheld', emoji: '✅', nextStep: 'solution-camera-restart' },
        ],
      },
      {
        id: 'camera-front-issue',
        question: 'Er der noget der dækker frontkameraet?',
        helpText: 'Skærmbeskytter, snavs eller cover kan blokere det',
        options: [
          { label: 'Ja, jeg fjerner det', emoji: '🧹', nextStep: 'solution-camera-clean' },
          { label: 'Nej, intet i vejen', emoji: '❌', nextStep: 'solution-camera-restart' },
        ],
      },
      {
        id: 'camera-blurry',
        question: 'Er billederne altid uskarpe?',
        options: [
          { label: 'Ja, altid sløret', emoji: '🌫️', nextStep: 'camera-lens-check' },
          { label: 'Kun i svag belysning', emoji: '🌙', nextStep: 'solution-camera-low-light' },
          { label: 'Kun når jeg zoomer ind', emoji: '🔍', nextStep: 'solution-camera-zoom' },
        ],
      },
      {
        id: 'camera-lens-check',
        question: 'Er der noget på linsen?',
        helpText: 'Tjek for snavs, ridser eller fedtede fingeraftryk',
        options: [
          { label: 'Ja, linsen er snavset', emoji: '💧', nextStep: 'solution-camera-clean' },
          { label: 'Linsen ser ren ud', emoji: '✅', nextStep: 'camera-focus-issue' },
          { label: 'Der er ridser på linsen', emoji: '💔', nextStep: 'solution-camera-repair' },
        ],
      },
      {
        id: 'camera-focus-issue',
        question: 'Fokuserer kameraet overhovedet? (hører du et klik når du tapper?)',
        options: [
          { label: 'Ja, det fokuserer men er sløret', emoji: '📸', nextStep: 'solution-camera-restart' },
          { label: 'Nej, ingen fokus-lyd/bevægelse', emoji: '❌', nextStep: 'solution-camera-repair' },
        ],
      },
      {
        id: 'camera-crash',
        question: 'Hvornår crasher kamera-appen?',
        options: [
          { label: 'Med det samme den åbnes', emoji: '💥', nextStep: 'solution-camera-reset' },
          { label: 'Når jeg tager et billede', emoji: '📸', nextStep: 'solution-camera-storage' },
          { label: 'Tilfældigt under brug', emoji: '❓', nextStep: 'solution-camera-restart' },
        ],
      },
      {
        id: 'flash-issue',
        question: 'Virker lommelygtefunktionen?',
        helpText: 'Tjek i Kontrolcenter (swipe ned fra højre hjørne)',
        options: [
          { label: 'Ja, lommelygte virker', emoji: '🔦', nextStep: 'solution-flash-software' },
          { label: 'Nej, heller ikke lommelygte', emoji: '❌', nextStep: 'solution-flash-repair' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-camera-restart',
        title: 'Genstart kamera og enhed',
        severity: 'low',
        explanation: 'Kamera-software kan fryse. En genstart løser ofte problemet.',
        steps: [
          'Luk Kamera-appen helt: Swipe op fra bunden, swipe appen væk',
          'Vent 10 sekunder',
          'Åbn Kamera-appen igen',
          'Stadig problem? Genstart enheden: Hold Lyd Op + Sideknap, slide for at slukke',
          'Tænd igen og test kameraet'
        ],
      },
      {
        id: 'solution-camera-app-issue',
        title: 'Problem med Kamera-appen',
        severity: 'low',
        explanation: 'Når kameraet virker i andre apps men ikke i Kamera-appen, er det et softwareproblem.',
        steps: [
          'Luk alle apps og genstart enheden',
          'Tjek for iOS-opdateringer: Indstillinger → Generelt → Softwareopdatering',
          'Nulstil alle indstillinger: Indstillinger → Generelt → Nulstil → Nulstil alle indstillinger',
          'Dette sletter IKKE dine billeder eller apps',
          'Genstart og test kameraet igen'
        ],
      },
      {
        id: 'solution-camera-clean',
        title: 'Rens kameralinsen',
        severity: 'low',
        explanation: 'En snavset linse er den mest almindelige årsag til uskarpe billeder.',
        steps: [
          'Brug en blød, tør mikrofiberklud (som til briller)',
          'Pust forsigtigt på linsen for at fjerne løst støv først',
          'Tør forsigtigt i cirkelbevægelser',
          'Brug IKKE almindeligt stof, papir eller våde klude',
          'Fjern også evt. cover der dækker linsen',
          'Tag et testbillede bagefter'
        ],
      },
      {
        id: 'solution-camera-low-light',
        title: 'Bedre billeder i svag belysning',
        severity: 'low',
        explanation: 'Alle kameraer har sværere ved at fokusere i mørke. Der er dog tricks.',
        steps: [
          'Hold enheden MEGET stille - brug begge hænder',
          'Støt albuerne mod kroppen eller en overflade',
          'Slå Nattilstand til hvis tilgængelig (vises automatisk)',
          'Tryk på skærmen for at fokusere på det du vil fotografere',
          'Undgå at zoome i mørke - det gør billedet mere kornet',
          'Brug blitz hvis nødvendigt'
        ],
      },
      {
        id: 'solution-camera-zoom',
        title: 'Digital zoom giver altid dårligere kvalitet',
        severity: 'low',
        explanation: 'Digital zoom forstørrer bare billedet og mister kvalitet. Optisk zoom er bedre.',
        steps: [
          'Gå tættere på motivet i stedet for at zoome',
          'Modeller med flere kameraer har optisk zoom (0.5x, 1x, 2x, 3x)',
          'Digital zoom (mere end max optisk) vil altid være sløret',
          'Tag billede uden zoom og beskær bagefter for bedre kvalitet',
          'Billeder kan beskæres i Fotos-appen'
        ],
      },
      {
        id: 'solution-camera-reset',
        title: 'Nulstil kameraindstillinger',
        severity: 'low',
        explanation: 'Forkerte indstillinger eller korrupte cache-data kan få appen til at crashe.',
        steps: [
          'Gå til Indstillinger → Kamera',
          'Tryk "Bevar indstillinger" og slå alt FRA',
          'Gå tilbage og nulstil alle indstillinger: Generelt → Nulstil → Nulstil alle indstillinger',
          'Genstart enheden',
          'Åbn Kamera-appen og test'
        ],
      },
      {
        id: 'solution-camera-storage',
        title: 'Tjek lagerplads',
        severity: 'low',
        explanation: 'Hvis enheden er fuld, kan den ikke gemme billeder og Kamera-appen kan crashe.',
        steps: [
          'Gå til Indstillinger → Generelt → iPhone-lagring',
          'Hvis der er under 1-2 GB fri plads, slet noget',
          'Slet gamle billeder/videoer eller flyt dem til iCloud/computer',
          'Slet apps du ikke bruger',
          'Ryd "Nyligt slettet" album i Fotos',
          'Prøv kameraet igen når der er mere plads'
        ],
      },
      {
        id: 'solution-flash-software',
        title: 'Blitz-software problem',
        severity: 'low',
        explanation: 'Når lommelygten virker men kamerablitz ikke gør, er det et softwareproblem.',
        steps: [
          'Luk Kamera-appen og alle andre apps',
          'Genstart enheden',
          'Åbn Kamera og tjek blitz-ikonet øverst',
          'Sørg for at blitz er sat til "Auto" eller "Til"',
          'Hvis enheden er varm, kan blitz være midlertidigt deaktiveret - lad den køle ned'
        ],
      },
      {
        id: 'solution-flash-repair',
        title: 'Blitz-hardware defekt',
        severity: 'high',
        explanation: 'Når hverken blitz eller lommelygte virker, er LED-komponenten sandsynligvis defekt.',
        steps: [
          'Prøv en genstart først',
          'Tjek om enheden er overophedet (kan midlertidigt slå blitz fra)',
          'Vent til den er kølet ned og prøv igen',
          'Hvis det stadig ikke virker, er det hardware',
          'Kontakt en reparatør - LED udskiftning er muligt'
        ],
        needsRepair: true,
        repairNote: 'Defekt blitz-LED kræver professionel reparation',
      },
      {
        id: 'solution-camera-repair',
        title: 'Kameraet kræver reparation',
        severity: 'high',
        explanation: 'Baseret på symptomerne ser det ud til at være et hardware-problem med kameraet.',
        technicalInfo: 'Kameramodulet kan have løse forbindelser, defekt autofokus-motor, eller beskadiget sensor.',
        steps: [
          'Tag backup af dine billeder til iCloud eller computer',
          'Kontakt Apple eller en autoriseret servicepartner',
          'Få en diagnose før du beslutter om reparation',
          'Kamerareparationer kan variere meget i pris',
          'Overvej om prisen er værd det ift. enhedens alder'
        ],
        needsRepair: true,
        repairNote: 'Kamerareparation bør udføres af autoriseret tekniker',
      },
    ],
  },
  {
    id: 'security-check',
    name: 'Er jeg hacket?',
    icon: '🔒',
    description: 'Tjek for tegn på uautoriseret adgang eller sikkerhedsproblemer',
    startQuestion: 'security-start',
    deviceTypes: ['iphone', 'ipad', 'mac'],
    questions: [
      {
        id: 'security-start',
        question: 'Hvorfor tror du at du måske er hacket?',
        helpText: 'Vælg det der bedst beskriver din bekymring',
        options: [
          { label: 'Mærkelig opførsel på enheden', emoji: '👻', nextStep: 'strange-behavior' },
          { label: 'Mistænkelige emails/beskeder', emoji: '📧', nextStep: 'suspicious-messages' },
          { label: 'Ukendte apps eller køb', emoji: '📲', nextStep: 'unknown-apps' },
          { label: 'Nogen nævnte at de kunne se mine ting', emoji: '👁️', nextStep: 'shared-access' },
          { label: 'Jeg vil bare tjekke sikkerheden generelt', emoji: '🛡️', nextStep: 'solution-security-checkup' },
        ],
      },
      {
        id: 'strange-behavior',
        question: 'Hvilken mærkelig opførsel ser du?',
        options: [
          { label: 'Enheden gør ting af sig selv', emoji: '👆', nextStep: 'device-actions' },
          { label: 'Batteri drænes unormalt hurtigt', emoji: '🔋', nextStep: 'battery-drain-security' },
          { label: 'Enheden er varm hele tiden', emoji: '🔥', nextStep: 'device-hot' },
          { label: 'Pop-ups og reklamer overalt', emoji: '📢', nextStep: 'popup-ads' },
        ],
      },
      {
        id: 'device-actions',
        question: 'Hvad gør enheden af sig selv?',
        options: [
          { label: 'Skærmen trykker af sig selv', emoji: '👻', nextStep: 'solution-ghost-touch-not-hack' },
          { label: 'Apps åbner af sig selv', emoji: '📲', nextStep: 'apps-opening' },
          { label: 'Beskeder sendes jeg ikke har skrevet', emoji: '✉️', nextStep: 'solution-account-compromised' },
        ],
      },
      {
        id: 'apps-opening',
        question: 'Hvilke apps åbner af sig selv?',
        options: [
          { label: 'Tilfældige apps starter', emoji: '🎲', nextStep: 'solution-app-bug' },
          { label: 'Kamera/mikrofon aktiveres', emoji: '📷', nextStep: 'solution-privacy-check' },
          { label: 'Browser åbner mærkelige sider', emoji: '🌐', nextStep: 'solution-clear-browser' },
        ],
      },
      {
        id: 'battery-drain-security',
        question: 'Er batteridræningen pludselig eller gradvis?',
        options: [
          { label: 'Pludselig, fra den ene dag til den anden', emoji: '⚡', nextStep: 'solution-check-battery-apps' },
          { label: 'Gradvis over tid', emoji: '📉', nextStep: 'solution-battery-normal-wear' },
        ],
      },
      {
        id: 'device-hot',
        question: 'Hvornår bliver enheden varm?',
        options: [
          { label: 'Hele tiden, også når jeg ikke bruger den', emoji: '🔥', nextStep: 'solution-check-background-activity' },
          { label: 'Kun når jeg bruger den meget', emoji: '📱', nextStep: 'solution-normal-heat' },
        ],
      },
      {
        id: 'popup-ads',
        question: 'Hvor ser du pop-ups og reklamer?',
        options: [
          { label: 'I alle apps og på hjemmeskærmen', emoji: '📲', nextStep: 'solution-remove-bad-app' },
          { label: 'Kun i browseren', emoji: '🌐', nextStep: 'solution-clear-browser' },
          { label: 'Kun i én specifik app', emoji: '📱', nextStep: 'solution-app-has-ads' },
        ],
      },
      {
        id: 'suspicious-messages',
        question: 'Hvad modtog du?',
        options: [
          { label: 'Email/SMS om login jeg ikke lavede', emoji: '🔐', nextStep: 'login-notification' },
          { label: 'Besked om at skifte adgangskode', emoji: '🔑', nextStep: 'password-reset-message' },
          { label: 'Trussel om at de har mine billeder/data', emoji: '😰', nextStep: 'solution-extortion-scam' },
          { label: 'Link jeg kom til at klikke på', emoji: '🔗', nextStep: 'clicked-link' },
        ],
      },
      {
        id: 'login-notification',
        question: 'Genkender du lokationen/enheden i beskeden?',
        options: [
          { label: 'Nej, det var ikke mig!', emoji: '❌', nextStep: 'solution-account-compromised' },
          { label: 'Hmm, måske var det mig alligevel', emoji: '🤔', nextStep: 'solution-check-login-history' },
          { label: 'Ved ikke', emoji: '🤷', nextStep: 'solution-check-login-history' },
        ],
      },
      {
        id: 'password-reset-message',
        question: 'Har du selv bedt om at nulstille adgangskoden?',
        options: [
          { label: 'Nej, det har jeg ikke', emoji: '❌', nextStep: 'solution-ignore-reset' },
          { label: 'Ja, det var mig', emoji: '✅', nextStep: 'solution-safe-reset' },
        ],
      },
      {
        id: 'clicked-link',
        question: 'Hvad skete der efter du klikkede?',
        options: [
          { label: 'Jeg blev bedt om at logge ind', emoji: '🔐', nextStep: 'solution-phishing-login' },
          { label: 'Der skete ikke noget særligt', emoji: '🤷', nextStep: 'solution-clicked-link-monitor' },
          { label: 'Der blev downloadet noget', emoji: '⬇️', nextStep: 'solution-remove-download' },
        ],
      },
      {
        id: 'unknown-apps',
        question: 'Hvad har du opdaget?',
        options: [
          { label: 'Apps jeg ikke har installeret', emoji: '📲', nextStep: 'solution-check-unknown-apps' },
          { label: 'Køb på min konto jeg ikke har lavet', emoji: '💳', nextStep: 'solution-unauthorized-purchase' },
          { label: 'Abonnementer jeg ikke har tilmeldt', emoji: '📋', nextStep: 'solution-check-subscriptions' },
        ],
      },
      {
        id: 'shared-access',
        question: 'Hvordan ved de noget om dig?',
        options: [
          { label: 'De nævnte ting fra mine beskeder', emoji: '💬', nextStep: 'solution-account-compromised' },
          { label: 'De kendte min lokation', emoji: '📍', nextStep: 'solution-check-location-sharing' },
          { label: 'De så billeder fra min telefon', emoji: '📷', nextStep: 'solution-check-shared-albums' },
          { label: 'Ved ikke præcist', emoji: '🤷', nextStep: 'solution-security-checkup' },
        ],
      },
    ],
    solutions: [
      {
        id: 'solution-security-checkup',
        title: 'Generelt sikkerhedstjek',
        severity: 'low',
        explanation: 'Her er en tjekliste for at sikre din enhed og dine konti. Du behøver ikke være bekymret - dette er bare god praksis.',
        steps: [
          '1. Tjek Apple ID: Indstillinger → [Dit navn] → Se under "Enheder" om der er enheder du ikke genkender',
          '2. Tjek login-historik: Gå til appleid.apple.com og log ind for at se al aktivitet',
          '3. Tjek "Familiedeling": Indstillinger → [Dit navn] → Familiedeling - er der nogen du ikke kender?',
          '4. Tjek "Find My" deling: Indstillinger → Anonymitet → Lokalitetstjenester → Del min lokation',
          '5. Tjek konfigurationsprofiler: Indstillinger → Generelt → VPN og enhedshåndtering - slet ukendte profiler',
          '6. Opdater til nyeste iOS: Indstillinger → Generelt → Softwareopdatering'
        ],
      },
      {
        id: 'solution-ghost-touch-not-hack',
        title: 'Dette er ikke hacking - det er "Ghost Touch"',
        severity: 'low',
        explanation: 'Når skærmen trykker af sig selv, er det næsten altid et hardware-problem kaldet "Ghost Touch" - ikke hacking.',
        steps: [
          'Ghost Touch skyldes typisk:',
          '- Billig eller dårlig skærmbeskytter',
          '- Defekt oplader der sender elektrisk støj',
          '- Fysisk skade på skærmen',
          'Prøv at fjerne skærmbeskytteren og se om problemet forsvinder',
          'Prøv en anden oplader',
          'Vælg "Skærmproblemer" i fejlfindingen for trin-for-trin hjælp'
        ],
      },
      {
        id: 'solution-account-compromised',
        title: '⚠️ Din konto kan være kompromitteret',
        severity: 'high',
        explanation: 'Hvis nogen sender beskeder fra din konto eller logger ind som dig, skal du handle hurtigt.',
        steps: [
          '1. SKIFT ADGANGSKODE NU: Gå til appleid.apple.com → Sikkerhed → Skift adgangskode',
          '2. Slå to-faktor godkendelse til hvis den ikke er det',
          '3. Gå til "Enheder" og tryk "Fjern fra konto" på enheder du ikke genkender',
          '4. Skift adgangskode på din email (den bruges til at nulstille andre konti)',
          '5. Tjek om din email er lækket: Gå til haveibeenpwned.com og indtast din email',
          '6. Overvej at kontakte banken hvis finansielle oplysninger er involveret'
        ],
      },
      {
        id: 'solution-privacy-check',
        title: 'Tjek kamera- og mikrofontilladelser',
        severity: 'medium',
        explanation: 'Når kamera eller mikrofon aktiveres, viser iOS en grøn/orange prik øverst. Du kan tjekke hvilke apps der har adgang.',
        technicalInfo: 'Grøn prik = kamera aktivt. Orange prik = mikrofon aktiv.',
        steps: [
          '1. Gå til Indstillinger → Anonymitet og sikkerhed → Kamera',
          '2. Slå FRA for alle apps du ikke genkender eller stoler på',
          '3. Gør det samme for Mikrofon',
          '4. Swipe ned fra toppen for at se Kontrolcenter - seneste kamera/mikrofon-brug vises øverst',
          '5. Hvis du ser apps du ikke genkender, slet dem',
          '6. Genstart enheden bagefter'
        ],
      },
      {
        id: 'solution-check-battery-apps',
        title: 'Tjek hvilke apps der dræner batteri',
        severity: 'low',
        explanation: 'Pludselig batteridræning skyldes ofte en app der kører amok i baggrunden - sjældent hacking.',
        steps: [
          '1. Gå til Indstillinger → Batteri',
          '2. Scroll ned for at se hvilke apps der bruger mest strøm',
          '3. Hvis en ukendt app bruger meget: Slet den!',
          '4. Hvis en normal app bruger unormalt meget: Opdater appen eller geninstaller',
          '5. Slå "Opdater i baggrund" fra for apps der dræner: Indstillinger → Generelt → Opdater i baggrund',
          '6. Genstart enheden'
        ],
      },
      {
        id: 'solution-battery-normal-wear',
        title: 'Gradvis batterislid er normalt',
        severity: 'low',
        explanation: 'Batterier slides over tid. Dette er ikke tegn på hacking.',
        steps: [
          'Tjek batterisundheden: Indstillinger → Batteri → Batterisundhed',
          'Under 80% = batteriet er slidt og bør udskiftes',
          'Ældre enheder holder naturligt kortere',
          'Flere åbne apps = hurtigere batteriforbrug',
          'Se "Batteriproblemer" i fejlfindingen for flere tips'
        ],
      },
      {
        id: 'solution-normal-heat',
        title: 'Normal varme ved brug',
        severity: 'low',
        explanation: 'Det er helt normalt at enheden bliver varm ved intensiv brug. Dette er ikke hacking.',
        steps: [
          'Spil, video og opladning varmer enheden op',
          'Direkte sollys kan overophede enheden',
          'Tag cover af hvis enheden er for varm',
          'Luk tunge apps du ikke bruger',
          'Hvis den er varm UDEN brug, tjek batteriforbruget'
        ],
      },
      {
        id: 'solution-check-background-activity',
        title: 'Tjek baggrundsaktivitet',
        severity: 'medium',
        explanation: 'Hvis enheden er varm uden du bruger den, kører der muligvis noget i baggrunden.',
        steps: [
          '1. Gå til Indstillinger → Batteri og se "Aktivitet"',
          '2. Kig efter apps med høj baggrundsaktivitet',
          '3. Ukendte apps med meget aktivitet bør slettes',
          '4. Gå til Indstillinger → Generelt → Opdater i baggrund',
          '5. Slå det FRA for apps der ikke behøver det',
          '6. Tjek også: Indstillinger → Generelt → VPN og enhedshåndtering for ukendte profiler'
        ],
      },
      {
        id: 'solution-remove-bad-app',
        title: 'Fjern problematisk app',
        severity: 'medium',
        explanation: 'Hvis du ser reklamer på hjemmeskærmen, har du sandsynligvis installeret en app med skjulte reklamer.',
        steps: [
          '1. Tænk tilbage: Hvilke apps installerede du lige før problemet startede?',
          '2. Slet nyligt installerede apps én ad gangen og test',
          '3. Tjek alle apps: Indstillinger → Generelt → iPhone-lagring',
          '4. Slet apps du ikke genkender',
          '5. Tjek for "Konfigurationsprofiler": Indstillinger → Generelt → VPN og enhedshåndtering',
          '6. Slet ukendte profiler (de kan vise reklamer)'
        ],
      },
      {
        id: 'solution-clear-browser',
        title: 'Rens browserdata',
        severity: 'low',
        explanation: 'Pop-ups og omdirigeringer i browseren skyldes ofte cookies eller ondsindede websites du har besøgt.',
        steps: [
          '1. Safari: Indstillinger → Safari → Ryd historik og websitedata',
          '2. Tryk "Ryd historik og data" for at bekræfte',
          '3. Slå "Blokér pop op-vinduer" TIL: Indstillinger → Safari → Blokér pop op-vinduer',
          '4. Slå "Advarsel om falske websteder" TIL i samme menu',
          '5. Installer IKKE "rense-apps" eller "sikkerhedsapps" fra pop-ups - de er ofte selv problemet!',
          '6. Brug kun App Store til at installere apps'
        ],
      },
      {
        id: 'solution-app-has-ads',
        title: 'Appen har reklamer',
        severity: 'low',
        explanation: 'Mange gratis apps viser reklamer. Dette er normalt og ikke hacking.',
        steps: [
          'Gratis apps finansieres ofte af reklamer',
          'Du kan ofte betale for at fjerne reklamer (in-app køb)',
          'Hvis reklamer er for aggressive, find et alternativ til appen',
          'Undgå at klikke på reklamerne - luk dem med X',
          'Slet appen hvis reklamerne er for irriterende'
        ],
      },
      {
        id: 'solution-app-bug',
        title: 'Apps der åbner af sig selv er ofte bugs',
        severity: 'low',
        explanation: 'Apps der starter af sig selv skyldes normalt fejl i appen, ikke hacking.',
        steps: [
          '1. Opdater den problematiske app i App Store',
          '2. Hvis det ikke hjælper: Slet og geninstaller appen',
          '3. Tjek notifikationsindstillinger: Indstillinger → Notifikationer → [App]',
          '4. Slå "Tillad notifikationer" fra for appen',
          '5. Hvis problemet fortsætter med mange apps: Genstart enheden',
          '6. Stadig problem? Nulstil alle indstillinger (ikke data)'
        ],
      },
      {
        id: 'solution-extortion-scam',
        title: '🚨 Dette er AFPRESNING - Ignorer det!',
        severity: 'high',
        explanation: 'Beskeder der truer med at frigive dine private billeder/data er NÆSTEN ALTID svindel. De har typisk INTET.',
        steps: [
          'BETAL ALDRIG! Betaling stopper ikke svindlere - de kræver bare mere',
          'De har højst sandsynligt INGENTING - de sender samme besked til tusinder',
          'SVAR IKKE på beskeden - det bekræfter at din email virker',
          'SLET beskeden og bloker afsenderen',
          'Hvis de nævner en gammel adgangskode: Den er fra en gammel datalæk - skift den!',
          'Tjek haveibeenpwned.com for at se om din email er lækket',
          'Anmeld til politiet hvis du føler dig truet: anmeld.telepoliti.dk'
        ],
      },
      {
        id: 'solution-check-login-history',
        title: 'Tjek din login-historik',
        severity: 'medium',
        explanation: 'Du kan se alle enheder og lokationer der har logget ind på din Apple ID.',
        steps: [
          '1. Gå til appleid.apple.com i en browser og log ind',
          '2. Klik på "Enheder" for at se alle tilsluttede enheder',
          '3. Fjern enheder du ikke genkender',
          '4. Klik på "Log på og sikkerhed" for at se seneste login-forsøg',
          '5. Hvis der er login du ikke genkender: Skift adgangskode straks',
          '6. Slå to-faktor godkendelse til under "Sikkerhed"'
        ],
      },
      {
        id: 'solution-ignore-reset',
        title: 'Ignorer uventede nulstillingslinks',
        severity: 'low',
        explanation: 'Hvis du ikke selv bad om at nulstille din adgangskode, er linket sandsynligvis phishing eller nogen der prøver at hacke dig.',
        steps: [
          'KLIK IKKE på linket i emailen/SMS\'en',
          'Hvis du er bekymret: Gå SELV til appleid.apple.com (skriv adressen)',
          'Log ind og tjek om din konto er OK',
          'Skift adgangskode hvis du er i tvivl - men gør det via den officielle side',
          'Slet den mistænkelige besked',
          'Aktivér to-faktor godkendelse for ekstra sikkerhed'
        ],
      },
      {
        id: 'solution-safe-reset',
        title: 'Sikker nulstilling',
        severity: 'low',
        explanation: 'Hvis du selv bad om nulstilling, er det sikkert at følge linket - men vær altid opmærksom.',
        steps: [
          'Dobbelttjek at afsenderadressen er fra Apple (@apple.com)',
          'Linket bør føre til appleid.apple.com eller tilsvarende Apple-domæne',
          'Indtast ALDRIG adgangskode hvis du er i tvivl om sidens ægthed',
          'Når du skifter adgangskode: Brug en unik adgangskode du ikke bruger andre steder',
          'Overvej at bruge en password manager til at generere stærke adgangskoder'
        ],
      },
      {
        id: 'solution-phishing-login',
        title: '⚠️ Du kan have afgivet login til svindlere',
        severity: 'high',
        explanation: 'Hvis du indtastede login-oplysninger på en falsk side, skal du handle hurtigt.',
        steps: [
          '1. SKIFT ADGANGSKODE STRAKS for den konto du "loggede ind" på',
          '2. Gør det via den officielle hjemmeside - IKKE via linket du klikkede på',
          '3. Hvis det var bank-login: RING til banken med det samme',
          '4. Hvis det var email: Skift adgangskode og tjek "sendt"-mappen for mistænkelige mails',
          '5. Slå to-faktor godkendelse til på kontoen',
          '6. Overvåg kontoen for mistænkelig aktivitet de næste uger'
        ],
      },
      {
        id: 'solution-clicked-link-monitor',
        title: 'Link klikket - overvåg situationen',
        severity: 'low',
        explanation: 'At klikke på et link er ofte uskadeligt, så længe du ikke indtastede oplysninger eller downloadede noget.',
        steps: [
          'Bare at klikke på et link er normalt harmløst',
          'Problemet opstår når du afgiver oplysninger eller downloader',
          'Hold øje med mistænkelige SMS\'er eller emails de næste par dage',
          'Tjek din bank for ukendte transaktioner',
          'Ryd browserhistorik og cookies for en sikkerheds skyld',
          'Slå "Advarsel om falske websteder" til i Safari-indstillinger'
        ],
      },
      {
        id: 'solution-remove-download',
        title: 'Fjern downloadet fil',
        severity: 'medium',
        explanation: 'Hvis noget blev downloadet, bør du finde og slette det.',
        steps: [
          '1. Åbn "Filer" appen og gå til "Downloads"',
          '2. Slet alle filer du ikke genkender',
          '3. Tøm også "Senest slettet" mappen',
          '4. iOS kan normalt IKKE køre skadelig software som Windows/Android',
          '5. MEN: Slet filen alligevel og undgå at åbne den',
          '6. Hvis det var en "Konfigurationsprofil": Slet den under Indstillinger → Generelt → VPN og enhedshåndtering'
        ],
      },
      {
        id: 'solution-check-unknown-apps',
        title: 'Tjek for ukendte apps',
        severity: 'medium',
        explanation: 'Apps du ikke har installeret kan være fra Familiedeling eller en fejl. Tjek dem.',
        steps: [
          '1. Gå til Indstillinger → Generelt → iPhone-lagring for at se alle apps',
          '2. Scroll gennem listen og slet apps du ikke genkender',
          '3. Tjek Familiedeling: Indstillinger → [Dit navn] → Familiedeling',
          '4. Familie-medlemmer kan dele apps med dig',
          '5. Hvis du ikke genkender nogen i familien: FJERN dig selv fra gruppen!',
          '6. Tjek også App Store → din profil → Køb for at se alle installerede apps'
        ],
      },
      {
        id: 'solution-unauthorized-purchase',
        title: 'Uautoriseret køb på din konto',
        severity: 'high',
        explanation: 'Hvis der er køb på din konto du ikke har lavet, skal du handle hurtigt.',
        steps: [
          '1. Tjek købet: Indstillinger → [Dit navn] → Medier og køb → Vis konto → Købshistorik',
          '2. Hvis du finder ukendte køb: Rapporter til Apple via "Rapporter et problem"',
          '3. Skift Apple ID-adgangskode straks',
          '4. Tjek din betalingsmetode i Indstillinger → [Dit navn] → Betaling og forsendelse',
          '5. Overvej at fjerne gemte kortoplysninger og tilføje igen',
          '6. Kontakt din bank hvis det er store beløb'
        ],
      },
      {
        id: 'solution-check-subscriptions',
        title: 'Tjek dine abonnementer',
        severity: 'low',
        explanation: 'Ukendte abonnementer kan skyldes gratis prøveperioder der blev til betalte, eller familiedeling.',
        steps: [
          '1. Gå til Indstillinger → [Dit navn] → Abonnementer',
          '2. Se listen over aktive abonnementer',
          '3. Tryk på et abonnement for at se detaljer eller opsige det',
          '4. Mange apps har "gratis prøve" der automatisk fornyes til betalt',
          '5. Opsig uønskede abonnementer',
          '6. Husk at opsigelse først træder i kraft ved periodens udløb'
        ],
      },
      {
        id: 'solution-check-location-sharing',
        title: 'Tjek lokationsdeling',
        severity: 'medium',
        explanation: 'Din lokation kan være delt med andre via "Find My" eller andre apps.',
        steps: [
          '1. Gå til Indstillinger → Anonymitet og sikkerhed → Lokalitetstjenester',
          '2. Tryk "Del min placering" og se hvem der kan se dig',
          '3. Fjern personer du ikke vil dele med',
          '4. Tjek også "Find My" appen → "Mig" fanen → "Del min placering"',
          '5. Gennemgå hvilke apps der har adgang til lokation',
          '6. Skift "Altid" til "Under brug" for apps der ikke behøver konstant adgang'
        ],
      },
      {
        id: 'solution-check-shared-albums',
        title: 'Tjek delte album og iCloud',
        severity: 'medium',
        explanation: 'Dine billeder kan være delt via iCloud Delte Album eller Familie-deling.',
        steps: [
          '1. Åbn Fotos → Album → Delt med dig (nederst)',
          '2. Se hvem du deler album med',
          '3. Forlad delte album du ikke genkender',
          '4. Tjek iCloud indstillinger: Indstillinger → [Dit navn] → iCloud → Fotos',
          '5. "Delte Album" kan slås fra hvis du vil',
          '6. Tjek også at "iCloud-link" ikke er aktivt for følsomme billeder'
        ],
      },
    ],
  },
];

interface InteractiveTroubleshooterProps {
  device: DeviceType;
}

export const InteractiveTroubleshooter = ({ device }: InteractiveTroubleshooterProps) => {
  const [selectedFlow, setSelectedFlow] = useState<TroubleshootingFlow | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [solution, setSolution] = useState<TroubleshootingSolution | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Filter flows based on device type - properly check device types
  const availableFlows = troubleshootingFlows.filter(
    flow => flow.deviceTypes.includes(device)
  );

  const currentQuestion = selectedFlow?.questions.find(q => q.id === currentQuestionId);
  const progress = selectedFlow 
    ? ((history.length + 1) / (selectedFlow.questions.length / 2)) * 100 
    : 0;

  const startFlow = (flow: TroubleshootingFlow) => {
    setSelectedFlow(flow);
    setCurrentQuestionId(flow.startQuestion);
    setHistory([]);
    setSolution(null);
    setCompletedSteps([]);
  };

  const handleAnswer = (nextStep: string) => {
    if (nextStep === 'solution' || nextStep.startsWith('solution-')) {
      const solutionData = selectedFlow?.solutions.find(s => s.id === nextStep);
      if (solutionData) {
        setSolution(solutionData);
        setCurrentQuestionId('');
      }
    } else {
      setHistory([...history, currentQuestionId]);
      setCurrentQuestionId(nextStep);
    }
  };

  const goBack = () => {
    if (solution) {
      setSolution(null);
      setCurrentQuestionId(history[history.length - 1] || selectedFlow?.startQuestion || '');
    } else if (history.length > 0) {
      const previousQuestion = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentQuestionId(previousQuestion);
    } else {
      setSelectedFlow(null);
      setCurrentQuestionId('');
    }
  };

  const resetFlow = () => {
    setSelectedFlow(null);
    setCurrentQuestionId('');
    setHistory([]);
    setSolution(null);
    setCompletedSteps([]);
  };

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Flow selection screen
  if (!selectedFlow) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Hvad har du brug for hjælp til?</h3>
          <p className="text-sm text-muted-foreground">
            Vælg et emne, så guider jeg dig til løsningen
          </p>
        </div>
        
        <div className="grid gap-3">
          {availableFlows.map(flow => (
            <Card
              key={flow.id}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/50"
              onClick={() => startFlow(flow)}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{flow.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium">{flow.name}</h4>
                  <p className="text-sm text-muted-foreground">{flow.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Solution screen
  if (solution) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbage
          </Button>
          <Button variant="ghost" size="sm" onClick={resetFlow}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Start forfra
          </Button>
        </div>

        {/* Solution Card */}
        <Card className={`p-5 border-2 ${
          solution.severity === 'high' ? 'border-destructive/50 bg-destructive/5' :
          solution.severity === 'medium' ? 'border-warning/50 bg-warning/5' :
          'border-primary/50 bg-primary/5'
        }`}>
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2 rounded-full ${
              solution.severity === 'high' ? 'bg-destructive/10' :
              solution.severity === 'medium' ? 'bg-warning/10' :
              'bg-primary/10'
            }`}>
              {solution.needsRepair ? (
                <Wrench className={`h-5 w-5 ${
                  solution.severity === 'high' ? 'text-destructive' :
                  solution.severity === 'medium' ? 'text-warning' :
                  'text-primary'
                }`} />
              ) : (
                <Lightbulb className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{solution.title}</h3>
              {solution.severity === 'high' && (
                <span className="text-xs text-destructive font-medium">⚠️ Kan kræve reparation</span>
              )}
            </div>
          </div>

          <p className="text-muted-foreground mb-4">{solution.explanation}</p>

          {solution.technicalInfo && (
            <div className="p-3 rounded-lg bg-info/10 border border-info/20 mb-4">
              <p className="text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                <span>{solution.technicalInfo}</span>
              </p>
            </div>
          )}
        </Card>

        {/* Steps */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Følg disse trin:
          </h4>
          <div className="space-y-2">
            {solution.steps.map((step, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  completedSteps.includes(idx) 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => toggleStep(idx)}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors ${
                  completedSteps.includes(idx)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {completedSteps.includes(idx) ? '✓' : idx + 1}
                </div>
                <span className={`text-sm pt-1 ${
                  completedSteps.includes(idx) ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Repair note */}
        {solution.needsRepair && solution.repairNote && (
          <Card className="p-4 bg-warning/10 border-warning/30">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Hvis trinene ikke hjælper:</p>
                <p className="text-sm text-muted-foreground">{solution.repairNote}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Completion message */}
        {completedSteps.length === solution.steps.length && (
          <Card className="p-4 bg-primary/10 border-primary/30 text-center">
            <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Alle trin gennemført! 🎉</p>
            <p className="text-sm text-muted-foreground">Løste det problemet?</p>
            <div className="flex gap-2 justify-center mt-3">
              <Button size="sm" variant="outline" onClick={resetFlow}>
                Nej, prøv noget andet
              </Button>
              <Button size="sm" onClick={resetFlow}>
                Ja, det virkede!
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Question screen
  return (
    <div className="space-y-4">
      {/* Header with back and progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbage
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedFlow.icon} {selectedFlow.name}
          </span>
        </div>
        <Progress value={Math.min(progress, 100)} className="h-2" />
      </div>

      {/* Question */}
      {currentQuestion && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-2">{currentQuestion.question}</h3>
          {currentQuestion.helpText && (
            <p className="text-sm text-muted-foreground mb-4 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              {currentQuestion.helpText}
            </p>
          )}
          
          <div className="space-y-2 mt-4">
            {currentQuestion.options.map((option, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 text-left"
                onClick={() => handleAnswer(option.nextStep)}
              >
                {option.emoji && <span className="text-xl mr-3">{option.emoji}</span>}
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
