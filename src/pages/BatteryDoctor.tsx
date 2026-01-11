import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { BatteryHelpModal, ShowMeWhereButton } from '@/components/battery-doctor/BatteryHelpModal';
import { DeviceSelector, DeviceType } from '@/components/ui/DeviceSelector';
import { 
  Battery, 
  BatteryWarning,
  Sun,
  AppWindow,
  Clock,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Chrome,
  BellOff,
  MapPin
} from 'lucide-react';
import { trackToolUsage } from '@/utils/analytics';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

interface Question {
  id: 'brightness' | 'close-apps' | 'old-phone' | 'chrome' | 'battery-health' | 'background-refresh' | 'location-services' | 'low-power-mode' | 'notifications';
  question: string;
  questionByDevice?: Record<DeviceType, string>;
  icon: typeof Battery;
  yesAdvice: string;
  yesAdviceByDevice?: Record<DeviceType, string>;
  noAdvice?: string;
  devices: DeviceType[];
}

// Device-specific battery health check steps
const batteryHealthSteps: Record<DeviceType, string[]> = {
  iphone: [
    '1. Gå til **Indstillinger**.',
    '2. Tryk på **Batteri**.',
    '3. Tryk på **Batteritilstand og opladning**.',
    '4. Tallet ud for "Maksimumkapacitet" er dit helbred. Under 80% = tid til nyt batteri.',
  ],
  ipad: [
    '1. Gå til **Indstillinger** > **Batteri**.',
    '2. iPad viser desværre ikke "Helbred i %" ligesom iPhone.',
    '3. Kig i stedet på grafen: Falder den hurtigt, selvom du ikke bruger den?',
    '4. Hvis ja, kan batteriet være slidt. Kontakt Apple Support.',
  ],
  mac: [
    '1. Klik på **Æblet ()** i øverste venstre hjørne.',
    '2. Vælg **Systemindstillinger**.',
    '3. Klik på **Batteri** i sidebaren.',
    '4. Klik på det lille **(i)** info-ikon ud for "Batteritilstand".',
  ],
};

