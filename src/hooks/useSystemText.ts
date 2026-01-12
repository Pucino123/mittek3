import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch dynamic system text from the database
 * Falls back to defaultValue if key not found or on error
 */
export function useSystemText(key: string, defaultValue: string): {
  text: string;
  isLoading: boolean;
} {
  const [text, setText] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchText = async () => {
      try {
        const { data, error } = await supabase
          .from('system_content')
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (error) {
          console.error(`Failed to fetch system text "${key}":`, error);
          return;
        }

        if (data?.value) {
          setText(data.value);
        }
      } catch (error) {
        console.error(`Error fetching system text "${key}":`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchText();
  }, [key]);

  return { text, isLoading };
}

/**
 * Hook to fetch multiple system texts at once
 */
export function useSystemTexts(keys: string[], defaults: Record<string, string>): {
  texts: Record<string, string>;
  isLoading: boolean;
} {
  const [texts, setTexts] = useState<Record<string, string>>(defaults);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const { data, error } = await supabase
          .from('system_content')
          .select('key, value')
          .in('key', keys);

        if (error) {
          console.error('Failed to fetch system texts:', error);
          return;
        }

        if (data) {
          const result = { ...defaults };
          data.forEach(item => {
            if (item.value) {
              result[item.key] = item.value;
            }
          });
          setTexts(result);
        }
      } catch (error) {
        console.error('Error fetching system texts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTexts();
  }, [keys.join(',')]);

  return { texts, isLoading };
}
