import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HelpStep {
  instruction: string;
  detail: string;
  icon?: string;
  image_url?: string;
}

export interface CheckinHelpData {
  title: string;
  screenshot?: string;
  steps: HelpStep[];
  tip?: string;
}

export interface DeviceQuestion {
  id: string;
  question_id: string;
  text: string;
  type: 'boolean' | 'done';
  weight: number;
  goodAnswer: boolean;
  recommendation: string;
  checkLabel: string;
  helpData: CheckinHelpData;
}

interface RawQuestion {
  id: string;
  device_type: string;
  question_id: string;
  text: string;
  question_type: string;
  weight: number;
  good_answer: boolean;
  recommendation: string;
  check_label: string;
  help_title: string | null;
  help_screenshot: string | null;
  help_steps: { instruction: string; detail: string; icon?: string; image_url?: string }[];
  help_tip: string | null;
  sort_order: number;
  is_active: boolean;
}

export function useCheckinQuestions() {
  const [questions, setQuestions] = useState<Record<string, DeviceQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('checkin_questions')
        .select('*')
        .eq('is_active', true)
        .order('device_type')
        .order('sort_order');

      if (fetchError) {
        console.error('Error fetching checkin questions:', fetchError);
        setError('Kunne ikke hente spørgsmål');
        setLoading(false);
        return;
      }

      // Group by device type and transform
      const grouped: Record<string, DeviceQuestion[]> = {};
      
      for (const rawData of (data || [])) {
        const raw = rawData as unknown as RawQuestion;
        
        // Parse help_steps properly
        let helpSteps: HelpStep[] = [];
        if (Array.isArray(raw.help_steps)) {
          helpSteps = raw.help_steps.map(step => ({
            instruction: step.instruction || '',
            detail: step.detail || '',
            icon: step.icon,
            image_url: step.image_url,
          }));
        }
        
        const transformed: DeviceQuestion = {
          id: raw.question_id,
          question_id: raw.question_id,
          text: raw.text,
          type: raw.question_type as 'boolean' | 'done',
          weight: raw.weight,
          goodAnswer: raw.good_answer,
          recommendation: raw.recommendation,
          checkLabel: raw.check_label,
          helpData: {
            title: raw.help_title || raw.text,
            screenshot: raw.help_screenshot || undefined,
            steps: helpSteps,
            tip: raw.help_tip || undefined,
          },
        };

        if (!grouped[raw.device_type]) {
          grouped[raw.device_type] = [];
        }
        grouped[raw.device_type].push(transformed);
      }

      setQuestions(grouped);
      setLoading(false);
    };

    fetchQuestions();
  }, []);

  const getQuestionsForDevice = (device: string): DeviceQuestion[] => {
    return questions[device] || [];
  };

  return {
    questions,
    loading,
    error,
    getQuestionsForDevice,
  };
}
