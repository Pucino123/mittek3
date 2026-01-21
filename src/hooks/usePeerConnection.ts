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
}

export function usePeerConnection(bookingId: string | null, isAdmin: boolean) {
  const [state, setState] = useState<PeerConnectionState>({
    peerId: null,
    remotePeerId: null,
    isConnected: false,
    isConnecting: false,
    localStream: null,
    remoteStream: null,
  });
  
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize peer and subscribe to signaling channel
  const initializePeer = useCallback(async () => {
    if (!bookingId) return;
    
    setState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      // Create a new Peer instance
      const peer = new Peer();
      peerRef.current = peer;
      
      peer.on('open', async (id) => {
        console.log('PeerJS: My ID is', id);
        setState(prev => ({ ...prev, peerId: id }));
        
        // Broadcast our peer ID via Supabase Realtime
        const channel = supabase.channel(`peer-signaling-${bookingId}`);
        channelRef.current = channel;
        
        channel
          .on('broadcast', { event: 'peer-id' }, ({ payload }) => {
            console.log('Received peer ID:', payload);
            if (payload.peerId !== id && payload.role !== (isAdmin ? 'admin' : 'user')) {
              setState(prev => ({ ...prev, remotePeerId: payload.peerId }));
              
              // If we're admin and received user's ID, call them
              if (isAdmin && payload.role === 'user') {
                toast.info('Bruger forbundet, opretter videoforbindelse...');
              }
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Broadcast our peer ID
              await channel.send({
                type: 'broadcast',
                event: 'peer-id',
                payload: { peerId: id, role: isAdmin ? 'admin' : 'user' },
              });
            }
          });
      });
      
      // Handle incoming calls (user side receives call from admin)
      peer.on('call', async (call) => {
        console.log('PeerJS: Incoming call');
        
        try {
          // Get screen share stream for user
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });
          
          setState(prev => ({ ...prev, localStream: stream }));
          
          // Handle stream end
          stream.getVideoTracks()[0].onended = () => {
            toast.info('Skærmdeling stoppet');
            setState(prev => ({ ...prev, localStream: null }));
          };
          
          // Answer the call with our screen
          call.answer(stream);
          callRef.current = call;
          
          call.on('stream', (remoteStream) => {
            console.log('PeerJS: Received remote stream');
            setState(prev => ({ 
              ...prev, 
              remoteStream,
              isConnected: true,
              isConnecting: false,
            }));
          });
          
          call.on('close', () => {
            console.log('PeerJS: Call closed');
            setState(prev => ({ 
              ...prev, 
              isConnected: false,
              remoteStream: null,
            }));
          });
          
        } catch (error) {
          console.error('Failed to get screen share:', error);
          toast.error('Kunne ikke starte skærmdeling');
        }
      });
      
      peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        toast.error('Forbindelsesfejl: ' + err.type);
        setState(prev => ({ ...prev, isConnecting: false }));
      });
      
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [bookingId, isAdmin]);

  // Call remote peer (admin calls user)
  const callRemotePeer = useCallback(async (remotePeerId: string, stream: MediaStream) => {
    if (!peerRef.current) {
      toast.error('Peer forbindelse ikke klar');
      return;
    }
    
    console.log('PeerJS: Calling remote peer', remotePeerId);
    setState(prev => ({ ...prev, isConnecting: true, localStream: stream }));
    
    const call = peerRef.current.call(remotePeerId, stream);
    callRef.current = call;
    
    call.on('stream', (remoteStream) => {
      console.log('PeerJS: Received remote stream from call');
      setState(prev => ({ 
        ...prev, 
        remoteStream,
        isConnected: true,
        isConnecting: false,
      }));
      toast.success('Forbindelse oprettet!');
    });
    
    call.on('close', () => {
      console.log('PeerJS: Call ended');
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        remoteStream: null,
      }));
    });
    
    call.on('error', (err) => {
      console.error('PeerJS call error:', err);
      toast.error('Opkaldsfejl');
      setState(prev => ({ ...prev, isConnecting: false }));
    });
  }, []);

  // Start screen share and call (for admin or user)
  const startScreenShareCall = useCallback(async () => {
    if (!state.remotePeerId) {
      toast.error('Venter på modpart...');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      
      stream.getVideoTracks()[0].onended = () => {
        toast.info('Skærmdeling stoppet');
        endCall();
      };
      
      await callRemotePeer(state.remotePeerId, stream);
    } catch (error) {
      console.error('Failed to get display media:', error);
      toast.error('Kunne ikke starte skærmdeling');
    }
  }, [state.remotePeerId, callRemotePeer]);

  // End call and cleanup
  const endCall = useCallback(() => {
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

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    endCall();
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    setState({
      peerId: null,
      remotePeerId: null,
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
    });
  }, [endCall]);

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
    cleanup,
  };
}
