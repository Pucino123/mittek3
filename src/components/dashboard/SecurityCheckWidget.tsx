import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  CreditCard,
  Download,
  Eye,
  Smartphone,
  RefreshCw,
  Shield,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question: string;
  helpText: string;
  icon: React.ElementType;
  warningOnYes: boolean;
  recommendation: string;
}

const securityQuestions: Question[] = [
  {
    id: 'strange_emails',
    question: 'Har du modtaget mærkelige e-mails på det seneste?',
    helpText: 'F.eks. beskeder om at din konto er låst, eller at du har vundet noget',
    icon: Mail,
    warningOnYes: true,
    recommendation: 'Slet mistænkelige e-mails uden at klikke på links. Brug Sikkerhedsskjoldet til at tjekke beskeder.',
  },
  {
    id: 'unknown_calls',
    question: 'Har du fået opkald fra ukendte numre, der beder om personlige oplysninger?',
    helpText: 'F.eks. nogen der udgiver sig for at være fra banken eller Microsoft',
    icon: Phone,
    warningOnYes: true,
    recommendation: 'Læg altid på og ring selv til banken på det officielle nummer. Aldrig del personlige oplysninger over telefonen.',
  },
  {
    id: 'bank_activity',
    question: 'Har du set ukendte bevægelser på din bankkonto?',
    helpText: 'Beløb du ikke kan genkende eller overførsler du ikke har lavet',
    icon: CreditCard,
    warningOnYes: true,
    recommendation: 'Kontakt din bank med det samme! Ring på det nummer der står på dit betalingskort.',
  },
  {
    id: 'unknown_apps',
    question: 'Er der kommet apps på din telefon, du ikke har installeret?',
    helpText: 'Apps du ikke kan huske at have hentet selv',
    icon: Download,
    warningOnYes: true,
    recommendation: 'Slet ukendte apps med det samme. Gå til Indstillinger → Apps og fjern dem.',
  },
  {
    id: 'popup_warnings',
    question: 'Ser du advarsler om at din enhed er hacket eller inficeret?',
    helpText: 'Popups der siger "Din iPhone har virus" eller lignende',
    icon: AlertTriangle,
    warningOnYes: true,
    recommendation: 'Disse er ALTID falske! Luk browseren helt og åbn den igen. Installer aldrig noget de beder om.',
  },
  {
    id: 'shared_passwords',
    question: 'Har du delt adgangskoder med nogen på det seneste?',
    helpText: 'Over telefon, SMS eller e-mail',
    icon: Eye,
    warningOnYes: true,
    recommendation: 'Skift straks de adgangskoder du har delt. Brug aldrig samme kode to steder.',
  },
  {
    id: 'slow_device',
    question: 'Er din enhed blevet mærkbart langsommere for nylig?',
    helpText: 'Uden at du har installeret noget nyt',
    icon: Smartphone,
    warningOnYes: true,
    recommendation: 'Genstart enheden og tjek for opdateringer. Slet apps du ikke bruger.',
  },
  {
    id: 'updates_installed',
    question: 'Er din telefon/computer opdateret til nyeste version?',
    helpText: 'Tjek under Indstillinger → Generelt → Softwareopdatering',
    icon: RefreshCw,
    warningOnYes: false, // This one is reversed - YES is good
    recommendation: 'Installer altid opdateringer hurtigst muligt - de indeholder vigtige sikkerhedsrettelser.',
  },
];

export const SecurityCheckWidget = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isComplete, setIsComplete] = useState(false);

  const progress = ((currentStep + 1) / securityQuestions.length) * 100;
  const currentQuestion = securityQuestions[currentStep];

  const handleAnswer = (answer: boolean) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    
    if (currentStep < securityQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setIsStarted(false);
    }
  };

  const handleReset = () => {
    setIsStarted(false);
    setCurrentStep(0);
    setAnswers({});
    setIsComplete(false);
  };

  // Calculate results
  const getResults = () => {
    let warnings = 0;
    const recommendations: string[] = [];

    securityQuestions.forEach((q) => {
      const answer = answers[q.id];
      const isWarning = q.warningOnYes ? answer === true : answer === false;
      
      if (isWarning) {
        warnings++;
        recommendations.push(q.recommendation);
      }
    });

    return { warnings, recommendations, total: securityQuestions.length };
  };

  // Initial state - invitation to start
  if (!isStarted) {
    return (
      <div className="card-elevated p-5 sm:p-6 mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold mb-1">🔒 Er jeg blevet hacket?</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Svar på 8 hurtige spørgsmål og find ud af, om din enhed er sikker. Det tager kun 2 minutter.
            </p>
          </div>
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => setIsStarted(true)}
            className="w-full sm:w-auto min-h-[48px]"
          >
            Start tjek
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Complete state - show results
  if (isComplete) {
    const { warnings, recommendations } = getResults();
    const isSecure = warnings === 0;
    const isConcerning = warnings >= 3;

    return (
      <div className="card-elevated p-5 sm:p-6 mb-6">
        <div className="text-center mb-6">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            isSecure ? "bg-success/10" : isConcerning ? "bg-destructive/10" : "bg-warning/10"
          )}>
            {isSecure ? (
              <Shield className="h-10 w-10 text-success" />
            ) : isConcerning ? (
              <AlertTriangle className="h-10 w-10 text-destructive" />
            ) : (
              <ShieldAlert className="h-10 w-10 text-warning" />
            )}
          </div>
          
          <h3 className={cn(
            "text-2xl font-bold mb-2",
            isSecure ? "text-success" : isConcerning ? "text-destructive" : "text-warning"
          )}>
            {isSecure ? "Alt ser godt ud! ✅" : isConcerning ? "Handling påkrævet! ⚠️" : "Vær opmærksom 👀"}
          </h3>
          
          <p className="text-muted-foreground">
            {isSecure 
              ? "Vi fandt ingen tegn på at din enhed er kompromitteret."
              : `Vi fandt ${warnings} punkt${warnings === 1 ? '' : 'er'} der kræver opmærksomhed.`
            }
          </p>
        </div>

        {recommendations.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Dine næste skridt:
            </h4>
            <ul className="space-y-3">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1 min-h-[48px]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tjek igen
          </Button>
          {isConcerning && (
            <Button variant="destructive" className="flex-1 min-h-[48px]" asChild>
              <Link to="/panic">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Gå til Tryghedsknap
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Question state
  return (
    <div className="card-elevated p-5 sm:p-6 mb-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Sikkerhedstjek</span>
          <span>Spørgsmål {currentStep + 1} af {securityQuestions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <currentQuestion.icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">{currentQuestion.question}</h3>
            <p className="text-sm text-muted-foreground">{currentQuestion.helpText}</p>
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          variant="outline"
          size="xl"
          onClick={() => handleAnswer(true)}
          className={cn(
            "h-16 text-lg",
            answers[currentQuestion.id] === true && "border-primary bg-primary/5"
          )}
        >
          <CheckCircle className="mr-2 h-5 w-5 text-success" />
          Ja
        </Button>
        <Button
          variant="outline"
          size="xl"
          onClick={() => handleAnswer(false)}
          className={cn(
            "h-16 text-lg",
            answers[currentQuestion.id] === false && "border-primary bg-primary/5"
          )}
        >
          <XCircle className="mr-2 h-5 w-5 text-destructive" />
          Nej
        </Button>
      </div>

      {/* Back button */}
      <Button variant="ghost" onClick={handleBack} className="w-full min-h-[44px]">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbage
      </Button>
    </div>
  );
};
