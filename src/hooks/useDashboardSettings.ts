import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardSettings {
  card_order: string[] | null;
  hidden_cards: string[];
}

export function useDashboardSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DashboardSettings>({
    card_order: null,
    hidden_cards: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    if (!user) {
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
          setSettings({
            card_order: data.card_order,
            hidden_cards: data.hidden_cards || [],
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Save settings to database
  const saveSettings = useCallback(async (newSettings: Partial<DashboardSettings>) => {
    if (!user) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

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
      console.error('Failed to save dashboard settings:', error);
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