const allQuestions: Question[] = [
  {
    id: 'brightness',
    question: 'Står lysstyrken på din skærm helt oppe?',
    questionByDevice: {
      iphone: 'Står lysstyrken på din iPhone helt oppe?',
      ipad: 'Står lysstyrken på din iPad helt oppe?',
      mac: 'Er skærmen på din Mac meget lys?',
    },
    icon: Sun,
    yesAdvice: 'Skærmen er den største strømsluger. Skru ned for lyset, eller slå "Automatisk lysstyrke" til.',
    yesAdviceByDevice: {
      iphone: 'Skærmen bruger op til 40% af batteriet! Gå til Indstillinger → Skærm & Lysstyrke, og skru ned til ca. 50%. Slå "Automatisk" til, så justerer den sig selv.',
      ipad: 'Skærmen bruger op til 40% af batteriet! Gå til Indstillinger → Skærm & Lysstyrke, og skru ned for lysstyrken. Slå "Automatisk" til.',
      mac: 'Skærmen bruger meget strøm. Juster lysstyrke med F1/F2 tasterne til ca. 60%. Gå til Systemindstillinger → Skærme og slå "Juster lysstyrke automatisk" til.',
    },
    devices: ['iphone', 'ipad', 'mac'],
  },
  {
    id: 'close-apps',
    question: 'Lukker du tit alle apps ned manuelt?',
    icon: AppWindow,
    yesAdvice: 'Lad dine apps ligge! Det bruger faktisk MERE strøm at starte dem forfra. iOS/iPadOS håndterer det automatisk og smart.',
    devices: ['iphone', 'ipad'],
  },
  {
    id: 'background-refresh',
    question: 'Er "Opdater i baggrunden" slået til for alle apps?',
    questionByDevice: {
      iphone: 'Er "Opdater i baggrunden" slået til for alle apps?',
      ipad: 'Er "Opdater i baggrunden" slået til for alle apps?',
      mac: 'Har du mange apps der kører i baggrunden?',
    },
    icon: RotateCcw,
    yesAdvice: 'Apps der opdaterer i baggrunden bruger strøm hele tiden.',
    yesAdviceByDevice: {
      iphone: 'Gå til Indstillinger → Generelt → Opdater i baggrunden. Slå det FRA for apps du ikke bruger dagligt (fx spil, shopping-apps). Behold det for mail og beskeder.',
      ipad: 'Gå til Indstillinger → Generelt → Opdater i baggrunden. Slå det FRA for apps du ikke bruger dagligt. Behold det for de vigtigste apps.',
      mac: 'Åbn Aktivitetsovervågning (søg i Spotlight). Se hvilke apps der bruger mest CPU i baggrunden og luk dem.',
    },
    devices: ['iphone', 'ipad', 'mac'],
  },
  {
    id: 'location-services',
    question: 'Bruger mange apps din placering hele tiden?',
    questionByDevice: {
      iphone: 'Har du apps der hele tiden bruger din GPS/placering?',
      ipad: 'Har du apps der hele tiden bruger din GPS/placering?',
      mac: 'Har du programmer der bruger din placering konstant?',
    },
    icon: Battery,
    yesAdvice: 'GPS bruger meget batteri!',
    yesAdviceByDevice: {
      iphone: 'GPS er en af de største strømslugere! Gå til Indstillinger → Anonymitet & Sikkerhed → Lokalitetstjenester. Sæt apps til "Kun ved brug" i stedet for "Altid".',
      ipad: 'GPS bruger meget strøm. Gå til Indstillinger → Anonymitet & Sikkerhed → Lokalitetstjenester. De fleste apps behøver kun placering "ved brug".',
      mac: 'Gå til Systemindstillinger → Anonymitet & Sikkerhed → Lokalitetstjenester. Fjern apps der ikke behøver din placering.',
    },
    devices: ['iphone', 'ipad', 'mac'],
  },
  {
    id: 'chrome',
    question: 'Bruger du Google Chrome til at surfe på nettet?',
    icon: Chrome,
    yesAdvice: 'Chrome bruger meget batteri på Mac. Prøv Safari i stedet - den er optimeret til din Mac og kan spare op til 3 timers ekstra batteritid!',
    devices: ['mac'],
  },
  {
    id: 'low-power-mode',
    question: 'Bruger du strømbesparelse når batteriet er lavt?',
    questionByDevice: {
      iphone: 'Bruger du den gule batteribesparelse når batteriet er lavt?',
      ipad: 'Bruger du strømbesparelse på din iPad?',
      mac: 'Har du aktiveret Lavt strømforbrug på din Mac?',
    },
    icon: BatteryWarning,
    yesAdvice: 'Godt! Strømbesparelse forlænger batteriet markant.',
    noAdvice: 'Du bør aktivere strømbesparelse!',
    yesAdviceByDevice: {
      iphone: 'Godt valg! Tip: Swipe ned fra højre hjørne → tryk på batteri-ikonet for hurtigt at slå det til når du har under 30%.',
      ipad: 'Godt valg! Tip: Brug Kontrolcenter (swipe ned fra højre hjørne) for hurtigt at aktivere det.',
      mac: 'Godt! Tip: Gå til Systemindstillinger → Batteri → Lavt strømforbrug for at slå det til automatisk ved lav procent.',
    },
    devices: ['iphone', 'ipad', 'mac'],
  },
  {
    id: 'notifications',
    question: 'Modtager du mange notifikationer fra apps?',
    icon: BellOff,
    yesAdvice: 'Hver notifikation tænder skærmen og bruger strøm. Gå til Indstillinger → Notifikationer og slå dem fra for apps du ikke behøver beskeder fra.',
    yesAdviceByDevice: {
      iphone: 'Hver gang skærmen lyser op, bruger den strøm. Gå til Indstillinger → Notifikationer. Slå fra for spil, shopping og sociale medier du ikke bruger aktivt.',
      ipad: 'Notifikationer der tænder skærmen bruger strøm. Begræns dem til de vigtigste apps i Indstillinger → Notifikationer.',
      mac: 'For mange notifikationer kan forstyrre og bruge ressourcer. Gå til Systemindstillinger → Notifikationer og tilpas.',
    },
    devices: ['iphone', 'ipad', 'mac'],
  },
  {
    id: 'battery-health',
    question: 'Vil du tjekke dit batteris helbred?',
    questionByDevice: {
      iphone: 'Vil du tjekke din iPhones batterihelbred?',
      ipad: 'Vil du tjekke din iPads batterihelbred?',
      mac: 'Vil du tjekke din Macs batterihelbred?',
    },
    icon: Battery,
    yesAdvice: 'Her er hvordan du tjekker batteriet:',
    devices: ['iphone', 'ipad', 'mac'],
  },
  {
    id: 'old-phone',
    question: 'Er din enhed over 4 år gammel?',
    questionByDevice: {
      iphone: 'Er din iPhone over 4 år gammel?',
      ipad: 'Er din iPad over 4 år gammel?',
      mac: 'Er din Mac over 4 år gammel?',
    },
    icon: Clock,
    yesAdvice: 'Batteriet er måske slidt op.',
    yesAdviceByDevice: {
      iphone: 'Batteriet er måske slidt op. Tjek batterisundheden i Indstillinger → Batteri → Batteritilstand og opladning. Under 80% betyder, det er tid til at få det skiftet hos Apple eller en autoriseret reparatør.',
      ipad: 'Batteriet er måske slidt op. iPads viser ikke batterihelbred i %, men hvis den løber hurtigt tør, kan batteriet være gammelt. Kontakt Apple Support for en diagnose.',
      mac: 'Batteriet er måske slidt op. Tjek i Systemindstillinger → Batteri → (i) info-ikon. Hvis det siger "Skal serviceres", kontakt Apple for batteriudskiftning.',
    },
    devices: ['iphone', 'ipad', 'mac'],
  },
];

