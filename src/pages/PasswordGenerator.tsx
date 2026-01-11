import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { RefreshCw, Copy, Check, Key } from 'lucide-react';
import { toast } from 'sonner';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';

// Danish friendly nouns for passphrase generation
const danishNouns = [
  'Sol', 'Kat', 'Hund', 'Hus', 'Bil', 'Strand', 'Skov', 'Bog', 'Kaffe', 'Blomst',
  'Fugl', 'Fisk', 'Træ', 'Himmel', 'Vand', 'Brød', 'Ost', 'Æble', 'Pære', 'Kage',
  'Stol', 'Bord', 'Lampe', 'Vindue', 'Dør', 'Cykel', 'Båd', 'Tog', 'Fly', 'Bus',
  'Sko', 'Hat', 'Jakke', 'Bukser', 'Taske', 'Nøgle', 'Ur', 'Telefon', 'Musik', 'Film',
  'Sommer', 'Vinter', 'Forår', 'Efterår', 'Måne', 'Stjerne', 'Sky', 'Regn', 'Sne', 'Is',
  'Hav', 'Fjord', 'Ø', 'Bakke', 'Dal', 'Mark', 'Have', 'Park', 'Slot', 'Kirke'
];

const generatePassphrase = (): string => {
  const shuffled = [...danishNouns].sort(() => Math.random() - 0.5);
  const words = shuffled.slice(0, 3);
  const number = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${words[0]}-${words[1]}-${words[2]}-${number}`;
};

const PasswordGenerator = () => {
  const [passphrase, setPassphrase] = useState(generatePassphrase);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    setPassphrase(generatePassphrase());
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(passphrase);
      setCopied(true);
      toast.success('Kopieret til udklipsholder!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kunne ikke kopiere. Prøv at markere teksten manuelt.');
    }
  }, [passphrase]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center">
          <BackButton />
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-lg mx-auto">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4" />
          
          <div className="text-center">
            {/* Header */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <ToolPageHelpButton />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Sikker Kode-generator</h1>
            <p className="text-muted-foreground mb-8">
              Lav en stærk kode, du nemt kan huske. Brug den til nye konti eller adgangskoder.
            </p>

            {/* Passphrase Display */}
            <div className="card-elevated p-8 mb-6">
              <p className="text-sm text-muted-foreground mb-4">Din sikre kode:</p>
              <p 
                className="text-3xl md:text-4xl font-bold text-primary break-all select-all mb-6"
                aria-live="polite"
              >
                {passphrase}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCopy}
                  className="min-h-[48px]"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-5 w-5 text-success" />
                      Kopieret!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-5 w-5" />
                      Kopier
                    </>
                  )}
                </Button>
                
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleGenerate}
                  className="min-h-[48px]"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Lav ny kode
                </Button>
              </div>
            </div>

            {/* Tips */}
            <div className="card-elevated p-6 text-left">
              <h2 className="font-semibold mb-3">💡 Sådan husker du din kode</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Forestil dig en historie med ordene</li>
                <li>• Skriv koden ned og gem den sikkert</li>
                <li>• Brug den i din Kode-mappe på MitTek</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      
    </div>
  );
};

export default PasswordGenerator;
