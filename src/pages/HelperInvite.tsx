import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  UserCheck, 
  Loader2, 
  Check, 
  AlertCircle 
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card-elevated p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invitation ugyldig</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/">
            <Button variant="outline">Gå til forsiden</Button>
          </Link>
          
          {/* Debug panel */}
          {showDebug && debugInfo && (
            <div className="mt-6 p-4 bg-muted rounded-lg text-left text-xs font-mono overflow-auto">
              <p><strong>Raw token:</strong> "{debugInfo.rawToken}"</p>
              <p><strong>Normalized:</strong> "{debugInfo.normalizedToken}"</p>
              <p><strong>Length:</strong> {debugInfo.normalizedToken?.length}</p>
              <p><strong>RPC rows:</strong> {debugInfo.responseLength}</p>
              {debugInfo.rpcError && (
                <p className="text-destructive"><strong>Error:</strong> {JSON.stringify(debugInfo.rpcError)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold">MitTek</span>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-md mx-auto">
          <div className="card-elevated p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UserCheck className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Hjælper-invitation</h1>
            <p className="text-lg text-muted-foreground mb-6">
              <strong>{inviterName}</strong> vil gerne have dig som Trusted Helper
            </p>

            {/* Show permissions */}
            <div className="bg-muted rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium mb-3">Du vil kunne:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {invitation?.can_view_dashboard && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Se deres oversigt
                  </li>
                )}
                {invitation?.can_view_checkins && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Se deres tjek-resultater
                  </li>
                )}
                {invitation?.can_view_tickets && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Se deres support-sager
                  </li>
                )}
              </ul>
            </div>

            {user ? (
              // User is logged in - show accept button
              <Button
                variant="hero"
                size="lg"
                className="w-full"
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
                    <Check className="mr-2 h-5 w-5" />
                    Accepter invitation
                  </>
                )}
              </Button>
            ) : (
              // User not logged in - show auth form
              <div className="text-left">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  {isLogin ? 'Log ind for at acceptere' : 'Opret en konto for at acceptere'}
                </p>

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
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isAuthLoading}
                  >
                    {isAuthLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : isLogin ? (
                      'Log ind'
                    ) : (
                      'Opret konto'
                    )}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="w-full mt-4 text-sm text-primary hover:underline"
                >
                  {isLogin ? 'Har du ikke en konto? Opret en' : 'Har du allerede en konto? Log ind'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelperInvite;
