import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useRemoteSupportSession } from '@/hooks/useRemoteSupportSession';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { SessionTimer } from '@/components/remote-support/SessionTimer';
import { DrawingCanvas } from '@/components/remote-support/DrawingCanvas';
import { SessionChat } from '@/components/remote-support/SessionChat';
import { DebugInfo } from '@/components/remote-support/DebugInfo';
import { toast } from 'sonner';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Pencil, 
  Eraser,
  Circle,
  ArrowUp,
  Monitor,
  Loader2,
  Users,
  X,
  ScreenShare,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Move,
  RefreshCw
} from 'lucide-react';

type DrawingTool = 'pencil' | 'circle' | 'arrow' | 'eraser';

const RemoteSupport = () => {
  useScrollRestoration();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking');
  const isAdmin = searchParams.get('admin') === 'true';
  
  // Use the session hook
  const {
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
  } = useRemoteSupportSession(bookingId || undefined);
  
  // PeerJS connection
  const {
    peerId,
    remotePeerId,
    isConnected: peerConnected,
    isConnecting: peerConnecting,
    remoteStream,
    peerIdSavedToDb,
    initializePeer,
    startScreenShareCall,
    endCall,
    reconnect,
    cleanup: cleanupPeer,
  } = usePeerConnection(bookingId, isAdmin);
  
  // Media state
  const [webcamEnabled, setWebcamEnabled] = useState(false); // Start with camera OFF
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioMuted, setAudioMuted] = useState(true); // For browser autoplay policy
  const [showUnmuteOverlay, setShowUnmuteOverlay] = useState(true);
  
  // Webcam PiP state
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [pipPosition, setPipPosition] = useState({ x: 16, y: 16 }); // bottom-right offset
  const [isDraggingPip, setIsDraggingPip] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const pipRef = useRef<HTMLDivElement>(null);
  
  // Drawing state
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pencil');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Start webcam separately
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false // Audio handled separately
      });
      setWebcamStream(stream);
      setWebcamEnabled(true);
    } catch (error) {
      console.error('Failed to start webcam:', error);
      toast.error('Kunne ikke starte kamera');
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setWebcamEnabled(false);
  }, [webcamStream]);

  // Toggle webcam
  const toggleWebcam = useCallback(() => {
    if (webcamEnabled) {
      stopWebcam();
    } else {
      startWebcam();
    }
  }, [webcamEnabled, startWebcam, stopWebcam]);

  // Handle unmute click
  const handleUnmute = useCallback(() => {
    setAudioMuted(false);
    setShowUnmuteOverlay(false);
    
    // Try to play the remote video with audio
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play().catch(console.error);
    }
  }, []);

  // Handle session start based on role
  const handleStartSession = useCallback(async () => {
    if (!bookingId) {
      toast.error('Ingen booking ID');
      return;
    }

    if (isAdmin) {
      // Admin: Start session and initialize P2P connection
      await startSession(bookingId);
      await initializePeer();
    } else {
      // User: Join session and immediately initialize peer to save ID to DB
      await joinSession(bookingId);
      // Initialize peer immediately so our ID is saved to DB for admin to fetch
      await initializePeer();
    }
  }, [bookingId, isAdmin, startSession, joinSession, initializePeer]);

  // Auto-start for admin when landing on page
  useEffect(() => {
    if (isAdmin && bookingId && session.status === 'idle') {
      // Auto-trigger session start when admin lands on page
      handleStartSession();
    }
  }, [isAdmin, bookingId, session.status, handleStartSession]);

  // When admin starts session, user should auto-connect (if they haven't already)
  useEffect(() => {
    // If we're in waiting_for_technician and session becomes connected (admin started), init our peer if not already
    if (!isAdmin && session.status === 'connected' && !peerConnected && !peerConnecting && !peerId) {
      initializePeer();
    }
  }, [isAdmin, session.status, peerConnected, peerConnecting, peerId, initializePeer]);

  // Handle ending session
  const handleEndSession = useCallback(async () => {
    stopWebcam();
    endCall();
    await endSession();
    toast.info('Session afsluttet');
  }, [endSession, endCall, stopWebcam]);

  const toggleMic = () => {
    // Toggle microphone in the peer connection stream
    setMicEnabled(prev => !prev);
    toast.info(micEnabled ? 'Mikrofon slukket' : 'Mikrofon tændt');
  };

  // PiP drag handlers
  const handlePipDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingPip(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartPos.current = { x: clientX - pipPosition.x, y: clientY - pipPosition.y };
  }, [pipPosition]);

  const handlePipDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingPip) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 160, clientX - dragStartPos.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 120, clientY - dragStartPos.current.y));
    
    setPipPosition({ x: newX, y: newY });
  }, [isDraggingPip]);

  const handlePipDragEnd = useCallback(() => {
    setIsDraggingPip(false);
  }, []);

  // Add/remove drag listeners
  useEffect(() => {
    if (isDraggingPip) {
      window.addEventListener('mousemove', handlePipDrag);
      window.addEventListener('mouseup', handlePipDragEnd);
      window.addEventListener('touchmove', handlePipDrag);
      window.addEventListener('touchend', handlePipDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handlePipDrag);
      window.removeEventListener('mouseup', handlePipDragEnd);
      window.removeEventListener('touchmove', handlePipDrag);
      window.removeEventListener('touchend', handlePipDragEnd);
    };
  }, [isDraggingPip, handlePipDrag, handlePipDragEnd]);

  // Subscribe to drawing events when session exists
  useEffect(() => {
    if (bookingId && session.status !== 'idle') {
      subscribeToDrawingEvents(bookingId);
    }
  }, [bookingId, session.status, subscribeToDrawingEvents]);

  // Update webcam video element
  useEffect(() => {
    if (webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Update remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.muted = audioMuted;
    }
  }, [remoteStream, audioMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      cleanupPeer();
    };
  }, [cleanupPeer, stopWebcam]);

  // Waiting screen - handles idle, waiting_for_technician, and waiting states
  if (session.status === 'idle' || session.status === 'waiting_for_technician' || session.status === 'waiting') {
    const isWaitingForTech = session.status === 'waiting_for_technician';
    
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-18 items-center px-4">
            <BackButton />
          </div>
        </header>
        
        <main className="container py-12 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-info/10 flex items-center justify-center mx-auto mb-6">
              <Monitor className="h-10 w-10 text-info" />
            </div>
            <h1 className="text-2xl font-bold mb-3">
              {isAdmin ? 'Start fjernsupport-session' : isWaitingForTech ? 'Forbindelse klar' : 'Deltag i session'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isAdmin 
                ? 'Klik nedenfor for at starte sessionen og oprette forbindelse til brugeren.'
                : isWaitingForTech
                  ? 'Forbindelse klar. Venter på tekniker...'
                  : 'Klik nedenfor for at vente på at teknikeren starter sessionen.'
              }
            </p>
            
            {isWaitingForTech && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Afventer at tekniker starter sessionen...</span>
              </div>
            )}
            
            <div className="card-elevated p-6 mb-6 text-left">
              <h3 className="font-semibold mb-3">Hvad sker der?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  {isAdmin ? 'Du vil kunne se brugerens skærm' : 'Du deler din skærm med vores tekniker'}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  {isAdmin ? 'Du kan tegne for at vise brugeren' : 'Teknikeren kan tegne på skærmen for at vise dig'}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  I kan tale sammen via mikrofon (valgfrit kamera)
                </li>
              </ul>
            </div>
            
            {!isWaitingForTech && (
              <Button variant="hero" size="lg" onClick={handleStartSession}>
                <Video className="mr-2 h-5 w-5" />
                {isAdmin ? 'Start session' : 'Deltag i session'}
              </Button>
            )}
          </div>
        </main>
        
        {/* Debug Info */}
        <DebugInfo
          isAdmin={isAdmin}
          myPeerId={peerId}
          remotePeerId={remotePeerId}
          peerIdSavedToDb={peerIdSavedToDb}
          isConnected={peerConnected}
          isConnecting={peerConnecting}
        />
      </div>
    );
  }

  // Connecting screen
  if (session.status === 'connecting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Opretter forbindelse...</h2>
          <p className="text-muted-foreground">Vent venligst mens vi opretter forbindelsen</p>
        </div>
      </div>
    );
  }

  // Ended screen
  if (session.status === 'ended') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Session afsluttet</h2>
          <p className="text-muted-foreground mb-6">
            Tak fordi du brugte vores fjernsupport. Vi håber det hjalp!
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="hero" onClick={() => navigate('/dashboard')}>
              Tilbage til dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/support-hub')}>
              Book ny session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Connected - Main remote support interface
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header with Timer */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${peerConnected ? 'bg-success' : 'bg-warning'} animate-pulse`} />
          <span className="text-sm font-medium">
            {isAdmin ? 'Fjernsupport aktiv' : 'Forbundet med tekniker'}
          </span>
          {/* Peer connection status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {peerConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-success" />
                <span>P2P forbundet</span>
              </>
            ) : peerConnecting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Opretter...</span>
              </>
            ) : remotePeerId ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-warning" />
                <span>Forbindelse afbrudt</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Venter på modpart</span>
              </>
            )}
          </div>
          
          {/* Reconnect button - show when disconnected but we have peer IDs */}
          {!peerConnected && !peerConnecting && peerId && remotePeerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              className="ml-2 gap-1.5 text-xs h-7"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Genopret forbindelse
            </Button>
          )}
        </div>
        
        {/* Session Timer */}
        <SessionTimer 
          timeRemaining={timeRemaining} 
          formattedTime={formattedTimeRemaining} 
        />
        
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleEndSession}
        >
          <Phone className="mr-2 h-4 w-4" />
          Afslut session
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Screen share view */}
        <div className="flex-1 relative bg-muted/50">
          {/* Remote stream from PeerJS or placeholder */}
          {remoteStream ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={audioMuted}
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
              
              {/* Unmute overlay for browser autoplay policy */}
              {showUnmuteOverlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={handleUnmute}
                    className="gap-2"
                  >
                    <Volume2 className="h-5 w-5" />
                    Tænd lyd
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Monitor className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {isAdmin 
                    ? remotePeerId 
                      ? 'Bruger klar - klik for at oprette forbindelse'
                      : 'Venter på brugerens forbindelse...' 
                    : remotePeerId
                      ? 'Tekniker klar - del din skærm for at få hjælp'
                      : 'Venter på tekniker...'}
                </p>
                {remotePeerId && (
                  <Button variant="hero" onClick={startScreenShareCall}>
                    <ScreenShare className="mr-2 h-4 w-4" />
                    {isAdmin ? 'Opret forbindelse' : 'Del skærm'}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Drawing canvas overlay */}
          <DrawingCanvas
            width={1920}
            height={1080}
            drawingPoints={drawingPoints}
            isAdmin={isAdmin}
            selectedTool={selectedTool}
            selectedColor={drawingColor}
            onDraw={broadcastDraw}
            onClear={clearDrawings}
          />
          
          {/* Webcam PiP (draggable) */}
          {webcamEnabled && webcamStream && (
            <div 
              ref={pipRef}
              className={`absolute w-40 h-28 bg-black rounded-lg overflow-hidden shadow-lg border-2 border-background z-30 ${
                isDraggingPip ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                left: pipPosition.x,
                top: pipPosition.y,
              }}
            >
              <video
                ref={webcamVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Drag handle */}
              <div 
                className="absolute top-1 left-1 w-6 h-6 rounded bg-black/50 flex items-center justify-center cursor-grab active:cursor-grabbing"
                onMouseDown={handlePipDragStart}
                onTouchStart={handlePipDragStart}
              >
                <Move className="h-3 w-3 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar controls */}
        <div className="w-16 md:w-20 border-l border-border bg-background flex flex-col items-center py-4 gap-3">
          {/* Drawing tools - Only for admin */}
          {isAdmin && (
            <>
              <div className="space-y-2 pb-3 border-b border-border">
                <button
                  onClick={() => setSelectedTool('pencil')}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${
                    selectedTool === 'pencil' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                  title="Blyant"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedTool('circle')}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${
                    selectedTool === 'circle' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                  title="Cirkel"
                >
                  <Circle className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedTool('arrow')}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${
                    selectedTool === 'arrow' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                  title="Pil"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedTool('eraser')}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${
                    selectedTool === 'eraser' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                  title="Viskelæder"
                >
                  <Eraser className="h-5 w-5" />
                </button>
              </div>
              
              {/* Color picker */}
              <div className="space-y-2 pb-3 border-b border-border">
                {['#ef4444', '#3b82f6', '#22c55e', '#eab308'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setDrawingColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      drawingColor === color ? 'scale-110 border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              {/* Clear canvas */}
              <button
                onClick={clearDrawings}
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-destructive transition-colors"
                title="Ryd tegning"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Audio mute toggle */}
          {remoteStream && (
            <button
              onClick={() => {
                setAudioMuted(!audioMuted);
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.muted = !audioMuted;
                }
                setShowUnmuteOverlay(false);
              }}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${
                !audioMuted 
                  ? 'bg-muted text-foreground' 
                  : 'bg-destructive/10 text-destructive'
              }`}
              title={audioMuted ? 'Tænd lyd' : 'Sluk lyd'}
            >
              {audioMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          )}
          
          {/* Media controls */}
          <div className="space-y-2">
            <button
              onClick={toggleWebcam}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${
                webcamEnabled 
                  ? 'bg-muted text-foreground' 
                  : 'bg-muted/50 text-muted-foreground'
              }`}
              title={webcamEnabled ? 'Sluk kamera' : 'Tænd kamera'}
            >
              {webcamEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleMic}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${
                micEnabled 
                  ? 'bg-muted text-foreground' 
                  : 'bg-destructive/10 text-destructive'
              }`}
              title={micEnabled ? 'Sluk mikrofon' : 'Tænd mikrofon'}
            >
              {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Session Chat */}
        {bookingId && (
          <SessionChat 
            bookingId={bookingId} 
            isAdmin={isAdmin}
          />
        )}
      </div>
      
      {/* Debug Info */}
      <DebugInfo
        isAdmin={isAdmin}
        myPeerId={peerId}
        remotePeerId={remotePeerId}
        peerIdSavedToDb={peerIdSavedToDb}
        isConnected={peerConnected}
        isConnecting={peerConnecting}
      />
    </div>
  );
};

export default RemoteSupport;
