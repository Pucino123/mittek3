import { useState } from 'react';
import { BackButton } from '@/components/layout/BackButton';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Shield, 
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy
} from 'lucide-react';
import { trackToolUsage } from '@/utils/analytics';

interface Scenario {
  id: string;
  type: 'sms' | 'email';
  from: string;
  content: string;
  isScam: boolean;
  explanation: string;
}

const scenarios: Scenario[] = [
  {
    id: 'postnord',
    type: 'sms',
    from: 'PostNord',
    content: 'Din pakke mangler porto. Betal 12 kr her for at modtage den: www.post-nord-pakke-dk.xyz',
    isScam: true,
    explanation: 'PostNord bruger ALDRIG .xyz links. De kontakter dig kun via deres officielle app eller brev. Betalingslinks er altid svindel.',
  },
  {
    id: 'bank',
    type: 'email',
    from: 'Din Bank',
    content: 'VIGTIGT: Vi har brug for et billede af dit NemID nøglekort for at bekræfte din identitet. Upload det her.',
    isScam: true,
    explanation: 'Banken vil ALDRIG bede om et billede af dit nøglekort. Ingen seriøs institution beder om dette via email.',
  },
  {
    id: 'son',
    type: 'sms',
    from: '+45 XX XX XX XX',
    content: 'Hej mor/far, min telefon er gået i stykker. Dette er mit nye nummer. Kan du overføre 2.000 kr til min regning? Det haster!',
    isScam: true,
    explanation: 'Klassisk svindel! Ring ALTID til det gamle nummer for at tjekke. Svindlere udnytter, at forældre vil hjælpe deres børn.',
  },
  {
    id: 'mobilepay',
    type: 'sms',
    from: 'MobilePay',
    content: 'Din MobilePay er blevet spærret. Klik her for at genaktivere: mobilepay-dk-verify.com',
    isScam: true,
    explanation: 'MobilePay sender ikke SMS\'er med links. Åbn altid MobilePay-appen direkte for at tjekke din konto.',
  },
  {
    id: 'doctor',
    type: 'sms',
    from: 'Lægehuset',
    content: 'Du har en tid hos lægen i morgen kl. 10:00. Bekræft venligst ved at svare JA.',
    isScam: false,
    explanation: 'Dette er en normal påmindelse fra lægen. Den beder ikke om penge, links eller personlige oplysninger.',
  },
  // NEW SCENARIOS
  {
    id: 'eboks',
    type: 'email',
    from: 'e-Boks',
    content: 'Du har post. Log ind her for at læse den: www.e-boks-dk-login.com',
    isScam: true,
    explanation: 'E-boks sender ALDRIG links direkte til login i en mail. Du skal selv gå ind på e-boks.dk via din browser eller app.',
  },
  {
    id: 'microsoft',
    type: 'sms',
    from: '+44 7XXX XXXXX',
    content: 'Dette er Microsoft Support. Vi har registreret virus på din computer. Ring tilbage på dette nummer for hjælp.',
    isScam: true,
    explanation: 'Microsoft ringer ALDRIG til dig uopfordret. De sender heller ikke SMS\'er. Læg røret på med det samme!',
  },
  {
    id: 'mitid',
    type: 'sms',
    from: 'MitID',
    content: 'Din MitID konto er midlertidigt spærret. Bekræft dine oplysninger her: www.mitid-sikkerhed.com',
    isScam: true,
    explanation: 'MitID sender ALDRIG SMS\'er med links. Tjek altid URL\'en - officiel side er kun mitid.dk. Gå altid direkte til mitid.dk.',
  },
  {
    id: 'skat',
    type: 'email',
    from: 'Skattestyrelsen',
    content: 'Du har 2.847 kr til gode i skat. Indtast dit kontonummer her for at modtage pengene: skat-udbetaling.dk',
    isScam: true,
    explanation: 'Skattestyrelsen beder ALDRIG om kontooplysninger via email. De har allerede dine oplysninger. Tjek altid via skat.dk.',
  },
  {
    id: 'apotek',
    type: 'sms',
    from: 'Apoteket',
    content: 'Din medicin er klar til afhentning. Husk gyldigt ID.',
    isScam: false,
    explanation: 'Dette er en normal besked fra apoteket. Den beder ikke om links, penge eller personlige oplysninger.',
  },
];

