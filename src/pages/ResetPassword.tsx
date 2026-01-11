import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowRight, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Extract code from URL query params
  const code = useMemo(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("code");
  }, []);

  // Extract tokens from URL hash (e.g., #access_token=...&type=recovery)
  const hashParams = useMemo(() => {
    const hash = window.location.hash.substring(1); // Remove leading #
    const params = new URLSearchParams(hash);
    return {
      accessToken: params.get("access_token"),
      refreshToken: params.get("refresh_token"),
      type: params.get("type"),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setIsExchanging(true);
        setError(null);

        // Method 1: Handle ?code= parameter (PKCE flow)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const errorMsg = error.message.toLowerCase();
            if (
              errorMsg.includes('expired') || 
              errorMsg.includes('invalid') || 
              errorMsg.includes('otp') ||
              errorMsg.includes('code')
            ) {
              setLinkExpired(true);
            } else {
              throw error;
            }
          }
          return;
        }

        // Method 2: Handle #access_token hash (implicit flow / recovery)
        if (hashParams.accessToken && hashParams.type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: hashParams.accessToken,
            refresh_token: hashParams.refreshToken || '',
          });
          if (error) {
            const errorMsg = error.message.toLowerCase();
            if (
              errorMsg.includes('expired') || 
              errorMsg.includes('invalid') || 
              errorMsg.includes('token')
            ) {
              setLinkExpired(true);
            } else {
              throw error;
            }
          }
          // Clear the hash from URL for security
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }

        // No code or hash found - link is invalid/missing
        setLinkExpired(true);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Kunne ikke starte nulstilling af adgangskode.");
        }
      } finally {
        if (!cancelled) setIsExchanging(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [code, hashParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Adgangskoden skal være mindst ${MIN_PASSWORD_LENGTH} tegn.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Adgangskoderne matcher ikke.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('expired') || errorMsg.includes('session')) {
          setLinkExpired(true);
          return;
        }
        throw error;
      }

      setSuccess(true);
      toast({
        title: "Adgangskode opdateret",
        description: "Du kan nu logge ind med din nye adgangskode.",
      });
    } catch (e: any) {
      setError(e?.message ?? "Kunne ikke opdatere adgangskoden.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate('/login', { state: { showForgotPassword: true } });
  };

  // Expired/Invalid link view
  if (linkExpired) {
    return (
      <PublicLayout>
        <div className="min-h-[70vh] flex items-center justify-center py-8 md:py-12 px-4">
          <div className="card-elevated max-w-md w-full p-6 md:p-8">
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
                <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-destructive" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Linket er udløbet</h1>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
                Dit nulstillingslink er ikke længere gyldigt. Links udløber efter 1 time af sikkerhedsmæssige årsager.
              </p>
              <Button 
                variant="hero"
                size="lg"
                className="w-full min-h-[48px] md:min-h-[52px] mb-3"
                onClick={handleRequestNewLink}
              >
                <RefreshCw className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Send nyt link
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="w-full min-h-[48px] md:min-h-[52px]"
                onClick={() => navigate('/login')}
              >
                Tilbage til log ind
              </Button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-[70vh] flex items-center justify-center py-8 md:py-12 px-4">
        <div className="card-elevated max-w-md w-full p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Lock className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Vælg ny adgangskode</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Indtast en ny adgangskode til din konto.
            </p>
          </div>

          {error && (
            <div className="mb-5 md:mb-6 p-3 md:p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-2 md:gap-3">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
                <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-bold mb-2">Dit kodeord er nu ændret!</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
                Du kan nu logge ind med din nye adgangskode.
              </p>
              <Button 
                variant="hero"
                size="lg"
                className="w-full min-h-[52px] md:min-h-[56px] text-base md:text-lg"
                onClick={() => navigate("/login")}
              >
                Log ind nu
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm md:text-base">Ny adgangskode</Label>
                <PasswordInput
                  id="new-password"
                  placeholder="Mindst 6 tegn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 md:h-14 text-base"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  disabled={isExchanging}
                />
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm md:text-base">Gentag adgangskode</Label>
                <PasswordInput
                  id="confirm-password"
                  placeholder="Gentag adgangskode"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 md:h-14 text-base"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  disabled={isExchanging}
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full min-h-[48px] md:min-h-[52px]"
                disabled={isLoading || isExchanging}
              >
                {isExchanging ? "Åbner link..." : isLoading ? "Opdaterer..." : "Gem ny adgangskode"}
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full min-h-[48px] md:min-h-[52px]"
                onClick={() => navigate("/login")}
              >
                Tilbage til log ind
              </Button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
