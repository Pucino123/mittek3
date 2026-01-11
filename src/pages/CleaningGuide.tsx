import { useState } from 'react';
import { BackButton } from '@/components/layout/BackButton';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DeviceSelector, DeviceType } from '@/components/ui/DeviceSelector';
import { 
  Trash2, 
  Images, 
  MessageSquare, 
  FolderX,
  CheckCircle2,
  Sparkles,
  Keyboard,
  HardDrive
} from 'lucide-react';

interface CleaningTask {
  id: string;
  title: string;
  icon: typeof Trash2;
  color: string;
  devices: DeviceType[];
  steps: {
    number: number;
    instruction: string;
    detail?: string;
  }[];
}

const allCleaningTasks: CleaningTask[] = [
  {
    id: 'duplicates',
    title: 'Fjern dobbelte billeder',
    icon: Images,
    color: 'bg-info/10 text-info',
    devices: ['iphone', 'ipad'],
    steps: [
      {
        number: 1,
        instruction: 'Åbn appen Fotos',
        detail: 'Det er appen med det regnbuefarvede blomster-ikon',
      },
      {
        number: 2,
        instruction: 'Tryk på "Album" i bunden',
        detail: 'Rul derefter helt ned på siden',
      },
      {
        number: 3,
        instruction: 'Find "Dubletter" under "Andet"',
        detail: 'Her vises alle ens billeder automatisk',
      },
      {
        number: 4,
        instruction: 'Tryk på "Flet" ved hvert billede',
        detail: 'iPhone beholder det bedste billede og sletter resten',
      },
    ],
  },
  {
    id: 'messages',
    title: 'Slet gamle beskeder automatisk',
    icon: MessageSquare,
    color: 'bg-success/10 text-success',
    devices: ['iphone', 'ipad'],
    steps: [
      {
        number: 1,
        instruction: 'Gå til Indstillinger',
        detail: 'Det grå tandhjul på din startskærm',
      },
      {
        number: 2,
        instruction: 'Rul ned og tryk på "Beskeder"',
        detail: 'Den grønne ikon med taleboble',
      },
      {
        number: 3,
        instruction: 'Find "Gem beskeder"',
        detail: 'Under afsnittet "Beskedhistorik"',
      },
      {
        number: 4,
        instruction: 'Vælg "1 år" i stedet for "For evigt"',
        detail: 'Gamle beskeder slettes nu automatisk efter 1 år',
      },
    ],
  },
  {
    id: 'recently-deleted',
    title: 'Tøm "Slettet for nylig"',
    icon: FolderX,
    color: 'bg-warning/10 text-warning',
    devices: ['iphone', 'ipad'],
    steps: [
      {
        number: 1,
        instruction: 'Åbn Fotos > Album',
        detail: 'Samme som før - den regnbuefarvede app',
      },
      {
        number: 2,
        instruction: 'Rul ned til "Slettet for nylig"',
        detail: 'Under "Andet" helt i bunden',
      },
      {
        number: 3,
        instruction: 'Tryk på "Vælg" i toppen',
        detail: 'Derefter kan du markere billeder',
      },
      {
        number: 4,
        instruction: 'Tryk "Slet alle" for at fjerne dem helt',
        detail: 'OBS: Dette kan ikke fortrydes!',
      },
    ],
  },
  {
    id: 'physical-cleaning',
    title: 'Rengør ladeporten',
    icon: Trash2,
    color: 'bg-primary/10 text-primary',
    devices: ['iphone', 'ipad'],
    steps: [
      {
        number: 1,
        instruction: 'Sluk din enhed først',
        detail: 'For din sikkerhed',
      },
      {
        number: 2,
        instruction: 'Brug en tandstik (IKKE metal)',
        detail: 'Forsigtigt fjern fnug og støv fra ladeporten',
      },
      {
        number: 3,
        instruction: 'Pust forsigtigt i porten',
        detail: 'For at fjerne løst støv',
      },
      {
        number: 4,
        instruction: 'Tænd enheden igen',
        detail: 'Dit opladerkabel vil nu sidde bedre fast',
      },
    ],
  },
  {
    id: 'mac-keyboard',
    title: 'Rens tastatur og skærm',
    icon: Keyboard,
    color: 'bg-info/10 text-info',
    devices: ['mac'],
    steps: [
      {
        number: 1,
        instruction: 'Sluk din Mac',
        detail: 'Klik på Æblet () → Sluk',
      },
      {
        number: 2,
        instruction: 'Vend computeren forsigtigt på hovedet',
        detail: 'Ryst forsigtigt for at løsne krummer fra tastaturet',
      },
      {
        number: 3,
        instruction: 'Brug en mikrofiberklud til skærmen',
        detail: 'Tør forsigtigt i cirkelbevægelser - brug IKKE vinduesrens!',
      },
      {
        number: 4,
        instruction: 'Tør tastaturet af med en let fugtig klud',
        detail: 'Brug lidt vand eller skærmrens - aldrig direkte på computeren',
      },
    ],
  },
  {
    id: 'mac-storage',
    title: 'Ryd op i Mac lagring',
    icon: HardDrive,
    color: 'bg-success/10 text-success',
    devices: ['mac'],
    steps: [
      {
        number: 1,
        instruction: 'Klik på Æblet () i hjørnet',
        detail: 'Øverst til venstre på skærmen',
      },
      {
        number: 2,
        instruction: 'Vælg "Om denne Mac"',
        detail: 'Derefter klik på "Flere oplysninger"',
      },
      {
        number: 3,
        instruction: 'Klik på "Lagringsindstillinger"',
        detail: 'Her kan du se hvad der fylder mest',
      },
      {
        number: 4,
        instruction: 'Brug "Anbefalinger" til at rydde op',
        detail: 'Mac foreslår selv filer du kan slette',
      },
    ],
  },
];

