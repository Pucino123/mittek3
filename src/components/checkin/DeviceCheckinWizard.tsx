import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, ArrowLeft, CheckCircle, Trophy, Send, Loader2,
  Smartphone, Tablet, Monitor, Settings, Battery, Cloud, Trash2, RefreshCw,
  Printer, Check, HelpCircle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackToolUsage } from '@/utils/analytics';
import { jsPDF } from 'jspdf';
import CheckinHelpModal, { CheckinHelpData } from './CheckinHelpModal';
import { parseTextWithIcons } from '@/utils/inlineIcons';
// Device-specific question sets
interface DeviceQuestion {
  id: string;
  text: string;
  type: 'boolean' | 'done';
  weight: number;
  goodAnswer: boolean;
  recommendation: string;
  checkLabel: string;
  helpData: CheckinHelpData;
}

const iphoneQuestions: DeviceQuestion[] = [
  {
    id: 'iphone_update',
    text: 'Gå til Indstillinger → Generelt → Softwareopdatering. Er den opdateret?',
    type: 'boolean',
    weight: 25,
    goodAnswer: true,
    recommendation: 'Din iPhone mangler opdateringer. Installer dem for at få vigtige sikkerhedsrettelser.',
    checkLabel: 'Softwareopdatering',
    helpData: {
      title: 'Find Softwareopdatering',
      screenshot: 'settings',
      steps: [
        { instruction: 'Åbn "Indstillinger" appen', detail: 'Den grå app med tandhjul-ikonet på din startskærm', icon: 'settings' },
        { instruction: 'Tryk på "Generelt"', detail: 'Rul lidt ned på listen', icon: 'tap' },
        { instruction: 'Tryk på "Softwareopdatering"', detail: 'Øverst i menuen', icon: 'tap' },
        { instruction: 'Tjek hvad der står', detail: 'Hvis der står "iOS er opdateret" er alt godt. Ellers tryk "Download og installer"', icon: 'tap' }
      ],
      tip: 'Sørg for at have mindst 50% batteri og være på WiFi før du opdaterer.'
    }
  },
  {
    id: 'iphone_battery',
    text: 'Gå til Indstillinger → Batteri → Batteritilstand. Er den over 80%?',
    type: 'boolean',
    weight: 15,
    goodAnswer: true,
    recommendation: 'Dit batteri er slidt og holder måske ikke hele dagen. Overvej at få det skiftet.',
    checkLabel: 'Batteritilstand',
    helpData: {
      title: 'Tjek Batterisundhed',
      screenshot: 'battery',
      steps: [
        { instruction: 'Åbn "Indstillinger" appen', detail: 'Den grå app med tandhjul-ikonet', icon: 'settings' },
        { instruction: 'Tryk på "Batteri"', detail: 'Rul ned på listen til du finder den', icon: 'battery' },
        { instruction: 'Tryk på "Batterisundhed og opladning"', detail: 'Øverst i batteri-menuen', icon: 'tap' },
        { instruction: 'Kig på "Maksimal kapacitet"', detail: 'Tallet viser hvor sundt dit batteri er. Over 80% er godt!', icon: 'tap' }
      ],
      tip: 'Batterier slides naturligt over tid. Under 80% betyder det er tid til et nyt.'
    }
  },
  {
    id: 'iphone_backup',
    text: 'Har du lavet en iCloud Sikkerhedskopi inden for den sidste uge?',
    type: 'boolean',
    weight: 20,
    goodAnswer: true,
    recommendation: 'KRITISK: Ingen backup! Hvis din telefon går i stykker, mister du alt. Slå iCloud-backup til nu.',
    checkLabel: 'Sikkerhedskopi',
    helpData: {
      title: 'Tjek iCloud Sikkerhedskopi',
      screenshot: 'icloud',
      steps: [
        { instruction: 'Åbn "Indstillinger" appen', detail: 'Den grå app med tandhjul-ikonet', icon: 'settings' },
        { instruction: 'Tryk på dit navn øverst', detail: 'Der hvor dit billede og navn står', icon: 'tap' },
        { instruction: 'Tryk på "iCloud"', detail: 'I menuen under dit navn', icon: 'cloud' },
        { instruction: 'Tryk på "iCloud-sikkerhedskopiering"', detail: 'Rul ned til du finder den', icon: 'tap' },
        { instruction: 'Tjek "Sidst sikkerhedskopieret"', detail: 'Her kan du se hvornår din sidste backup blev lavet', icon: 'tap' }
      ],
      tip: 'Slå "Sikkerhedskopiér denne iPhone" til, så sker det automatisk hver nat når du oplader.'
    }
  }
];

