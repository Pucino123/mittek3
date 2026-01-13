import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Search, Mail, AlertTriangle, LifeBuoy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 1500;

const FinishSignup = () => {
  // Ensure page loads at the top
  useScrollRestoration();
  
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { user, signUp, signInWithMagicLink } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [foundSessionId, setFoundSessionId] = useState<string | null>(null);
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isEmailLocked, setIsEmailLocked] = useState(false);

  useEffect(() => {
    const fetchSessionEmail = async () => {
      if (!sessionId) return;
      
      setIsLoadingEmail(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-session-email', {
          body: { sessionId },
        });

        if (error) {
          console.error('Error fetching session email:', error);
          return;
        }

        if (data?.found && data?.email) {
          setEmail(data.email);
          setIsEmailLocked(true);
          if (data.planTier) {
            setPlanTier(data.planTier);
          }
          console.log('Auto-filled email from session:', data.email);
        }
      } catch (error) {
        console.error('Error fetching session email:', error);
      } finally {
        setIsLoadingEmail(false);
      }
    };

    fetchSessionEmail();
  }, [sessionId]);

  // Poll for subscription to handle webhook race condition
  const pollForSubscription = useCallback(async (userId: string, attempts = 0): Promise<boolean> => {
    if (attempts >= MAX_POLL_ATTEMPTS) {
      return false;
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (data) {
      return true;
    }

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    return pollForSubscription(userId, attempts + 1);
  }, []);

  // Track if we've already attempted to claim to prevent loops
  const [hasAttemptedClaim, setHasAttemptedClaim] = useState(false);

  // If user is logged in and we have a session ID, try to claim it (only once)
  useEffect(() => {
    const effectiveSessionId = sessionId || foundSessionId;
    if (user && effectiveSessionId && !hasAttemptedClaim && !isClaiming && !isFinalizing) {
      setHasAttemptedClaim(true);
      claimSubscription(effectiveSessionId);
    }
  }, [user, sessionId, foundSessionId, hasAttemptedClaim, isClaiming, isFinalizing]);

  const claimSubscription = async (claimSessionId: string) => {
    if (!user) return;
    
    setIsClaiming(true);
    setHasFailed(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('claim-subscription', {
        body: { sessionId: claimSessionId },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) {
        // If claim fails, check if subscription already exists (webhook beat us)
        console.log('Claim failed, checking if webhook already processed...', error);
        setIsFinalizing(true);
        const hasSubscription = await pollForSubscription(user.id);
        
        if (hasSubscription) {
          toast.success('Din betaling er bekræftet! Velkommen til MitTek.');
          navigate('/dashboard');
          return;
        }
        
        throw error;
      }

      toast.success('Din betaling er bekræftet! Velkommen til MitTek.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Claim error:', error);
      
      // Final fallback: poll for subscription in case webhook processed it
      setIsFinalizing(true);
      const hasSubscription = await pollForSubscription(user.id);
      
      if (hasSubscription) {
        toast.success('Din konto er klar! Velkommen til MitTek.');
        navigate('/dashboard');
      } else {
        toast.error('Kunne ikke aktivere dit abonnement. Kontakt support hvis problemet fortsætter.');
        setIsFinalizing(false);
        setHasFailed(true);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setHasFailed(false);
    const { error } = await signUp(email, password);
    
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      setHasFailed(true);
    } else {
      setSignupSuccess(true);
      // The useEffect will handle claiming when user is set
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error('Indtast din email');
      return;
    }

    setIsLoading(true);
    setHasFailed(false);
    const { error } = await signInWithMagicLink(email);
    
    if (error) {
      toast.error(error.message);
      setHasFailed(true);
    } else {
      toast.success('Vi har sendt et login-link til din email!');
      setSignupSuccess(true);
    }
    setIsLoading(false);
  };

  const handleRecovery = async () => {
    if (!recoveryEmail) {
      toast.error('Indtast den email du betalte med');
      return;
    }

    setIsRecovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-pending', {
        body: { email: recoveryEmail },
      });

      if (error) throw error;

      if (data.found) {
        setFoundSessionId(data.sessionId);
        setPlanTier(data.planTier);
        setShowRecovery(false);
        toast.success(`Vi fandt din ${data.planTier.toUpperCase()} betaling! Opret nu din konto.`);
      } else {
        toast.error('Vi kunne ikke finde en betaling med denne email.');
      }
    } catch (error) {
      console.error('Recovery error:', error);
      toast.error('Der opstod en fejl. Prøv igen.');
    } finally {
      setIsRecovering(false);
    }
  };

  const supportMailtoLink = `mailto:mittek@webilax.com?subject=${encodeURIComponent('Fejl ved oprettelse af konto')}&body=${encodeURIComponent(`Hej MitTek Support,\n\nJeg har oplevet en fejl under oprettelsen af min konto.\n\nEmail brugt: ${email}\nSession ID: ${sessionId || foundSessionId || 'Ikke tilgængelig'}\n\nVenlig hilsen`)}`;

  // If we're waiting for user to click magic link
  if (signupSuccess && !user) {
    return (
      <PublicLayout>
        <div className="container py-16 md:py-24">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Tjek din email</CardTitle>
              <CardDescription className="text-lg">
                Vi har sendt dig et link. Klik på det for at aktivere din konto og dit abonnement.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  // If claiming or finalizing is in progress
  if (isClaiming || isFinalizing) {
    return (
      <PublicLayout>
        <div className="container py-16 md:py-24">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">
                {isFinalizing ? 'Færdiggør opsætning...' : 'Aktiverer dit abonnement...'}
              </CardTitle>
              <CardDescription className="text-lg">
                {isFinalizing 
                  ? 'Verificerer din betaling. Dette kan tage et øjeblik.'
                  : 'Vent venligst mens vi sætter alt op for dig.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container py-16 md:py-24">
        <div className="max-w-md mx-auto">
          {/* Success indicator */}
          {(sessionId || foundSessionId) && (
            <div className="mb-6 p-4 bg-success/10 rounded-xl flex items-center gap-3 text-success">
              <CheckCircle className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Din betaling er modtaget!</p>
                <p className="text-sm opacity-90">Opret nu din konto for at komme i gang.</p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Opret din konto</CardTitle>
              <CardDescription className="text-lg">
                Sidste trin - så er du klar til at bruge MitTek
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* CRITICAL WARNING about matching email */}
              {(sessionId || foundSessionId) && (
                <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
                    VIGTIGT: Du skal oprette din konto med præcis samme email, som du lige har brugt til betalingen. Ellers kan vi ikke aktivere din plan.
                  </AlertDescription>
                </Alert>
              )}

              {/* Support fallback on failure */}
              {hasFailed && (
                <Alert className="mb-6 border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <p className="font-medium mb-3">Der opstod en fejl under oprettelsen af din konto.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      <a href={supportMailtoLink}>
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Kontakt Support
                      </a>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="din@email.dk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`h-14 text-lg ${isEmailLocked ? 'bg-muted/50 cursor-not-allowed' : ''}`}
                      disabled={isLoadingEmail}
                      readOnly={isEmailLocked}
                    />
                    {isLoadingEmail && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {isEmailLocked && !isLoadingEmail && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                    )}
                  </div>
                  {isEmailLocked && (
                    <p className="text-xs text-muted-foreground">
                      Denne email stammer fra din betaling og kan ikke ændres.
                    </p>
                  )}
                  {/* Visual confirmation of auto-filled email - positioned ABOVE password field */}
                  {(sessionId || foundSessionId) && email && !isLoadingEmail && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Brug denne email: <strong className="text-foreground">{email}</strong></span>
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Vælg en adgangskode</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 tegn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-14 text-lg"
                  />
                </div>

                <Button 
                  type="submit" 
                  size="xl" 
                  className="w-full"
                  disabled={isLoading || isLoadingEmail}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Opretter konto...
                    </>
                  ) : (
                    'Opret konto'
                  )}
                </Button>
              </form>

              {!sessionId && !foundSessionId && (
                <div className="mt-8 pt-6 border-t">
                  {!showRecovery ? (
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => setShowRecovery(true)}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Har du allerede betalt? Find din betaling
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Indtast den email du brugte ved betaling
                      </p>
                      <Input
                        type="email"
                        placeholder="betalings@email.dk"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="h-12"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowRecovery(false)}
                        >
                          Annuller
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleRecovery}
                          disabled={isRecovering}
                        >
                          {isRecovering ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Find betaling'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default FinishSignup;
