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
  WifiOff
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
    initializePeer,
    startScreenShareCall,
    endCall,
    cleanup: cleanupPeer,
  } = usePeerConnection(bookingId, isAdmin);
  
  // Media state
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  
  // Drawing state
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pencil');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start user camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  }, []);

  // Handle session start based on role
  const handleStartSession = useCallback(async () => {
    if (!bookingId) {
      toast.error('Ingen booking ID');
      return;
    }

    if (isAdmin) {
      await startSession(bookingId);
    } else {
      await joinSession(bookingId);
      await startCamera();
    }
    
    // Initialize PeerJS connection
    await initializePeer();
  }, [bookingId, isAdmin, startSession, joinSession, startCamera, initializePeer]);

  // Handle ending session
  const handleEndSession = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    endCall();
    await endSession();
    toast.info('Session afsluttet');
  }, [endSession, endCall]);

  const toggleWebcam = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setWebcamEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  // Subscribe to drawing events when session exists
  useEffect(() => {
    if (bookingId && session.status !== 'idle') {
      subscribeToDrawingEvents(bookingId);
    }
  }, [bookingId, session.status, subscribeToDrawingEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      cleanupPeer();
    };
  }, [cleanupPeer]);

  // Waiting screen
  if (session.status === 'idle' || session.status === 'waiting') {
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
              {isAdmin ? 'Start fjernsupport-session' : 'Vent på tekniker'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isAdmin 
                ? 'Klik nedenfor for at starte sessionen og oprette forbindelse til brugeren.'
                : session.status === 'waiting'
                  ? 'Venter på at teknikeren starter sessionen...'
                  : 'Når du starter sessionen, vil en tekniker kunne se din skærm og hjælpe dig i realtid.'
              }
            </p>
            
            {session.status === 'waiting' && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Venter på forbindelse...</span>
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
                  I kan tale sammen via mikrofon og kamera
                </li>
              </ul>
            </div>
            
            {session.status !== 'waiting' && (
              <Button variant="hero" size="lg" onClick={handleStartSession}>
                <Video className="mr-2 h-5 w-5" />
                {isAdmin ? 'Start session' : 'Deltag i session'}
              </Button>
            )}
          </div>
        </main>
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
                <span>Klar til forbindelse</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Venter på modpart</span>
              </>
            )}
          </div>
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
            <video
              autoPlay
              playsInline
              muted={false}
              className="absolute inset-0 w-full h-full object-contain bg-black"
              ref={(el) => {
                if (el && remoteStream) {
                  el.srcObject = remoteStream;
                }
              }}
            />
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
          
          {/* Self-view webcam (small corner view) */}
          <div className="absolute bottom-4 right-4 w-40 h-30 bg-black rounded-lg overflow-hidden shadow-lg border-2 border-background">
            {webcamEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
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
          
          {/* Media controls */}
          <div className="space-y-2">
            <button
              onClick={toggleWebcam}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${
                webcamEnabled 
                  ? 'bg-muted text-foreground' 
                  : 'bg-destructive/10 text-destructive'
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
    </div>
  );
};

export default RemoteSupport;