const ipadQuestions: DeviceQuestion[] = [
  {
    id: 'ipad_update',
    text: 'Gå til Indstillinger → Generelt → Softwareopdatering. Er den opdateret?',
    type: 'boolean',
    weight: 25,
    goodAnswer: true,
    recommendation: 'Din iPad mangler opdateringer. Installer dem for at få vigtige sikkerhedsrettelser.',
    checkLabel: 'Softwareopdatering',
    helpData: {
      title: 'Find Softwareopdatering på iPad',
      screenshot: 'settings',
      steps: [
        { instruction: 'Åbn "Indstillinger" appen', detail: 'Den grå app med tandhjul-ikonet på din startskærm', icon: 'settings' },
        { instruction: 'Tryk på "Generelt"', detail: 'I menuen til venstre', icon: 'tap' },
        { instruction: 'Tryk på "Softwareopdatering"', detail: 'Øverst i listen til højre', icon: 'tap' },
        { instruction: 'Tjek hvad der står', detail: 'Hvis der står "iPadOS er opdateret" er alt godt', icon: 'tap' }
      ],
      tip: 'Sørg for at have mindst 50% batteri og være på WiFi før du opdaterer.'
    }
  },
  {
    id: 'ipad_battery',
    text: 'Gå til Indstillinger → Batteri → Batteritilstand. Er den over 80%?',
    type: 'boolean',
    weight: 15,
    goodAnswer: true,
    recommendation: 'Dit iPad-batteri er slidt. Det påvirker hvor længe den holder strøm.',
    checkLabel: 'Batteritilstand',
    helpData: {
      title: 'Tjek Batterisundhed på iPad',
      screenshot: 'battery',
      steps: [
        { instruction: 'Åbn "Indstillinger" appen', detail: 'Den grå app med tandhjul-ikonet', icon: 'settings' },
        { instruction: 'Tryk på "Batteri"', detail: 'I menuen til venstre', icon: 'battery' },
        { instruction: 'Tryk på "Batterisundhed"', detail: 'Øverst i batteri-menuen', icon: 'tap' },
        { instruction: 'Kig på "Maksimal kapacitet"', detail: 'Over 80% er godt!', icon: 'tap' }
      ],
      tip: 'Ikke alle iPads viser batterisundhed. Ældre modeller har ikke denne funktion.'
    }
  },
  {
    id: 'ipad_backup',
    text: 'Har du lavet en iCloud Sikkerhedskopi inden for den sidste uge?',
    type: 'boolean',
    weight: 20,
    goodAnswer: true,
    recommendation: 'Din iPad har ingen nylig backup. Slå iCloud-backup til for at beskytte dine data.',
    checkLabel: 'Sikkerhedskopi',
    helpData: {
      title: 'Tjek iCloud Sikkerhedskopi på iPad',
      screenshot: 'icloud',
      steps: [
        { instruction: 'Åbn "Indstillinger" appen', detail: 'Den grå app med tandhjul-ikonet', icon: 'settings' },
        { instruction: 'Tryk på dit navn øverst til venstre', detail: 'Der hvor dit billede og navn står', icon: 'tap' },
        { instruction: 'Tryk på "iCloud"', detail: 'I menuen under dit navn', icon: 'cloud' },
        { instruction: 'Tryk på "iCloud-sikkerhedskopiering"', detail: 'Rul ned til du finder den', icon: 'tap' },
        { instruction: 'Tjek "Sidst sikkerhedskopieret"', detail: 'Her kan du se hvornår din sidste backup blev lavet', icon: 'tap' }
      ],
      tip: 'Slå backup til så det sker automatisk hver nat når du oplader.'
    }
  }
];

