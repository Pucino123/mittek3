import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { DeviceSelector, DeviceType } from '@/components/ui/DeviceSelector';
import { 
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  PartyPopper,
  Lock,
  Cloud,
  Shield,
  Bell,
  Wifi,
  MessageSquare,
  Camera,
  Battery,
  Fingerprint,
  MapPin,
  Mail
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Lock;
  detailedSteps: {
    instruction: string;
    tip?: string;
    warning?: string;
  }[];
}

const setupStepsByDevice: Record<DeviceType, SetupStep[]> = {
  iphone: [
    {
      id: 'apple-id',
      title: 'Log ind med Apple ID',
      description: 'Din nøgle til alt fra iCloud til App Store',
      icon: Fingerprint,
      detailedSteps: [
        { instruction: 'Under opsætning bliver du bedt om at logge ind med Apple ID', tip: 'Hvis du ikke har et Apple ID, kan du oprette et gratis' },
        { instruction: 'Indtast din Apple ID email og adgangskode', warning: 'Del ALDRIG dit Apple ID med andre!' },
        { instruction: 'Godkend med to-faktor-godkendelse hvis påkrævet' },
      ],
    },
    {
      id: 'passcode',
      title: 'Opret en stærk adgangskode',
      description: 'Beskyt din telefon mod uautoriseret adgang',
      icon: Lock,
      detailedSteps: [
        { instruction: 'Vælg en 6-cifret kode (minimum)', tip: 'Jo længere, jo bedre. Du kan vælge en tilpasset kode med bogstaver' },
        { instruction: 'Undgå nemme koder som 123456 eller din fødselsdag' },
        { instruction: 'Skriv koden ned et sikkert sted, hvis du er bange for at glemme den' },
      ],
    },
    {
      id: 'face-id',
      title: 'Opsæt Face ID eller Touch ID',
      description: 'Lås telefonen op med dit ansigt eller fingeraftryk',
      icon: Fingerprint,
      detailedSteps: [
        { instruction: 'Følg vejledningen for at scanne dit ansigt', tip: 'Sørg for godt lys og hold telefonen i naturlig afstand' },
        { instruction: 'Drej langsomt hovedet i en cirkel som vist' },
        { instruction: 'Gentag scanningen for bedre nøjagtighed' },
      ],
    },
    {
      id: 'icloud',
      title: 'Slå iCloud til',
      description: 'Gem dine billeder og data sikkert i skyen',
      icon: Cloud,
      detailedSteps: [
        { instruction: 'Gå til Indstillinger → [Dit navn] → iCloud' },
        { instruction: 'Slå de ting til du vil gemme: Fotos, Kontakter, Kalender', tip: 'iCloud Fotos er fantastisk - dine billeder er altid sikre!' },
        { instruction: 'Slå iCloud-sikkerhedskopiering til for automatisk backup' },
      ],
    },
    {
      id: 'find-my',
      title: 'Aktiver Find min iPhone',
      description: 'Find eller slet din telefon hvis den bliver væk',
      icon: MapPin,
      detailedSteps: [
        { instruction: 'Gå til Indstillinger → [Dit navn] → Find → Find min iPhone' },
        { instruction: 'Slå "Find min iPhone" TIL (grøn)' },
        { instruction: 'Slå også "Send sidste placering" til', tip: 'Så sender telefonen sin position lige før batteriet dør' },
      ],
    },
    {
      id: 'notifications',
      title: 'Juster notifikationer',
      description: 'Bestem hvilke apps der må forstyrre dig',
      icon: Bell,
      detailedSteps: [
        { instruction: 'Gå til Indstillinger → Notifikationer' },
        { instruction: 'Gennemgå hver app og beslut om du vil have beskeder fra den' },
        { instruction: 'Slå "Tillad notifikationer" fra for apps du ikke behøver høre fra', tip: 'Færre notifikationer = mere ro i hovedet og bedre batteri' },
      ],
    },
    {
      id: 'wifi',
      title: 'Forbind til WiFi',
      description: 'Spar mobildata og få hurtigere internet',
      icon: Wifi,
      detailedSteps: [
        { instruction: 'Gå til Indstillinger → WiFi' },
        { instruction: 'Tryk på dit hjemmenetværks navn' },
        { instruction: 'Indtast adgangskoden', tip: 'Adgangskoden står ofte på bagsiden af din router' },
      ],
    },
    {
      id: 'imessage',
      title: 'Opsæt iMessage',
      description: 'Send gratis beskeder til andre iPhone-brugere',
      icon: MessageSquare,
      detailedSteps: [
        { instruction: 'Gå til Indstillinger → Beskeder' },
        { instruction: 'Slå iMessage TIL (grøn)' },
        { instruction: 'Tryk på "Send & modtag" og vælg dit telefonnummer og email' },
      ],
    },
  ],
  ipad: [
    {
      id: 'apple-id',
      title: 'Log ind med Apple ID',
      description: 'Din nøgle til alt fra iCloud til App Store',
      icon: Fingerprint,
      detailedSteps: [
        { instruction: 'Under opsætning bliver du bedt om at logge ind' },
        { instruction: 'Brug samme Apple ID som på din iPhone for at synkronisere', tip: 'Så deler du billeder, kontakter og apps automatisk' },
      ],
    },
    {
      id: 'passcode',
      title: 'Opret adgangskode',
      description: 'Beskyt din iPad mod uautoriseret adgang',
      icon: Lock,
      detailedSteps: [
        { instruction: 'Vælg en 6-cifret kode' },
        { instruction: 'Eller tryk "Tilpasset" for en længere kode med bogstaver' },
      ],
    },
    {
      id: 'icloud',
      title: 'Slå iCloud til',
      description: 'Synkroniser med dine andre enheder',
      icon: Cloud,
      detailedSteps: [
        { instruction: 'Gå til Indstillinger → [Dit navn] → iCloud' },
        { instruction: 'Vælg hvad der skal synkroniseres' },
        { instruction: 'Slå sikkerhedskopiering til' },
      ],
    },
    {
      id: 'find-my',
      title: 'Aktiver Find min iPad',
      description: 'Find din iPad hvis den bliver væk',
      icon: MapPin,
      detailedSteps: [
        { instruction: 'Gå til Indstillinger → [Dit navn] → Find → Find min iPad' },
        { instruction: 'Slå alle indstillinger til' },
      ],
    },
    {
      id: 'wifi',
      title: 'Forbind til WiFi',
      description: 'iPad bruger WiFi til det meste',
      icon: Wifi,
      detailedSteps: [
        { instruction: 'Gå til Indstillinger → WiFi' },
        { instruction: 'Vælg dit netværk og indtast koden' },
      ],
    },
  ],
  mac: [
    {
      id: 'apple-id',
      title: 'Log ind med Apple ID',
      description: 'Forbind din Mac med dine andre Apple-enheder',
      icon: Fingerprint,
      detailedSteps: [
        { instruction: 'Under opsætning bliver du bedt om at logge ind' },
        { instruction: 'Brug samme Apple ID som på din iPhone', tip: 'Så kan du kopiere/indsætte mellem enheder og bruge AirDrop' },
      ],
    },
    {
      id: 'password',
      title: 'Opret et stærkt password',
      description: 'Beskyt din Mac mod uautoriseret adgang',
      icon: Lock,
      detailedSteps: [
        { instruction: 'Vælg et password med mindst 8 tegn' },
        { instruction: 'Bland store og små bogstaver, tal og symboler', tip: 'Brug en sætning du kan huske, fx "MinKat2Hedder-Felix!"' },
        { instruction: 'Skriv det ned et sikkert sted' },
      ],
    },
    {
      id: 'touch-id',
      title: 'Opsæt Touch ID',
      description: 'Lås Mac op med fingeraftryk',
      icon: Fingerprint,
      detailedSteps: [
        { instruction: 'Følg vejledningen for at scanne din finger' },
        { instruction: 'Læg fingeren på Touch ID-sensoren øverst til højre på tastaturet' },
        { instruction: 'Tilføj gerne flere fingre for mere fleksibilitet' },
      ],
    },
    {
      id: 'icloud',
      title: 'Opsæt iCloud',
      description: 'Synkroniser dokumenter og billeder',
      icon: Cloud,
      detailedSteps: [
        { instruction: 'Gå til Systemindstillinger → [Dit navn] → iCloud' },
        { instruction: 'Slå iCloud Drive til for at gemme filer i skyen' },
        { instruction: 'Aktiver Fotos hvis du vil se iPhone-billeder på Mac' },
      ],
    },
    {
      id: 'find-my',
      title: 'Aktiver Find min Mac',
      description: 'Find eller slet din Mac hvis den bliver stjålet',
      icon: MapPin,
      detailedSteps: [
        { instruction: 'Gå til Systemindstillinger → [Dit navn] → iCloud' },
        { instruction: 'Find "Find min Mac" og slå det til' },
      ],
    },
    {
      id: 'filevault',
      title: 'Slå FileVault til',
      description: 'Krypter hele din harddisk for ekstra sikkerhed',
      icon: Shield,
      detailedSteps: [
        { instruction: 'Gå til Systemindstillinger → Anonymitet & sikkerhed → FileVault' },
        { instruction: 'Klik "Slå FileVault til"' },
        { instruction: 'Gem gendannelsesnøglen et sikkert sted!', warning: 'Uden denne nøgle kan du ALDRIG få adgang til dine data hvis du glemmer dit password' },
      ],
    },
  ],
};

