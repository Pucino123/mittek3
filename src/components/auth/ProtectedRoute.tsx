import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
      navigate('/pricing');
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