const macQuestions: DeviceQuestion[] = [
  {
    id: 'mac_trash',
    text: 'Har du tømt Papirkurven for at frigøre plads?',
    type: 'done',
    weight: 10,
    goodAnswer: true,
    recommendation: 'Tøm Papirkurven for at frigøre plads på din Mac. Højreklik på Papirkurven → Tøm papirkurv.',
    checkLabel: 'Papirkurv tømt',
    helpData: {
      title: 'Tøm Papirkurven på Mac',
      screenshot: 'mac-trash',
      steps: [
        { instruction: 'Find Papirkurven i Dock', detail: 'Den er helt til højre i bunden af skærmen (ligner en skraldespand)', icon: 'trash' },
        { instruction: 'Højreklik på Papirkurven', detail: 'Tryk med to fingre på pegefeltet, eller hold Ctrl nede og klik', icon: 'tap' },
        { instruction: 'Vælg "Tøm papirkurv"', detail: 'I menuen der kommer frem', icon: 'tap' },
        { instruction: 'Bekræft ved at klikke "Tøm papirkurv"', detail: 'Nu er filerne slettet permanent', icon: 'tap' }
      ],
      tip: 'Du kan også bruge tastatur-genvejen: Cmd + Shift + Delete mens du er i Finder.'
    }
  },
  {
    id: 'mac_update',
    text: 'Er styresystemet opdateret via Systemindstillinger?',
    type: 'boolean',
    weight: 25,
    goodAnswer: true,
    recommendation: 'Din Mac mangler opdateringer. Gå til Apple-menu → Systemindstillinger → Softwareopdatering.',
    checkLabel: 'Softwareopdatering',
    helpData: {
      title: 'Tjek Mac-opdateringer',
      screenshot: 'mac-settings',
      steps: [
        { instruction: 'Klik på Apple-logoet øverst til venstre', detail: 'I menulinjen helt øverst på skærmen', icon: 'apple' },
        { instruction: 'Vælg "Systemindstillinger"', detail: 'I menuen der kommer frem', icon: 'settings' },
        { instruction: 'Klik på "Generelt" i sidepanelet', detail: 'Til venstre i vinduet', icon: 'tap' },
        { instruction: 'Klik på "Softwareopdatering"', detail: 'Her kan du se om der er opdateringer tilgængelige', icon: 'tap' }
      ],
      tip: 'Slå "Automatiske opdateringer" til, så holder din Mac sig selv opdateret.'
    }
  },
  {
    id: 'mac_restart',
    text: 'Har du genstartet computeren helt (Sluk/Tænd) inden for den sidste uge?',
    type: 'done',
    weight: 15,
    goodAnswer: true,
    recommendation: 'Genstart din Mac regelmæssigt for at holde den hurtig. Gå til Apple-menu → Genstart.',
    checkLabel: 'Genstartet',
    helpData: {
      title: 'Genstart din Mac',
      screenshot: 'mac-settings',
      steps: [
        { instruction: 'Klik på Apple-logoet øverst til venstre', detail: 'I menulinjen helt øverst på skærmen', icon: 'apple' },
        { instruction: 'Vælg "Genstart..."', detail: 'I menuen der kommer frem', icon: 'refresh' },
        { instruction: 'Klik "Genstart" for at bekræfte', detail: 'Din Mac lukker ned og starter op igen', icon: 'tap' }
      ],
      tip: 'Genstart rydder op i hukommelsen og får din Mac til at køre hurtigere.'
    }
  }
];

const getQuestionsForDevice = (device: string): DeviceQuestion[] => {
  switch (device) {
    case 'iphone': return iphoneQuestions;
    case 'ipad': return ipadQuestions;
    case 'mac': return macQuestions;
    default: return iphoneQuestions;
  }
};

const getDeviceInfo = (device: string) => {
  switch (device) {
    case 'iphone': return { label: 'iPhone', icon: Smartphone, emoji: '📱' };
    case 'ipad': return { label: 'iPad', icon: Tablet, emoji: '📱' };
    case 'mac': return { label: 'Mac', icon: Monitor, emoji: '💻' };
    default: return { label: 'Enhed', icon: Smartphone, emoji: '📱' };
  }
};

