import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
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
  X
} from 'lucide-react';

type DrawingTool = 'pencil' | 'circle' | 'arrow' | 'eraser';
type SessionStatus = 'waiting' | 'connecting' | 'connected' | 'ended';

const RemoteSupport = () => {
  useScrollRestoration();
  const navigate = useNavigate();
  
  // Session state
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('waiting');
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pencil');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Simulate connection
  const startSession = useCallback(async () => {
    setSessionStatus('connecting');
    
    try {
      // In a real implementation, this would connect to a WebRTC signaling server
      // For now, we'll simulate getting the user's camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      // Simulate connection delay
      setTimeout(() => {
        setSessionStatus('connected');
        toast.success('Forbindelse oprettet!', {
          description: 'Tekniker er nu tilsluttet og kan se din skærm.',
        });
      }, 2000);
      
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Kunne ikke starte session', {
        description: 'Tjek at du har givet adgang til kamera og mikrofon.',
      });
      setSessionStatus('waiting');
    }
  }, []);

  const endSession = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setSessionStatus('ended');
    toast.info('Session afsluttet');
  }, []);

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

  // Canvas drawing functions
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
    
    if (selectedTool === 'circle' || selectedTool === 'arrow') {
      // For shapes, just record start position
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const coords = getCanvasCoords(e);
    
    if (selectedTool === 'pencil') {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      lastPosRef.current = coords;
    } else if (selectedTool === 'eraser') {
      ctx.clearRect(coords.x - 15, coords.y - 15, 30, 30);
      lastPosRef.current = coords;
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const coords = getCanvasCoords(e);
    
    if (selectedTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(coords.x - lastPosRef.current.x, 2) + 
        Math.pow(coords.y - lastPosRef.current.y, 2)
      );
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(lastPosRef.current.x, lastPosRef.current.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (selectedTool === 'arrow') {
      const headLength = 20;
      const angle = Math.atan2(coords.y - lastPosRef.current.y, coords.x - lastPosRef.current.x);
      
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      
      // Line
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(
        coords.x - headLength * Math.cos(angle - Math.PI / 6),
        coords.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(
        coords.x - headLength * Math.cos(angle + Math.PI / 6),
        coords.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
    
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Waiting screen
  if (sessionStatus === 'waiting') {
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
            <h1 className="text-2xl font-bold mb-3">Start fjernsupport</h1>
            <p className="text-muted-foreground mb-8">
              Når du starter sessionen, vil en tekniker kunne se din skærm og hjælpe dig i realtid.
            </p>
            
            <div className="card-elevated p-6 mb-6 text-left">
              <h3 className="font-semibold mb-3">Hvad sker der?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  Du deler din skærm med vores tekniker
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  Teknikeren kan tegne på skærmen for at vise dig
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  Du kan tale sammen via mikrofon og kamera
                </li>
              </ul>
            </div>
            
            <Button variant="hero" size="lg" onClick={startSession}>
              <Video className="mr-2 h-5 w-5" />
              Start session
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Connecting screen
  if (sessionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Opretter forbindelse...</h2>
          <p className="text-muted-foreground">Vent venligst mens vi finder en ledig tekniker</p>
        </div>
      </div>
    );
  }

  // Ended screen
  if (sessionStatus === 'ended') {
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
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium">Forbundet med tekniker</span>
        </div>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={endSession}
        >
          <Phone className="mr-2 h-4 w-4" />
          Afslut session
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Screen share view */}
        <div className="flex-1 relative bg-muted/50">
          {/* Placeholder for screen share / video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Skærmdeling aktiv
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Demo-tilstand - ingen faktisk skærmdeling)
              </p>
            </div>
          </div>
          
          {/* Drawing canvas overlay */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
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
          {/* Drawing tools */}
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
            onClick={clearCanvas}
            className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-destructive transition-colors"
            title="Ryd tegning"
          >
            <X className="h-5 w-5" />
          </button>
          
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
      </div>
    </div>
  );
};

export default RemoteSupport;
