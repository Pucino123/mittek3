import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Search, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FinishSignup = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { user, signUp, signInWithMagicLink } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [foundSessionId, setFoundSessionId] = useState<string | null>(null);
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // If user is logged in and we have a session ID, try to claim it
  useEffect(() => {
    if (user && (sessionId || foundSessionId)) {
      claimSubscription(sessionId || foundSessionId!);
    }
  }, [user, sessionId, foundSessionId]);

  const claimSubscription = async (claimSessionId: string) => {
    setIsClaiming(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('claim-subscription', {
        body: { sessionId: claimSessionId },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast.success('Din betaling er bekræftet! Velkommen til MitTek.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Kunne ikke aktivere dit abonnement. Prøv igen.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const { error } = await signUp(email, password);
    
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
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
    const { error } = await signInWithMagicLink(email);
    
    if (error) {
      toast.error(error.message);
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

  // If claiming is in progress
  if (isClaiming) {
    return (
      <PublicLayout>
        <div className="container py-16 md:py-24">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Aktiverer dit abonnement...</CardTitle>
              <CardDescription className="text-lg">
                Vent venligst mens vi sætter alt op for dig.
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
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@email.dk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 text-lg"
                  />
                </div>

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
                  disabled={isLoading}
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">eller</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleMagicLink}
                  disabled={isLoading || !email}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Få login-link på email
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