interface DeviceAnswers {
  [questionId: string]: boolean | null;
}

interface DeviceResult {
  device: string;
  score: number;
  recommendations: string[];
  answers: DeviceAnswers;
  checks: { label: string; ok: boolean }[];
}

interface AIRecommendation {
  title: string;
  description: string;
  link?: string;
  priority: 'high' | 'medium' | 'low';
  device?: string; // Track which device this is for
}

// Stepper component
function DeviceStepper({ 
  devices, 
  currentIndex, 
  isComplete 
}: { 
  devices: string[]; 
  currentIndex: number;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {devices.map((device, idx) => {
        const info = getDeviceInfo(device);
        const DeviceIcon = info.icon;
        const isCompleted = isComplete || idx < currentIndex;
        const isCurrent = !isComplete && idx === currentIndex;
        const isPending = !isComplete && idx > currentIndex;
        
        return (
          <div key={device} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-success text-white' :
                  isCurrent ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' :
                  'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <DeviceIcon className="h-5 w-5" />
                )}
              </div>
              <span className={`text-xs mt-1 ${isCurrent ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                {info.label}
              </span>
            </div>
            {idx < devices.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-success' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
      {/* Result step */}
      <div className="flex items-center">
        <div className={`w-8 h-0.5 mx-1 ${isComplete ? 'bg-success' : 'bg-muted'}`} />
        <div className="flex flex-col items-center">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isComplete ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {isComplete ? <Check className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
          </div>
          <span className={`text-xs mt-1 ${isComplete ? 'font-medium text-success' : 'text-muted-foreground'}`}>
            Resultat
          </span>
        </div>
      </div>
    </div>
  );
}

export function DeviceCheckinWizard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const ownedDevices = (profile?.owned_devices as string[]) || ['iphone'];
  
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DeviceAnswers>>({});
  const [results, setResults] = useState<DeviceResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hasHelper, setHasHelper] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Reset all state when component mounts (fresh start)
  useEffect(() => {
    setCurrentDeviceIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults([]);
    setIsComplete(false);
    setAiRecommendations([]);
    setReportSent(false);
  }, []);

  // Check for trusted helper
  useEffect(() => {
    const checkHelper = async () => {
      if (!user) return;
      const { data: helpers } = await supabase
        .from('trusted_helpers')
        .select('id')
        .eq('user_id', user.id)
        .eq('invitation_accepted', true)
        .eq('can_view_checkins', true)
        .limit(1);
      setHasHelper(!!helpers && helpers.length > 0);
    };
    checkHelper();
  }, [user]);

  const currentDevice = ownedDevices[currentDeviceIndex];
  const currentQuestions = getQuestionsForDevice(currentDevice);
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const deviceInfo = getDeviceInfo(currentDevice);

  // Total progress calculation
  const totalQuestions = ownedDevices.reduce((sum, d) => sum + getQuestionsForDevice(d).length, 0);
  const completedQuestions = ownedDevices.slice(0, currentDeviceIndex).reduce((sum, d) => sum + getQuestionsForDevice(d).length, 0) + currentQuestionIndex;
  const progress = ((completedQuestions + 1) / totalQuestions) * 100;

  const handleAnswer = (answer: boolean) => {
    const deviceAnswers = answers[currentDevice] || {};
    const newDeviceAnswers = { ...deviceAnswers, [currentQuestion.id]: answer };
    setAnswers({ ...answers, [currentDevice]: newDeviceAnswers });
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentDeviceIndex < ownedDevices.length - 1) {
      setCurrentDeviceIndex(currentDeviceIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      calculateResults({ ...answers, [currentDevice]: newDeviceAnswers });
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentDeviceIndex > 0) {
      setCurrentDeviceIndex(currentDeviceIndex - 1);
      const prevDevice = ownedDevices[currentDeviceIndex - 1];
      setCurrentQuestionIndex(getQuestionsForDevice(prevDevice).length - 1);
    }
  };

  const calculateResults = async (allAnswers: Record<string, DeviceAnswers>) => {
    setIsSaving(true);
    
    const deviceResults: DeviceResult[] = [];
    const allRecommendations: string[] = [];
    
    // ONLY process devices the user actually owns
    for (const device of ownedDevices) {
      const deviceAnswers = allAnswers[device] || {};
      const questions = getQuestionsForDevice(device);
      
      let score = 100;
      const recommendations: string[] = [];
      const checks: { label: string; ok: boolean }[] = [];
      
      for (const q of questions) {
        const answer = deviceAnswers[q.id];
        const isOk = answer === q.goodAnswer;
        checks.push({ label: q.checkLabel, ok: isOk });
        
        if (!isOk && answer !== null) {
          score -= q.weight;
          recommendations.push(q.recommendation);
          allRecommendations.push(`${getDeviceInfo(device).label}: ${q.recommendation}`);
        }
      }
      
      deviceResults.push({
        device,
        score: Math.max(0, score),
        recommendations,
        answers: deviceAnswers,
        checks
      });
    }
    
    setResults(deviceResults);
    
    if (user) {
      const avgScore = Math.round(deviceResults.reduce((sum, r) => sum + r.score, 0) / deviceResults.length);
      
      // Save to checkins table (for dashboard status)
      await supabase.from('checkins').insert({
        user_id: user.id,
        score: avgScore,
        recommendations: allRecommendations
      });
      
      // Also save to check_history for tracking progress over time
      await supabase.from('check_history').insert({
        user_id: user.id,
        score: avgScore,
        device_types: ownedDevices,
        issues_found: allRecommendations
      });
      
      trackToolUsage('checkin', 'completed', { score: avgScore, devices: ownedDevices });
    }
    
    await generateAIRecommendations(deviceResults);
    
    setIsSaving(false);
    setIsComplete(true);
  };

  const generateAIRecommendations = async (deviceResults: DeviceResult[]) => {
    setIsLoadingAI(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');
      
      // Build context ONLY for owned devices
      const issuesSummary = deviceResults
        .filter(r => ownedDevices.includes(r.device)) // STRICT FILTER
        .flatMap(r => r.recommendations.map(rec => `${getDeviceInfo(r.device).label}: ${rec}`))
        .join('\n');
      
      if (!issuesSummary) {
        // No issues = no recommendations needed (score is 100)
        setAiRecommendations([]);
        setIsLoadingAI(false);
        return;
      }
      
      const response = await supabase.functions.invoke('generate-recommendations', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: { 
          issues: issuesSummary, 
          devices: ownedDevices // Pass ONLY owned devices
        }
      });
      
      if (response.data?.recommendations) {
        // STRICT FILTER: Remove any recommendations mentioning devices user doesn't own
        const filteredRecs = (response.data.recommendations as AIRecommendation[]).filter(rec => {
          const text = `${rec.title} ${rec.description}`.toLowerCase();
          const hasMac = text.includes('mac') || text.includes('computer') || text.includes('papirkurv') || text.includes('genstart din computer');
          const hasIphone = text.includes('iphone');
          const hasIpad = text.includes('ipad');
          
          // If recommendation mentions Mac but user doesn't have Mac, exclude it
          if (hasMac && !ownedDevices.includes('mac')) return false;
          // If recommendation mentions iPhone but user doesn't have iPhone, exclude it
          if (hasIphone && !ownedDevices.includes('iphone') && !ownedDevices.includes('ipad')) return false;
          
          return true;
        });
        
        setAiRecommendations(filteredRecs);
      }
    } catch (error) {
      console.error('AI recommendation error:', error);
      // Fallback - ONLY use recommendations from owned devices
      const fallback: AIRecommendation[] = deviceResults
        .filter(r => ownedDevices.includes(r.device))
        .flatMap(r => r.recommendations.slice(0, 2).map(rec => ({
          title: rec.split('.')[0] || rec,
          description: rec,
          priority: 'high' as const
        })))
        .slice(0, 4);
      
      setAiRecommendations(fallback);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSendReport = async () => {
    if (!user) return;
    setIsSendingReport(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
      const allRecs = results.flatMap(r => r.recommendations.map(rec => `${getDeviceInfo(r.device).label}: ${rec}`));
      
      await supabase.functions.invoke('send-checkin-report', {
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
        body: { score: avgScore, recommendations: allRecs }
      });
      
      toast.success('Rapport sendt til din hjælper!');
      setReportSent(true);
    } catch (error) {
      console.error('Send report error:', error);
      toast.error('Kunne ikke sende rapport. Prøv igen.');
    } finally {
      setIsSendingReport(false);
    }
  };

  const generatePDF = () => {
    setIsGeneratingPDF(true);
    
    try {
      const doc = new jsPDF();
      const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
      const hasIssues = results.some(r => r.recommendations.length > 0);
      const userName = profile?.display_name || 'Bruger';
      const dateStr = new Date().toLocaleDateString('da-DK', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      const pageWidth = 210;
      const margin = 20;
      
      // Helper to sanitize text for PDF (replace Danish chars with ASCII-safe versions)
      const sanitize = (text: string): string => {
        return text
          .replace(/æ/g, 'ae').replace(/Æ/g, 'Ae')
          .replace(/ø/g, 'oe').replace(/Ø/g, 'Oe')
          .replace(/å/g, 'aa').replace(/Å/g, 'Aa')
          .replace(/é/g, 'e').replace(/É/g, 'E')
          .replace(/–/g, '-').replace(/—/g, '-')
          .replace(/'/g, "'").replace(/'/g, "'")
          .replace(/"/g, '"').replace(/"/g, '"');
      };
      
      // ========== HEADER ==========
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('MitTek', margin, 25);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Din Digitale Hjaelper', margin, 35);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Sundhedstjek Rapport', pageWidth - margin, 25, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(sanitize(dateStr), pageWidth - margin, 35, { align: 'right' });
      
      // ========== USER INFO ==========
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Udarbejdet for: ${sanitize(userName)}`, margin, 58);
      
      // ========== STATUS BADGE ==========
      const badgeY = 70;
      const badgeWidth = pageWidth - margin * 2;
      const badgeHeight = 35;
      
      if (hasIssues) {
        doc.setFillColor(255, 237, 213);
        doc.setDrawColor(245, 158, 11);
        doc.roundedRect(margin, badgeY, badgeWidth, badgeHeight, 5, 5, 'FD');
        
        doc.setTextColor(180, 83, 9);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('! HANDLING KRAEVES', pageWidth / 2, badgeY + 15, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Samlet score: ${avgScore}/100 - Nogle ting kraever opmaerksomhed`, pageWidth / 2, badgeY + 27, { align: 'center' });
      } else {
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(34, 197, 94);
        doc.roundedRect(margin, badgeY, badgeWidth, badgeHeight, 5, 5, 'FD');
        
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('GODKENDT', pageWidth / 2, badgeY + 15, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Samlet score: ${avgScore}/100 - Alle dine enheder har det godt!`, pageWidth / 2, badgeY + 27, { align: 'center' });
      }
      
      // ========== DEVICE RESULTS TABLE ==========
      let yPos = badgeY + badgeHeight + 15;
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Enhedsoversigt', margin, yPos);
      yPos += 10;
      
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos, badgeWidth, 10, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('ENHED', margin + 5, yPos + 7);
      doc.text('STATUS', margin + 70, yPos + 7);
      doc.text('SCORE', pageWidth - margin - 20, yPos + 7, { align: 'right' });
      yPos += 12;
      
      results.forEach((result, idx) => {
        const info = getDeviceInfo(result.device);
        const rowHeight = 8 + result.checks.length * 5;
        
        if (idx % 2 === 0) {
          doc.setFillColor(252, 252, 253);
          doc.rect(margin, yPos - 2, badgeWidth, rowHeight + 4, 'F');
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(`${info.label}`, margin + 5, yPos + 5);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let checkY = yPos + 5;
        result.checks.forEach((check) => {
          if (check.ok) {
            doc.setTextColor(34, 197, 94);
            doc.text(`[OK] ${sanitize(check.label)}`, margin + 70, checkY);
          } else {
            doc.setTextColor(239, 68, 68);
            doc.text(`[X] ${sanitize(check.label)}`, margin + 70, checkY);
          }
          checkY += 5;
        });
        
        const scoreColor = result.score >= 80 ? [34, 197, 94] : result.score >= 50 ? [245, 158, 11] : [239, 68, 68];
        doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${result.score}`, pageWidth - margin - 20, yPos + 5, { align: 'right' });
        
        yPos += rowHeight + 6;
      });
      
      // ========== RECOMMENDATIONS ==========
      if (hasIssues) {
        yPos += 10;
        
        if (yPos > 220) {
          doc.addPage();
          yPos = 30;
        }
        
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Anbefalede Handlinger', margin, yPos);
        yPos += 10;
        
        let actionNum = 1;
        results.forEach(result => {
          result.recommendations.forEach((rec) => {
            if (yPos > 260) {
              doc.addPage();
              yPos = 30;
            }
            
            doc.setFillColor(59, 130, 246);
            doc.circle(margin + 5, yPos - 1, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(String(actionNum), margin + 5, yPos + 1, { align: 'center' });
            
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(sanitize(rec), badgeWidth - 20);
            doc.text(lines, margin + 15, yPos);
            yPos += lines.length * 5 + 6;
            actionNum++;
          });
        });
      }
      
      // ========== FOOTER ==========
      const footerY = 280;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Denne rapport er genereret af MitTek - Din Digitale Hjaelper', margin, footerY);
      doc.text(sanitize(dateStr), pageWidth - margin, footerY, { align: 'right' });
      
      doc.save(`mittek-sundhedstjek-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloadet!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Kunne ikke oprette PDF. Prøv igen.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Reset wizard to start fresh
  const handleStartOver = () => {
    setCurrentDeviceIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults([]);
    setIsComplete(false);
    setAiRecommendations([]);
    setReportSent(false);
    setIsLoadingAI(false);
  };

  // Results screen
  if (isComplete) {
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
    const scoreColor = avgScore >= 80 ? 'text-success' : avgScore >= 50 ? 'text-warning' : 'text-destructive';
    const isPerfectScore = avgScore === 100;
    // Never show recommendations section if perfect score, even if AI generated some
    const hasRecommendations = aiRecommendations.length > 0 && !isPerfectScore;
    
    return (
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <DeviceStepper devices={ownedDevices} currentIndex={ownedDevices.length} isComplete={true} />
        
        {/* Score header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${isPerfectScore ? 'bg-success/20' : 'bg-success/10'} flex items-center justify-center mx-auto mb-4`}>
            <Trophy className={`h-8 w-8 md:h-10 md:w-10 ${isPerfectScore ? 'text-success' : 'text-success'}`} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {isPerfectScore ? '🎉 Perfekt! Alle dine enheder er i topform!' : 'Dit Månedlige Tjek er færdigt!'}
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
            <span className="text-sm text-muted-foreground">Samlet score:</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>{avgScore}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          {isPerfectScore && (
            <p className="mt-4 text-muted-foreground">
              Der er ingen handlinger at tage lige nu. Godt klaret! 👏
            </p>
          )}
        </div>
        
        {/* Per-device results - ONLY shows owned devices */}
        <div className="grid gap-4 mb-8">
          {results.map((result) => {
            const info = getDeviceInfo(result.device);
            const DeviceIcon = info.icon;
            const deviceScoreColor = result.score >= 80 ? 'text-success' : result.score >= 50 ? 'text-warning' : 'text-destructive';
            
            return (
              <div key={result.device} className="card-elevated p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <DeviceIcon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">Din {info.label}</span>
                  </div>
                  <span className={`text-xl font-bold ${deviceScoreColor}`}>{result.score}/100</span>
                </div>
                
                {/* Show check status */}
                <div className="space-y-1 mb-2">
                  {result.checks.map((check, i) => (
                    <div key={i} className={`text-sm flex items-center gap-2 ${check.ok ? 'text-success' : 'text-destructive'}`}>
                      {check.ok ? <CheckCircle className="h-4 w-4" /> : <span>✗</span>}
                      {check.label}: {check.ok ? 'OK' : 'Mangler'}
                    </div>
                  ))}
                </div>
                
                {result.recommendations.length > 0 && (
                  <ul className="space-y-2 mt-3 pt-3 border-t">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-destructive">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        
        {/* AI Recommendations OR Success Message */}
        {!isLoadingAI && (
          hasRecommendations ? (
            <div className="card-elevated p-5 mb-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Dine Næste Skridt
              </h2>
              
              <div className="space-y-3">
                {aiRecommendations.map((rec, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-lg border ${
                      rec.priority === 'high' ? 'bg-destructive/5 border-destructive/20' :
                      rec.priority === 'medium' ? 'bg-warning/5 border-warning/20' :
                      'bg-success/5 border-success/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium mb-1">{parseTextWithIcons(rec.title)}</p>
                        <p className="text-sm text-muted-foreground">{parseTextWithIcons(rec.description)}</p>
                        {rec.link && (
                          <a href={rec.link} className="text-sm text-primary hover:underline mt-2 inline-block">
                            Læs guiden →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-elevated p-5 mb-6 bg-success/5 border-success/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                  <ShieldCheck className="h-7 w-7 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-success mb-1">Alt ser fint ud!</p>
                  <p className="text-sm text-muted-foreground">Ingen handlinger kræves. Dine enheder er i god stand.</p>
                </div>
              </div>
            </div>
          )
        )}
        
        {/* Actions */}
        <div className="space-y-3">
          {/* PDF Export */}
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            onClick={generatePDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Opretter PDF...</>
            ) : (
              <><Printer className="mr-2 h-5 w-5" />Hent Resultat som PDF</>
            )}
          </Button>
          
          {hasHelper && (
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onClick={handleSendReport}
              disabled={isSendingReport || reportSent}
            >
              {isSendingReport ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sender...</>
              ) : reportSent ? (
                <><CheckCircle className="mr-2 h-5 w-5 text-success" />Rapport sendt</>
              ) : (
                <><Send className="mr-2 h-5 w-5" />Send rapport til hjælper</>
              )}
            </Button>
          )}
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="lg" 
              className="flex-1"
              onClick={handleStartOver}
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Start forfra
            </Button>
            <Button variant="hero" size="lg" className="flex-1" onClick={() => navigate('/dashboard')}>
              Tilbage til dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Saving screen
  if (isSaving) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium">Beregner dine resultater...</p>
        <p className="text-muted-foreground">Dette tager kun et øjeblik</p>
      </div>
    );
  }

  // Question screen
  const DeviceIcon = deviceInfo.icon;
  
  return (
    <div className="max-w-lg mx-auto">
      {/* Stepper */}
      <DeviceStepper devices={ownedDevices} currentIndex={currentDeviceIndex} isComplete={false} />
      
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Månedligt Tjek</span>
          <span>Spørgsmål {completedQuestions + 1} af {totalQuestions}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <DeviceIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{deviceInfo.label}</p>
            <p className="text-sm text-muted-foreground">
              Spørgsmål {currentQuestionIndex + 1} af {currentQuestions.length}
            </p>
          </div>
        </div>
        
        <h2 className="text-lg font-semibold mb-4">
          {parseTextWithIcons(currentQuestion.text)}
        </h2>
        
        {/* Help button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHelpModalOpen(true)}
          className="mb-6 text-primary hover:text-primary/80"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Vis mig hvor
        </Button>
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="xl"
            variant="outline"
            onClick={() => handleAnswer(true)}
            className="h-20 text-lg flex flex-col gap-1"
          >
            <span className="text-2xl">✅</span>
            {currentQuestion.type === 'done' ? 'Gjort' : 'Ja'}
          </Button>
          <Button
            size="xl"
            variant="outline"
            onClick={() => handleAnswer(false)}
            className="h-20 text-lg flex flex-col gap-1"
          >
            <span className="text-2xl">❌</span>
            {currentQuestion.type === 'done' ? 'Ikke gjort' : 'Nej'}
          </Button>
        </div>
      </div>

      {/* Help Modal */}
      <CheckinHelpModal
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
        helpData={currentQuestion.helpData}
      />

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={handleBack}
          disabled={currentDeviceIndex === 0 && currentQuestionIndex === 0}
          className="min-h-[48px]"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Tilbage
        </Button>
        
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate('/dashboard')}
          className="min-h-[48px]"
        >
          Afbryd
        </Button>
      </div>
    </div>
  );
}
