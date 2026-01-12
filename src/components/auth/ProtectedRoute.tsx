import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPlan?: 'basic' | 'plus' | 'pro';
}

// Owner email that can bypass subscription requirements
const OWNER_EMAIL = 'kevin.therkildsen@icloud.com';

// Polling configuration
const MAX_POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 1500;

export function ProtectedRoute({ children, requiredPlan = 'basic' }: ProtectedRouteProps) {
  const { user, isLoading, hasAccess, isSubscriptionActive, subscription, refetchSubscription } = useAuth();
  const navigate = useNavigate();
  const [isVerifyingSubscription, setIsVerifyingSubscription] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  // Check if user is the owner (bypasses subscription requirement)
  const isOwner = user?.email === OWNER_EMAIL;

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Verify subscription with server-side fallback
  useEffect(() => {
    const verifySubscription = async () => {
      // Skip if owner, already active, still loading, or no user
      if (isOwner || isSubscriptionActive || isLoading || !user || verificationComplete) {
        setVerificationComplete(true);
        return;
      }

      // If no subscription found locally, poll the server before blocking
      setIsVerifyingSubscription(true);
      console.log('No local subscription found, polling server...');
      
      const hasServerSubscription = await pollForSubscription(user.id);
      
      if (hasServerSubscription) {
        console.log('Found subscription via server poll');
        await refetchSubscription();
        setIsVerifyingSubscription(false);
        setVerificationComplete(true);
        return;
      }
      
      setIsVerifyingSubscription(false);
      setVerificationComplete(true);
    };

    if (!isLoading && user) {
      verifySubscription();
    }
  }, [user, isLoading, isSubscriptionActive, isOwner, pollForSubscription, verificationComplete]);

  // Redirect to pricing if no active subscription (after verification complete)
  useEffect(() => {
    if (!isLoading && user && !isSubscriptionActive && !isOwner && verificationComplete && !isVerifyingSubscription) {
      toast.info('Du skal have et aktivt abonnement for at fortsætte', {
        description: 'Start din 14 dages gratis prøve ved at vælge en plan.',
        duration: 6000,
        action: {
          label: 'Vælg plan',
          onClick: () => navigate('/pricing?signup=true'),
        },
      });
      navigate('/pricing?signup=true');
    }
  }, [user, isLoading, isSubscriptionActive, isOwner, verificationComplete, isVerifyingSubscription, navigate]);

  // Redirect to pricing if plan tier too low (for Plus/Pro features)
  // Owner bypasses this check
  useEffect(() => {
    if (!isLoading && user && !isOwner && isSubscriptionActive && !hasAccess(requiredPlan)) {
      const planName = requiredPlan === 'plus' ? 'Plus' : 'Pro';
      toast.info(`Denne funktion kræver ${planName}-planen`, {
        description: 'Opgradér dit abonnement for at få adgang.',
        duration: 6000,
        action: {
          label: 'Opgradér nu',
          onClick: () => navigate('/pricing'),
        },
      });
      navigate('/pricing');
    }
  }, [user, isLoading, isSubscriptionActive, isOwner, requiredPlan, hasAccess, navigate]);

  if (isLoading || isVerifyingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isVerifyingSubscription ? 'Verificerer abonnement...' : 'Indlæser...'}
          </p>
        </div>
      </div>
    );
  }

  // Allow access if user is owner OR has active subscription
  if (!user || (!isSubscriptionActive && !isOwner)) {
    return null;
  }

  return <>{children}</>;
}
