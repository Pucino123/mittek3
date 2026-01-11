import { useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  MessageSquare, 
  Send,
  CheckCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { SEOHead } from '@/components/seo/SEOHead';
import { trackFormSubmission } from '@/utils/analytics';
import { supabase } from '@/integrations/supabase/client';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Navn er påkrævet').max(100, 'Navn må maks være 100 tegn'),
  email: z.string().trim().email('Ugyldig email-adresse').max(255, 'Email må maks være 255 tegn'),
  subject: z.string().trim().min(1, 'Emne er påkrævet').max(200, 'Emne må maks være 200 tegn'),
  message: z.string().trim().min(10, 'Beskeden skal være mindst 10 tegn').max(2000, 'Beskeden må maks være 2000 tegn'),
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-form', {
        body: result.data,
      });

      if (error) {
        throw new Error(error.message || 'Kunne ikke sende besked');
      }

      setIsSubmitted(true);
      trackFormSubmission('contact', true);
      toast.success('Tak for din besked! Vi vender tilbage hurtigst muligt.');
    } catch (error: any) {
      console.error('Contact form error:', error);
      trackFormSubmission('contact', false);
      toast.error('Der opstod en fejl. Prøv venligst igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: 'Brug formularen til højre',
      value: 'Svartid: 1-2 hverdage',
    },
    {
      icon: HelpCircle,
      title: 'Ofte stillede spørgsmål',
      description: 'Find svar på almindelige spørgsmål',
      value: 'Se vores FAQ',
      href: '/faq',
    },
  ];

  if (isSubmitted) {
    return (
      <PublicLayout>
        <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Tak for din besked!</h1>
              <p className="text-muted-foreground mb-6">
                Vi har modtaget din henvendelse og vender tilbage hurtigst muligt. 
                Du kan forvente svar inden for 1-2 hverdage.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
              >
                Send en ny besked
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead
        title="Kontakt os - MitTek"
        description="Har du spørgsmål eller brug for hjælp? Kontakt MitTek og få svar inden for 1-2 hverdage. Vi er her for at hjælpe dig."
        canonical="https://www.mittek.dk/contact"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Kontakt os
              </h1>
              <p className="text-lg text-muted-foreground">
                Har du spørgsmål eller brug for hjælp? Vi er her for dig.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Methods */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-xl font-semibold mb-4">Kontaktoplysninger</h2>
                {contactMethods.map((method, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <method.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{method.title}</h3>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                          {method.href ? (
                            <a 
                              href={method.href} 
                              className="text-sm text-primary hover:underline font-medium"
                            >
                              {method.value}
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-foreground">{method.value}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-xl font-semibold mb-6">Send os en besked</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Dit navn *</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Karen Jensen"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? 'border-destructive' : ''}
                          />
                          {errors.name && (
                            <p className="text-sm text-destructive">{errors.name}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Din email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="din@email.dk"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'border-destructive' : ''}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Emne *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="Hvad handler din henvendelse om?"
                          value={formData.subject}
                          onChange={handleChange}
                          className={errors.subject ? 'border-destructive' : ''}
                        />
                        {errors.subject && (
                          <p className="text-sm text-destructive">{errors.subject}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Din besked *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Beskriv dit spørgsmål eller problem så detaljeret som muligt..."
                          value={formData.message}
                          onChange={handleChange}
                          rows={6}
                          className={errors.message ? 'border-destructive' : ''}
                        />
                        {errors.message && (
                          <p className="text-sm text-destructive">{errors.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground text-right">
                          {formData.message.length}/2000 tegn
                        </p>
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sender...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send besked
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Contact;
