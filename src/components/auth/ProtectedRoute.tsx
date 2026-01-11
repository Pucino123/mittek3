import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPlan?: 'basic' | 'plus' | 'pro';
}

export function ProtectedRoute({ children, requiredPlan = 'basic' }: ProtectedRouteProps) {
  const { user, isLoading, hasAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user && requiredPlan !== 'basic' && !hasAccess(requiredPlan)) {
      // Show toast explaining why they're being redirected
      const planName = requiredPlan === 'plus' ? 'Plus' : 'Pro';
      toast.info(`Denne funktion kræver ${planName}-planen`, {
        description: 'Opgradér dit abonnement for at få adgang.',
        duration: 5000,
      });
      // Redirect to settings subscription section
      navigate('/settings/subscription');
    }
  }, [user, isLoading, requiredPlan, hasAccess, navigate]);

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

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