const ScamQuiz = () => {
  useScrollRestoration();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  const currentScenario = scenarios[currentIndex];

  const handleAnswer = (answeredScam: boolean) => {
    const isCorrect = answeredScam === currentScenario.isScam;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setUserAnswer(answeredScam);
    setShowResult(true);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setUserAnswer(null);
    
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsQuizComplete(true);
      trackToolUsage('scam_quiz', 'completed', { score, percentage: Math.round((score / scenarios.length) * 100) });
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setUserAnswer(null);
    setIsQuizComplete(false);
  };

  const isCorrect = userAnswer === currentScenario.isScam;
  const percentage = Math.round((score / scenarios.length) * 100);

  // Quiz complete view
  if (isQuizComplete) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-18 items-center">
            <BackButton />
          </div>
        </header>

        <main className="container py-8">
          <div className="max-w-xl mx-auto">
            <Breadcrumb className="mb-4" />
            
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                percentage >= 80 ? 'bg-success/10' : percentage >= 50 ? 'bg-warning/10' : 'bg-destructive/10'
              }`}>
                <Trophy className={`h-12 w-12 ${
                  percentage >= 80 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive'
                }`} />
              </div>

              <h1 className="text-3xl font-bold mb-2">Quiz færdig!</h1>
              <p className="text-xl text-muted-foreground mb-6">
                Du fik <span className="font-bold text-foreground">{score}</span> ud af <span className="font-bold text-foreground">{scenarios.length}</span> rigtige
              </p>

              <div className="card-elevated p-6 mb-8">
                <div className="text-6xl font-bold mb-2" style={{
                  color: percentage >= 80 ? 'hsl(var(--success))' : percentage >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'
                }}>
                  {percentage}%
                </div>
                <p className="text-muted-foreground">
                  {percentage >= 80 
                    ? 'Imponerende! Du er svær at snyde.' 
                    : percentage >= 50 
                      ? 'Godt gået! Men vær stadig opmærksom.' 
                      : 'Øv dig lidt mere. Svindlerne bliver bedre!'}
                </p>
              </div>

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
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1"
                >
                  Til forsiden
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Svindel-Quizzen</h1>
            <p className="text-muted-foreground">
              Kan du gennemskue svindlerne?
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Spørgsmål {currentIndex + 1} af {scenarios.length}</span>
              <span>Score: {score}</span>
            </div>
            <div className="flex gap-1">
              {scenarios.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index < currentIndex ? 'bg-primary' : index === currentIndex ? 'bg-primary/50' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Scenario Card */}
          <div className="card-elevated p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentScenario.type === 'sms' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
              }`}>
                {currentScenario.type === 'sms' ? '📱 SMS' : '📧 Email'}
              </span>
              <span className="text-sm text-muted-foreground">fra "{currentScenario.from}"</span>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <p className="text-lg leading-relaxed">{currentScenario.content}</p>
            </div>

            <p className="text-center text-muted-foreground font-medium">
              Er dette svindel?
            </p>
          </div>

          {/* Answer buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              variant="outline"
              className="h-16 text-lg border-success hover:bg-success hover:text-success-foreground"
              onClick={() => handleAnswer(false)}
              disabled={showResult}
            >
              <ShieldCheck className="mr-2 h-6 w-6" />
              Sikker
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-16 text-lg border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleAnswer(true)}
              disabled={showResult}
            >
              <ShieldAlert className="mr-2 h-6 w-6" />
              Svindel!
            </Button>
          </div>
        </div>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideClose>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center text-xl">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  Rigtigt!
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-destructive" />
                  Forkert!
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className={`p-4 rounded-xl mb-4 ${
              currentScenario.isScam ? 'bg-destructive/10' : 'bg-success/10'
            }`}>
              <p className="font-semibold mb-1">
                {currentScenario.isScam ? '🚨 Dette var SVINDEL' : '✅ Dette var SIKKERT'}
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              {currentScenario.explanation}
            </p>
          </div>

          <Button variant="hero" onClick={nextQuestion} className="w-full">
            {currentIndex < scenarios.length - 1 ? (
              <>
                Næste spørgsmål
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              'Se resultat'
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScamQuiz;
