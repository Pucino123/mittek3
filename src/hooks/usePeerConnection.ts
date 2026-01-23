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
  screenShareReady: boolean; // NEW: Track if user has shared screen
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
    screenShareReady: false,
  });
  
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hasCalledRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null); // Keep stream reference for answering calls

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

  // USER ONLY: Get screen share stream FIRST before signaling readiness
  const startUserScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    console.log('[PeerConnection] User: Starting screen share...');
    
    // Clear any previous state
    if (localStreamRef.current) {
      console.log('[PeerConnection] User: Cleaning up previous stream');
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    try {
      // Get screen share with system audio
      console.log('[PeerConnection] User: Requesting getDisplayMedia...');
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: true,
      });
      
      const videoTracks = displayStream.getVideoTracks();
      console.log('[PeerConnection] User: Screen share acquired, video tracks:', videoTracks.length);
      console.log('[PeerConnection] User: All tracks:', displayStream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`));
      
      if (videoTracks.length === 0) {
        console.error('[PeerConnection] User: No video tracks in display stream!');
        return null;
      }
      
      // Also get microphone for two-way voice
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        });
        console.log('[PeerConnection] User: Microphone acquired');
      } catch (micError) {
        console.warn('[PeerConnection] User: Microphone access denied:', micError);
        toast.warning('Mikrofon ikke tilgængelig - kun skærmdeling');
      }
      
      // Combine screen + mic into one stream
      const combinedStream = new MediaStream();
      displayStream.getTracks().forEach(track => {
        combinedStream.addTrack(track);
        console.log('[PeerConnection] User: Added track to combined stream:', track.kind, track.label, track.readyState);
      });
      if (micStream) {
        micStream.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track);
          console.log('[PeerConnection] User: Added mic track to combined stream:', track.kind, track.label);
        });
      }
      
      // Store in ref for answering calls - CRITICAL: do this BEFORE updating state
      localStreamRef.current = combinedStream;
      console.log('[PeerConnection] User: Stored stream in localStreamRef, tracks:', 
        localStreamRef.current.getTracks().map(t => `${t.kind}:${t.readyState}`));
      
      // Handle stream end (user stops sharing)
      videoTracks[0].onended = () => {
        console.log('[PeerConnection] User: Screen share stopped by user');
        toast.info('Skærmdeling stoppet');
        if (micStream) {
          micStream.getTracks().forEach(track => track.stop());
        }
        localStreamRef.current = null;
        setState(prev => ({ ...prev, localStream: null, screenShareReady: false }));
      };
      
      // Update state to reflect screen share is ready
      setState(prev => ({ 
        ...prev, 
        localStream: combinedStream, 
        screenShareReady: true 
      }));
      
      console.log('[PeerConnection] User: Screen share setup complete, screenShareReady=true');
      
      return combinedStream;
    } catch (error: unknown) {
      // User cancelled the screen share picker
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('[PeerConnection] User: Screen share cancelled by user');
        return null;
      }
      console.error('[PeerConnection] User: Failed to get screen share:', error);
      toast.error('Kunne ikke starte skærmdeling. Prøv igen.');
      return null;
    }
  }, []);

  // Initialize peer connection (for User: call AFTER screen share is ready)
  const initializePeer = useCallback(async (requireScreenShare = false) => {
    if (!bookingId) return;
    if (peerRef.current) {
      console.log('[PeerConnection] Peer already initialized');
      return;
    }
    
    // For user (non-admin), require screen share to be ready before initializing
    if (!isAdmin && requireScreenShare && !localStreamRef.current) {
      console.error('[PeerConnection] User: Cannot initialize peer without screen share');
      toast.error('Del din skærm først');
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
      peer.on('call', (call) => {
        console.log('[PeerConnection] Incoming call from:', call.peer);
        
        // CRITICAL FIX: Use the pre-acquired stream from localStreamRef
        const stream = localStreamRef.current;
        
        if (!stream) {
          console.error('[PeerConnection] No local stream available to answer call!');
          toast.error('Skærmdeling ikke klar - kunne ikke besvare opkald');
          return;
        }
        
        console.log('[PeerConnection] Answering call with stream tracks:', stream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`));
        
        // Answer the call with the pre-acquired stream
        call.answer(stream);
        callRef.current = call;
        
        call.on('stream', (remoteStream) => {
          console.log('[PeerConnection] User: Received remote stream from admin');
          console.log('[PeerConnection] User: Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`));
          
          setState(prev => ({ 
            ...prev, 
            remoteStream,
            isConnected: true,
            isConnecting: false,
          }));
          toast.success('Forbindelse oprettet!');
        });
        
        call.on('close', () => {
          console.log('[PeerConnection] Call closed');
          setState(prev => ({ 
            ...prev, 
            isConnected: false,
            remoteStream: null,
          }));
        });
        
        call.on('error', (err) => {
          console.error('[PeerConnection] Call error (user side):', err);
          toast.error('Opkaldsfejl');
        });
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
  }, [bookingId, isAdmin, savePeerIdToDb, subscribeToRemotePeerId, fetchRemotePeerId]);

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
    
    console.log('[PeerConnection] Admin: Calling remote peer:', remotePeerId);
    console.log('[PeerConnection] Admin: Sending stream with tracks:', stream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`));
    
    setState(prev => ({ ...prev, isConnecting: true, localStream: stream }));
    
    const call = peerRef.current.call(remotePeerId, stream);
    callRef.current = call;
    
    call.on('stream', (remoteStream) => {
      console.log('[PeerConnection] Admin: Received remote stream from user');
      console.log('[PeerConnection] Admin: Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`));
      
      // CRITICAL DEBUG: Check if tracks are active
      const videoTracks = remoteStream.getVideoTracks();
      const audioTracks = remoteStream.getAudioTracks();
      console.log('[PeerConnection] Admin: Video tracks count:', videoTracks.length);
      console.log('[PeerConnection] Admin: Audio tracks count:', audioTracks.length);
      
      if (videoTracks.length === 0) {
        console.error('[PeerConnection] Admin: WARNING - No video tracks in remote stream!');
        toast.warning('Brugerens skærmdeling har ingen video');
      }
      
      setState(prev => ({ 
        ...prev, 
        remoteStream,
        isConnected: true,
        isConnecting: false,
      }));
      toast.success('Forbindelse oprettet!');
    });
    
    call.on('close', () => {
      console.log('[PeerConnection] Admin: Call ended');
      hasCalledRef.current = false;
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        remoteStream: null,
      }));
    });
    
    call.on('error', (err) => {
      console.error('[PeerConnection] Admin: Call error:', err);
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
    localStreamRef.current = null;
    
    setState({
      peerId: null,
      remotePeerId: previousRemotePeerId,
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      peerIdSavedToDb: false,
      screenShareReady: false,
    });
    
    // Reinitialize after a short delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For user, they need to re-share screen first
    if (!isAdmin) {
      toast.info('Del din skærm igen for at genoprette forbindelsen');
    } else {
      await initializePeer();
      toast.info('Genopretter forbindelse...');
    }
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
    
    localStreamRef.current = null;
    
    setState({
      peerId: null,
      remotePeerId: null,
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      peerIdSavedToDb: false,
      screenShareReady: false,
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
    startUserScreenShare,
    startScreenShareCall,
    callRemotePeer,
    endCall,
    reconnect,
    cleanup,
  };
}
