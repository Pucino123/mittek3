import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'mittek_dashboard_settings';

interface DashboardSettings {
  card_order: string[] | null;
  hidden_cards: string[];
}

// localStorage helpers
function loadFromLocalStorage(): DashboardSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse localStorage settings:', e);
  }
  return null;
}

function saveToLocalStorage(settings: DashboardSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function useDashboardSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DashboardSettings>({
    card_order: null,
    hidden_cards: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount - DB first, then localStorage fallback
  useEffect(() => {
    if (!user) {
      // Try localStorage for non-authenticated users
      const localSettings = loadFromLocalStorage();
      if (localSettings) {
        setSettings(localSettings);
      }
      setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_dashboard_settings')
          .select('card_order, hidden_cards')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const loadedSettings = {
            card_order: data.card_order,
            hidden_cards: data.hidden_cards || [],
          };
          setSettings(loadedSettings);
          // Also save to localStorage as backup
          saveToLocalStorage(loadedSettings);
        } else {
          // No DB data, try localStorage
          const localSettings = loadFromLocalStorage();
          if (localSettings) {
            setSettings(localSettings);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard settings from DB, trying localStorage:', error);
        // Fallback to localStorage
        const localSettings = loadFromLocalStorage();
        if (localSettings) {
          setSettings(localSettings);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Save settings to database AND localStorage
  const saveSettings = useCallback(async (newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Always save to localStorage immediately (backup)
    saveToLocalStorage(updatedSettings);

    // Save to DB if authenticated
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_dashboard_settings')
        .upsert({
          user_id: user.id,
          card_order: updatedSettings.card_order,
          hidden_cards: updatedSettings.hidden_cards,
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save dashboard settings to DB:', error);
      // localStorage backup already saved above
    }
  }, [user, settings]);

  // Hide a card
  const hideCard = useCallback((cardId: string) => {
    const newHiddenCards = [...settings.hidden_cards, cardId];
    saveSettings({ hidden_cards: newHiddenCards });
  }, [settings.hidden_cards, saveSettings]);

  // Show a card (remove from hidden)
  const showCard = useCallback((cardId: string) => {
    const newHiddenCards = settings.hidden_cards.filter(id => id !== cardId);
    saveSettings({ hidden_cards: newHiddenCards });
  }, [settings.hidden_cards, saveSettings]);

  // Update card order
  const updateCardOrder = useCallback((newOrder: string[]) => {
    saveSettings({ card_order: newOrder });
  }, [saveSettings]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    saveSettings({ card_order: null, hidden_cards: [] });
  }, [saveSettings]);

  return {
    cardOrder: settings.card_order,
    hiddenCards: settings.hidden_cards,
    isLoading,
    hideCard,
    showCard,
    updateCardOrder,
    resetToDefault,
  };
}