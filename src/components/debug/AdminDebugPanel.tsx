import { useState, useEffect, useCallback } from 'react';
import { Bug, X, Trash2, AlertTriangle, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface LogEntry {
  id: string;
  type: 'error' | 'network';
  message: string;
  timestamp: Date;
  details?: string;
}

/**
 * Floating Debug Panel for Admins
 * Captures console errors and network failures for quick troubleshooting
 */
export function AdminDebugPanel() {
  const { isAdmin, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Add a new log entry
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prev => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date(),
      },
      ...prev.slice(0, 49), // Keep max 50 logs
    ]);
  }, []);

  // Set up error listeners
  useEffect(() => {
    if (!isAdmin || !user) return;

    // Capture window errors
    const handleError = (event: ErrorEvent) => {
      addLog({
        type: 'error',
        message: event.message || 'Unknown error',
        details: `${event.filename}:${event.lineno}:${event.colno}`,
      });
    };

    // Capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || event.reason?.toString() || 'Unhandled Promise Rejection';
      addLog({
        type: 'error',
        message,
        details: event.reason?.stack?.split('\n')[1]?.trim(),
      });
    };

    // Intercept fetch to capture network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Log 4xx and 5xx responses
        if (!response.ok && response.status >= 400) {
          const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : args[0]?.url || 'unknown';
          addLog({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: url.length > 60 ? `...${url.slice(-60)}` : url,
          });
        }
        
        return response;
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : args[0]?.url || 'unknown';
        addLog({
          type: 'network',
          message: error instanceof Error ? error.message : 'Network request failed',
          details: url.length > 60 ? `...${url.slice(-60)}` : url,
        });
        throw error;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.fetch = originalFetch;
    };
  }, [isAdmin, user, addLog]);

  // Don't render for non-admins
  if (!isAdmin || !user) return null;

  const errorCount = logs.filter(l => l.type === 'error').length;
  const networkCount = logs.filter(l => l.type === 'network').length;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed bottom-20 right-4 z-[60]">
      {isOpen ? (
        <div className={`bg-card border border-border rounded-xl shadow-2xl transition-all duration-200 ${
          isMinimized ? 'w-72' : 'w-96'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-warning" />
              <span className="font-semibold text-sm">Debug Console</span>
              {logs.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {logs.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => setLogs([])}
                title="Ryd logs"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          {!isMinimized && (
            <div className="flex items-center gap-4 px-3 py-2 border-b border-border text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                {errorCount} fejl
              </span>
              <span className="flex items-center gap-1">
                <WifiOff className="h-3 w-3 text-warning" />
                {networkCount} netværk
              </span>
            </div>
          )}

          {/* Log entries */}
          {!isMinimized && (
            <ScrollArea className="h-64">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <Bug className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Ingen fejl registreret</p>
                  <p className="text-xs mt-1">Fejl vises automatisk her</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className={`p-2 rounded-lg text-xs ${
                        log.type === 'error' 
                          ? 'bg-destructive/10 border border-destructive/20' 
                          : 'bg-warning/10 border border-warning/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {log.type === 'error' ? (
                            <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                          ) : (
                            <WifiOff className="h-3 w-3 text-warning shrink-0" />
                          )}
                          <span className="font-medium truncate">{log.message}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                      {log.details && (
                        <p className="mt-1 text-muted-foreground truncate pl-4">
                          {log.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className={`h-12 w-12 rounded-full shadow-lg border-2 ${
            logs.length > 0 
              ? 'border-warning bg-warning/10 hover:bg-warning/20' 
              : 'border-border'
          }`}
          onClick={() => setIsOpen(true)}
          title="Åbn Debug Console"
        >
          <Bug className={`h-5 w-5 ${logs.length > 0 ? 'text-warning' : ''}`} />
          {logs.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {logs.length > 9 ? '9+' : logs.length}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
