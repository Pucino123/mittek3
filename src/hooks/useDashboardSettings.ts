import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'mittek_dashboard_settings';

// Standard Suite: The 16 tools visible by default on the dashboard
// Tools NOT in this list start hidden in the Tool Library
// MUST match STANDARD_TOOL_IDS in Dashboard.tsx
const STANDARD_TOOL_IDS = [
  'checkin', 'guides', 'help', 'dictionary',       // Kom i gang
  'password-generator', 'battery-doctor', 'cleaning', 'hardware', // Værktøjer
  'scam-quiz', 'panic', 'safety', 'vault',         // Sikkerhed
  'wishlist', 'medical-id', 'guest-wifi', 'screenshot' // Ekstra
];

// Tool Library items (hidden by default, accessible via "Tilføj værktøj")
// New users will only see the Standard Suite - these tools must be explicitly added
const DEFAULT_HIDDEN_TOOL_IDS = [
  'notes',
  'subscription-tracker',
  'speedtest',
  'digital-legacy',
  'password-health'
];

// All tool IDs in default order (Standard Suite + Tool Library items)
const DEFAULT_CARD_ORDER = [
  ...STANDARD_TOOL_IDS,
  ...DEFAULT_HIDDEN_TOOL_IDS
];

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
  card_categories: Record<string, string>; // cardId -> categoryId mapping
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
    hidden_cards: DEFAULT_HIDDEN_TOOL_IDS, // Start with Tool Library items hidden
    category_titles: {},
    category_order: null,
    custom_categories: [],
    card_categories: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount - DB first, then localStorage fallback
  useEffect(() => {
    if (!user) {
      // Try localStorage for non-authenticated users
      const localSettings = loadFromLocalStorage();
      if (localSettings) {
        setSettings({
          ...localSettings,
          card_categories: localSettings.card_categories || {},
        });
      } else {
        // New user - set default hidden cards (Tool Library items)
        setSettings(prev => ({
          ...prev,
          hidden_cards: DEFAULT_HIDDEN_TOOL_IDS,
        }));
      }
      setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_dashboard_settings')
          .select('card_order, hidden_cards, card_categories')
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
            card_categories: (data.card_categories as Record<string, string>) || {},
          };
          setSettings(loadedSettings);
          // Also save to localStorage as backup
          saveToLocalStorage(loadedSettings);
        } else {
          // No DB settings row = new user, use default hidden cards (Tool Library items)
          const defaultSettings: DashboardSettings = {
            card_order: null,
            hidden_cards: DEFAULT_HIDDEN_TOOL_IDS,
            category_titles: {},
            category_order: null,
            custom_categories: [],
            card_categories: {},
          };
          setSettings(defaultSettings);
          saveToLocalStorage(defaultSettings);
        }
      } catch (error) {
        console.error('Failed to load dashboard settings from DB, trying localStorage:', error);
        // Fallback to localStorage
        const localSettings = loadFromLocalStorage();
        if (localSettings) {
          setSettings({
            ...localSettings,
            card_categories: localSettings.card_categories || {},
          });
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
          card_categories: updatedSettings.card_categories,
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

  // Show a card (remove from hidden) and optionally assign to a category
  // CRITICAL: Also add to card_order if not present (fixes bug where new tools never appear)
  const showCard = useCallback((cardId: string, targetCategoryId?: string) => {
    const newHiddenCards = settings.hidden_cards.filter(id => id !== cardId);
    
    // Ensure the card is in the card_order array - add to end if missing
    let newCardOrder = settings.card_order;
    if (newCardOrder && !newCardOrder.includes(cardId)) {
      // Has custom order but card not in it - add to end
      newCardOrder = [...newCardOrder, cardId];
    } else if (!newCardOrder) {
      // No custom order yet - use default order but ensure this card is included
      // This handles Tool Library items that aren't in the standard order
      if (DEFAULT_CARD_ORDER.includes(cardId)) {
        newCardOrder = [...DEFAULT_CARD_ORDER];
      } else {
        newCardOrder = [...DEFAULT_CARD_ORDER, cardId];
      }
    }
    
    // If a target category is specified, also update card_categories
    if (targetCategoryId) {
      const newCardCategories = { ...settings.card_categories, [cardId]: targetCategoryId };
      saveSettings({ 
        hidden_cards: newHiddenCards,
        card_categories: newCardCategories,
        card_order: newCardOrder,
      });
    } else {
      saveSettings({ 
        hidden_cards: newHiddenCards,
        card_order: newCardOrder,
      });
    }
  }, [settings.hidden_cards, settings.card_categories, settings.card_order, saveSettings]);

  // Update card order
  const updateCardOrder = useCallback((newOrder: string[]) => {
    saveSettings({ card_order: newOrder });
  }, [saveSettings]);

  // Update a single card's category (for cross-category drag)
  const updateCardCategory = useCallback((cardId: string, newCategoryId: string) => {
    const newCardCategories = { ...settings.card_categories, [cardId]: newCategoryId };
    saveSettings({ card_categories: newCardCategories });
  }, [settings.card_categories, saveSettings]);

  // Batch update card categories and order (for drag operations)
  const updateCardCategoryAndOrder = useCallback((cardId: string, newCategoryId: string, newOrder: string[]) => {
    const newCardCategories = { ...settings.card_categories, [cardId]: newCategoryId };
    saveSettings({ 
      card_categories: newCardCategories,
      card_order: newOrder,
    });
  }, [settings.card_categories, saveSettings]);

  // Restore a full dashboard snapshot (used for Undo)
  type DashboardSnapshot = Pick<DashboardSettings, 'card_order' | 'hidden_cards' | 'card_categories'>;

  const restoreSnapshot = useCallback(async (snapshot: Partial<DashboardSnapshot>) => {
    const incomingCategories = snapshot.card_categories;
    const sanitizedCategories = incomingCategories && typeof incomingCategories === 'object'
      ? Object.fromEntries(
          Object.entries(incomingCategories as Record<string, unknown>)
            .filter(([k, v]) => typeof k === 'string' && k.trim().length > 0 && typeof v === 'string' && v.trim().length > 0)
            .map(([k, v]) => [k, String(v)])
        ) as Record<string, string>
      : undefined;

    const nextSettings: DashboardSettings = {
      ...settings,
      card_order: snapshot.card_order ?? settings.card_order,
      hidden_cards: snapshot.hidden_cards ?? settings.hidden_cards,
      card_categories: sanitizedCategories ?? settings.card_categories ?? {},
    };

    // Update UI immediately
    setSettings(nextSettings);
    saveToLocalStorage(nextSettings);

    // Persist to DB when authenticated
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_dashboard_settings')
        .upsert({
          user_id: user.id,
          card_order: nextSettings.card_order,
          hidden_cards: nextSettings.hidden_cards,
          card_categories: nextSettings.card_categories,
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to restore dashboard snapshot in DB:', error);
    }
  }, [user, settings]);

  // Reset to default - clear DB and localStorage, restore Standard Suite
  const resetToDefault = useCallback(async () => {
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    
    // Reset local state to default Standard Suite (hide Tool Library items)
    setSettings({ 
      card_order: null, 
      hidden_cards: DEFAULT_HIDDEN_TOOL_IDS, 
      category_titles: {}, 
      category_order: null, 
      custom_categories: [],
      card_categories: {},
    });
    
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

  // Reorder cards within a specific category (update the card_order to reflect new positions)
  const reorderCardsInCategory = useCallback((categoryId: string, newCardIds: string[]) => {
    // Update card_categories to ensure all cards are mapped to this category
    const newCardCategories = { ...settings.card_categories };
    newCardIds.forEach(cardId => {
      newCardCategories[cardId] = categoryId;
    });
    
    // Update card_order to reflect the new order within this category
    const currentOrder = settings.card_order || DEFAULT_CARD_ORDER;
    
    // Remove the old positions of these cards from the order
    const otherCards = currentOrder.filter(id => !newCardIds.includes(id));
    
    // Insert the new order at the appropriate position (find where cards in this category should go)
    // For now, just append them but maintain relative positions with other categories
    const newOrder = [...otherCards];
    
    // Find the right insertion point based on existing category structure
    // Simple approach: just update and let the category-based grouping handle display
    saveSettings({ 
      card_categories: newCardCategories,
      card_order: [...newOrder, ...newCardIds],
    });
  }, [settings.card_categories, settings.card_order, saveSettings]);

  // Move a card from one category to another
  const moveCardToCategory = useCallback((cardId: string, fromCategoryId: string, toCategoryId: string) => {
    // Simply update the card's category mapping
    const newCardCategories = { ...settings.card_categories, [cardId]: toCategoryId };
    saveSettings({ card_categories: newCardCategories });
  }, [settings.card_categories, saveSettings]);

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

  // Delete a category (default or custom) - moves cards to hidden pool for safety
  const deleteCategory = useCallback((categoryId: string, cardIdsInCategory?: string[]) => {
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
    
    // SAFE DELETION: Move all cards from this category to hidden pool
    // This ensures tools are never lost - they become available via the "+" button
    const newHiddenCards = cardIdsInCategory 
      ? [...new Set([...settings.hidden_cards, ...cardIdsInCategory])]
      : settings.hidden_cards;

    // Also remove card_categories entries for deleted category's cards
    const newCardCategories = { ...settings.card_categories };
    if (cardIdsInCategory) {
      cardIdsInCategory.forEach(cardId => {
        delete newCardCategories[cardId];
      });
    }
    
    saveSettings({ 
      custom_categories: newCustomCategories,
      category_order: newOrder,
      category_titles: newCategoryTitles,
      hidden_cards: newHiddenCards,
      card_categories: newCardCategories,
    });
  }, [settings.custom_categories, settings.category_order, settings.category_titles, settings.hidden_cards, settings.card_categories, saveSettings]);

  return {
    cardOrder: settings.card_order,
    hiddenCards: settings.hidden_cards,
    categoryTitles: settings.category_titles,
    categoryOrder: settings.category_order,
    customCategories: settings.custom_categories,
    cardCategories: settings.card_categories,
    isLoading,
    hideCard,
    showCard,
    updateCardOrder,
    updateCardCategory,
    updateCardCategoryAndOrder,
    restoreSnapshot,
    updateCategoryTitle,
    updateCategoryOrder,
    reorderCardsInCategory,
    moveCardToCategory,
    addCustomCategory,
    deleteCategory,
    resetToDefault,
  };
}