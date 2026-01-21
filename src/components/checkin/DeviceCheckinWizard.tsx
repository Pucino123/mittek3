import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, ArrowLeft, CheckCircle, Trophy, Send, Loader2,
  Smartphone, Tablet, Monitor, RefreshCw,
  Printer, Check, HelpCircle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackToolUsage } from '@/utils/analytics';
import { jsPDF } from 'jspdf';
import CheckinHelpModal, { CheckinHelpData } from './CheckinHelpModal';
import { useCheckinQuestions, DeviceQuestion } from '@/hooks/useCheckinQuestions';

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
  device?: string;
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
  const { getQuestionsForDevice, loading: questionsLoading, error: questionsError } = useCheckinQuestions();
  
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
  const progress = totalQuestions > 0 ? ((completedQuestions + 1) / totalQuestions) * 100 : 0;

  const handleAnswer = (answer: boolean) => {
    if (!currentQuestion) return;
    
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

  const handleStartOver = () => {
    setCurrentDeviceIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults([]);
    setIsComplete(false);
    setAiRecommendations([]);
    setReportSent(false);
  };

  const calculateResults = async (allAnswers: Record<string, DeviceAnswers>) => {
    setIsSaving(true);
    
    const deviceResults: DeviceResult[] = [];
    const allRecommendations: string[] = [];
    
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
      
      await supabase.from('checkins').insert({
        user_id: user.id,
        score: avgScore,
        recommendations: allRecommendations
      });
      
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
      
      const issuesSummary = deviceResults
        .filter(r => ownedDevices.includes(r.device))
        .flatMap(r => r.recommendations.map(rec => `${getDeviceInfo(r.device).label}: ${rec}`))
        .join('\n');
      
      if (!issuesSummary) {
        setAiRecommendations([]);
        setIsLoadingAI(false);
        return;
      }
      
      const response = await supabase.functions.invoke('generate-recommendations', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: { 
          issues: issuesSummary, 
          devices: ownedDevices
        }
      });
      
      if (response.data?.recommendations) {
        const filteredRecs = (response.data.recommendations as AIRecommendation[]).filter(rec => {
          const text = `${rec.title} ${rec.description}`.toLowerCase();
          const hasMac = text.includes('mac') || text.includes('computer') || text.includes('papirkurv') || text.includes('genstart din computer');
          const hasIphone = text.includes('iphone');
          
          if (hasMac && !ownedDevices.includes('mac')) return false;
          if (hasIphone && !ownedDevices.includes('iphone') && !ownedDevices.includes('ipad')) return false;
          
          return true;
        });
        
        setAiRecommendations(filteredRecs);
      }
    } catch (error) {
      console.error('AI recommendation error:', error);
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
      
      // Header
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
      
      // User info
      let yPos = 60;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Bruger: ${sanitize(userName)}`, margin, yPos);
      
      yPos += 15;
      
      // Score box
      const scoreColor = avgScore >= 80 ? [34, 197, 94] : avgScore >= 50 ? [234, 179, 8] : [239, 68, 68];
      doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(`${avgScore}/100`, pageWidth / 2, yPos + 22, { align: 'center' });
      
      yPos += 50;
      
      // Device results
      doc.setTextColor(0, 0, 0);
      for (const result of results) {
        const info = getDeviceInfo(result.device);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${sanitize(info.label)} - ${result.score}/100`, margin, yPos);
        yPos += 8;
        
        for (const check of result.checks) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const status = check.ok ? '[OK]' : '[X]';
          doc.text(`  ${status} ${sanitize(check.label)}`, margin, yPos);
          yPos += 6;
        }
        
        yPos += 10;
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      }
      
      doc.save(`mittek-tjek-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF gemt!');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Kunne ikke oprette PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Loading state
  if (questionsLoading) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium">Henter spørgsmål...</p>
      </div>
    );
  }

  // Error state
  if (questionsError) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-lg font-medium text-destructive mb-4">Kunne ikke hente spørgsmål</p>
        <Button onClick={() => window.location.reload()}>Prøv igen</Button>
      </div>
    );
  }

  // No questions available
  if (totalQuestions === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-lg font-medium mb-2">Ingen spørgsmål tilgængelige</p>
        <p className="text-muted-foreground mb-4">Der er endnu ikke opsat spørgsmål for dine enheder.</p>
        <Button onClick={() => navigate('/dashboard')}>Tilbage til dashboard</Button>
      </div>
    );
  }

  // Results screen
  if (isComplete && results.length > 0) {
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
    const scoreColor = avgScore >= 80 ? 'text-success' : avgScore >= 50 ? 'text-warning' : 'text-destructive';
    const hasRecommendations = aiRecommendations.length > 0;
    
    return (
      <div className="max-w-lg mx-auto">
        <DeviceStepper devices={ownedDevices} currentIndex={ownedDevices.length} isComplete={true} />
        
        {/* Score card */}
        <div className="card-elevated p-6 text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${scoreColor}`}>{avgScore}/100</h1>
          <p className="text-muted-foreground">
            {avgScore >= 80 ? 'Dine enheder er i god stand!' :
             avgScore >= 50 ? 'Der er nogle ting, du kan forbedre' :
             'Der er flere ting, der kræver opmærksomhed'}
          </p>
        </div>
        
        {/* Per-device results */}
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
        
        {/* AI Recommendations */}
        {isLoadingAI ? (
          <div className="card-elevated p-5 mb-6 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Genererer anbefalinger...</span>
          </div>
        ) : hasRecommendations ? (
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
                      <p className="font-medium mb-1">{rec.title}</p>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
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
        )}
        
        {/* Actions */}
        <div className="space-y-3">
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

  // No current question (edge case)
  if (!currentQuestion) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-lg font-medium mb-4">Ingen spørgsmål fundet</p>
        <Button onClick={() => navigate('/dashboard')}>Tilbage til dashboard</Button>
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
          {currentQuestion.text}
        </h2>
        
        {/* Help button - only show if help data exists */}
        {currentQuestion.helpData && currentQuestion.helpData.steps.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpModalOpen(true)}
            className="mb-6 text-primary hover:text-primary/80"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Vis mig hvor
          </Button>
        )}
        
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
      {currentQuestion.helpData && (
        <CheckinHelpModal
          open={helpModalOpen}
          onOpenChange={setHelpModalOpen}
          helpData={currentQuestion.helpData}
        />
      )}

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
