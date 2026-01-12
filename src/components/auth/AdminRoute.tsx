import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Strict admin-only route guard.
 * - Checks authentication first
 * - Checks admin authorization via server-validated is_admin RPC
 * - Shows loading spinner while checking (never renders children prematurely)
 * - Redirects non-admins to /dashboard immediately
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Redirect to dashboard if authenticated but not admin
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, isAdmin, navigate]);

  // Show loading spinner while checking auth/admin status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificerer admin-adgang...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or not admin
  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
