import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { initGA4 } from '@/utils/analytics';
import { initWebVitals } from '@/utils/webVitals';

const COOKIE_CONSENT_KEY = 'cookie-consent';

type ConsentStatus = 'accepted' | 'declined' | null;

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;
    if (!consent) {
      // Small delay for smoother UX
      const timer = setTimeout(() => {
        setShowBanner(true);
        setTimeout(() => setIsVisible(true), 50);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
    
    // Initialize GA4 and Web Vitals tracking after consent
    initGA4();
    initWebVitals();
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 max-w-[320px] relative">
        {/* Close button */}
        <button
          onClick={handleDecline}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Luk"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 pr-4">
            <h3 className="font-semibold text-foreground text-sm mb-1">Cookies 🍪</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vi bruger cookies for at forbedre din oplevelse.{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Læs mere
              </Link>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            className="flex-1 h-9 text-xs"
          >
            Kun nødvendige
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="flex-1 h-9 text-xs"
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}

// Utility function to check if user has consented to cookies
export function hasConsentedToCookies(): boolean {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
}

// Utility function to check consent status
export function getCookieConsent(): ConsentStatus {
  return localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;
}

// Utility function to reset consent (for settings page)
export function resetCookieConsent(): void {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
}
