import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Shield, 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  CreditCard,
  Fingerprint,
  HelpCircle,
  CheckCircle,
  ExternalLink,
  Users,
  HeartHandshake,
  BookOpen,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';

const incidentTypes = [
  { id: 'sms', label: 'Mistænkelig SMS', icon: MessageSquare, description: 'Link eller besked du ikke stoler på' },
  { id: 'email', label: 'Mistænkelig Email', icon: Mail, description: 'Phishing eller ukendt afsender' },
  { id: 'call', label: 'Mistænkeligt Opkald', icon: Phone, description: 'Nogen bad om oplysninger' },
  { id: 'popup', label: 'Popup/Advarsel', icon: AlertTriangle, description: 'Skræmmende besked på skærmen' },
  { id: 'bank', label: 'Bank/Betaling', icon: CreditCard, description: 'Uautoriseret transaktion' },
  { id: 'mitid', label: 'MitID Problem', icon: Fingerprint, description: 'Nogen misbruger dit MitID' },
  { id: 'facebook', label: 'Facebook Hacket', icon: Users, description: 'Kontoen sender opslag eller beskeder' },
  { id: 'other', label: 'Andet', icon: HelpCircle, description: 'Noget andet mistænkeligt' },
];

const riskOptions = [
  { id: 'yes', label: 'Ja, der er risiko', emoji: '⚠️' },
  { id: 'no', label: 'Nej, ingen pengerisiko', emoji: '✅' },
  { id: 'unsure', label: 'Jeg er ikke sikker', emoji: '🤔' },
];

const sharedOptions = [
  { id: 'yes', label: 'Ja, jeg klikkede eller gav oplysninger', emoji: '⚠️' },
  { id: 'no', label: 'Nej, jeg klikkede ikke på noget', emoji: '✅' },
  { id: 'unsure', label: 'Jeg er ikke sikker', emoji: '🤔' },
];

const quickActions = [
  { id: 'bank', label: 'Ring til banken', icon: CreditCard, color: 'bg-destructive/10 text-destructive', action: 'bank', helpText: 'Spær dit kort hurtigt' },
  { id: 'police', label: 'Ring til politiet', icon: Shield, color: 'bg-warning/10 text-warning', action: 'tel:114', helpText: 'Ved akut svindel' },
  { id: 'helper', label: 'Ring til hjælper', icon: HeartHandshake, color: 'bg-primary/10 text-primary', action: 'helper', helpText: 'Få hjælp fra en du kender' },
];

interface PanicData {
  incidentType: string;
  moneyRisk: string;
  clickedOrShared: string;
  notifyHelper: boolean;
}

