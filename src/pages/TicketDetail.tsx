import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  ChevronLeft,
  Send,
  Loader2,
  User,
  Headphones,
  Paperclip,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  is_admin_reply: boolean;
  attachment_url?: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'Åben', color: 'bg-info/10 text-info' },
  in_progress: { label: 'I gang', color: 'bg-warning/10 text-warning' },
  resolved: { label: 'Løst', color: 'bg-success/10 text-success' },
  closed: { label: 'Lukket', color: 'bg-muted text-muted-foreground' },
};

const TicketDetail = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch ticket
  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (error) throw error;
      return data as Ticket;
    },
    enabled: !!ticketId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!ticketId,
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Kun billeder er tilladt');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Billedet må maks være 5MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketId || (!newMessage.trim() && !selectedImage)) return;

    setIsSending(true);

    try {
      let attachmentUrl: string | null = null;
      
      // Upload image if selected
      if (selectedImage) {
        attachmentUrl = await uploadImage(selectedImage);
        if (!attachmentUrl) {
          throw new Error('Kunne ikke uploade billede');
        }
      }

      // Insert message
      const messageData: any = {
        ticket_id: ticketId,
        sender_id: user.id,
        message: newMessage.trim() || (attachmentUrl ? '[Billede]' : ''),
        is_admin_reply: false,
      };

      // Note: attachment_url column may need to be added to the table
      // For now we include it in the message if there's an attachment
      if (attachmentUrl) {
        messageData.message = newMessage.trim() 
          ? `${newMessage.trim()}\n\n[Vedhæftet billede: ${attachmentUrl}]`
          : `[Vedhæftet billede: ${attachmentUrl}]`;
      }

      const { error: msgError } = await supabase
        .from('support_messages')
        .insert(messageData);

      if (msgError) throw msgError;

      // Update ticket timestamp
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      toast.success('Besked sendt');
      setNewMessage('');
      clearSelectedImage();
      
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Kunne ikke sende besked. Prøv igen.');
    } finally {
      setIsSending(false);
    }
  };

  // Extract image URL from message if embedded
  const extractImageUrl = (message: string): string | null => {
    const match = message.match(/\[Vedhæftet billede: (https?:\/\/[^\]]+)\]/);
    return match ? match[1] : null;
  };

  const getMessageText = (message: string): string => {
    return message.replace(/\n*\[Vedhæftet billede: https?:\/\/[^\]]+\]/, '').trim();
  };

  if (ticketLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-18 items-center">
            <Link to="/help" className="flex items-center gap-2 text-primary font-medium">
              <ChevronLeft className="h-5 w-5" />
              Tilbage
            </Link>
          </div>
        </header>
        <main className="container py-8">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Sag ikke fundet</h1>
            <p className="text-muted-foreground">Sagen eksisterer ikke eller du har ikke adgang.</p>
          </div>
        </main>
      </div>
    );
  }

  const status = statusLabels[ticket.status] || statusLabels.open;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container flex h-18 items-center justify-between">
          <Link to="/help" className="flex items-center gap-2 text-primary font-medium min-w-[100px]">
            <ChevronLeft className="h-5 w-5" />
            Tilbage
          </Link>
          
          <div className="flex-1 text-center px-4">
            <h1 className="font-semibold truncate">{ticket.subject}</h1>
          </div>
          
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${status.color} min-w-[80px] text-center`}>
            {status.label}
          </span>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 container py-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => {
            const isMe = !msg.is_admin_reply;
            const imageUrl = extractImageUrl(msg.message);
            const textContent = getMessageText(msg.message);
            
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isMe ? 'order-2' : 'order-1'}`}>
                  {/* Sender label */}
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <>
                        <div className="w-6 h-6 min-w-[24px] min-h-[24px] aspect-square rounded-full bg-primary/10 flex items-center justify-center">
                          <Headphones className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Support</span>
                      </>
                    )}
                    {isMe && (
                      <>
                        <span className="text-xs font-medium text-muted-foreground">Dig</span>
                        <div className="w-6 h-6 min-w-[24px] min-h-[24px] aspect-square rounded-full bg-info/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-info" />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isMe
                        ? 'bg-info/10 text-foreground rounded-tr-md'
                        : 'bg-card border border-border rounded-tl-md'
                    }`}
                  >
                    {textContent && (
                      <p className="whitespace-pre-wrap">{textContent}</p>
                    )}
                    {imageUrl && (
                      <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`block ${textContent ? 'mt-3' : ''}`}
                      >
                        <img 
                          src={imageUrl} 
                          alt="Vedhæftet billede" 
                          className="rounded-lg max-w-full max-h-64 object-cover"
                        />
                      </a>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <p className={`text-xs text-muted-foreground mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {format(new Date(msg.created_at), "d. MMM 'kl.' HH:mm", { locale: da })}
                  </p>
                </div>
              </div>
            );
          })}
          
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ingen beskeder endnu</p>
            </div>
          )}
        </div>
      </main>

      {/* Reply area */}
      {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
        <div className="border-t border-border bg-background sticky bottom-0">
          <form onSubmit={handleSendMessage} className="container py-4">
            <div className="max-w-2xl mx-auto">
              {/* Image preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-20 w-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-3 items-end">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                {/* Attach button */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Skriv en besked her..."
                  className="min-h-[50px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim() || selectedImage) {
                        handleSendMessage(e);
                      }
                    }
                  }}
                />
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  disabled={isSending || (!newMessage.trim() && !selectedImage)}
                  className="px-6"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;