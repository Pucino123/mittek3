import { useEffect, useState } from 'react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Trophy, Sparkles, TrendingUp, BookOpen, ClipboardCheck, Wrench } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TechBarometer = () => {
  const { 
    loading, 
    currentXp, 
    currentLevel, 
    progressPercent, 
    nextLevel,
    achievements,
    LEVELS,
    XP_VALUES,
  } = useUserAchievements();

  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Animate the bar on mount
  useEffect(() => {
    if (!loading) {
      // Start animation after a short delay
      const timer = setTimeout(() => {
        setAnimatedPercent(progressPercent);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, progressPercent]);

  // Dynamic feedback message
  const getFeedbackMessage = () => {
    if (nextLevel && nextLevel.xpNeeded <= 50) {
      return "🎯 Så tæt på! Én guide mere til næste niveau!";
    }
    if (nextLevel && nextLevel.xpNeeded <= 100) {
      return "🔥 Godt gået! Du er tæt på næste niveau!";
    }
    if (currentXp === 0) {
      return "👋 Velkommen! Læs din første guide for at starte.";
    }
    if (progressPercent >= 80) {
      return "⭐ Fantastisk! Du er næsten en Tech Ekspert!";
    }
    return "💪 Bliv ved! Hver guide giver +50 point.";
  };

  if (loading) {
    return (
      <div className="card-elevated p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Dit Tech-Niveau</h3>
      </div>

      {/* Main barometer container */}
      <div className="relative flex flex-col items-center">
        {/* Vertical barometer */}
        <div className="relative h-72 w-16 bg-muted rounded-full overflow-hidden border-2 border-border">
          {/* Level markers */}
          <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between py-2 pointer-events-none z-10">
            {[...LEVELS].reverse().map((level, index) => (
              <div key={level.name} className="relative flex items-center">
                <div className="absolute -left-20 w-16 text-right">
                  <span className={`text-xs font-medium ${
                    currentLevel.name === level.name ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {level.name === 'Ny i Tech' ? 'Start' : 
                     level.name === 'Godt på vej' ? 'Bronze' :
                     level.name === 'Sikker Bruger' ? 'Sølv' : 'Guld'}
                  </span>
                </div>
                <div className="h-0.5 w-3 bg-border ml-auto mr-1" />
              </div>
            ))}
          </div>

          {/* Animated fill */}
          <div 
            className={`absolute bottom-0 left-0 right-0 rounded-b-full transition-all duration-1500 ease-out bg-gradient-to-t ${currentLevel.gradient}`}
            style={{ 
              height: `${animatedPercent}%`,
            }}
          >
            {/* Bubbles effect */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
              <div className="absolute bottom-4 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-300" />
              <div className="absolute bottom-8 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-500" />
            </div>
          </div>

          {/* Glass shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* XP Counter */}
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold text-primary">{currentXp}</div>
          <div className="text-sm text-muted-foreground">/ 1000 XP</div>
        </div>

        {/* Current Level Badge */}
        <div className={`mt-4 px-4 py-2 rounded-full bg-gradient-to-r ${currentLevel.gradient} text-white font-semibold text-sm flex items-center gap-2`}>
          <Sparkles className="h-4 w-4" />
          {currentLevel.name}
        </div>
      </div>

      {/* Feedback bubble */}
      <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">{getFeedbackMessage()}</p>
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Læste guides
          </span>
          <span className="font-medium">
            {achievements?.guides_read?.length || 0} 
            <span className="text-muted-foreground ml-1">(+{XP_VALUES.GUIDE_READ} XP/stk)</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            Månedlige tjek
          </span>
          <span className="font-medium">
            {achievements?.checkins_completed || 0}
            <span className="text-muted-foreground ml-1">(+{XP_VALUES.CHECKIN_COMPLETED} XP/stk)</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Wrench className="h-4 w-4" />
            Værktøjer brugt
          </span>
          <span className="font-medium">
            {achievements?.tools_used?.length || 0}
            <span className="text-muted-foreground ml-1">(+{XP_VALUES.TOOL_USED} XP/stk)</span>
          </span>
        </div>
      </div>

      {/* Next level progress */}
      {nextLevel && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Endnu <span className="font-semibold text-primary">{nextLevel.xpNeeded} XP</span> til "{nextLevel.level.name}"
          </p>
        </div>
      )}
    </div>
  );
};

export default TechBarometer;
