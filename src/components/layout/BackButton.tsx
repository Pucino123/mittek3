import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackPath?: string;
}

export function BackButton({ fallbackPath = '/dashboard' }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // For subscription page, always go back to settings
    if (location.pathname === '/settings/subscription') {
      navigate('/settings');
      return;
    }
    
    // Check if we have browser history to go back to
    // window.history.length > 2 means we have actual navigation history
    // (1 is initial, 2 is current page)
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback to dashboard if no history
      navigate(fallbackPath);
    }
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
