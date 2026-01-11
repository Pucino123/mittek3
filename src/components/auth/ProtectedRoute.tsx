import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPlan?: 'basic' | 'plus' | 'pro';
}

// Owner email that can bypass subscription requirements
const OWNER_EMAIL = 'kevin.therkildsen@icloud.com';

export function ProtectedRoute({ children, requiredPlan = 'basic' }: ProtectedRouteProps) {
  const { user, isLoading, hasAccess, isSubscriptionActive } = useAuth();
  const navigate = useNavigate();

  // Check if user is the owner (bypasses subscription requirement)
  const isOwner = user?.email === OWNER_EMAIL;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Redirect to pricing if no active subscription (must complete Stripe checkout)
  // Owner bypasses this check
  useEffect(() => {
    if (!isLoading && user && !isSubscriptionActive && !isOwner) {
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
  }, [user, isLoading, isSubscriptionActive, isOwner, navigate]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Indlæser...</p>
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
