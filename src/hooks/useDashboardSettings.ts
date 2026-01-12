import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'mittek_dashboard_settings';

interface CustomCategory {
  id: string;
  title: string;
}

interface DashboardSettings {
  card_order: string[] | null;
  hidden_cards: string[];
  category_titles: Record<string, string>;
  category_order: string[] | null;
  custom_categories: CustomCategory[];
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
    category_titles: {},
    category_order: null,
    custom_categories: [],
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
          // Load from local storage for category_titles, category_order and custom_categories
          const localSettings = loadFromLocalStorage();
          const loadedSettings: DashboardSettings = {
            card_order: data.card_order,
            hidden_cards: data.hidden_cards || [],
            category_titles: localSettings?.category_titles || {},
            category_order: localSettings?.category_order || null,
            custom_categories: localSettings?.custom_categories || [],
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

  // Reset to default - clear DB and localStorage
  const resetToDefault = useCallback(async () => {
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    
    // Reset local state
    setSettings({ card_order: null, hidden_cards: [], category_titles: {}, category_order: null, custom_categories: [] });
    
    // Clear from DB if authenticated
    if (user) {
      try {
        await supabase
          .from('user_dashboard_settings')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to reset dashboard settings in DB:', error);
      }
    }
  }, [user]);

  // Update category title
  const updateCategoryTitle = useCallback((categoryId: string, newTitle: string) => {
    const newCategoryTitles = { ...settings.category_titles };
    if (newTitle) {
      newCategoryTitles[categoryId] = newTitle;
    } else {
      delete newCategoryTitles[categoryId]; // Remove to use default
    }
    saveSettings({ category_titles: newCategoryTitles });
  }, [settings.category_titles, saveSettings]);

  // Update category order
  const updateCategoryOrder = useCallback((newOrder: string[]) => {
    saveSettings({ category_order: newOrder });
  }, [saveSettings]);

  // Add a custom category
  const addCustomCategory = useCallback((categoryName: string) => {
    const newCategory: CustomCategory = {
      id: `custom_${Date.now()}`,
      title: categoryName,
    };
    const newCustomCategories = [...settings.custom_categories, newCategory];
    
    // Also add to category order if exists
    const currentOrder = settings.category_order || ['start', 'tools', 'safety', 'extras'];
    const newOrder = [...currentOrder, newCategory.id];
    
    saveSettings({ 
      custom_categories: newCustomCategories,
      category_order: newOrder,
    });
  }, [settings.custom_categories, settings.category_order, saveSettings]);

  // Delete a category (default or custom)
  const deleteCategory = useCallback((categoryId: string) => {
    const isCustom = categoryId.startsWith('custom_');
    
    // For custom categories, remove from custom_categories list
    const newCustomCategories = isCustom 
      ? settings.custom_categories.filter(c => c.id !== categoryId)
      : settings.custom_categories;
    
    // Remove from order
    const currentOrder = settings.category_order || ['start', 'tools', 'safety', 'extras'];
    const newOrder = currentOrder.filter(id => id !== categoryId);
    
    // Also remove the category title if any
    const newCategoryTitles = { ...settings.category_titles };
    delete newCategoryTitles[categoryId];
    
    // Move all cards from this category to hidden (add to hidden_cards)
    // Note: We're not doing this here as it would require knowing which cards belong to this category
    // The UI already handles this - cards in deleted categories just won't appear
    
    saveSettings({ 
      custom_categories: newCustomCategories,
      category_order: newOrder,
      category_titles: newCategoryTitles,
    });
  }, [settings.custom_categories, settings.category_order, settings.category_titles, saveSettings]);

  return {
    cardOrder: settings.card_order,
    hiddenCards: settings.hidden_cards,
    categoryTitles: settings.category_titles,
    categoryOrder: settings.category_order,
    customCategories: settings.custom_categories,
    isLoading,
    hideCard,
    showCard,
    updateCardOrder,
    updateCategoryTitle,
    updateCategoryOrder,
    addCustomCategory,
    deleteCategory,
    resetToDefault,
  };
}