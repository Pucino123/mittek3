import { Bug, Check, X, Loader2, ScreenShare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DebugInfoProps {
  isAdmin: boolean;
  myPeerId: string | null;
  remotePeerId: string | null;
  peerIdSavedToDb: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  screenShareReady?: boolean;
  bookingStatus?: string | null;
  onForceFetch?: () => void;
}

export function DebugInfo({ 
  isAdmin, 
  myPeerId, 
  remotePeerId, 
  peerIdSavedToDb,
  isConnected,
  isConnecting,
  screenShareReady,
  bookingStatus,
  onForceFetch,
}: DebugInfoProps) {
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
