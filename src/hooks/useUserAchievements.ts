import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserAchievements {
  id: string;
  user_id: string;
  guides_read: string[];
  tools_used: string[];
  checkins_completed: number;
  total_xp: number;
  current_level: string;
}

interface LevelInfo {
  name: string;
  minXp: number;
  maxXp: number;
  color: string;
  gradient: string;
}

const LEVELS: LevelInfo[] = [
  { name: 'Ny i Tech', minXp: 0, maxXp: 199, color: 'hsl(210, 60%, 50%)', gradient: 'from-blue-400 to-blue-600' },
  { name: 'Godt på vej', minXp: 200, maxXp: 499, color: 'hsl(280, 60%, 55%)', gradient: 'from-purple-400 to-purple-600' },
  { name: 'Sikker Bruger', minXp: 500, maxXp: 799, color: 'hsl(45, 90%, 50%)', gradient: 'from-amber-400 to-amber-600' },
  { name: 'Tech Ekspert', minXp: 800, maxXp: 1000, color: 'hsl(140, 60%, 45%)', gradient: 'from-emerald-400 to-emerald-600' },
];

const XP_VALUES = {
  GUIDE_READ: 50,
  CHECKIN_COMPLETED: 100,
  TOOL_USED: 20,
};

export const useUserAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievements | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial achievements record
        const { data: newData, error: insertError } = await supabase
          .from('user_achievements')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setAchievements(newData);
      } else {
        setAchievements(data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const calculateXp = (achievements: UserAchievements): number => {
    const guideXp = (achievements.guides_read?.length || 0) * XP_VALUES.GUIDE_READ;
    const checkinXp = (achievements.checkins_completed || 0) * XP_VALUES.CHECKIN_COMPLETED;
    const toolXp = (achievements.tools_used?.length || 0) * XP_VALUES.TOOL_USED;
    return Math.min(guideXp + checkinXp + toolXp, 1000);
  };

  const getLevelInfo = (xp: number): LevelInfo => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  };

  const getProgressPercent = (xp: number): number => {
    return Math.min((xp / 1000) * 100, 100);
  };

  const getNextLevelInfo = (xp: number): { level: LevelInfo; xpNeeded: number } | null => {
    const currentLevel = getLevelInfo(xp);
    const currentIndex = LEVELS.findIndex(l => l.name === currentLevel.name);
    if (currentIndex < LEVELS.length - 1) {
      const nextLevel = LEVELS[currentIndex + 1];
      return {
        level: nextLevel,
        xpNeeded: nextLevel.minXp - xp,
      };
    }
    return null;
  };

  const markGuideAsRead = async (guideId: string) => {
    if (!user || !achievements) return false;

    // Check if already read
    if (achievements.guides_read?.includes(guideId)) {
      return false;
    }

    try {
      const newGuidesRead = [...(achievements.guides_read || []), guideId];
      const newXp = calculateXp({ ...achievements, guides_read: newGuidesRead });
      const newLevel = getLevelInfo(newXp).name;

      const { error } = await supabase
        .from('user_achievements')
        .update({
          guides_read: newGuidesRead,
          total_xp: newXp,
          current_level: newLevel,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setAchievements(prev => prev ? {
        ...prev,
        guides_read: newGuidesRead,
        total_xp: newXp,
        current_level: newLevel,
      } : null);

      return true;
    } catch (error) {
      console.error('Error marking guide as read:', error);
      return false;
    }
  };

  const trackToolUsed = async (toolId: string) => {
    if (!user || !achievements) return;

    // Check if already tracked
    if (achievements.tools_used?.includes(toolId)) {
      return;
    }

    try {
      const newToolsUsed = [...(achievements.tools_used || []), toolId];
      const newXp = calculateXp({ ...achievements, tools_used: newToolsUsed });
      const newLevel = getLevelInfo(newXp).name;

      await supabase
        .from('user_achievements')
        .update({
          tools_used: newToolsUsed,
          total_xp: newXp,
          current_level: newLevel,
        })
        .eq('user_id', user.id);

      setAchievements(prev => prev ? {
        ...prev,
        tools_used: newToolsUsed,
        total_xp: newXp,
        current_level: newLevel,
      } : null);
    } catch (error) {
      console.error('Error tracking tool usage:', error);
    }
  };

  const incrementCheckins = async () => {
    if (!user || !achievements) return;

    try {
      const newCheckins = (achievements.checkins_completed || 0) + 1;
      const newXp = calculateXp({ ...achievements, checkins_completed: newCheckins });
      const newLevel = getLevelInfo(newXp).name;

      await supabase
        .from('user_achievements')
        .update({
          checkins_completed: newCheckins,
          total_xp: newXp,
          current_level: newLevel,
        })
        .eq('user_id', user.id);

      setAchievements(prev => prev ? {
        ...prev,
        checkins_completed: newCheckins,
        total_xp: newXp,
        current_level: newLevel,
      } : null);
    } catch (error) {
      console.error('Error incrementing checkins:', error);
    }
  };

  const currentXp = achievements ? calculateXp(achievements) : 0;
  const currentLevel = getLevelInfo(currentXp);
  const progressPercent = getProgressPercent(currentXp);
  const nextLevel = getNextLevelInfo(currentXp);

  return {
    achievements,
    loading,
    currentXp,
    currentLevel,
    progressPercent,
    nextLevel,
    markGuideAsRead,
    trackToolUsed,
    incrementCheckins,
    refetch: fetchAchievements,
    isGuideRead: (guideId: string) => achievements?.guides_read?.includes(guideId) || false,
    LEVELS,
    XP_VALUES,
  };
};
