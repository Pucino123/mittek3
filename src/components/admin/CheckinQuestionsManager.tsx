import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical, 
  Smartphone, 
  Tablet, 
  Monitor,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HelpStep {
  instruction: string;
  detail: string;
  [key: string]: string; // Allow JSON compatibility
}

interface CheckinQuestion {
  id: string;
  device_type: string;
  question_id: string;
  text: string;
  question_type: string;
  weight: number;
  good_answer: boolean;
  recommendation: string;
  check_label: string;
  help_title: string | null;
  help_screenshot: string | null;
  help_steps: HelpStep[];
  help_tip: string | null;
  sort_order: number;
  is_active: boolean;
}

const deviceTabs = [
  { value: 'iphone', label: 'iPhone', icon: Smartphone },
  { value: 'ipad', label: 'iPad', icon: Tablet },
  { value: 'mac', label: 'Mac', icon: Monitor },
];

export function CheckinQuestionsManager() {
  const [questions, setQuestions] = useState<CheckinQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('iphone');
  const [editingQuestion, setEditingQuestion] = useState<CheckinQuestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checkin_questions')
      .select('*')
      .order('device_type')
      .order('sort_order');

    if (error) {
      toast.error('Kunne ikke hente spørgsmål');
      console.error(error);
    } else {
      // Parse help_steps from JSON if needed and cast properly
      const parsed = (data || []).map(q => ({
        ...q,
        help_steps: (Array.isArray(q.help_steps) ? q.help_steps : []) as HelpStep[]
      })) as CheckinQuestion[];
      setQuestions(parsed);
    }
    setLoading(false);
  };

  const getQuestionsForDevice = (device: string) => {
    return questions.filter(q => q.device_type === device).sort((a, b) => a.sort_order - b.sort_order);
  };

  const handleSave = async () => {
    if (!editingQuestion) return;
    setSaving(true);

    const payload = {
      device_type: editingQuestion.device_type,
      question_id: editingQuestion.question_id,
      text: editingQuestion.text,
      question_type: editingQuestion.question_type,
      weight: editingQuestion.weight,
      good_answer: editingQuestion.good_answer,
      recommendation: editingQuestion.recommendation,
      check_label: editingQuestion.check_label,
      help_title: editingQuestion.help_title || null,
      help_screenshot: editingQuestion.help_screenshot || null,
      help_steps: editingQuestion.help_steps,
      help_tip: editingQuestion.help_tip || null,
      sort_order: editingQuestion.sort_order,
      is_active: editingQuestion.is_active,
    };

    if (editingQuestion.id && !editingQuestion.id.startsWith('new-')) {
      // Update existing
      const { error } = await supabase
        .from('checkin_questions')
        .update(payload)
        .eq('id', editingQuestion.id);

      if (error) {
        toast.error('Kunne ikke gemme ændringer');
        console.error(error);
      } else {
        toast.success('Spørgsmål opdateret');
        fetchQuestions();
        setIsDialogOpen(false);
        setEditingQuestion(null);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('checkin_questions')
        .insert(payload);

      if (error) {
        toast.error('Kunne ikke oprette spørgsmål');
        console.error(error);
      } else {
        toast.success('Spørgsmål oprettet');
        fetchQuestions();
        setIsDialogOpen(false);
        setEditingQuestion(null);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på, at du vil slette dette spørgsmål?')) return;

    const { error } = await supabase
      .from('checkin_questions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Kunne ikke slette spørgsmål');
      console.error(error);
    } else {
      toast.success('Spørgsmål slettet');
      fetchQuestions();
    }
  };

  const handleToggleActive = async (question: CheckinQuestion) => {
    const { error } = await supabase
      .from('checkin_questions')
      .update({ is_active: !question.is_active })
      .eq('id', question.id);

    if (error) {
      toast.error('Kunne ikke ændre status');
    } else {
      fetchQuestions();
    }
  };

  const handleMoveUp = async (question: CheckinQuestion) => {
    const deviceQuestions = getQuestionsForDevice(question.device_type);
    const currentIndex = deviceQuestions.findIndex(q => q.id === question.id);
    if (currentIndex <= 0) return;

    const prevQuestion = deviceQuestions[currentIndex - 1];
    
    await supabase
      .from('checkin_questions')
      .update({ sort_order: prevQuestion.sort_order })
      .eq('id', question.id);
    
    await supabase
      .from('checkin_questions')
      .update({ sort_order: question.sort_order })
      .eq('id', prevQuestion.id);

    fetchQuestions();
  };

  const handleMoveDown = async (question: CheckinQuestion) => {
    const deviceQuestions = getQuestionsForDevice(question.device_type);
    const currentIndex = deviceQuestions.findIndex(q => q.id === question.id);
    if (currentIndex >= deviceQuestions.length - 1) return;

    const nextQuestion = deviceQuestions[currentIndex + 1];
    
    await supabase
      .from('checkin_questions')
      .update({ sort_order: nextQuestion.sort_order })
      .eq('id', question.id);
    
    await supabase
      .from('checkin_questions')
      .update({ sort_order: question.sort_order })
      .eq('id', nextQuestion.id);

    fetchQuestions();
  };

  const openNewQuestion = () => {
    const deviceQuestions = getQuestionsForDevice(activeTab);
    const maxOrder = deviceQuestions.length > 0 
      ? Math.max(...deviceQuestions.map(q => q.sort_order)) 
      : 0;

    setEditingQuestion({
      id: `new-${Date.now()}`,
      device_type: activeTab,
      question_id: '',
      text: '',
      question_type: 'boolean',
      weight: 10,
      good_answer: true,
      recommendation: '',
      check_label: '',
      help_title: null,
      help_screenshot: null,
      help_steps: [],
      help_tip: null,
      sort_order: maxOrder + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const addHelpStep = () => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      help_steps: [...editingQuestion.help_steps, { instruction: '', detail: '' }]
    });
  };

  const removeHelpStep = (index: number) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      help_steps: editingQuestion.help_steps.filter((_, i) => i !== index)
    });
  };

  const updateHelpStep = (index: number, field: 'instruction' | 'detail', value: string) => {
    if (!editingQuestion) return;
    const newSteps = [...editingQuestion.help_steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditingQuestion({
      ...editingQuestion,
      help_steps: newSteps
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Månedligt Tjek - Spørgsmål</h3>
        <Button onClick={openNewQuestion} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nyt spørgsmål
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {deviceTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className="text-xs text-muted-foreground">
                ({getQuestionsForDevice(tab.value).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {deviceTabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-2 mt-4">
            {getQuestionsForDevice(tab.value).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Ingen spørgsmål for {tab.label}
              </p>
            ) : (
              getQuestionsForDevice(tab.value).map((question, index) => (
                <Card key={question.id} className={!question.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(question)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(question)}
                          disabled={index === getQuestionsForDevice(tab.value).length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {question.question_id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Vægt: {question.weight} • Type: {question.question_type}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{question.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Label: {question.check_label}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={question.is_active}
                          onCheckedChange={() => handleToggleActive(question)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setEditingQuestion(question);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion?.id?.startsWith('new-') ? 'Nyt spørgsmål' : 'Rediger spørgsmål'}
            </DialogTitle>
          </DialogHeader>

          {editingQuestion && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID (unik nøgle)</Label>
                  <Input 
                    value={editingQuestion.question_id}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question_id: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    })}
                    placeholder="f.eks. iphone_update"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enhed</Label>
                  <Select 
                    value={editingQuestion.device_type}
                    onValueChange={(value) => setEditingQuestion({
                      ...editingQuestion,
                      device_type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iphone">iPhone</SelectItem>
                      <SelectItem value="ipad">iPad</SelectItem>
                      <SelectItem value="mac">Mac</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Spørgsmålstekst</Label>
                <Textarea 
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    text: e.target.value
                  })}
                  placeholder="Skriv spørgsmålet her..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={editingQuestion.question_type}
                    onValueChange={(value) => setEditingQuestion({
                      ...editingQuestion,
                      question_type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boolean">Ja/Nej</SelectItem>
                      <SelectItem value="done">Udført</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vægt (point)</Label>
                  <Input 
                    type="number"
                    value={editingQuestion.weight}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      weight: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Godt svar</Label>
                  <Select 
                    value={editingQuestion.good_answer ? 'true' : 'false'}
                    onValueChange={(value) => setEditingQuestion({
                      ...editingQuestion,
                      good_answer: value === 'true'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ja</SelectItem>
                      <SelectItem value="false">Nej</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Check-label (kort visning)</Label>
                <Input 
                  value={editingQuestion.check_label}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    check_label: e.target.value
                  })}
                  placeholder="f.eks. Opdatering"
                />
              </div>

              <div className="space-y-2">
                <Label>Anbefaling (vises hvis forkert svar)</Label>
                <Textarea 
                  value={editingQuestion.recommendation}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    recommendation: e.target.value
                  })}
                  placeholder="Skriv anbefaling her..."
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Hjælp-sektion (valgfrit)</h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hjælp-titel</Label>
                    <Input 
                      value={editingQuestion.help_title || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        help_title: e.target.value || null
                      })}
                      placeholder="f.eks. Tjek om din iPhone er opdateret"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Screenshot-nøgle (bruges til at vise billede)</Label>
                    <Input 
                      value={editingQuestion.help_screenshot || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        help_screenshot: e.target.value || null
                      })}
                      placeholder="f.eks. settings, battery, icloud"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hjælp-tip</Label>
                    <Input 
                      value={editingQuestion.help_tip || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        help_tip: e.target.value || null
                      })}
                      placeholder="Et kort tip til brugeren"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Hjælp-trin</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addHelpStep}>
                        <Plus className="h-3 w-3 mr-1" />
                        Tilføj trin
                      </Button>
                    </div>
                    
                    {editingQuestion.help_steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-xs text-muted-foreground mt-2.5 w-4">{idx + 1}.</span>
                        <div className="flex-1 space-y-1">
                          <Input 
                            value={step.instruction}
                            onChange={(e) => updateHelpStep(idx, 'instruction', e.target.value)}
                            placeholder="Instruktion"
                          />
                          <Input 
                            value={step.detail}
                            onChange={(e) => updateHelpStep(idx, 'detail', e.target.value)}
                            placeholder="Detalje"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeHelpStep(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch 
                  id="is-active"
                  checked={editingQuestion.is_active}
                  onCheckedChange={(checked) => setEditingQuestion({
                    ...editingQuestion,
                    is_active: checked
                  })}
                />
                <Label htmlFor="is-active">Aktiv (vises for brugere)</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Gem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
