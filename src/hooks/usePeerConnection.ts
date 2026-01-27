import { useState, useRef, useCallback, useEffect } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// React 18 StrictMode (dev) mounts/unmounts components twice.
// If we run destructive cleanup in the first "fake" unmount, screen share and PeerJS
// will be torn down immediately (looks like a page refresh / 1s connection).
// We debounce unmount cleanup across component instances using a module-level map.
const pendingUnmountCleanupTimers = new Map<string, number>();

// Polling interval for fallback peer ID fetching (5 seconds)
const POLLING_INTERVAL_MS = 5000;

// Connection timeout in milliseconds (15 seconds)
const CONNECTION_TIMEOUT_MS = 15000;

export type ScreenShareError = 
  | 'cancelled'        // User cancelled the picker dialog
  | 'permission'       // Permission denied
  | 'no_video_track'   // Stream has no video tracks
  | 'unknown'          // Unknown error
  | null;              // No error (ready or not attempted)

// Stream type as detected from getSettings().displaySurface
export type StreamSurfaceType = 'browser' | 'window' | 'monitor' | 'unknown' | null;

// ICE connection state for debugging
export type IceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed' | null;

// Connection status for more granular UI feedback
export type ConnectionStatus = 
  | 'idle'
  | 'waiting_for_stream'
  | 'calling'
  | 'ice_checking'
  | 'connected'
  | 'timeout'
  | 'failed';

