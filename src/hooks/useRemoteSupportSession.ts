import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface DrawingPoint {
  x: number;
  y: number;
  type: 'start' | 'draw' | 'end';
  tool: 'pencil' | 'circle' | 'arrow' | 'eraser';
  color: string;
}

interface SessionState {
  bookingId: string | null;
  peerId: string | null;
  remotePeerId: string | null;
  startedAt: string | null;
  status: 'idle' | 'waiting' | 'connecting' | 'connected' | 'ended';
}

export function useRemoteSupportSession(bookingId?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionState>({
    bookingId: bookingId || null,
    peerId: null,
    remotePeerId: null,
    startedAt: null,
    status: 'idle',
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(SESSION_DURATION_MS);
  const [drawingPoints, setDrawingPoints] = useState<DrawingPoint[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a unique peer ID
  const generatePeerId = useCallback(() => {
    const id = `peer_${user?.id?.slice(0, 8)}_${Date.now()}`;
    setSession(prev => ({ ...prev, peerId: id }));
    return id;
  }, [user]);

  // Calculate remaining time based on server timestamp
  const updateTimeRemaining = useCallback((startedAt: string) => {
    const startTime = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = now - startTime;
    const remaining = Math.max(0, SESSION_DURATION_MS - elapsed);
    setTimeRemaining(remaining);
    return remaining;
  }, []);

  // Start timer countdown
  useEffect(() => {
    if (session.startedAt && session.status === 'connected') {
      timerRef.current = setInterval(() => {
        const remaining = updateTimeRemaining(session.startedAt!);
        if (remaining <= 0) {
          setSession(prev => ({ ...prev, status: 'ended' }));
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session.startedAt, session.status, updateTimeRemaining]);

  // Subscribe to drawing events via Supabase Realtime
  const subscribeToDrawingEvents = useCallback((bookingId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase.channel(`drawing-events-${bookingId}`)
      .on('broadcast', { event: 'draw' }, (payload) => {
        const point = payload.payload as DrawingPoint;
        setDrawingPoints(prev => [...prev, point]);
      })
      .on('broadcast', { event: 'clear' }, () => {
        setDrawingPoints([]);
      })
      .on('broadcast', { event: 'session-start' }, (payload) => {
        setSession(prev => ({
          ...prev,
          remotePeerId: payload.payload.peerId,
          startedAt: payload.payload.startedAt,
          status: 'connected',
        }));
      })
      .on('broadcast', { event: 'session-end' }, () => {
        setSession(prev => ({ ...prev, status: 'ended' }));
      })
      .subscribe();

    channelRef.current = channel;
    return channel;
  }, []);

  // Broadcast a drawing point
  const broadcastDraw = useCallback((point: DrawingPoint) => {
    if (!channelRef.current || !session.bookingId) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'draw',
      payload: point,
    });
  }, [session.bookingId]);

  // Clear all drawings
  const clearDrawings = useCallback(() => {
    if (!channelRef.current) return;
    
    setDrawingPoints([]);
    channelRef.current.send({
      type: 'broadcast',
      event: 'clear',
      payload: {},
    });
  }, []);

  // Start a session (admin side)
  const startSession = useCallback(async (bookingId: string) => {
    const peerId = generatePeerId();
    const startedAt = new Date().toISOString();

    // Update booking with session start time
    await supabase
      .from('support_bookings')
      .update({ 
        status: 'in_progress',
      })
      .eq('id', bookingId);

    // Subscribe to channel
    const channel = subscribeToDrawingEvents(bookingId);

    // Broadcast session start
    channel.send({
      type: 'broadcast',
      event: 'session-start',
      payload: { peerId, startedAt },
    });

    setSession({
      bookingId,
      peerId,
      remotePeerId: null,
      startedAt,
      status: 'connected',
    });
  }, [generatePeerId, subscribeToDrawingEvents]);

  // Join a session (user side)
  const joinSession = useCallback(async (bookingId: string) => {
    const peerId = generatePeerId();
    
    // Subscribe to channel
    subscribeToDrawingEvents(bookingId);

    setSession(prev => ({
      ...prev,
      bookingId,
      peerId,
      status: 'waiting',
    }));
  }, [generatePeerId, subscribeToDrawingEvents]);

  // End a session
  const endSession = useCallback(async () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'session-end',
        payload: {},
      });
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (session.bookingId) {
      await supabase
        .from('support_bookings')
        .update({ status: 'completed' })
        .eq('id', session.bookingId);
    }

    setSession({
      bookingId: null,
      peerId: null,
      remotePeerId: null,
      startedAt: null,
      status: 'ended',
    });
  }, [session.bookingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time remaining as MM:SS
  const formattedTimeRemaining = `${Math.floor(timeRemaining / 60000)}:${String(Math.floor((timeRemaining % 60000) / 1000)).padStart(2, '0')}`;

  return {
    session,
    timeRemaining,
    formattedTimeRemaining,
    drawingPoints,
    startSession,
    joinSession,
    endSession,
    broadcastDraw,
    clearDrawings,
    subscribeToDrawingEvents,
  };
}
