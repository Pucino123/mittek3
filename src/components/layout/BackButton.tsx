import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackPath?: string;
}

/**
 * BackButton - ALWAYS navigates to /dashboard (or fallbackPath)
 * This ensures a consistent, safe exit path for users.
 * NO history.back() - we want deterministic navigation.
 */
export function BackButton({ fallbackPath = '/dashboard' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Always navigate to the fallback path (dashboard by default)
    // This is intentional - we want consistent navigation, not unpredictable history.back()
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