const DeviceSetup = () => {
  const [device, setDevice] = useState<DeviceType>('iphone');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const steps = setupStepsByDevice[device];
  const progress = (completedSteps.filter(s => steps.some(step => step.id === s)).length / steps.length) * 100;
  const allComplete = completedSteps.filter(s => steps.some(step => step.id === s)).length === steps.length;

  const handleDeviceChange = (newDevice: DeviceType) => {
    setDevice(newDevice);
    setExpandedStep(null);
  };

  const toggleStep = (stepId: string) => {
    if (expandedStep === stepId) {
      setExpandedStep(null);
    } else {
      setExpandedStep(stepId);
    }
  };

  const markComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    setExpandedStep(null);
  };

  const getDeviceLabel = () => {
    switch (device) {
      case 'iphone': return 'iPhone';
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-success/20 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Opsæt din nye {getDeviceLabel()}</h1>
            <p className="text-muted-foreground">
              Følg disse trin for at komme godt i gang
            </p>
          </div>

          {/* Device Selector */}
          <div className="mb-6">
            <DeviceSelector value={device} onChange={handleDeviceChange} />
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Fremgang</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedSteps.filter(s => steps.some(step => step.id === s)).length} af {steps.length} trin gennemført
            </p>
          </div>

          {/* All complete celebration */}
          {allComplete && (
            <div className="card-elevated p-6 bg-gradient-to-r from-success/10 to-primary/10 border-2 border-success/30 text-center mb-8">
              <PartyPopper className="h-12 w-12 text-success mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Tillykke! 🎉</h3>
              <p className="text-muted-foreground mb-4">
                Din {getDeviceLabel()} er nu klar til brug. Du har gjort alt rigtigt!
              </p>
              <Link to="/dashboard">
                <Button variant="hero" size="lg">
                  Gå til forsiden
                </Button>
              </Link>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isComplete = completedSteps.includes(step.id);
              const isExpanded = expandedStep === step.id;
              const StepIcon = step.icon;

              return (
                <div 
                  key={step.id} 
                  className={`card-elevated overflow-hidden transition-all ${
                    isComplete ? 'bg-success/5 border-success/20' : ''
                  }`}
                >
                  {/* Step header */}
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isComplete ? 'bg-success/10' : 'bg-muted'
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${isComplete ? 'text-success' : ''}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`} />
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      <div className="pt-4 space-y-3">
                        {step.detailedSteps.map((detail, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-primary">{idx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">{detail.instruction}</p>
                              {detail.tip && (
                                <p className="text-xs text-info mt-1 flex items-start gap-1">
                                  💡 {detail.tip}
                                </p>
                              )}
                              {detail.warning && (
                                <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                                  ⚠️ {detail.warning}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        variant={isComplete ? "outline" : "hero"}
                        size="lg"
                        className="w-full mt-4"
                        onClick={() => markComplete(step.id)}
                      >
                        {isComplete ? (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Gennemført
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Marker som gennemført
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeviceSetup;