interface PeerConnectionState {
  peerId: string | null;
  remotePeerId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerIdSavedToDb: boolean;
  screenShareReady: boolean; // Track if user has shared screen
  screenShareError: ScreenShareError; // Track why screen share failed
  bookingStatus: string | null; // Track booking status for UI feedback
  streamSurfaceType: StreamSurfaceType; // What type of surface is being shared
  iceState: IceConnectionState; // ICE connection state for debugging
  connectionStatus: ConnectionStatus; // More granular connection status
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
    screenShareError: null,
    bookingStatus: null,
    streamSurfaceType: null,
    iceState: null,
    connectionStatus: 'idle',
  });
  
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const statusChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hasCalledRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null); // Keep stream reference for answering calls
  const isInitializedRef = useRef(false); // CRITICAL: Prevent double-init in React Strict Mode
  const isMountedRef = useRef(true); // Track if component is truly mounted
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout for connection
  const hasReceivedRemoteStreamRef = useRef(false); // Track if stream was actually received (for robust timeout)

  const cleanupKey = `${bookingId ?? 'no-booking'}:${isAdmin ? 'admin' : 'user'}`;

  // Save peer ID to database with toast notification
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
      toast.error('Kunne ikke gemme forbindelses-ID');
      return false;
    }
    
    console.log(`[PeerConnection] ${column} saved successfully`);
    toast.success(isAdmin ? 'Klar til at modtage forbindelse' : 'Dit ID er gemt - venter på tekniker');
    return true;
  }, [bookingId, isAdmin]);

  // Fetch remote peer ID from database
  const fetchRemotePeerId = useCallback(async (): Promise<string | null> => {
    if (!bookingId) return null;
    
    const column = isAdmin ? 'user_peer_id' : 'admin_peer_id';
    console.log(`[PeerConnection] Fetching ${column} from DB...`);
    
    const { data, error } = await supabase
      .from('support_bookings')
      .select(`${column}, status`)
      .eq('id', bookingId)
      .single();
    
    if (error) {
      console.error('[PeerConnection] Failed to fetch remote peer ID:', error);
      return null;
    }
    
    const remotePeerId = data?.[column as keyof typeof data] as string | null;
    const status = data?.status as string | null;
    
    console.log(`[PeerConnection] ${column} from DB:`, remotePeerId, 'status:', status);
    
    // Update booking status in state
    if (status && isMountedRef.current) {
      setState(prev => ({ ...prev, bookingStatus: status }));
    }
    
    return remotePeerId;
  }, [bookingId, isAdmin]);

  // Force fetch remote peer ID (for manual retry button)
  const forceFetchRemotePeerId = useCallback(async () => {
    console.log('[PeerConnection] Force fetching remote peer ID...');
    toast.info('Henter forbindelses-ID...');
    
    const remotePeerId = await fetchRemotePeerId();
    
    if (remotePeerId && isMountedRef.current) {
      setState(prev => ({ ...prev, remotePeerId }));
      toast.success('Fundet! Opretter forbindelse...');
    } else {
      toast.warning('Modpartens ID ikke fundet endnu');
    }
    
    return remotePeerId;
  }, [fetchRemotePeerId]);

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
          const newStatus = payload.new['status'] as string | null;
          console.log(`[PeerConnection] Realtime: ${column} changed to:`, newPeerId, 'status:', newStatus);
          
          if (isMountedRef.current) {
            setState(prev => ({ 
              ...prev, 
              remotePeerId: newPeerId || prev.remotePeerId,
              bookingStatus: newStatus || prev.bookingStatus,
            }));
            
            if (newPeerId && !state.remotePeerId) {
              toast.success(isAdmin ? 'Bruger er klar!' : 'Tekniker er klar!');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[PeerConnection] Realtime subscription status:', status);
      });
    
    channelRef.current = channel;
  }, [bookingId, isAdmin, state.remotePeerId]);

  // Start polling for remote peer ID as backup to realtime
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return; // Already polling
    
    console.log('[PeerConnection] Starting polling backup...');
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current || state.remotePeerId || state.isConnected) {
        // Stop polling if we have remote peer ID or are connected
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }
      
      console.log('[PeerConnection] Polling for remote peer ID...');
      const remotePeerId = await fetchRemotePeerId();
      
      if (remotePeerId && isMountedRef.current && !state.remotePeerId) {
        console.log('[PeerConnection] Polling found remote peer ID:', remotePeerId);
        setState(prev => ({ ...prev, remotePeerId }));
        toast.success(isAdmin ? 'Bruger fundet via polling!' : 'Tekniker fundet via polling!');
        
        // Stop polling once we have the ID
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    }, POLLING_INTERVAL_MS);
  }, [fetchRemotePeerId, isAdmin, state.remotePeerId, state.isConnected]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

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
      // Note: We don't restrict displaySurface - let user choose tab/window/screen freely
      console.log('[PeerConnection] User: Requesting getDisplayMedia (no surface hint)...');
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // No displaySurface hint - allows tab/window/screen equally
        audio: true,
      });
      
      const videoTracks = displayStream.getVideoTracks();
      console.log('[PeerConnection] User: Screen share acquired, video tracks:', videoTracks.length);
      console.log('[PeerConnection] User: All tracks:', displayStream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`));
      
      if (videoTracks.length === 0) {
        console.error('[PeerConnection] User: No video tracks in display stream!');
        setState(prev => ({ ...prev, screenShareError: 'no_video_track', streamSurfaceType: null }));
        return null;
      }
      
      // Detect what type of surface the user chose to share
      const videoTrack = videoTracks[0];
      const trackSettings = videoTrack.getSettings();
      const surfaceType = (trackSettings as { displaySurface?: string }).displaySurface as StreamSurfaceType || 'unknown';
      console.log('[PeerConnection] User: Stream surface type:', surfaceType);
      console.log('[PeerConnection] User: Track settings:', JSON.stringify(trackSettings));
      
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
      
      // Handle stream end (user stops sharing) - also clear peer ID from DB
      videoTracks[0].onended = async () => {
        console.log('[PeerConnection] User: Screen share stopped by user');
        toast.info('Skærmdeling stoppet');
        if (micStream) {
          micStream.getTracks().forEach(track => track.stop());
        }
        localStreamRef.current = null;
        setState(prev => ({ ...prev, localStream: null, screenShareReady: false, screenShareError: 'cancelled', streamSurfaceType: null }));
        
        // Clear user_peer_id from DB so admin knows user is no longer sharing
        if (bookingId) {
          console.log('[PeerConnection] User: Clearing user_peer_id from DB after screen share ended');
          await supabase
            .from('support_bookings')
            .update({ user_peer_id: null })
            .eq('id', bookingId);
        }
      };
      
      // Update state to reflect screen share is ready (clear any previous error)
      setState(prev => ({ 
        ...prev, 
        localStream: combinedStream, 
        screenShareReady: true,
        screenShareError: null,
        streamSurfaceType: surfaceType,
      }));
      
      console.log('[PeerConnection] User: Screen share setup complete, screenShareReady=true, surfaceType:', surfaceType);
      
      return combinedStream;
    } catch (error: unknown) {
      // User cancelled the screen share picker
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('[PeerConnection] User: Screen share cancelled by user');
        setState(prev => ({ ...prev, screenShareError: 'cancelled' }));
        return null;
      }
      // Permission denied (e.g. in Safari or enterprise policies)
      if (error instanceof Error && error.name === 'NotFoundError') {
        console.log('[PeerConnection] User: Screen share permission denied');
        setState(prev => ({ ...prev, screenShareError: 'permission' }));
        return null;
      }
      console.error('[PeerConnection] User: Failed to get screen share:', error);
      setState(prev => ({ ...prev, screenShareError: 'unknown' }));
      toast.error('Kunne ikke starte skærmdeling. Prøv igen.');
      return null;
    }
  }, [bookingId]);

  // Initialize peer connection (for User: call AFTER screen share is ready)
  const initializePeer = useCallback(async (requireScreenShare = false) => {
    if (!bookingId) return;
    
    // CRITICAL: Prevent double-initialization (React Strict Mode fix)
    if (peerRef.current || isInitializedRef.current) {
      console.log('[PeerConnection] Peer already initialized, skipping');
      return;
    }
    isInitializedRef.current = true;
    
    // For user (non-admin), require screen share to be ready before initializing
    if (!isAdmin && requireScreenShare && !localStreamRef.current) {
      console.error('[PeerConnection] User: Cannot initialize peer without screen share');
      toast.error('Del din skærm først');
      isInitializedRef.current = false;
      return;
    }
    
    setState(prev => ({ ...prev, isConnecting: true }));
    console.log('[PeerConnection] Initializing PeerJS...');
    
    try {
      // Create a new Peer instance
      const peer = new Peer();
      peerRef.current = peer;
      
      peer.on('open', async (id) => {
        // CRITICAL: Check if still mounted before updating state
        if (!isMountedRef.current) {
          console.log('[PeerConnection] Component unmounted during peer open, cleaning up');
          peer.destroy();
          return;
        }
        
        console.log('[PeerConnection] My Peer ID is:', id);
        
        // Save to database immediately
        const saved = await savePeerIdToDb(id);
        
        if (!isMountedRef.current) return;
        
        // CRITICAL FIX: Reset isConnecting to false after peer is ready
        // This allows auto-call to trigger and UI to show correct status
        setState(prev => ({ 
          ...prev, 
          peerId: id,
          peerIdSavedToDb: saved,
          isConnecting: false, // Peer is ready, not actively connecting yet
          connectionStatus: 'idle', // Ready but not in a call
        }));
        
        console.log('[PeerConnection] Peer ready, isConnecting reset to false');
        
        // Subscribe to realtime updates for remote peer
        subscribeToRemotePeerId();
        
        // Start polling as backup for realtime
        startPolling();
        
        // Fetch current remote peer ID from database
        const remotePeerId = await fetchRemotePeerId();
        if (remotePeerId && isMountedRef.current) {
          console.log('[PeerConnection] Found remote peer ID:', remotePeerId);
          setState(prev => ({ ...prev, remotePeerId }));
        }
      });
      
      // Handle incoming calls (user side receives call from admin)
      peer.on('call', (call) => {
        console.log('[PeerConnection] ========================================');
        console.log('[PeerConnection] INCOMING CALL RECEIVED from:', call.peer);
        console.log('[PeerConnection] ========================================');
        
        // CRITICAL FIX: Use the pre-acquired stream from localStreamRef
        const stream = localStreamRef.current;
        
        if (!stream) {
          console.error('[PeerConnection] No local stream available to answer call!');
          console.error('[PeerConnection] localStreamRef.current is:', localStreamRef.current);
          toast.error('Skærmdeling ikke klar - kunne ikke besvare opkald');
          return;
        }
        
        // Validate stream has active tracks
        const tracks = stream.getTracks();
        const activeTracks = tracks.filter(t => t.readyState === 'live');
        console.log('[PeerConnection] Stream tracks:', tracks.length, 'Active tracks:', activeTracks.length);
        console.log('[PeerConnection] Track details:', tracks.map(t => `${t.kind}:${t.label}:${t.readyState}`));
        
        if (activeTracks.length === 0) {
          console.error('[PeerConnection] All tracks are ended/stopped! Stream is invalid.');
          toast.error('Skærmdeling er stoppet - del din skærm igen');
          return;
        }
        
        console.log('[PeerConnection] Answering call with', activeTracks.length, 'active tracks...');
        
        // Answer the call with the pre-acquired stream
        call.answer(stream);
        callRef.current = call;
        
        // Setup ICE monitoring on user side too
        const peerConnection = (call as { peerConnection?: RTCPeerConnection }).peerConnection;
        if (peerConnection) {
          console.log('[PeerConnection] User: Setting up ICE monitoring for answered call');
          peerConnection.oniceconnectionstatechange = () => {
            console.log('[PeerConnection] User: ICE state changed to:', peerConnection.iceConnectionState);
            if (isMountedRef.current) {
              setState(prev => ({ ...prev, iceState: peerConnection.iceConnectionState as IceConnectionState }));
            }
          };
        }
        
        call.on('stream', (remoteStream) => {
          if (!isMountedRef.current) return;
          
          console.log('[PeerConnection] User: Received remote stream from admin');
          console.log('[PeerConnection] User: Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`));
          
          setState(prev => ({ 
            ...prev, 
            remoteStream,
            isConnected: true,
            isConnecting: false,
            connectionStatus: 'connected',
          }));
          toast.success('Forbindelse oprettet!');
        });
        
        call.on('close', () => {
          if (!isMountedRef.current) return;
          console.log('[PeerConnection] Call closed');
          setState(prev => ({ 
            ...prev, 
            isConnected: false,
            remoteStream: null,
          }));
        });
        
        call.on('error', (err) => {
          console.error('[PeerConnection] Call error (user side):', err);
          if (isMountedRef.current) {
            toast.error('Opkaldsfejl');
          }
        });
      });
      
      peer.on('error', (err) => {
        console.error('[PeerConnection] PeerJS error:', err);
        if (isMountedRef.current) {
          toast.error('Forbindelsesfejl: ' + err.type);
          setState(prev => ({ ...prev, isConnecting: false }));
        }
      });
      
      // CRITICAL: Handle peer disconnection
      peer.on('disconnected', () => {
        console.log('[PeerConnection] Peer disconnected from signaling server');
        // Don't destroy - try to reconnect
        if (peerRef.current && isMountedRef.current) {
          console.log('[PeerConnection] Attempting to reconnect...');
          peerRef.current.reconnect();
        }
      });
      
    } catch (error) {
      console.error('[PeerConnection] Failed to initialize peer:', error);
      isInitializedRef.current = false;
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [bookingId, isAdmin, savePeerIdToDb, subscribeToRemotePeerId, fetchRemotePeerId]);

  // Clear connection timeout
  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Setup ICE connection state monitoring
  const setupIceMonitoring = useCallback((call: MediaConnection) => {
    // Access the underlying RTCPeerConnection
    const peerConnection = (call as { peerConnection?: RTCPeerConnection }).peerConnection;
    
    if (!peerConnection) {
      console.log('[PeerConnection] No peerConnection available for ICE monitoring');
      return;
    }
    
    console.log('[PeerConnection] Setting up ICE connection monitoring');
    
    peerConnection.oniceconnectionstatechange = () => {
      const iceState = peerConnection.iceConnectionState as IceConnectionState;
      console.log('[PeerConnection] ICE connection state changed:', iceState);
      
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, iceState }));
      }
      
      // Handle ICE failures
      if (iceState === 'failed' || iceState === 'disconnected') {
        console.error('[PeerConnection] ICE connection failed/disconnected');
        if (isMountedRef.current) {
          toast.error('Netværksforbindelse fejlede - prøv "Genopret forbindelse"');
          setState(prev => ({ 
            ...prev, 
            isConnecting: false,
            connectionStatus: 'failed',
          }));
        }
        clearConnectionTimeout();
      }
    };
    
    // Also monitor ICE gathering state for debugging
    peerConnection.onicegatheringstatechange = () => {
      console.log('[PeerConnection] ICE gathering state:', peerConnection.iceGatheringState);
    };
  }, [clearConnectionTimeout]);

  // Call remote peer (admin calls user)
  const callRemotePeer = useCallback(async (remotePeerId: string, stream: MediaStream) => {
    if (!peerRef.current) {
      console.error('[PeerConnection] Admin: No peer reference available!');
      toast.error('Peer forbindelse ikke klar');
      return;
    }
    
    if (hasCalledRef.current) {
      console.log('[PeerConnection] Already called, skipping...');
      return;
    }
    hasCalledRef.current = true;
    hasReceivedRemoteStreamRef.current = false; // Reset stream received flag
    
    console.log('[PeerConnection] ========================================');
    console.log('[PeerConnection] Admin: INITIATING CALL to:', remotePeerId);
    console.log('[PeerConnection] Admin: My peer ID:', peerRef.current.id);
    console.log('[PeerConnection] Admin: Peer open:', !peerRef.current.disconnected);
    console.log('[PeerConnection] Admin: Stream tracks:', stream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`));
    console.log('[PeerConnection] ========================================');
    
    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      localStream: stream,
      connectionStatus: 'calling',
    }));
    
    const call = peerRef.current.call(remotePeerId, stream);
    
    if (!call) {
      console.error('[PeerConnection] Admin: call() returned null/undefined!');
      hasCalledRef.current = false;
      toast.error('Kunne ikke oprette opkald - prøv igen');
      setState(prev => ({ ...prev, isConnecting: false, connectionStatus: 'failed' }));
      return;
    }
    
    console.log('[PeerConnection] Admin: Call object created successfully');
    callRef.current = call;
    
    // Setup ICE monitoring for debugging
    setupIceMonitoring(call);
    
    // Listen for PeerJS-specific events on the call
    call.on('willCloseOnRemote', () => {
      console.log('[PeerConnection] Admin: Remote peer will close the call');
    });
    
    // Log when call is actually established
    console.log('[PeerConnection] Admin: Waiting for stream event...');
    
    // ROBUST TIMEOUT FIX: Use hasReceivedRemoteStreamRef instead of call.open
    // call.open can become true before stream event fires, causing false negatives
    clearConnectionTimeout();
    connectionTimeoutRef.current = setTimeout(() => {
      // Check if we actually received a stream (not just call.open)
      const stillWaitingForStream = callRef.current === call && !hasReceivedRemoteStreamRef.current;
      
      if (isMountedRef.current && stillWaitingForStream) {
        console.error('[PeerConnection] ========================================');
        console.error('[PeerConnection] CONNECTION TIMEOUT after', CONNECTION_TIMEOUT_MS, 'ms');
        console.error('[PeerConnection] Call object:', call);
        console.error('[PeerConnection] Call open:', call?.open);
        console.error('[PeerConnection] Stream received:', hasReceivedRemoteStreamRef.current);
        console.error('[PeerConnection] ========================================');
        
        toast.error('Forbindelse timeout - brugerens skærm modtages ikke. Prøv "Genopret forbindelse".');
        
        hasCalledRef.current = false;
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          connectionStatus: 'timeout',
        }));
      }
    }, CONNECTION_TIMEOUT_MS);
    
    call.on('stream', (remoteStream) => {
      if (!isMountedRef.current) return;
      
      // CRITICAL: Mark that we received the stream (for robust timeout)
      hasReceivedRemoteStreamRef.current = true;
      
      // Clear timeout since we received the stream
      clearConnectionTimeout();
      
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
      
      // Try to detect the stream surface type from the remote stream
      let detectedSurfaceType: StreamSurfaceType = null;
      if (videoTracks.length > 0) {
        const settings = videoTracks[0].getSettings();
        detectedSurfaceType = (settings as { displaySurface?: string }).displaySurface as StreamSurfaceType || 'unknown';
        console.log('[PeerConnection] Admin: Detected remote stream surface type:', detectedSurfaceType);
      }
      
      setState(prev => ({ 
        ...prev, 
        remoteStream,
        isConnected: true,
        isConnecting: false,
        connectionStatus: 'connected',
        streamSurfaceType: detectedSurfaceType || prev.streamSurfaceType,
        iceState: 'connected',
      }));
      toast.success('Forbindelse oprettet!');
    });
    
    call.on('close', () => {
      if (!isMountedRef.current) return;
      console.log('[PeerConnection] Admin: Call ended');
      hasCalledRef.current = false;
      clearConnectionTimeout();
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        remoteStream: null,
        connectionStatus: 'idle',
        iceState: 'closed',
      }));
    });
    
    call.on('error', (err) => {
      console.error('[PeerConnection] Admin: Call error:', err);
      hasCalledRef.current = false;
      clearConnectionTimeout();
      if (isMountedRef.current) {
        toast.error('Opkaldsfejl: ' + err.message);
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          connectionStatus: 'failed',
        }));
      }
    });
  }, [setupIceMonitoring, clearConnectionTimeout, state.isConnected, state.isConnecting]);

  // Start call to user - admin only sends audio, receives user's screen share
  const startScreenShareCall = useCallback(async () => {
    if (!state.remotePeerId) {
      toast.error('Venter på modpart...');
      return;
    }
    
    try {
      // Admin does NOT share their screen - they only need to send audio
      // and receive the USER's screen share
      let audioStream: MediaStream | null = null;
      
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        });
        console.log('[PeerConnection] Admin: Got microphone stream');
      } catch (micError) {
        console.warn('[PeerConnection] Admin: Microphone access denied:', micError);
        toast.warning('Mikrofon ikke tilgængelig - kun modtagelse af skærmdeling');
      }
      
      // Create a minimal stream (even if no audio, PeerJS needs a stream to call)
      const callStream = audioStream || new MediaStream();
      
      console.log('[PeerConnection] Admin: Calling user to receive their screen share');
      await callRemotePeer(state.remotePeerId, callStream);
    } catch (error) {
      console.error('[PeerConnection] Admin: Failed to start call:', error);
      toast.error('Kunne ikke oprette forbindelse');
    }
  }, [state.remotePeerId, callRemotePeer]);

  // Auto-call when remote peer ID is available (admin only)
  // Add a small delay to ensure user's peer is fully ready to receive calls
  useEffect(() => {
    if (isAdmin && state.remotePeerId && state.peerId && !state.isConnected && !state.isConnecting && !hasCalledRef.current) {
      console.log('[PeerConnection] Admin: Remote peer ID detected, waiting 1.5s before calling...');
      
      const callDelayTimer = setTimeout(() => {
        if (isMountedRef.current && !hasCalledRef.current && !state.isConnected) {
          console.log('[PeerConnection] Admin: Delay complete, auto-calling user now...');
          startScreenShareCall();
        }
      }, 1500); // 1.5 second delay to ensure user's peer is ready
      
      return () => clearTimeout(callDelayTimer);
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
    
    // Avoid state updates during unmount (StrictMode fake unmount included)
    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        localStream: null,
        remoteStream: null,
      }));
    }
  }, [state.localStream]);

  // Reconnect - destroy peer and reinitialize
  const reconnect = useCallback(async () => {
    console.log('[PeerConnection] Reconnecting...');
    hasCalledRef.current = false;
    isInitializedRef.current = false; // Allow re-initialization
    
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
      screenShareError: null,
      bookingStatus: null,
      streamSurfaceType: null,
      iceState: null,
      connectionStatus: 'idle',
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
  }, [state.localStream, state.remotePeerId, initializePeer, isAdmin]);

  // Cleanup (manual or true unmount)
  const cleanupNow = useCallback(async () => {
    console.log('[PeerConnection] Cleanup called');

    // If we're already unmounted, do not attempt setState (but still stop resources + clear DB)
    const canSetState = isMountedRef.current;
    isMountedRef.current = false;

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
    
    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    hasCalledRef.current = false;
    isInitializedRef.current = false;
    
    localStreamRef.current = null;
    
    if (canSetState) {
      setState({
        peerId: null,
        remotePeerId: null,
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      peerIdSavedToDb: false,
      screenShareReady: false,
      screenShareError: null,
      bookingStatus: null,
      streamSurfaceType: null,
      iceState: null,
      connectionStatus: 'idle',
    });
    }
  }, [endCall, bookingId, isAdmin]);

  // Abort connection attempt - cancel ongoing call and reset state
  const abortConnection = useCallback(() => {
    console.log('[PeerConnection] Aborting connection attempt...');
    clearConnectionTimeout();
    hasCalledRef.current = false;
    
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    
    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStatus: 'idle',
        iceState: null,
      }));
      toast.info('Forbindelsesforsøg afbrudt');
    }
  }, [clearConnectionTimeout]);

  // CRITICAL: StrictMode-safe mount/unmount handling.
  // Debounce cleanup to the next tick and cancel if we remount immediately.
  useEffect(() => {
    const pending = pendingUnmountCleanupTimers.get(cleanupKey);
    if (pending) {
      window.clearTimeout(pending);
      pendingUnmountCleanupTimers.delete(cleanupKey);
      console.log('[PeerConnection] Cancelled pending unmount cleanup (StrictMode remount)');
    }

    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      const existing = pendingUnmountCleanupTimers.get(cleanupKey);
      if (existing) window.clearTimeout(existing);

      const timerId = window.setTimeout(() => {
        pendingUnmountCleanupTimers.delete(cleanupKey);
        void cleanupNow();
      }, 0);

      pendingUnmountCleanupTimers.set(cleanupKey, timerId);
    };
  }, [cleanupKey, cleanupNow]);

  return {
    ...state,
    initializePeer,
    startUserScreenShare,
    startScreenShareCall,
    callRemotePeer,
    endCall,
    reconnect,
    cleanup: cleanupNow,
    forceFetchRemotePeerId,
    stopPolling,
    abortConnection,
  };
}
