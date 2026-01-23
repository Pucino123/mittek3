import { useState, useRef, useCallback, useEffect } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PeerConnectionState {
  peerId: string | null;
  remotePeerId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerIdSavedToDb: boolean;
}

export function usePeerConnection(bookingId: string | null, isAdmin: boolean) {
  const [state, setState] = useState<PeerConnectionState>({
    peerId: null,
    remotePeerId: null,
    isConnected: false,
    isConnecting: false,
    localStream: null,
    remoteStream: null,
    peerIdSavedToDb: false,
  });
  
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hasCalledRef = useRef(false);

  // Save peer ID to database
  const savePeerIdToDb = useCallback(async (peerId: string) => {
    if (!bookingId) return false;
    
    const column = isAdmin ? 'admin_peer_id' : 'user_peer_id';
    console.log(`[PeerConnection] Saving ${column} to DB:`, peerId);
    
    const { error } = await supabase
      .from('support_bookings')
      .update({ [column]: peerId })
      .eq('id', bookingId);
    
    if (error) {
      console.error('[PeerConnection] Failed to save peer ID:', error);
      return false;
    }
    
    console.log(`[PeerConnection] ${column} saved successfully`);
    return true;
  }, [bookingId, isAdmin]);

  // Fetch remote peer ID from database
  const fetchRemotePeerId = useCallback(async () => {
    if (!bookingId) return null;
    
    const column = isAdmin ? 'user_peer_id' : 'admin_peer_id';
    console.log(`[PeerConnection] Fetching ${column} from DB...`);
    
    const { data, error } = await supabase
      .from('support_bookings')
      .select(column)
      .eq('id', bookingId)
      .single();
    
    if (error) {
      console.error('[PeerConnection] Failed to fetch remote peer ID:', error);
      return null;
    }
    
    const remotePeerId = data?.[column as keyof typeof data] as string | null;
    console.log(`[PeerConnection] ${column} from DB:`, remotePeerId);
    return remotePeerId;
  }, [bookingId, isAdmin]);

  // Subscribe to realtime updates for peer ID changes
  const subscribeToRemotePeerId = useCallback(() => {
    if (!bookingId || channelRef.current) return;
    
    const column = isAdmin ? 'user_peer_id' : 'admin_peer_id';
    console.log(`[PeerConnection] Subscribing to realtime updates for ${column}...`);
    
    const channel = supabase
      .channel(`booking-peer-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const newPeerId = payload.new[column] as string | null;
          console.log(`[PeerConnection] Realtime: ${column} changed to:`, newPeerId);
          
          if (newPeerId && newPeerId !== state.peerId) {
            setState(prev => ({ ...prev, remotePeerId: newPeerId }));
          }
        }
      )
      .subscribe((status) => {
        console.log('[PeerConnection] Realtime subscription status:', status);
      });
    
    channelRef.current = channel;
  }, [bookingId, isAdmin, state.peerId]);

  // Initialize peer and set up connection
  const initializePeer = useCallback(async () => {
    if (!bookingId) return;
    if (peerRef.current) {
      console.log('[PeerConnection] Peer already initialized');
      return;
    }
    
    setState(prev => ({ ...prev, isConnecting: true }));
    console.log('[PeerConnection] Initializing PeerJS...');
    
    try {
      // Create a new Peer instance
      const peer = new Peer();
      peerRef.current = peer;
      
      peer.on('open', async (id) => {
        console.log('[PeerConnection] My Peer ID is:', id);
        
        // Save to database immediately
        const saved = await savePeerIdToDb(id);
        setState(prev => ({ 
          ...prev, 
          peerId: id,
          peerIdSavedToDb: saved,
        }));
        
        // Subscribe to realtime updates for remote peer
        subscribeToRemotePeerId();
        
        // Fetch current remote peer ID from database
        const remotePeerId = await fetchRemotePeerId();
        if (remotePeerId) {
          console.log('[PeerConnection] Found remote peer ID:', remotePeerId);
          setState(prev => ({ ...prev, remotePeerId }));
        }
      });
      
      // Handle incoming calls (user side receives call from admin)
      peer.on('call', async (call) => {
        console.log('[PeerConnection] Incoming call from:', call.peer);
        
        try {
          // Get screen share stream with audio for user
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          
          // Also get microphone audio for two-way voice
          let micStream: MediaStream | null = null;
          try {
            micStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
          } catch (micError) {
            console.warn('[PeerConnection] Microphone access denied:', micError);
            toast.warning('Mikrofon ikke tilgængelig - kun skærmdeling');
          }
          
          // Combine screen + mic into one stream
          const combinedStream = new MediaStream();
          displayStream.getTracks().forEach(track => combinedStream.addTrack(track));
          if (micStream) {
            micStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
          }
          
          setState(prev => ({ ...prev, localStream: combinedStream }));
          
          // Handle stream end
          displayStream.getVideoTracks()[0].onended = () => {
            toast.info('Skærmdeling stoppet');
            if (micStream) {
              micStream.getTracks().forEach(track => track.stop());
            }
            setState(prev => ({ ...prev, localStream: null }));
          };
          
          // Answer the call with combined stream
          call.answer(combinedStream);
          callRef.current = call;
          
          call.on('stream', (remoteStream) => {
            console.log('[PeerConnection] Received remote stream');
            setState(prev => ({ 
              ...prev, 
              remoteStream,
              isConnected: true,
              isConnecting: false,
            }));
          });
          
          call.on('close', () => {
            console.log('[PeerConnection] Call closed');
            setState(prev => ({ 
              ...prev, 
              isConnected: false,
              remoteStream: null,
            }));
          });
          
        } catch (error) {
          console.error('[PeerConnection] Failed to get screen share:', error);
          toast.error('Kunne ikke starte skærmdeling');
        }
      });
      
      peer.on('error', (err) => {
        console.error('[PeerConnection] PeerJS error:', err);
        toast.error('Forbindelsesfejl: ' + err.type);
        setState(prev => ({ ...prev, isConnecting: false }));
      });
      
    } catch (error) {
      console.error('[PeerConnection] Failed to initialize peer:', error);
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [bookingId, savePeerIdToDb, subscribeToRemotePeerId, fetchRemotePeerId]);

  // Call remote peer (admin calls user)
  const callRemotePeer = useCallback(async (remotePeerId: string, stream: MediaStream) => {
    if (!peerRef.current) {
      toast.error('Peer forbindelse ikke klar');
      return;
    }
    
    if (hasCalledRef.current) {
      console.log('[PeerConnection] Already called, skipping...');
      return;
    }
    hasCalledRef.current = true;
    
    console.log('[PeerConnection] Calling remote peer:', remotePeerId);
    setState(prev => ({ ...prev, isConnecting: true, localStream: stream }));
    
    const call = peerRef.current.call(remotePeerId, stream);
    callRef.current = call;
    
    call.on('stream', (remoteStream) => {
      console.log('[PeerConnection] Received remote stream from call');
      setState(prev => ({ 
        ...prev, 
        remoteStream,
        isConnected: true,
        isConnecting: false,
      }));
      toast.success('Forbindelse oprettet!');
    });
    
    call.on('close', () => {
      console.log('[PeerConnection] Call ended');
      hasCalledRef.current = false;
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        remoteStream: null,
      }));
    });
    
    call.on('error', (err) => {
      console.error('[PeerConnection] Call error:', err);
      hasCalledRef.current = false;
      toast.error('Opkaldsfejl');
      setState(prev => ({ ...prev, isConnecting: false }));
    });
  }, []);

  // Start screen share and call with audio (for admin)
  const startScreenShareCall = useCallback(async () => {
    if (!state.remotePeerId) {
      toast.error('Venter på modpart...');
      return;
    }
    
    try {
      // Get screen share with system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      // Also get microphone for two-way voice
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (micError) {
        console.warn('[PeerConnection] Microphone access denied:', micError);
        toast.warning('Mikrofon ikke tilgængelig - kun skærmdeling');
      }
      
      // Combine screen + mic into one stream
      const combinedStream = new MediaStream();
      displayStream.getTracks().forEach(track => combinedStream.addTrack(track));
      if (micStream) {
        micStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      }
      
      displayStream.getVideoTracks()[0].onended = () => {
        toast.info('Skærmdeling stoppet');
        if (micStream) {
          micStream.getTracks().forEach(track => track.stop());
        }
        endCall();
      };
      
      await callRemotePeer(state.remotePeerId, combinedStream);
    } catch (error) {
      console.error('[PeerConnection] Failed to get display media:', error);
      toast.error('Kunne ikke starte skærmdeling');
    }
  }, [state.remotePeerId, callRemotePeer]);

  // Auto-call when remote peer ID is available (admin only)
  useEffect(() => {
    if (isAdmin && state.remotePeerId && state.peerId && !state.isConnected && !state.isConnecting && !hasCalledRef.current) {
      console.log('[PeerConnection] Auto-calling user...');
      startScreenShareCall();
    }
  }, [isAdmin, state.remotePeerId, state.peerId, state.isConnected, state.isConnecting, startScreenShareCall]);

  // End call and cleanup
  const endCall = useCallback(() => {
    hasCalledRef.current = false;
    
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      localStream: null,
      remoteStream: null,
    }));
  }, [state.localStream]);

  // Reconnect - destroy peer and reinitialize
  const reconnect = useCallback(async () => {
    console.log('[PeerConnection] Reconnecting...');
    hasCalledRef.current = false;
    
    // End current call
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    
    // Stop local streams
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    
    // Unsubscribe from realtime
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    // Reset state but keep remotePeerId if we had it
    const previousRemotePeerId = state.remotePeerId;
    setState({
      peerId: null,
      remotePeerId: previousRemotePeerId,
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      peerIdSavedToDb: false,
    });
    
    // Reinitialize after a short delay
    await new Promise(resolve => setTimeout(resolve, 500));
    await initializePeer();
    
    toast.info('Genopretter forbindelse...');
  }, [state.localStream, state.remotePeerId, initializePeer]);

  // Cleanup on unmount
  const cleanup = useCallback(async () => {
    endCall();
    
    // Clear peer ID from database
    if (bookingId) {
      const column = isAdmin ? 'admin_peer_id' : 'user_peer_id';
      await supabase
        .from('support_bookings')
        .update({ [column]: null })
        .eq('id', bookingId);
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    hasCalledRef.current = false;
    
    setState({
      peerId: null,
      remotePeerId: null,
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      peerIdSavedToDb: false,
    });
  }, [endCall, bookingId, isAdmin]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    ...state,
    initializePeer,
    startScreenShareCall,
    callRemotePeer,
    endCall,
    reconnect,
    cleanup,
  };
}
