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

const HelperInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp, signInWithPassword } = useAuth();
  
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<any>(null);
  const [inviterName, setInviterName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auth form state
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Ugyldig invitation');
      setIsLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    const { data, error } = await supabase
      .from('trusted_helpers')
      .select('*')
      .eq('invitation_token', token)
      .maybeSingle();

    if (error || !data) {
      setError('Invitation ikke fundet eller udløbet');
      setIsLoading(false);
      return;
    }

    if (data.invitation_accepted) {
      setError('Denne invitation er allerede accepteret');
      setIsLoading(false);
      return;
    }

    setInvitation(data);

    // Get inviter's name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', data.user_id)
      .maybeSingle();

    if (profile) {
      setInviterName(profile.display_name || profile.email || 'Ukendt');
    }

    setIsLoading(false);
  };

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return;

    setIsAccepting(true);

    try {
      const { error } = await supabase
        .from('trusted_helpers')
        .update({
          helper_user_id: user.id,
          invitation_accepted: true,
          invitation_token: null, // Clear token after use
        })
        .eq('id', invitation.id);

      if (error) throw error;

      toast.success('Invitation accepteret!', {
        description: 'Du er nu hjælper for ' + inviterName,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Accept error:', error);
      toast.error('Kunne ikke acceptere invitation');
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
