import { useState } from 'react';
import { Download, FileText, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatExportButtonProps {
  messages: Message[];
  disabled?: boolean;
}

export function ChatExportButton({ messages, disabled }: ChatExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatChatForExport = (includeTimestamp = true): string => {
    const header = includeTimestamp 
      ? `MitTek Chat-historik\nEksporteret: ${new Date().toLocaleString('da-DK')}\n${'='.repeat(50)}\n\n`
      : '';
    
    const content = messages.map(msg => {
      const sender = msg.role === 'user' ? 'Dig' : 'Din Digitale Hjælper';
      return `${sender}:\n${msg.content}\n`;
    }).join('\n---\n\n');
    
    return header + content;
  };

  const downloadAsText = () => {
    setIsExporting(true);
    try {
      const content = formatChatForExport(true);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mittek-chat-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Chat gemt som tekstfil');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kunne ikke eksportere chat');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadAsPDF = async () => {
    setIsExporting(true);
    try {
      // Create a simple HTML-to-PDF using print dialog
      const content = messages.map(msg => {
        const sender = msg.role === 'user' ? 'Dig' : 'Din Digitale Hjælper';
        const bgColor = msg.role === 'user' ? '#e0f2fe' : '#f1f5f9';
        return `
          <div style="margin-bottom: 16px; padding: 16px; background: ${bgColor}; border-radius: 12px;">
            <p style="font-weight: bold; margin-bottom: 8px; color: #334155; font-size: 16px;">${sender}</p>
            <p style="margin: 0; line-height: 1.6; color: #475569; font-size: 18px; white-space: pre-wrap;">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
        `;
      }).join('');

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Pop-up blev blokeret. Tillad pop-ups for at downloade PDF.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MitTek Chat</title>
          <style>
            @page { margin: 2cm; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              font-size: 18px;
              line-height: 1.6;
            }
            h1 { 
              color: #0369a1; 
              font-size: 28px;
              margin-bottom: 8px;
            }
            .date { 
              color: #64748b; 
              margin-bottom: 32px;
              font-size: 16px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>🛡️ MitTek Chat-historik</h1>
          <p class="date">Eksporteret: ${new Date().toLocaleString('da-DK')}</p>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success('PDF-dialog åbnet. Vælg "Gem som PDF" i printmenuen.');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Kunne ikke oprette PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (messages.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
          disabled={disabled || isExporting}
          title="Gem samtale"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={downloadAsPDF} className="cursor-pointer">
          <FileDown className="mr-2 h-4 w-4" />
          Gem som PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadAsText} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          Gem som Tekst
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
