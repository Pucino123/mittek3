import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  UserCheck, 
  Loader2, 
  Check, 
  AlertCircle,
  Eye,
  BookOpen,
  KeyRound,
  Handshake
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Normalize token to handle copy/paste issues (newlines, whitespace, encoding)
const normalizeToken = (raw: string | null): string => {
  if (!raw) return '';
  return decodeURIComponent(raw).replace(/\s+/g, '').trim();
};

const HelperInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp, signInWithPassword } = useAuth();
  
  const rawToken = searchParams.get('token');
  const token = normalizeToken(rawToken);
  const showDebug = searchParams.get('debug') === '1';
  
  const [invitation, setInvitation] = useState<any>(null);
  const [inviterName, setInviterName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Auth form state
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Ugyldig invitation - manglende token');
      setIsLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    console.log('Raw token from URL:', rawToken);
    console.log('Normalized token:', token);
    
    // Use security definer function to bypass RLS for anonymous users
    const { data, error: rpcError } = await supabase
      .rpc('verify_invite_token', { token_input: token });

    console.log('RPC verify_invite_token result:', { data, error: rpcError });
    
    // Store debug info
    setDebugInfo({
      rawToken,
      normalizedToken: token,
      rpcResponse: data,
      rpcError,
      responseLength: data?.length ?? 0,
    });

    if (rpcError) {
      console.error('Invitation fetch error:', rpcError);
      setError('Der opstod en fejl ved hentning af invitation');
      setIsLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError('Invitation ikke fundet eller udløbet');
      setIsLoading(false);
      return;
    }

    const invitationData = data[0];

    if (invitationData.invitation_accepted) {
      setError('Denne invitation er allerede accepteret');
      setIsLoading(false);
      return;
    }

    setInvitation(invitationData);
    setInviterName(invitationData.inviter_display_name || 'Ukendt');
    setIsLoading(false);
  };

  const handleAcceptInvitation = async () => {
    if (!user || !token) return;

    setIsAccepting(true);

    try {
      // Use the secure RPC to accept the invitation (bypasses RLS)
      const { data, error: acceptError } = await supabase
        .rpc('accept_invite_token', { token_input: token });

      console.log('accept_invite_token result:', { data, error: acceptError });

      if (acceptError) throw acceptError;

      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.message || 'Kunne ikke acceptere invitation');
      }

      toast.success('Invitation accepteret!', {
        description: 'Du er nu hjælper for ' + inviterName,
      });

      navigate('/helper-dashboard');
    } catch (err: any) {
      console.error('Accept error:', err);
      toast.error(err.message || 'Kunne ikke acceptere invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);

    try {
      if (isLogin) {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast.success('Konto oprettet! Du kan nu acceptere invitationen.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Der opstod en fejl');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Benefits for helpers
  const helperBenefits = [
    {
      icon: Eye,
      title: 'Sikkerhedsoverblik',
      description: 'Se status og sikkerhedstjek for den du hjælper'
    },
    {
      icon: BookOpen,
      title: 'Guides & Hjælp',
      description: 'Adgang til nemme trin-for-trin guides til IT-udfordringer'
    },
    {
      icon: KeyRound,
      title: 'Koder & Adgangskoder',
      description: 'Se og administrer vigtige koder (hvis delt med dig)'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-2">Invitation ugyldig</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/">
              <Button variant="outline" size="lg">Gå til forsiden</Button>
            </Link>
            
            {/* Debug panel */}
            {showDebug && debugInfo && (
              <div className="mt-6 p-4 bg-muted rounded-lg text-left text-xs font-mono overflow-auto break-all">
                <p><strong>Raw token:</strong> "{debugInfo.rawToken}"</p>
                <p><strong>Normalized:</strong> "{debugInfo.normalizedToken}"</p>
                <p><strong>Length:</strong> {debugInfo.normalizedToken?.length}</p>
                <p><strong>RPC rows:</strong> {debugInfo.responseLength}</p>
                {debugInfo.rpcError && (
                  <p className="text-destructive"><strong>Error:</strong> {JSON.stringify(debugInfo.rpcError)}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">MitTek</span>
          </Link>
        </div>
      </header>

      <main className="container py-8 md:py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Hero Card */}
          <Card className="shadow-xl border-0 overflow-hidden">
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 md:p-8 text-center text-primary-foreground">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Handshake className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">Bliv Trusted Helper</h1>
              <p className="text-primary-foreground/90 text-sm md:text-base">
                <strong>{inviterName}</strong> inviterer dig til at hjælpe med IT
              </p>
            </div>

            <CardContent className="p-5 md:p-8">
              {/* Benefits section */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Som hjælper kan du
                </h2>
                <div className="space-y-3">
                  {helperBenefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{benefit.title}</p>
                        <p className="text-xs text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissions granted */}
              <div className="bg-success/5 border border-success/20 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Tilladelser du får
                </p>
                <ul className="space-y-2 text-sm">
                  {invitation?.can_view_dashboard && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      Se deres oversigt
                    </li>
                  )}
                  {invitation?.can_view_checkins && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      Se deres tjek-resultater
                    </li>
                  )}
                  {invitation?.can_view_tickets && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      Se deres support-sager
                    </li>
                  )}
                  {invitation?.can_view_vault && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      Adgang til delte koder
                    </li>
                  )}
                  {invitation?.can_view_notes && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      Læse deres noter
                    </li>
                  )}
                </ul>
              </div>

              {user ? (
                // User is logged in - show accept button
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full text-base py-6"
                  onClick={handleAcceptInvitation}
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Accepterer...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-5 w-5" />
                      Accepter invitation
                    </>
                  )}
                </Button>
              ) : (
                // User not logged in - show auth form
                <div>
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      {isLogin ? 'Log ind for at acceptere invitationen' : 'Opret en konto for at komme i gang'}
                    </p>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Dit navn</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="F.eks. Søren"
                          required={!isLogin}
                          className="h-12"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="din@email.dk"
                        required
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Adgangskode</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-12"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full text-base py-6"
                      disabled={isAuthLoading}
                    >
                      {isAuthLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : isLogin ? (
                        'Log ind og accepter'
                      ) : (
                        'Opret konto og accepter'
                      )}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">eller</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full py-3 text-sm text-primary hover:underline font-medium"
                  >
                    {isLogin ? 'Har du ikke en konto? Opret en' : 'Har du allerede en konto? Log ind'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground mt-6 px-4">
            Ved at acceptere invitationen accepterer du vores{' '}
            <Link to="/privacy" className="underline hover:text-foreground">privatlivspolitik</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default HelperInvite;
