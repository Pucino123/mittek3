import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Notification sound (simple beep using Web Audio API)
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Could not play notification sound:', error);
  }
};

export function useWaitingBookings() {
  const [waitingCount, setWaitingCount] = useState(0);
  const previousCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const fetchWaitingCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('support_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting_for_technician');
      
      if (error) throw error;
      
      const newCount = count || 0;
      
      // Play sound if count increased (not on initial load)
      if (!isInitialLoadRef.current && newCount > previousCountRef.current) {
        playNotificationSound();
      }
      
      previousCountRef.current = newCount;
      isInitialLoadRef.current = false;
      setWaitingCount(newCount);
    } catch (error) {
      console.error('Error fetching waiting count:', error);
    }
  }, []);

  useEffect(() => {
    fetchWaitingCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('admin-waiting-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_bookings',
        },
        () => {
          // Refetch count on any change
          fetchWaitingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWaitingCount]);

  return { waitingCount };
}