const Panic = () => {
  useScrollRestoration();

  const [currentStep, setCurrentStep] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [data, setData] = useState<PanicData>({
    incidentType: '',
    moneyRisk: '',
    clickedOrShared: '',
    notifyHelper: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionPlan, setActionPlan] = useState<string[] | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<{
    bankPhone: string | null;
    helperPhone: string | null;
    helperName: string | null;
  }>({ bankPhone: null, helperPhone: null, helperName: null });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch emergency contacts from profile
  useEffect(() => {
    const fetchEmergencyContacts = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('emergency_bank_phone, emergency_helper_phone, emergency_helper_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setEmergencyContacts({
          bankPhone: (profile as any).emergency_bank_phone,
          helperPhone: (profile as any).emergency_helper_phone,
          helperName: (profile as any).emergency_helper_name,
        });
      }
    };
    
    fetchEmergencyContacts();
  }, [user]);

  const generateActionPlan = (): string[] => {
    const actions: string[] = [];

    // CRITICAL first action based on money risk
    if (data.moneyRisk === 'yes') {
      actions.push('🚨 RING TIL DIN BANK NU på nummeret bag på dit kort. Fortæl at du muligvis er udsat for svindel. De kan spærre kortet midlertidigt.');
    } else if (data.moneyRisk === 'unsure') {
      actions.push('Tjek din bankkonto NU for ukendte transaktioner. Åbn bankens app eller netbank og se de seneste bevægelser.');
    }

    // Specific actions based on incident type
    switch (data.incidentType) {
      case 'sms':
        actions.push('SLET SMS\'en uden at klikke på links. Blokér afsenderens nummer: Hold fingeren på beskeden → "Blokér kontakt".');
        actions.push('Danske myndigheder og banker sender ALDRIG links via SMS. Gå altid selv til hjemmesiden ved at skrive adressen.');
        break;
      case 'email':
        actions.push('FLYT emailen til spam UDEN at klikke på links eller downloade vedhæftede filer. Klik på de tre prikker → "Markér som spam".');
        actions.push('Tjek afsenderadressen nøje - svindlere bruger ofte adresser der ligner, f.eks. "postnord-dk.com" i stedet for "postnord.dk".');
        break;
      case 'call':
        actions.push('LÆG PÅ med det samme. Banker, politi og myndigheder ringer ALDRIG og beder om NemID/MitID, kortoplysninger eller at overføre penge.');
        actions.push('Hvis de truede med "kontoen lukkes" - ring selv til banken på det officielle nummer (bag på kortet) og verificer.');
        break;
      case 'popup':
        actions.push('LUK POPUP\'EN uden at klikke på knapper inde i den. Brug X\'et i hjørnet eller tryk Alt+F4 (Windows) / Cmd+Q (Mac).');
        actions.push('Ryd browserens cache: Indstillinger → Privatliv → Ryd browserdata. Dette fjerner ondsindede cookies.');
        break;
      case 'bank':
        actions.push('Log ALDRIG ind via links du modtager. Åbn selv bankens app eller skriv bankens adresse direkte i browseren.');
        actions.push('Kontakt banken på det officielle nummer og fortæl præcis hvad der skete. De kan overvåge din konto.');
        break;
      case 'mitid':
        actions.push('Gå STRAKS til mitid.dk (skriv selv adressen) og tjek under "Aktivitet" om der er handlinger du ikke genkender.');
        actions.push('Kontakt MitID support på 72 68 88 88 hvis du har godkendt noget mistænkeligt. De kan spærre midlertidigt.');
        break;
      case 'facebook':
        actions.push('SKIFT ADGANGSKODE NU: Gå til facebook.com → Indstillinger → Sikkerhed og login → Skift adgangskode. Vælg en helt ny adgangskode.');
        actions.push('LOG UD AF ALLE ENHEDER: I samme menu, klik "Se alle" under "Hvor du er logget ind" → "Log ud af alle sessioner".');
        actions.push('SLÅ TO-FAKTOR TIL: Indstillinger → Sikkerhed → To-faktor godkendelse. Brug authenticator-app eller SMS.');
        actions.push('ADVAR DINE VENNER: Skriv et opslag om at din konto blev hacket, så de ikke klikker på links sendt fra dig.');
        break;
      default:
        actions.push('Beskriv hvad der skete til en du stoler på. At tale om det giver ofte klarhed over situationen.');
    }

    // Actions based on clicked/shared
    if (data.clickedOrShared === 'yes') {
      actions.push('SKIFT ADGANGSKODE på din email FØRST (den bruges til at nulstille andre konti). Derefter bank og sociale medier.');
      actions.push('Slå to-faktor verificering til på vigtige konti: Indstillinger → Sikkerhed → To-faktor godkendelse.');
    } else if (data.clickedOrShared === 'unsure') {
      actions.push('Skift forebyggende adgangskode på din email og bank. Brug en ny og unik adgangskode til hver konto.');
    }

    // Always add monitoring advice
    actions.push('Hold øje med din bankkonto de næste 2-4 uger. Svindlere venter ofte før de bruger stjålne oplysninger.');

    return actions.slice(0, 5);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    const plan = generateActionPlan();

    const { error } = await supabase.from('panic_cases').insert({
      user_id: user.id,
      incident_type: data.incidentType,
      money_risk: data.moneyRisk,
      clicked_or_shared: data.clickedOrShared,
      action_plan: plan,
      notify_helper: data.notifyHelper,
    });

    if (error) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke gemme. Prøv igen.',
        variant: 'destructive',
      });
    } else {
      setActionPlan(plan);
    }

    setIsSubmitting(false);
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return data.incidentType !== '';
    if (currentStep === 1) return data.moneyRisk !== '';
    if (currentStep === 2) return data.clickedOrShared !== '';
    return true;
  };

  if (actionPlan) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-success/5">
          <div className="container flex h-16 sm:h-18 items-center px-4">
            <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-lg sm:text-xl font-semibold">MitTek</span>
            </Link>
          </div>
        </header>

        <main className="container py-8 sm:py-12 px-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-success" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Din handlingsplan</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Følg disse trin for at sikre dig</p>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {actionPlan.map((action, index) => (
                <div key={index} className="card-elevated p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-sm sm:text-base">{index + 1}</span>
                  </div>
                  <p className="text-sm sm:text-lg pt-0.5 sm:pt-1">{action}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => window.open('tel:114', '_blank')}
              >
                <Phone className="mr-2 h-5 w-5" />
                Ring til politiet (114)
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>

              <Button variant="hero" size="lg" className="w-full" onClick={() => navigate('/dashboard')}>
                Tilbage til dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-warning/5">
        <div className="container flex h-16 sm:h-18 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-lg sm:text-xl font-semibold">MitTek</span>
          </Link>
          
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            Afbryd
          </Button>
        </div>
      </header>

      <main className="container py-6 sm:py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-warning/10 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-warning" />
              </div>
              <ToolPageHelpButton />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Tryghedsknap</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Du er i sikre hænder. Vi hjælper dig trin for trin.
            </p>
          </div>

          {/* Quick Actions - shown initially */}
          {showQuickActions && currentStep === 0 && (
            <Card className="p-4 sm:p-5 mb-5 sm:mb-6 border-2 border-warning/30 bg-warning/5">
              <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                Hurtig hjælp
              </h3>
              <div className="grid gap-2 sm:gap-3">
                {/* Bank button */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 sm:py-4 bg-destructive/10 text-destructive border-0"
                  onClick={() => {
                    if (emergencyContacts.bankPhone) {
                      window.open(`tel:${emergencyContacts.bankPhone}`, '_blank');
                    } else {
                      toast({ 
                        title: 'Intet banknummer gemt', 
                        description: 'Gå til Indstillinger → Nødkontakter for at gemme din banks nummer' 
                      });
                      navigate('/settings');
                    }
                  }}
                >
                  <CreditCard className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base">Ring til banken</div>
                    <div className="text-xs opacity-70 truncate">
                      {emergencyContacts.bankPhone ? `Ringer til ${emergencyContacts.bankPhone}` : 'Gem nummeret i Indstillinger'}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>

                {/* Police button */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 sm:py-4 bg-warning/10 text-warning border-0"
                  onClick={() => window.open('tel:114', '_blank')}
                >
                  <Shield className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base">Ring til politiet</div>
                    <div className="text-xs opacity-70">Ringer til 114 (svindel-hotline)</div>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>

                {/* Helper button */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 sm:py-4 bg-primary/10 text-primary border-0"
                  onClick={() => {
                    if (emergencyContacts.helperPhone) {
                      window.open(`tel:${emergencyContacts.helperPhone}`, '_blank');
                    } else {
                      toast({ 
                        title: 'Ingen hjælper gemt', 
                        description: 'Gå til Indstillinger → Nødkontakter for at gemme din hjælpers nummer' 
                      });
                      navigate('/settings');
                    }
                  }}
                >
                  <HeartHandshake className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base">
                      Ring til {emergencyContacts.helperName || 'hjælper'}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {emergencyContacts.helperPhone ? `Ringer til ${emergencyContacts.helperPhone}` : 'Gem nummeret i Indstillinger'}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-3 sm:mt-4 text-muted-foreground text-sm"
                onClick={() => setShowQuickActions(false)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Jeg vil hellere have en handlingsplan
              </Button>
            </Card>
          )}

          {/* Step indicator */}
          {!showQuickActions && (
            <>
              <div className="flex gap-2 mb-5 sm:mb-6">
                {[0, 1, 2].map((step) => (
                  <div
                    key={step}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      step <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Questions */}
              <Card className="p-4 sm:p-6 mb-5 sm:mb-6">
                {currentStep === 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Hvad skete der?</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Vælg det der passer bedst</p>
                    <div className="space-y-2 sm:space-y-3">
                      {incidentTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setData({ ...data, incidentType: type.id })}
                          className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 sm:gap-4 ${
                            data.incidentType === type.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${data.incidentType === type.id ? 'bg-primary/10' : 'bg-muted'}`}>
                            <type.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                              data.incidentType === type.id ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base">{type.label}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{type.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Er der risiko for penge?</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Har du givet kortoplysninger eller overført penge?</p>
                    <div className="space-y-2 sm:space-y-3">
                      {riskOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setData({ ...data, moneyRisk: option.id })}
                          className={`w-full p-4 sm:p-5 rounded-xl border-2 text-left text-base sm:text-lg transition-all flex items-center gap-3 ${
                            data.moneyRisk === option.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-xl sm:text-2xl">{option.emoji}</span>
                          <span className="text-sm sm:text-base">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Klikkede du på noget?</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Eller gav du personlige oplysninger?</p>
                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {sharedOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setData({ ...data, clickedOrShared: option.id })}
                          className={`w-full p-4 sm:p-5 rounded-xl border-2 text-left text-base sm:text-lg transition-all flex items-center gap-3 ${
                            data.clickedOrShared === option.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-xl sm:text-2xl">{option.emoji}</span>
                          <span className="text-sm sm:text-base">{option.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg bg-secondary">
                      <Checkbox
                        id="notify-helper"
                        checked={data.notifyHelper}
                        onCheckedChange={(checked) => setData({ ...data, notifyHelper: checked === true })}
                      />
                      <Label htmlFor="notify-helper" className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                        <Users className="h-4 w-4" />
                        Giv min hjælper besked
                      </Label>
                    </div>
                  </div>
                )}
              </Card>

              {/* Navigation */}
              <div className="flex justify-between gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex-1 sm:flex-none"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Tilbage</span>
                </Button>
                
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  {currentStep === 2 ? (
                    isSubmitting ? 'Beregner...' : 'Se handlingsplan'
                  ) : (
                    <>
                      Næste
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      
    </div>
  );
};

export default Panic;
