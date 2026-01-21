import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageSquare, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'admin' | 'user';
  timestamp: Date;
}

interface SessionChatProps {
  bookingId: string;
  isAdmin: boolean;
}

export function SessionChat({ bookingId, isAdmin }: SessionChatProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase.channel(`session-chat-${bookingId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'chat-message' }, (payload) => {
        const msg = payload.payload as ChatMessage;
        setMessages((prev) => [...prev, { ...msg, timestamp: new Date(msg.timestamp) }]);
        
        // Show toast if chat is closed
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
          toast.info(msg.sender === 'admin' ? 'Tekniker' : 'Bruger', {
            description: msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : ''),
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [bookingId, isOpen]);

  // Clear unread when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessage = useCallback(() => {
    if (!inputValue.trim() || !channelRef.current) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      content: inputValue.trim(),
      sender: isAdmin ? 'admin' : 'user',
      timestamp: new Date(),
    };

    // Add to local messages immediately
    setMessages((prev) => [...prev, message]);
    setInputValue('');

    // Broadcast to other participants
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: message,
    });
  }, [inputValue, isAdmin]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all",
          isOpen 
            ? "bg-muted text-muted-foreground" 
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-50 w-80 h-96 bg-card border border-border rounded-xl shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Session Chat
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Chat med brugeren' : 'Chat med teknikeren'}
            </p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">
                  Ingen beskeder endnu
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2",
                    msg.sender === (isAdmin ? 'admin' : 'user')
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    msg.sender === (isAdmin ? 'admin' : 'user')
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}>
                    {msg.timestamp.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Skriv en besked..."
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={sendMessage}
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}