const BatteryDoctor = () => {
  useScrollRestoration();

  const [device, setDevice] = useState<DeviceType>('iphone');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpType, setHelpType] = useState<'brightness' | 'close-apps' | 'old-phone' | 'background-refresh' | 'location-services' | 'low-power-mode' | 'notifications' | null>(null);

  const questions = allQuestions.filter(q => q.devices.includes(device));

  const handleAnswer = (answer: boolean) => {
    const question = questions[currentQuestion];
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
      trackToolUsage('battery_doctor', 'completed', { device, issues_found: Object.values(answers).filter(Boolean).length });
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleDeviceChange = (newDevice: DeviceType) => {
    setDevice(newDevice);
    resetQuiz();
  };

  // Questions that have help content available
  const questionsWithHelp = ['brightness', 'close-apps', 'old-phone', 'background-refresh', 'location-services', 'low-power-mode', 'notifications'];

  const openHelp = (type: typeof helpType) => {
    setHelpType(type);
    setHelpModalOpen(true);
  };

  const getAdvice = () => {
    const advice: { icon: typeof Battery; text: string; steps?: string[] }[] = [];
    
    questions.forEach(q => {
      if (answers[q.id] === true) {
        const adviceText = q.yesAdviceByDevice?.[device] || q.yesAdvice;
        
        // Add battery health steps if applicable
        if (q.id === 'battery-health') {
          advice.push({ 
            icon: q.icon, 
            text: adviceText,
            steps: batteryHealthSteps[device],
          });
        } else {
          advice.push({ icon: q.icon, text: adviceText });
        }
      }
    });
    
    return advice;
  };

  const getDeviceLabel = () => {
    switch (device) {
      case 'iphone': return 'telefon';
      case 'ipad': return 'iPad';
      case 'mac': return 'Mac';
    }
  };

  // Results view
  if (showResults) {
    const advice = getAdvice();
    const hasIssues = advice.length > 0;

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-18 items-center">
            <BackButton />
          </div>
        </header>

        <main className="container py-8">
          <div className="max-w-xl mx-auto">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4" />
            
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                hasIssues ? 'bg-warning/10' : 'bg-success/10'
              }`}>
                {hasIssues ? (
                  <BatteryWarning className="h-10 w-10 text-warning" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-success" />
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {hasIssues ? 'Her er dine råd' : 'Alt ser godt ud!'}
              </h1>
              <p className="text-muted-foreground">
                {hasIssues 
                  ? 'Baseret på dine svar har jeg nogle tips til dig'
                  : 'Dine vaner er gode for batteriet. Bliv ved sådan!'}
              </p>
            </div>

            {hasIssues && (
              <div className="space-y-4 mb-8">
                {advice.map((item, index) => (
                  <div key={index} className="card-elevated p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-6 w-6 text-warning" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground leading-relaxed">{item.text}</p>
                        {item.steps && (
                          <div className="mt-4 space-y-2 bg-muted/50 rounded-lg p-4">
                            {item.steps.map((step, stepIndex) => (
                              <p 
                                key={stepIndex} 
                                className="text-sm text-muted-foreground"
                                dangerouslySetInnerHTML={{ 
                                  __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') 
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={resetQuiz}
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Prøv igen
              </Button>
              <Link to="/dashboard" className="flex-1">
                <Button variant="hero" size="lg" className="w-full">
                  Til forsiden
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Quiz view
  const question = questions[currentQuestion];
  const QuestionIcon = question?.icon || Battery;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center">
          <BackButton />
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-xl mx-auto">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4" />
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Battery className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Batteri-Doktoren</h1>
            <p className="text-muted-foreground">
              Hvorfor løber min {getDeviceLabel()} tør? Lad os finde ud af det.
            </p>
          </div>

          {/* Device Selector */}
          <div className="mb-8">
            <DeviceSelector value={device} onChange={handleDeviceChange} />
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Spørgsmål {currentQuestion + 1} af {questions.length}</span>
            </div>
            <div className="flex gap-1">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index <= currentQuestion ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question */}
          {question && (
            <>
              <div className="card-elevated p-8 mb-6 text-center">
                <div className="w-16 h-16 rounded-xl bg-info/10 mx-auto mb-6 flex items-center justify-center">
                  <QuestionIcon className="h-8 w-8 text-info" />
                </div>
                <h2 className="text-xl font-semibold mb-4">
                  {question.questionByDevice?.[device] || question.question}
                </h2>
                
                {/* Show me where button - for all questions with help content */}
                {questionsWithHelp.includes(question.id) && (
                  <ShowMeWhereButton onClick={() => openHelp(question.id as typeof helpType)} />
                )}
              </div>

              {/* Answer buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 text-lg"
                    onClick={() => handleAnswer(false)}
                  >
                    Nej
                  </Button>
                  <Button
                    variant="hero"
                    size="lg"
                    className="h-16 text-lg"
                    onClick={() => handleAnswer(true)}
                  >
                    Ja
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>

                {/* Back button to previous question */}
                {currentQuestion > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="w-full text-muted-foreground"
                  >
                    ← Tilbage til forrige spørgsmål
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Help Modal */}
      <BatteryHelpModal 
        open={helpModalOpen} 
        onOpenChange={setHelpModalOpen}
        helpType={helpType}
      />
    </div>
  );
};

export default BatteryDoctor;
