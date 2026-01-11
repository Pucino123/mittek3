import { useEffect, useState, useRef } from 'react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Check, Star, Sparkles, BookOpen, Trophy, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const STAMPS_NEEDED = 4;

const StampCard = () => {
  const { loading, achievements } = useUserAchievements();
  const [animatedStamps, setAnimatedStamps] = useState(0);
  const [showStarAnimation, setShowStarAnimation] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const previousGuidesCountRef = useRef<number | null>(null);
  const hasShownCelebrationRef = useRef(false);

  const guidesReadCount = achievements?.guides_read?.length || 0;
  const currentCardStamps = guidesReadCount % STAMPS_NEEDED;
  const completedCards = Math.floor(guidesReadCount / STAMPS_NEEDED);
  const isCardComplete = currentCardStamps === 0 && guidesReadCount > 0;

  // Detect when user just completed a card (goes from 3 to 4 stamps)
  useEffect(() => {
    if (!loading && previousGuidesCountRef.current !== null) {
      const previousCount = previousGuidesCountRef.current;
      const previousCardStamps = previousCount % STAMPS_NEEDED;
      
      // User just filled the 4th stamp
      if (previousCardStamps === 3 && guidesReadCount === previousCount + 1) {
        if (!hasShownCelebrationRef.current) {
          triggerCelebration();
          hasShownCelebrationRef.current = true;
        }
      }
    }
    previousGuidesCountRef.current = guidesReadCount;
  }, [loading, guidesReadCount]);

  const triggerCelebration = () => {
    // Full-screen confetti burst
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      });
    }, 250);

    // Show celebration modal after a brief delay
    setTimeout(() => {
      setShowCelebrationModal(true);
    }, 500);
  };

  // Animate stamps on load
  useEffect(() => {
    if (!loading) {
      const targetStamps = isCardComplete ? STAMPS_NEEDED : currentCardStamps;
      let current = 0;
      const interval = setInterval(() => {
        if (current < targetStamps) {
          current++;
          setAnimatedStamps(current);
        } else {
          clearInterval(interval);
          // Show star animation if card is complete
          if (targetStamps === STAMPS_NEEDED) {
            setShowStarAnimation(true);
          }
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [loading, currentCardStamps, isCardComplete]);

  const getFeedbackMessage = () => {
    if (isCardComplete) {
      return "🌟 Fantastisk! Du har gjort din telefon mere sikker!";
    }
    if (currentCardStamps === 3) {
      return "🎯 Én guide mere - så får du en stjerne!";
    }
    if (guidesReadCount === 0) {
      return "👋 Læs din første guide for at få et stempel!";
    }
    const remaining = STAMPS_NEEDED - currentCardStamps;
    return `💪 ${remaining} guide${remaining > 1 ? 's' : ''} mere til din næste stjerne!`;
  };

  if (loading) {
    return (
      <div className="card-elevated p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  // Determine which stamps to show
  const displayStamps = isCardComplete ? STAMPS_NEEDED : currentCardStamps;

  return (
    <>
      <div className={`card-elevated p-4 sm:p-6 animate-fade-in transition-all duration-500 overflow-hidden ${
        isCardComplete ? 'ring-2 ring-amber-400 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <h3 className="font-semibold text-base sm:text-lg">Din Fremskridt</h3>
          </div>
          {completedCards > 0 && (
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-lg shadow-amber-200 dark:shadow-amber-900/50">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white fill-white" />
              <span className="text-xs sm:text-sm font-bold text-white">
                {completedCards} {completedCards === 1 ? 'stjerne' : 'stjerner'}
              </span>
            </div>
          )}
        </div>

        {/* Stamp card visual */}
        <div className={`relative rounded-2xl p-4 sm:p-6 border-2 border-dashed transition-all duration-500 ${
          isCardComplete 
            ? 'bg-gradient-to-br from-amber-100 to-amber-200/50 border-amber-400 dark:from-amber-900/30 dark:to-amber-800/20' 
            : 'bg-gradient-to-br from-primary/5 to-success/5 border-primary/20'
        }`}>
          {/* Stamps row */}
          <div className="flex justify-center gap-2 sm:gap-4 mb-4">
            {Array.from({ length: STAMPS_NEEDED }).map((_, index) => {
              const isFilled = index < animatedStamps;
              const isLatest = index === animatedStamps - 1 && animatedStamps > 0;
              
              return (
                <div
                  key={index}
                  className={`
                    relative w-11 h-11 sm:w-14 sm:h-14 rounded-full border-3 transition-all duration-300
                    flex items-center justify-center shrink-0
                    ${isFilled 
                      ? isCardComplete 
                        ? 'bg-amber-500 border-amber-500 text-white scale-100' 
                        : 'bg-success border-success text-white scale-100' 
                      : 'bg-muted/50 border-muted-foreground/20 text-muted-foreground/30 scale-95'
                    }
                    ${isLatest ? 'animate-stamp-pop ring-4 ring-success/30' : ''}
                  `}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  {isFilled ? (
                    <Check className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={3} />
                  ) : (
                    <span className="text-base sm:text-xl font-bold">{index + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress text */}
          <div className="text-center">
            <p className={`text-xs sm:text-sm ${isCardComplete ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-muted-foreground'}`}>
              {displayStamps} af {STAMPS_NEEDED} stempler
            </p>
          </div>

          {/* Completed star animation */}
          {showStarAnimation && isCardComplete && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-star-burst">
                <Star className="h-12 w-12 sm:h-16 sm:w-16 text-amber-400 fill-amber-400 drop-shadow-lg" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(8)].map((_, i) => (
                  <Sparkles 
                    key={i}
                    className="absolute h-4 w-4 sm:h-5 sm:w-5 text-amber-300 animate-sparkle"
                    style={{
                      transform: `rotate(${i * 45}deg) translateY(-30px) sm:translateY(-40px)`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feedback message */}
        <div className={`mt-4 p-2 sm:p-3 rounded-xl text-center ${
          isCardComplete ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/5'
        }`}>
          <p className="text-xs sm:text-sm font-medium">{getFeedbackMessage()}</p>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Læste guides i alt</span>
            <span className="font-semibold text-primary">{guidesReadCount}</span>
          </div>
        </div>

        {/* CTA */}
        {!isCardComplete && (
          <Link to="/guides" className="block mt-4">
            <Button variant="outline" className="w-full text-sm">
              <BookOpen className="mr-2 h-4 w-4" />
              Find næste guide
            </Button>
          </Link>
        )}

        {/* Completed state CTA */}
        {isCardComplete && (
          <Link to="/guides" className="block mt-4">
            <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm">
              <Star className="mr-2 h-4 w-4 fill-current" />
              Start nyt kort
            </Button>
          </Link>
        )}
      </div>

      {/* Celebration Modal */}
      <Dialog open={showCelebrationModal} onOpenChange={setShowCelebrationModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="mb-4 relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-xl shadow-amber-200 dark:shadow-amber-900/50">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Star className="h-8 w-8 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">
              Tillykke! Du er en Tech-Helt! 🏆
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Du har gennemført de 4 vigtigste trin for din sikkerhed. Din telefon er nu meget mere tryg at bruge!
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
              <Star className="h-5 w-5 fill-current" />
              <span className="font-semibold">Du har optjent en Guldstjerne!</span>
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>

          <Button 
            onClick={() => setShowCelebrationModal(false)}
            className="w-full mt-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            Luk og nyd min stjerne
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StampCard;
