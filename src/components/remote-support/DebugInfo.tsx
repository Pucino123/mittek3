import { Bug, Check, X, Loader2, ScreenShare, RefreshCw, Monitor, AppWindow, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StreamSurfaceType, IceConnectionState, ConnectionStatus } from '@/hooks/usePeerConnection';

interface DebugInfoProps {
  isAdmin: boolean;
  myPeerId: string | null;
  remotePeerId: string | null;
  peerIdSavedToDb: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  screenShareReady?: boolean;
  bookingStatus?: string | null;
  streamSurfaceType?: StreamSurfaceType;
  iceState?: IceConnectionState;
  connectionStatus?: ConnectionStatus;
  onForceFetch?: () => void;
}

// Helper to get surface type icon and label
const getSurfaceTypeDisplay = (type: StreamSurfaceType) => {
  switch (type) {
    case 'browser':
      return { icon: Globe, label: 'Fane' };
    case 'window':
      return { icon: AppWindow, label: 'Vindue' };
    case 'monitor':
      return { icon: Monitor, label: 'Skærm' };
    case 'unknown':
      return { icon: ScreenShare, label: 'Ukendt' };
    default:
      return null;
  }
};

// Helper to get ICE state color
const getIceStateColor = (state: IceConnectionState) => {
  switch (state) {
    case 'connected':
    case 'completed':
      return 'text-success';
    case 'checking':
    case 'new':
      return 'text-warning';
    case 'failed':
    case 'disconnected':
    case 'closed':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
};

export function DebugInfo({ 
  isAdmin, 
  myPeerId, 
  remotePeerId, 
  peerIdSavedToDb,
  isConnected,
  isConnecting,
  screenShareReady,
  bookingStatus,
  streamSurfaceType,
  iceState,
  connectionStatus,
  onForceFetch,
}: DebugInfoProps) {
  const surfaceDisplay = streamSurfaceType ? getSurfaceTypeDisplay(streamSurfaceType) : null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-background/95 border border-border rounded-lg p-3 text-xs font-mono shadow-lg max-w-xs">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <Bug className="h-3.5 w-3.5" />
        <span className="font-semibold">Debug Info ({isAdmin ? 'Admin' : 'User'})</span>
      </div>
      
      <div className="space-y-1.5">
        {/* Screen share status (User only) */}
        {!isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Screen Share:</span>
            {screenShareReady ? (
              <span className="flex items-center gap-1 text-success">
                <ScreenShare className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-warning">
                <X className="h-3 w-3" /> Not shared
              </span>
            )}
          </div>
        )}
        
        {/* Stream surface type */}
        {surfaceDisplay && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Type:</span>
            <span className="flex items-center gap-1 text-info">
              <surfaceDisplay.icon className="h-3 w-3" />
              {surfaceDisplay.label}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">My ID:</span>
          <span className="text-foreground truncate max-w-32">
            {myPeerId ? myPeerId.slice(0, 16) + '...' : 'Initializing...'}
          </span>
        </div>
        
        {!isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Saved to DB:</span>
            {peerIdSavedToDb ? (
              <span className="flex items-center gap-1 text-success">
                <Check className="h-3 w-3" /> Yes
              </span>
            ) : myPeerId ? (
              <span className="flex items-center gap-1 text-warning">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <X className="h-3 w-3" /> No
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {isAdmin ? 'Target User ID:' : 'Admin ID:'}
          </span>
          <span className={remotePeerId ? 'text-success' : 'text-muted-foreground'}>
            {remotePeerId ? remotePeerId.slice(0, 16) + '...' : 'Waiting...'}
          </span>
        </div>
        
        {/* Booking status */}
        {bookingStatus && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Booking:</span>
            <span className={`${
              bookingStatus === 'in_progress' ? 'text-success' : 
              bookingStatus === 'waiting_for_technician' ? 'text-warning' : 
              'text-muted-foreground'
            }`}>
              {bookingStatus}
            </span>
          </div>
        )}
        
        {/* Connection status (more granular) */}
        {connectionStatus && connectionStatus !== 'idle' && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Conn Status:</span>
            <span className={`${
              connectionStatus === 'connected' ? 'text-success' : 
              connectionStatus === 'timeout' || connectionStatus === 'failed' ? 'text-destructive' : 
              'text-warning'
            }`}>
              {connectionStatus}
            </span>
          </div>
        )}
        
        {/* ICE state */}
        {iceState && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">ICE:</span>
            <span className={getIceStateColor(iceState)}>
              {iceState}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-1 border-t border-border mt-2">
          <span className="text-muted-foreground">Status:</span>
          {isConnected ? (
            <span className="text-success flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Connected
            </span>
          ) : isConnecting ? (
            <span className="text-warning flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Connecting...
            </span>
          ) : (
            <span className="text-muted-foreground">Waiting</span>
          )}
        </div>
        
        {/* Force fetch button when not connected and no remote peer */}
        {!isConnected && !remotePeerId && onForceFetch && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => { e.preventDefault(); onForceFetch(); }}
            className="w-full mt-2 h-7 text-xs gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Hent ID manuelt
          </Button>
        )}
      </div>
    </div>
  );
}
