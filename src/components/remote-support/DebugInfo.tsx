import { Bug, Check, X, Loader2 } from 'lucide-react';

interface DebugInfoProps {
  isAdmin: boolean;
  myPeerId: string | null;
  remotePeerId: string | null;
  peerIdSavedToDb: boolean;
  isConnected: boolean;
  isConnecting: boolean;
}

export function DebugInfo({ 
  isAdmin, 
  myPeerId, 
  remotePeerId, 
  peerIdSavedToDb,
  isConnected,
  isConnecting,
}: DebugInfoProps) {
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-background/95 border border-border rounded-lg p-3 text-xs font-mono shadow-lg max-w-xs">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <Bug className="h-3.5 w-3.5" />
        <span className="font-semibold">Debug Info ({isAdmin ? 'Admin' : 'User'})</span>
      </div>
      
      <div className="space-y-1.5">
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
      </div>
    </div>
  );
}
