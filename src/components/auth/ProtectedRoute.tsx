import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPlan?: 'basic' | 'plus' | 'pro';
}

export function ProtectedRoute({ children, requiredPlan = 'basic' }: ProtectedRouteProps) {
  const { user, isLoading, hasAccess, isSubscriptionActive } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Redirect to pricing if no active subscription (must complete Stripe checkout)
  useEffect(() => {
    if (!isLoading && user && !isSubscriptionActive) {
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
  }, [user, isLoading, isSubscriptionActive, navigate]);

  // Redirect to pricing if plan tier too low (for Plus/Pro features)
  useEffect(() => {
    if (!isLoading && user && isSubscriptionActive && !hasAccess(requiredPlan)) {
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
  }, [user, isLoading, isSubscriptionActive, requiredPlan, hasAccess, navigate]);

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

  if (!user || !isSubscriptionActive) {
    return null;
  }

  return <>{children}</>;
}
