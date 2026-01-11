import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, User, History, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, Link } from 'react-router-dom';
import helperAvatar from '@/assets/digital-helper-avatar.png';
import { ChatExportButton } from './ChatExportButton';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Parse markdown links (without icons for clarity)
const parseMessageContent = (content: string): React.ReactNode => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      parts.push(<span key={keyIndex++}>{textBefore}</span>);
    }

    const [, linkText, linkUrl] = match;
    if (linkUrl.startsWith('/')) {
      parts.push(
        <Link 
          key={keyIndex++} 
          to={linkUrl} 
          className="text-primary underline hover:text-primary/80 font-medium"
        >
          {linkText}
        </Link>
      );
    } else {
      parts.push(
        <a 
          key={keyIndex++} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 font-medium"
        >
          {linkText}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={keyIndex++}>{content.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? <>{parts}</> : content;
};

// Device-specific suggestions
const getSuggestions = (devices: string[] | null | undefined): string[] => {
  const hasMac = devices?.includes('mac');
  const hasPhone = devices?.includes('iphone') || devices?.includes('ipad');
  
  const suggestions: string[] = [];
  
  if (hasPhone || !devices?.length) {
    suggestions.push('Hvorfor er mit batteri rødt?');
    suggestions.push('Hvordan sletter jeg apps?');
  }
  
  if (hasMac) {
    suggestions.push('Computeren er langsom');
    suggestions.push('Hvordan printer jeg?');
  }
  
  // Add some general ones
  if (suggestions.length < 4) {
    suggestions.push('Opdater min enhed');
  }
  
  return suggestions.slice(0, 4);
};

// LocalStorage key for chat history
const getChatStorageKey = (userId: string) => `mittek_chat_history_${userId}`;

export const AIChatWidget = () => {
  const { isSubscriptionActive, user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Delayed appearance on landing pages (10 seconds)
  useEffect(() => {
    const isLandingPage = location.pathname === '/' || location.pathname === '/pricing';
    
    if (isLandingPage) {
      const timer = setTimeout(() => {
        setShowWidget(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    } else {
      setShowWidget(true);
    }
  }, [location.pathname]);

  // Load chat from localStorage on mount
  useEffect(() => {
    if (user && isOpen && messages.length === 0 && !currentConversationId) {
      const stored = localStorage.getItem(getChatStorageKey(user.id));
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error('Failed to parse chat history:', e);
        }
      }
    }
  }, [user, isOpen]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (user && messages.length > 0 && !currentConversationId) {
      localStorage.setItem(getChatStorageKey(user.id), JSON.stringify(messages));
    }
  }, [messages, user, currentConversationId]);

  // Load conversations when widget opens
  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user]);

  // Auto-scroll to bottom on new messages or when streaming
  useEffect(() => {
    // Use a small delay to ensure DOM is updated
    const scrollTimer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(scrollTimer);
  }, [messages, isLoading]);

  const loadConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setConversations(data);
    }
  };

  const loadConversation = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
      setCurrentConversationId(conversationId);
      setShowHistory(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
    setInput('');
    // Clear localStorage when starting fresh
    if (user) {
      localStorage.removeItem(getChatStorageKey(user.id));
    }
  };

  // Clear local chat history
  const clearLocalHistory = () => {
    if (user) {
      localStorage.removeItem(getChatStorageKey(user.id));
      setMessages([]);
      setCurrentConversationId(null);
    }
  };

  // Handle suggestion chip click - directly send
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
    }
  };

  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string, convId: string) => {
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        role,
        content,
      });

    // Update conversation timestamp and title
    const titleUpdate = role === 'user' && messages.length === 0 
      ? { title: content.slice(0, 50) + (content.length > 50 ? '...' : ''), updated_at: new Date().toISOString() }
      : { updated_at: new Date().toISOString() };

    await supabase
      .from('chat_conversations')
      .update(titleUpdate)
      .eq('id', convId);
  }, [messages.length]);

  // Don't render if no active subscription or widget not ready to show
  if (!isSubscriptionActive || !showWidget) return null;

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let conversationId = currentConversationId;

    try {
      // Create new conversation if needed
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            title: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : ''),
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
        setConversations(prev => [newConv, ...prev]);
      }

      // Save user message
      await saveMessage('user', userMessage.content, conversationId);

      const allMessages = [...messages, userMessage];
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Ikke logget ind');
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fejl ved AI-svar');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Save assistant message
      if (assistantContent && conversationId) {
        await saveMessage('assistant', assistantContent, conversationId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Beklager, der opstod en fejl. Prøv igen om lidt. 😔',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'I dag';
    if (diffDays === 1) return 'I går';
    if (diffDays < 7) return `${diffDays} dage siden`;
    return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="floating-widget">
      {isOpen ? (
        <div className="bg-card rounded-2xl shadow-2xl border w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-3">
              <img 
                src={helperAvatar} 
                alt="Din Digitale Hjælper" 
                className="w-10 h-10 rounded-full object-cover border-2 border-primary-foreground/30"
              />
              <span className="font-semibold">Din Digitale Hjælper</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
                onClick={() => setShowHistory(!showHistory)}
                title="Tidligere samtaler"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
                onClick={startNewConversation}
                title="Ny samtale"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {messages.length > 0 && !currentConversationId && (
                <ChatExportButton messages={messages} />
              )}
              {messages.length > 0 && !currentConversationId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-destructive/80 h-8 w-8"
                  onClick={clearLocalHistory}
                  title="Slet chat-historik"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showHistory ? (
            /* History View */
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ingen tidligere samtaler</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-muted transition-colors group ${
                        conv.id === currentConversationId ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(conv.updated_at)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteConversation(conv.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            /* Chat View */
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col min-h-full">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6">
                    <img 
                      src={helperAvatar} 
                      alt="Din Digitale Hjælper" 
                      className="w-14 h-14 rounded-full object-cover mx-auto mb-3 border-2 border-primary/20"
                    />
                    <p className="text-lg font-medium mb-1">Hej! Hvordan kan jeg hjælpe?</p>
                    <p className="text-sm mb-4">Vælg et emne eller skriv dit spørgsmål:</p>
                    
                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-2 justify-center px-2">
                      {getSuggestions(profile?.owned_devices).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <img 
                            src={helperAvatar} 
                            alt="" 
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm'
                          }`}
                        >
                          {msg.role === 'assistant' ? parseMessageContent(msg.content) : msg.content}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex gap-2">
                        <img 
                          src={helperAvatar} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="bg-muted p-3 rounded-2xl rounded-tl-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Skriv dit spørgsmål..."
                    className="min-h-[44px] max-h-24 resize-none text-base"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    className="h-11 w-11 flex-shrink-0"
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="floating-widget-button"
          aria-label="Åbn Din Digitale Hjælper chat"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}
    </div>
  );
};
