import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Shield, Mail, Lock, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/seo/SEOHead';
import { trackLogin } from '@/utils/analytics';

const Login = () => {
  const [authMethod, setAuthMethod] = useState<'password' | 'forgot-password'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signInWithMagicLink, signInWithPassword, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation state from ResetPassword page
  useEffect(() => {
    if (location.state?.showForgotPassword) {
      setAuthMethod('forgot-password');
      // Clear the state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const { error } = await signInWithMagicLink(email);
    
    if (error) {
      setError(error.message);
      toast({
        title: 'Fejl',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMagicLinkSent(true);
      trackLogin('magic_link');
    }
    
    setIsLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const { error } = await signInWithPassword(email, password, rememberMe);
    
    if (error) {
      setError(error.message);
      toast({
        title: 'Fejl ved log ind',
        description: 'Forkert email eller adgangskode.',
        variant: 'destructive',
      });
    } else {
      trackLogin('password');
      toast({
        title: 'Velkommen tilbage!',
        description: 'Du er nu logget ind.',
      });
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const { error } = await resetPassword(email);
    
    if (error) {
      setError(error.message);
      toast({
        title: 'Fejl',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: 'Email sendt',
        description: 'Tjek din email for at nulstille din adgangskode.',
      });
    }
    
    setIsLoading(false);
  };

  if (resetEmailSent) {
    return (
      <PublicLayout>
        <div className="min-h-[70vh] flex items-center justify-center py-8 md:py-12 px-4">
          <div className="card-elevated max-w-md w-full p-6 md:p-8 text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <CheckCircle className="h-7 w-7 md:h-8 md:w-8 text-success" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Tjek din email</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
              Vi har sendt et link til <strong className="break-all">{email}</strong> hvor du kan nulstille din adgangskode.
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
              Kan du ikke finde mailen? Tjek din spam-mappe.
            </p>
            <Button 
              variant="outline" 
              className="w-full min-h-[48px]"
              onClick={() => {
                setResetEmailSent(false);
                setAuthMethod('password');
              }}
            >
              Tilbage til log ind
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (magicLinkSent) {
    return (
      <PublicLayout>
        <div className="min-h-[70vh] flex items-center justify-center py-8 md:py-12 px-4">
          <div className="card-elevated max-w-md w-full p-6 md:p-8 text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <CheckCircle className="h-7 w-7 md:h-8 md:w-8 text-success" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Tjek din email</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
              Vi har sendt et log-ind link til <strong className="break-all">{email}</strong>.
              Klik på linket i mailen for at logge ind.
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
              Kan du ikke finde mailen? Tjek din spam-mappe.
            </p>
            <Button 
              variant="outline" 
              className="w-full min-h-[48px]"
              onClick={() => setMagicLinkSent(false)}
            >
              Prøv igen med en anden email
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead
        title="Log ind - MitTek"
        description="Log ind på din MitTek konto og få adgang til IT-hjælp, guides og værktøjer til din iPhone, iPad og Mac."
        canonical="https://www.mittek.dk/login"
        noindex={true}
      />
      <div className="min-h-[70vh] flex items-center justify-center py-8 md:py-12 px-4">
        <div className="card-elevated max-w-md w-full p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Shield className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Velkommen tilbage</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Log ind på din MitTek konto
            </p>
          </div>

          {error && (
            <div className="mb-5 md:mb-6 p-3 md:p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-2 md:gap-3">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm">{error}</p>
            </div>
          )}

          {authMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email-password" className="text-sm md:text-base">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  <Input
                    id="email-password"
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm md:text-base">Adgangskode</Label>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('forgot-password')}
                    className="text-xs md:text-sm text-primary hover:underline min-h-0"
                  >
                    Glemt kode?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground z-10" />
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 md:pl-10 h-12 md:h-14 text-base"
                    required
                  />
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label 
                  htmlFor="remember-me" 
                  className="text-sm font-medium cursor-pointer text-muted-foreground"
                >
                  Husk mig på denne enhed
                </Label>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full min-h-[48px] md:min-h-[52px]"
                disabled={isLoading}
              >
                {isLoading ? 'Logger ind...' : 'Log ind'}
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>

            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5 md:space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold mb-2">Nulstil adgangskode</h2>
                <p className="text-sm text-muted-foreground">
                  Indtast din email, så sender vi dig et link til at nulstille din adgangskode.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-reset" className="text-sm md:text-base">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  <Input
                    id="email-reset"
                    type="email"
                    placeholder="din@email.dk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 md:pl-10 h-12 md:h-14 text-base"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full min-h-[48px] md:min-h-[52px]"
                disabled={isLoading}
              >
                {isLoading ? 'Sender...' : 'Send nulstillingslink'}
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full min-h-[48px] md:min-h-[52px]"
                onClick={() => setAuthMethod('password')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbage til log ind
              </Button>
            </form>
          )}

          {/* Footer links */}
          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-border text-center">
            <p className="text-sm md:text-base text-muted-foreground">
              Har du ikke en konto?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Opret konto
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;