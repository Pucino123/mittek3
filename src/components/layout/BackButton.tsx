import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { saveScrollPosition } from '@/hooks/useScrollRestoration';

interface BackButtonProps {
  fallbackPath?: string;
}

// Track navigation history within the app
const navigationStack: string[] = [];

export function BackButton({ fallbackPath = '/dashboard' }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Add current path to navigation stack if it's not already the last item
    const currentPath = location.pathname + location.search + location.hash;
    if (navigationStack[navigationStack.length - 1] !== currentPath) {
      navigationStack.push(currentPath);
    }
    
    // Can go back if we have more than 1 item in our stack
    setCanGoBack(navigationStack.length > 1);
    
    // Note: scroll restoration happens via useScrollRestoration on the destination page
  }, [location]);

  const handleBack = () => {
    // Save current scroll position before navigating
    saveScrollPosition(location.pathname + location.search + location.hash);
    
    // For subscription page, always go back to settings
    if (location.pathname === '/settings/subscription') {
      navigate('/settings');
      return;
    }

    // Check if we came from within the app (referrer check)
    const referrer = document.referrer;
    const isInternalReferrer = referrer && referrer.includes(window.location.origin);
    
    // Use our navigation stack to determine if we can go back
    if (navigationStack.length > 1) {
      // Remove current page from stack
      navigationStack.pop();
      // Navigate to previous page
      const previousPath = navigationStack[navigationStack.length - 1];
      
      if (previousPath) {
        // Remove the previous page too (as we're navigating there)
        navigationStack.pop();
        navigate(previousPath);
        return;
      }
    }
    
    // Try browser history if we have internal referrer
    if (isInternalReferrer && window.history.length > 1) {
      navigate(-1);
      return;
    }
    
    // Fallback to dashboard
    navigate(fallbackPath);
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-primary font-medium hover:opacity-80 transition-opacity min-w-[44px] min-h-[44px] -ml-2 pl-2"
      aria-label="Tilbage"
    >
      <ChevronLeft className="h-6 w-6" />
      <span className="text-base md:text-lg">Tilbage</span>
    </button>
  );
}
