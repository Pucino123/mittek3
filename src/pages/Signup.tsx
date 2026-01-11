import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle, CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/seo/SEOHead';
import { trackSignup } from '@/utils/analytics';

// Allowed email that can sign up without selecting a plan first
const ALLOWED_DIRECT_SIGNUP_EMAIL = 'kevin.therkildsen@icloud.com';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPlanSelected, setHasPlanSelected] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: string } | null>(null);
  
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Plan details for display
  const planDetails: Record<string, { name: string; price: string }> = {
    plus: { name: 'Plus', price: '79' },
    pro: { name: 'Pro', price: '99' },
  };

  // Check if user has selected a plan (via URL param from pricing page)
  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan && ['plus', 'pro'].includes(plan)) {
      setHasPlanSelected(true);
      setSelectedPlan({ id: plan, ...planDetails[plan] });
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Check if user needs to select a plan first (except for allowed email)
    const isAllowedEmail = email.toLowerCase() === ALLOWED_DIRECT_SIGNUP_EMAIL.toLowerCase();
    if (!hasPlanSelected && !isAllowedEmail) {
      setError('Du skal vælge en betalingsplan før du kan oprette en konto.');
      setIsLoading(false);
      // Redirect to pricing with signup intent
      setTimeout(() => {
        navigate('/pricing?signup=true');
      }, 2000);
      return;
    }

    if (!acceptedTerms) {
      setError('Du skal acceptere vilkår og betingelser for at oprette en konto.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn.');
      setIsLoading(false);
      return;
    }
    
    const { error } = await signUp(email, password, displayName);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Denne email er allerede registreret. Prøv at logge ind i stedet.');
      } else {
        setError(error.message);
      }
      toast({
        title: 'Fejl ved oprettelse',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      trackSignup('email');
      toast({
        title: 'Konto oprettet!',
        description: 'Du er nu logget ind.',
      });
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Opret konto - MitTek"
        description="Opret din gratis MitTek konto og få adgang til IT-hjælp, guides og værktøjer til din iPhone, iPad og Mac."
        canonical="https://www.mittek.dk/signup"
        noindex={true}
      />
      <div className="min-h-[70vh] flex items-center justify-center py-8 md:py-12 px-4">
        <div className="card-elevated max-w-md w-full p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Shield className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Opret din konto</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Kom i gang med MitTek på få sekunder
            </p>
          </div>

          {/* Plan selection info box */}
          {!hasPlanSelected && (
            <div className="mb-5 md:mb-6 p-3 md:p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Vælg en plan først
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Start med 14 dages gratis prøveperiode. Derefter fortsætter betalingen automatisk.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/pricing?signup=true')}
                    className="h-8"
                  >
                    Se planer og priser
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Plan selected confirmation */}
          {hasPlanSelected && selectedPlan && (
            <div className="mb-5 md:mb-6 p-3 md:p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-success">
                      {selectedPlan.name}-plan valgt
                    </p>
                    <span className="text-xs font-semibold bg-success/20 text-success px-2 py-0.5 rounded-full">
                      {selectedPlan.price} kr./md
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    14 dages gratis prøve, derefter betales automatisk.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/pricing?signup=true')}
                    className="h-6 px-0 text-xs text-muted-foreground hover:text-foreground mt-1"
                  >
                    Skift plan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 md:mb-6 p-3 md:p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-2 md:gap-3">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm md:text-base">Dit navn</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Karen Jensen"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-9 md:pl-10 h-12 md:h-14 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.dk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 md:pl-10 h-12 md:h-14 text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm md:text-base">Adgangskode</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground z-10" />
                <PasswordInput
                  id="password"
                  placeholder="Mindst 6 tegn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 md:pl-10 h-12 md:h-14 text-base"
                  required
                  minLength={6}
                />
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-1"
              />
              <Label 
                htmlFor="terms" 
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                Jeg accepterer MitTeks{' '}
                <Link 
                  to="/terms" 
                  className="text-primary hover:underline"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                >
                  vilkår og betingelser
                </Link>
                {' '}og{' '}
                <Link 
                  to="/privacy" 
                  className="text-primary hover:underline"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                >
                  privatlivspolitik
                </Link>
              </Label>
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full min-h-[48px] md:min-h-[52px]"
              disabled={isLoading || !acceptedTerms}
            >
              {isLoading ? 'Opretter konto...' : 'Opret konto'}
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-border text-center">
            <p className="text-sm md:text-base text-muted-foreground">
              Har du allerede en konto?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Log ind
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Signup;
