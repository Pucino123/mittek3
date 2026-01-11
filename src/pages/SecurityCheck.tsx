import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';
import { DeviceSelector, DeviceType } from '@/components/ui/DeviceSelector';
import { 
  Shield, 
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Eye,
  Lock,
  Fingerprint,
  MapPin,
  Users,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Question {
  id: string;
  question: string;
  questionByDevice?: Record<DeviceType, string>;
  icon: typeof Shield;
  yesIsGood: boolean;
  goodAdvice: string;
  badAdvice: string;
  badAdviceByDevice?: Record<DeviceType, string>;
  helpSteps?: { instruction: string; detail: string }[];
  devices: DeviceType[];
  severity: 'critical' | 'important' | 'recommended';
}

const allQuestions: Question[] = [
  {
    id: 'passcode',
    question: 'Har din enhed en adgangskode eller Face ID/Touch ID?',
    questionByDevice: {
      iphone: 'Har din iPhone en adgangskode eller Face ID/Touch ID?',
      ipad: 'Har din iPad en adgangskode eller Face ID/Touch ID?',
      mac: 'Har din Mac et login-password eller Touch ID?',
    },
    icon: Lock,
    yesIsGood: true,
    goodAdvice: 'Godt! Din enhed er beskyttet mod uautoriseret adgang.',
    badAdvice: 'KRITISK: Enhver kan åbne din enhed og se alt!',
    badAdviceByDevice: {
      iphone: 'Gå til Indstillinger → Face ID & kode (eller Touch ID & kode) → Slå kode til. Brug minimum 6 cifre.',
      ipad: 'Gå til Indstillinger → Face ID & kode (eller Touch ID & kode) → Slå kode til.',
      mac: 'Gå til Systemindstillinger → Brugere & grupper → Sørg for at din bruger har et stærkt password.',
    },
    helpSteps: [
      { instruction: 'Åbn Indstillinger', detail: 'Find det grå tandhjul' },
      { instruction: 'Tryk på "Face ID & kode"', detail: 'Eller "Touch ID & kode" på ældre modeller' },
      { instruction: 'Tryk "Slå kode til"', detail: 'Vælg mindst 6 cifre' },
    ],
    devices: ['iphone', 'ipad', 'mac'],
    severity: 'critical',
  },
  {
    id: 'two-factor',
    question: 'Har du slået to-faktor-godkendelse til på dit Apple ID?',
    icon: Fingerprint,
    yesIsGood: true,
    goodAdvice: 'Perfekt! Selv hvis nogen stjæler dit password, kan de ikke logge ind.',
    badAdvice: 'VIGTIGT: Uden to-faktor kan hackere logge ind med kun dit password!',
    badAdviceByDevice: {
      iphone: 'Gå til Indstillinger → [Dit navn] → Log ind og sikkerhed → To-faktor-godkendelse → Slå til.',
      ipad: 'Gå til Indstillinger → [Dit navn] → Log ind og sikkerhed → To-faktor-godkendelse.',
      mac: 'Gå til Systemindstillinger → [Dit navn] → Log ind og sikkerhed → To-faktor-godkendelse.',
    },
    helpSteps: [
      { instruction: 'Åbn Indstillinger', detail: 'Find det grå tandhjul' },
      { instruction: 'Tryk på dit navn øverst', detail: 'Der hvor dit billede eller initialer vises' },
      { instruction: 'Tryk "Log ind og sikkerhed"', detail: 'Find to-faktor-godkendelse' },
      { instruction: 'Slå det til', detail: 'Følg vejledningen på skærmen' },
    ],
    devices: ['iphone', 'ipad', 'mac'],
    severity: 'critical',
  },
  {
    id: 'find-my',
    question: 'Er "Find min iPhone/iPad/Mac" slået til?',
    questionByDevice: {
      iphone: 'Er "Find min iPhone" slået til?',
      ipad: 'Er "Find min iPad" slået til?',
      mac: 'Er "Find min Mac" slået til?',
    },
    icon: MapPin,
    yesIsGood: true,
    goodAdvice: 'Godt! Du kan finde eller fjernslette din enhed hvis den bliver stjålet.',
    badAdvice: 'Hvis din enhed bliver stjålet, kan du ikke finde eller slette den!',
    badAdviceByDevice: {
      iphone: 'Gå til Indstillinger → [Dit navn] → Find → Find min iPhone → Slå alle tre indstillinger til.',
      ipad: 'Gå til Indstillinger → [Dit navn] → Find → Find min iPad → Slå til.',
      mac: 'Gå til Systemindstillinger → [Dit navn] → iCloud → Find min Mac → Slå til.',
    },
    helpSteps: [
      { instruction: 'Åbn Indstillinger', detail: 'Find det grå tandhjul' },
      { instruction: 'Tryk på dit navn', detail: 'Øverst i Indstillinger' },
      { instruction: 'Tryk "Find"', detail: 'Find min-tjenester' },
      { instruction: 'Slå alt til', detail: 'Inklusiv "Send sidste placering"' },
    ],
    devices: ['iphone', 'ipad', 'mac'],
    severity: 'important',
  },
  {
    id: 'auto-updates',
    question: 'Er automatiske opdateringer slået til?',
    icon: Shield,
    yesIsGood: true,
    goodAdvice: 'Godt! Din enhed får automatisk de nyeste sikkerhedsrettelser.',
    badAdvice: 'Uden automatiske opdateringer kan du misse vigtige sikkerhedsrettelser.',
    badAdviceByDevice: {
      iphone: 'Gå til Indstillinger → Generelt → Softwareopdatering → Automatiske opdateringer → Slå alle til.',
      ipad: 'Gå til Indstillinger → Generelt → Softwareopdatering → Automatiske opdateringer.',
      mac: 'Gå til Systemindstillinger → Generelt → Softwareopdatering → Automatiske opdateringer.',
    },
    devices: ['iphone', 'ipad', 'mac'],
    severity: 'important',
  },
  {
    id: 'unknown-devices',
    question: 'Har du tjekket for ukendte enheder på dit Apple ID?',
    icon: Smartphone,
    yesIsGood: true,
    goodAdvice: 'Godt! Du ved hvilke enheder der har adgang til din konto.',
    badAdvice: 'Der kan være enheder du ikke genkender, som har adgang til dine data.',
    badAdviceByDevice: {
      iphone: 'Gå til Indstillinger → [Dit navn] → Scroll ned og se listen over enheder. Fjern dem du ikke genkender.',
      ipad: 'Gå til Indstillinger → [Dit navn] → Se listen over enheder.',
      mac: 'Gå til Systemindstillinger → [Dit navn] → Se listen over enheder.',
    },
    helpSteps: [
      { instruction: 'Åbn Indstillinger', detail: 'Find det grå tandhjul' },
      { instruction: 'Tryk på dit navn', detail: 'Øverst i Indstillinger' },
      { instruction: 'Scroll ned til "Enheder"', detail: 'Her ser du alle enheder logget ind med dit Apple ID' },
      { instruction: 'Fjern ukendte enheder', detail: 'Tryk på en enhed og vælg "Fjern fra konto"' },
    ],
    devices: ['iphone', 'ipad', 'mac'],
    severity: 'important',
  },
  {
    id: 'location-sharing',
    question: 'Ved du, hvem du deler din placering med?',
    icon: Users,
    yesIsGood: true,
    goodAdvice: 'Godt! Du har styr på hvem der kan se hvor du er.',
    badAdvice: 'Nogen du ikke kender til, kan måske se din placering!',
    badAdviceByDevice: {
      iphone: 'Gå til Indstillinger → Anonymitet & sikkerhed → Lokalitetstjenester → Del min placering. Tjek listen.',
      ipad: 'Gå til Indstillinger → Anonymitet & sikkerhed → Lokalitetstjenester → Del min placering.',
      mac: 'Gå til Systemindstillinger → Anonymitet & sikkerhed → Lokalitetstjenester.',
    },
    devices: ['iphone', 'ipad', 'mac'],
    severity: 'recommended',
  },
  {
    id: 'safari-warnings',
    question: 'Er Safari-svindeladvarsler slået til?',
    icon: Eye,
    yesIsGood: true,
    goodAdvice: 'Godt! Safari advarer dig om farlige hjemmesider.',
    badAdvice: 'Uden advarsler kan du ende på svindel-sider uden at vide det.',
    badAdviceByDevice: {
      iphone: 'Gå til Indstillinger → Safari → Sørg for at "Advarsel om svindelwebsted" er grøn.',
      ipad: 'Gå til Indstillinger → Safari → "Advarsel om svindelwebsted" skal være til.',
      mac: 'Åbn Safari → Safari-menu → Indstillinger → Sikkerhed → "Advar ved svindelwebsted".',
    },
    devices: ['iphone', 'ipad', 'mac'],
    severity: 'recommended',
  },
];

const SecurityCheck = () => {
  const [device, setDevice] = useState<DeviceType>('iphone');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState<Question | null>(null);

  const questions = allQuestions.filter(q => q.devices.includes(device));

  const handleAnswer = (answer: boolean) => {
    const question = questions[currentQuestion];
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
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

  const openHelp = (question: Question) => {
    setCurrentHelpQuestion(question);
    setHelpModalOpen(true);
  };

  const getSecurityScore = () => {
    let score = 0;
    let maxScore = 0;
    
    questions.forEach(q => {
      const points = q.severity === 'critical' ? 30 : q.severity === 'important' ? 20 : 10;
      maxScore += points;
      
      const answer = answers[q.id];
      const isGood = q.yesIsGood ? answer === true : answer === false;
      if (isGood) {
        score += points;
      }
    });
    
    return Math.round((score / maxScore) * 100);
  };

  const getIssues = () => {
    return questions.filter(q => {
      const answer = answers[q.id];
      const isGood = q.yesIsGood ? answer === true : answer === false;
      return !isGood;
    }).sort((a, b) => {
      const order = { critical: 0, important: 1, recommended: 2 };
      return order[a.severity] - order[b.severity];
    });
  };

  const getDeviceLabel = () => {
    switch (device) {
      case 'iphone': return 'iPhone';
      case 'ipad': return 'iPad';
      case 'mac': return 'Mac';
    }
  };

  // Results view
  if (showResults) {
    const score = getSecurityScore();
    const issues = getIssues();
    const hasIssues = issues.length > 0;
    const criticalIssues = issues.filter(i => i.severity === 'critical');

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-18 items-center">
            <BackButton />
          </div>
        </header>

        <main className="container py-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
                score >= 80 ? 'bg-success/10' : score >= 50 ? 'bg-warning/10' : 'bg-destructive/10'
              }`}>
                {score >= 80 ? (
                  <ShieldCheck className="h-12 w-12 text-success" />
                ) : score >= 50 ? (
                  <Shield className="h-12 w-12 text-warning" />
                ) : (
                  <ShieldAlert className="h-12 w-12 text-destructive" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {score}% Sikker
              </h1>
              <p className="text-muted-foreground">
                {score >= 80 
                  ? 'Din ' + getDeviceLabel() + ' er godt beskyttet!' 
                  : score >= 50 
                    ? 'Der er nogle ting du bør rette op på'
                    : 'Din ' + getDeviceLabel() + ' har kritiske sikkerhedshuller!'}
              </p>
            </div>

            {/* Score bar */}
            <div className="mb-8">
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    score >= 80 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {hasIssues && (
              <div className="space-y-4 mb-8">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  {issues.length} {issues.length === 1 ? 'problem' : 'problemer'} fundet
                </h2>
                
                {issues.map((issue, index) => (
                  <div 
                    key={issue.id} 
                    className={`card-elevated p-5 border-l-4 ${
                      issue.severity === 'critical' ? 'border-l-destructive bg-destructive/5' :
                      issue.severity === 'important' ? 'border-l-warning bg-warning/5' :
                      'border-l-info bg-info/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        issue.severity === 'critical' ? 'bg-destructive/10' :
                        issue.severity === 'important' ? 'bg-warning/10' :
                        'bg-info/10'
                      }`}>
                        <issue.icon className={`h-5 w-5 ${
                          issue.severity === 'critical' ? 'text-destructive' :
                          issue.severity === 'important' ? 'text-warning' :
                          'text-info'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            issue.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
                            issue.severity === 'important' ? 'bg-warning/20 text-warning' :
                            'bg-info/20 text-info'
                          }`}>
                            {issue.severity === 'critical' ? 'Kritisk' : 
                             issue.severity === 'important' ? 'Vigtigt' : 'Anbefalet'}
                          </span>
                        </div>
                        <p className="font-medium mb-2">{issue.badAdvice}</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          {issue.badAdviceByDevice?.[device] || issue.badAdvice}
                        </p>
                        {issue.helpSteps && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openHelp(issue)}
                            className="gap-1.5"
                          >
                            <Eye className="h-4 w-4" />
                            Vis mig hvordan
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!hasIssues && (
              <div className="card-elevated p-6 bg-success/5 border-success/20 text-center mb-8">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Alle tjek bestået!</h3>
                <p className="text-muted-foreground">
                  Din {getDeviceLabel()} er godt beskyttet. Bliv ved med at holde den opdateret!
                </p>
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
                Tjek igen
              </Button>
              <Link to="/dashboard" className="flex-1">
                <Button variant="hero" size="lg" className="w-full">
                  Til forsiden
                </Button>
              </Link>
            </div>
          </div>
        </main>

        {/* Help Modal */}
        <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {currentHelpQuestion && <currentHelpQuestion.icon className="h-5 w-5 text-primary" />}
                Sådan gør du
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {currentHelpQuestion?.helpSteps?.map((step, index) => (
                <div key={index} className="card-elevated p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{step.instruction}</p>
                      <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="hero" onClick={() => setHelpModalOpen(false)} className="w-full">
              Forstået
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Quiz view
  const question = questions[currentQuestion];
  const QuestionIcon = question?.icon || Shield;

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
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <ToolPageHelpButton />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sikkerhedstjek</h1>
            <p className="text-muted-foreground">
              Lad os tjekke om din {getDeviceLabel()} er sikker
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
              <span className={`font-medium ${
                question.severity === 'critical' ? 'text-destructive' :
                question.severity === 'important' ? 'text-warning' :
                'text-info'
              }`}>
                {question.severity === 'critical' ? '⚠️ Kritisk' : 
                 question.severity === 'important' ? '📌 Vigtigt' : '💡 Anbefalet'}
              </span>
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
                <div className={`w-16 h-16 rounded-xl mx-auto mb-6 flex items-center justify-center ${
                  question.severity === 'critical' ? 'bg-destructive/10' :
                  question.severity === 'important' ? 'bg-warning/10' :
                  'bg-info/10'
                }`}>
                  <QuestionIcon className={`h-8 w-8 ${
                    question.severity === 'critical' ? 'text-destructive' :
                    question.severity === 'important' ? 'text-warning' :
                    'text-info'
                  }`} />
                </div>
                <h2 className="text-xl font-semibold mb-4">
                  {question.questionByDevice?.[device] || question.question}
                </h2>
                
                {question.helpSteps && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openHelp(question)}
                    className="text-info hover:text-info hover:bg-info/10 gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    Vis mig hvor jeg tjekker
                  </Button>
                )}
              </div>

              {/* Answer buttons */}
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
            </>
          )}
        </div>
      </main>

      
    </div>
  );
};

export default SecurityCheck;