const CleaningGuide = () => {
  useScrollRestoration();

  const [device, setDevice] = useState<DeviceType>('iphone');
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const cleaningTasks = allCleaningTasks.filter(task => task.devices.includes(device));

  const toggleCompleted = (taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const completedCount = cleaningTasks.filter(t => completedTasks.has(t.id)).length;
  const allCompleted = completedCount === cleaningTasks.length && cleaningTasks.length > 0;

  const getDeviceLabel = () => {
    switch (device) {
      case 'iphone': return 'telefon';
      case 'ipad': return 'iPad';
      case 'mac': return 'Mac';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center">
          <BackButton />
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Oprydnings-assistent</h1>
            <p className="text-muted-foreground">
              Få mere plads på din {getDeviceLabel()} med disse enkle trin
            </p>
          </div>

          {/* Device Selector */}
          <div className="mb-6">
            <DeviceSelector value={device} onChange={setDevice} />
          </div>

          {/* Progress */}
          {completedCount > 0 && (
            <div className="card-elevated p-4 mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
              <div>
                <p className="font-medium">
                  {completedCount} af {cleaningTasks.length} opgaver udført
                </p>
                {allCompleted && (
                  <p className="text-sm text-success">Godt klaret! Din {getDeviceLabel()} er nu ryddet op 🎉</p>
                )}
              </div>
            </div>
          )}

          {/* Tasks */}
          <Accordion type="single" collapsible className="space-y-4">
            {cleaningTasks.map((task) => {
              const isCompleted = completedTasks.has(task.id);
              const TaskIcon = task.icon;
              
              return (
                <AccordionItem
                  key={task.id}
                  value={task.id}
                  className={`card-elevated overflow-hidden border-0 ${
                    isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${task.color} flex items-center justify-center flex-shrink-0`}>
                        <TaskIcon className="h-6 w-6" />
                      </div>
                      <span className={`font-semibold text-left ${isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4 mb-6">
                      {task.steps.map((step) => (
                        <div key={step.number} className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                            {step.number}
                          </div>
                          <div>
                            <p className="font-medium">{step.instruction}</p>
                            {step.detail && (
                              <p className="text-sm text-muted-foreground mt-0.5">{step.detail}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      variant={isCompleted ? 'outline' : 'hero'}
                      className="w-full"
                      onClick={() => toggleCompleted(task.id)}
                    >
                      {isCompleted ? (
                        <>Marker som ikke udført</>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Jeg har gjort det!
                        </>
                      )}
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* Tip card */}
          <div className="card-elevated p-6 mt-8">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              💡 Bonus-tip
            </h3>
            <p className="text-muted-foreground">
              {device === 'mac' ? (
                <>Gå til <strong>Æblet → Systemindstillinger → Generelt → Lagring</strong> for at se præcis, hvilke programmer der fylder mest på din Mac.</>
              ) : (
                <>Gå til <strong>Indstillinger → Generelt → iPhone-lagring</strong> for at se præcis, hvilke apps der fylder mest på din {getDeviceLabel()}.</>
              )}
            </p>
          </div>
        </div>
      </main>

      <ToolPageHelpButton />
    </div>
  );
};

export default CleaningGuide;
