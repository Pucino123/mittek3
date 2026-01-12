import { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Edit, Plus, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemContent {
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const SystemContentEditor = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  const [items, setItems] = useState<SystemContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<SystemContent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isNewItem, setIsNewItem] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_content')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Failed to fetch system content:', error);
      toast.error('Kunne ikke hente system indhold');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditor = (item?: SystemContent) => {
    if (item) {
      setEditingItem(item);
      setEditKey(item.key);
      setEditValue(item.value);
      setEditDescription(item.description || '');
      setIsNewItem(false);
    } else {
      setEditingItem(null);
      setEditKey('');
      setEditValue('');
      setEditDescription('');
      setIsNewItem(true);
    }
    setIsDialogOpen(true);
  };

  const saveItem = async () => {
    if (!editKey.trim() || !editValue.trim()) {
      toast.error('Nøgle og værdi er påkrævet');
      return;
    }

    setIsSaving(true);
    try {
      if (isNewItem) {
        // Insert new item
        const { error } = await supabase
          .from('system_content')
          .insert({
            key: editKey.trim(),
            value: editValue,
            description: editDescription || null,
          });

        if (error) throw error;
        toast.success('Tekst oprettet');
      } else {
        // Update existing item
        const { error } = await supabase
          .from('system_content')
          .update({
            value: editValue,
            description: editDescription || null,
            updated_at: new Date().toISOString(),
          })
          .eq('key', editingItem!.key);

        if (error) throw error;
        toast.success('Tekst opdateret');
      }

      setIsDialogOpen(false);
      fetchItems();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message?.includes('duplicate') 
        ? 'Nøglen eksisterer allerede' 
        : 'Kunne ikke gemme tekst');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>System Tekster</CardTitle>
              <CardDescription>
                Rediger dynamiske tekster brugt i applikationen (Screenshot AI, prompts, etc.)
              </CardDescription>
            </div>
            <Button onClick={() => openEditor()} className="gap-2">
              <Plus className="h-4 w-4" />
              Tilføj Tekst
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Ingen system tekster fundet. Klik "Tilføj Tekst" for at oprette en.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nøgle</TableHead>
                  <TableHead>Værdi</TableHead>
                  <TableHead>Beskrivelse</TableHead>
                  <TableHead className="text-right">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="font-mono text-sm">
                      {item.key}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {item.value.slice(0, 100)}{item.value.length > 100 ? '...' : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditor(item)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Rediger
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isNewItem ? 'Tilføj Ny Tekst' : 'Rediger Tekst'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-key">Nøgle (unik identifikator)</Label>
              <Input
                id="edit-key"
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                placeholder="f.eks. screenshot_ai_title"
                disabled={!isNewItem}
                className="font-mono"
              />
              {!isNewItem && (
                <p className="text-xs text-muted-foreground">
                  Nøglen kan ikke ændres efter oprettelse
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivelse (valgfri)</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Hvad bruges denne tekst til?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-value">Værdi</Label>
              <Textarea
                id="edit-value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Indholdet af teksten..."
                rows={6}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuller
              </Button>
              <Button
                className="flex-1"
                onClick={saveItem}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Gem
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

SystemContentEditor.displayName = 'SystemContentEditor';