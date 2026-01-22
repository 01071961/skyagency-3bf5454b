import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, Plus, Edit2, Trash2, Eye, 
  BarChart3, Clock, CheckCircle, FileText, Paintbrush, Layout,
  Users, UserPlus, X, Mail
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EmailTemplateLibrary, { EmailTemplate, TEMPLATE_LIBRARY } from './EmailTemplateLibrary';
import EmailEditor from './EmailEditor';

interface ContactEmail {
  email: string;
  name: string;
  source: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  esp_id: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  created_at: string;
  updated_at: string;
}

interface ESPConfiguration {
  id: string;
  provider: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
}

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [espConfigs, setEspConfigs] = useState<ESPConfiguration[]>([]);
  const [contactEmails, setContactEmails] = useState<ContactEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [editorMode, setEditorMode] = useState<'code' | 'visual' | 'template'>('code');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [newManualEmail, setNewManualEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    esp_id: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [campaignsRes, espRes, contactsRes] = await Promise.all([
        supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('esp_configurations').select('id, provider, name, is_active, is_default').eq('is_active', true),
        supabase.from('contact_submissions').select('email, name, source').order('created_at', { ascending: false }),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (espRes.error) throw espRes.error;

      setCampaigns(campaignsRes.data || []);
      setEspConfigs(espRes.data || []);
      
      // Remove duplicates by email
      if (contactsRes.data) {
        const uniqueEmails = new Map<string, ContactEmail>();
        contactsRes.data.forEach((c) => {
          if (c.email && !uniqueEmails.has(c.email)) {
            uniqueEmails.set(c.email, { email: c.email, name: c.name, source: c.source || 'contact' });
          }
        });
        setContactEmails(Array.from(uniqueEmails.values()));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.subject || !formData.html_content) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha nome, assunto e conteúdo HTML.',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        name: formData.name,
        subject: formData.subject,
        html_content: formData.html_content,
        text_content: formData.text_content || null,
        esp_id: formData.esp_id || null,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from('email_campaigns')
          .update(payload)
          .eq('id', editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_campaigns')
          .insert(payload);
        if (error) throw error;
      }

      toast({
        title: 'Campanha salva!',
        description: `Campanha "${formData.name}" salva com sucesso.`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a campanha.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;

      toast({
        title: 'Campanha removida',
        description: 'A campanha foi excluída com sucesso.',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a campanha.',
        variant: 'destructive',
      });
    }
  };

  const handleSendCampaign = async () => {
    try {
      const recipients = [...selectedEmails, ...manualEmails];
      
      if (recipients.length === 0) {
        toast({
          title: 'Sem destinatários',
          description: 'Selecione pelo menos um destinatário para enviar.',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.name || !formData.subject || !formData.html_content) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha nome, assunto e conteúdo HTML.',
          variant: 'destructive',
        });
        return;
      }

      // First save/update the campaign
      let campaignId = editingCampaign?.id;
      
      const payload = {
        name: formData.name,
        subject: formData.subject,
        html_content: formData.html_content,
        text_content: formData.text_content || null,
        esp_id: formData.esp_id || null,
        status: 'sending',
        total_recipients: recipients.length,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from('email_campaigns')
          .update(payload)
          .eq('id', editingCampaign.id);
        if (error) throw error;
      } else {
        const { data: newCampaign, error } = await supabase
          .from('email_campaigns')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        campaignId = newCampaign.id;
      }

      toast({
        title: 'Enviando campanha...',
        description: `Enviando para ${recipients.length} destinatário(s).`,
      });

      // Send emails via edge function
      let sentCount = 0;
      let failedCount = 0;
      let lastError = '';

      for (const email of recipients) {
        try {
          console.log(`[Campaign] Invoking send-campaign-email for ${email}`);
          
          const { data, error } = await supabase.functions.invoke('send-campaign-email', {
            body: {
              to: email,
              subject: formData.subject,
              html: formData.html_content,
              campaignId,
            },
          });

          console.log(`[Campaign] Response for ${email}:`, { data, error });

          if (error) {
            console.error(`[Campaign] Invoke error for ${email}:`, error);
            lastError = `${error.message || error.name || 'Erro de invocação'}`;
            failedCount++;
          } else if (data?.error) {
            console.error(`[Campaign] Function error for ${email}:`, data.error);
            lastError = data.error;
            failedCount++;
          } else if (!data?.success) {
            console.error(`[Campaign] Unknown failure for ${email}:`, data);
            lastError = 'Resposta sem confirmação de sucesso';
            failedCount++;
          } else {
            console.log(`[Campaign] Success for ${email}:`, data);
            sentCount++;
          }
        } catch (err: any) {
          console.error(`[Campaign] Exception for ${email}:`, err);
          lastError = err.message || 'Erro de conexão';
          failedCount++;
        }
      }

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({
          status: failedCount === recipients.length ? 'failed' : 'sent',
          sent_at: new Date().toISOString(),
          sent_count: sentCount,
        })
        .eq('id', campaignId);

      toast({
        title: sentCount > 0 ? 'Campanha enviada!' : 'Falha no envio',
        description: sentCount > 0 
          ? `${sentCount} email(s) enviado(s)${failedCount > 0 ? `, ${failedCount} falha(s)` : ''}.`
          : `Erro: ${lastError}`,
        variant: sentCount > 0 ? 'default' : 'destructive',
      });

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a campanha.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setEditorMode('code');
    setSelectedEmails([]);
    setManualEmails([]);
    setNewManualEmail('');
    setFormData({
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      esp_id: '',
    });
  };

  const handleAddManualEmail = () => {
    const email = newManualEmail.trim().toLowerCase();
    if (!email) return;
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }
    
    if (manualEmails.includes(email) || selectedEmails.includes(email)) {
      toast({
        title: 'Email duplicado',
        description: 'Este email já foi adicionado.',
        variant: 'destructive',
      });
      return;
    }
    
    setManualEmails([...manualEmails, email]);
    setNewManualEmail('');
  };

  const handleRemoveManualEmail = (email: string) => {
    setManualEmails(manualEmails.filter(e => e !== email));
  };

  const toggleEmailSelection = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const selectAllEmails = () => {
    setSelectedEmails(contactEmails.map(c => c.email));
  };

  const deselectAllEmails = () => {
    setSelectedEmails([]);
  };

  const getTotalRecipients = () => {
    return selectedEmails.length + manualEmails.length;
  };

  const openEditDialog = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      html_content: campaign.html_content,
      text_content: campaign.text_content || '',
      esp_id: campaign.esp_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setFormData({
      ...formData,
      subject: template.subject,
      html_content: template.html_content,
    });
    setEditorMode('code');
    toast({
      title: 'Template aplicado!',
      description: `Template "${template.name}" carregado. Personalize conforme necessário.`,
    });
  };

  const handleEditorSave = (html: string) => {
    setFormData({ ...formData, html_content: html });
    toast({
      title: 'HTML atualizado',
      description: 'O conteúdo do editor visual foi aplicado.',
    });
  };

  const handlePreview = (html: string) => {
    setPreviewHtml(html);
    setShowPreview(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="border-muted-foreground">Rascunho</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Agendada</Badge>;
      case 'sending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Enviando</Badge>;
      case 'sent':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Enviada</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliveryRate = (campaign: EmailCampaign) => {
    if (campaign.total_recipients === 0) return 0;
    return Math.round((campaign.sent_count / campaign.total_recipients) * 100);
  };

  const getOpenRate = (campaign: EmailCampaign) => {
    if (campaign.sent_count === 0) return 0;
    return Math.round((campaign.opened_count / campaign.sent_count) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campanhas de E-mail</h2>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie campanhas de marketing por e-mail
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-6xl max-h-[95vh] overflow-hidden flex flex-col" aria-describedby="campaign-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
              </DialogTitle>
              <p id="campaign-dialog-description" className="text-sm text-muted-foreground">
                Configure os detalhes da sua campanha de e-mail marketing.
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
              {/* Campaign info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Nome da Campanha</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Newsletter Dezembro 2024"
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Provedor de Envio</Label>
                  <Select
                    value={formData.esp_id || "resend_default"}
                    onValueChange={(value) => setFormData({ ...formData, esp_id: value === "resend_default" ? "" : value })}
                  >
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Usar padrão (Resend)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend_default">Resend (Padrão)</SelectItem>
                      {espConfigs.filter(esp => esp.id).map((esp) => (
                        <SelectItem key={esp.id} value={esp.id}>
                          {esp.name} {esp.is_default && '(Configurado)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Assunto do E-mail</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Novidades exclusivas para você!"
                  className="bg-muted/50 border-border"
                />
              </div>

              {/* Recipients Section */}
              <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <Label className="text-foreground font-medium">Destinatários</Label>
                    <Badge variant="outline" className="ml-2">
                      {getTotalRecipients()} selecionado(s)
                    </Badge>
                  </div>
                </div>

                {/* Registered Emails */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Emails Cadastrados</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={selectAllEmails}
                        disabled={contactEmails.length === 0}
                      >
                        Selecionar todos
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={deselectAllEmails}
                        disabled={selectedEmails.length === 0}
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                  
                  {contactEmails.length > 0 ? (
                    <ScrollArea className="h-40 border border-border rounded-md bg-background">
                      <div className="p-2 space-y-1">
                        {contactEmails.map((contact) => (
                          <div 
                            key={contact.email}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleEmailSelection(contact.email)}
                          >
                            <Checkbox 
                              checked={selectedEmails.includes(contact.email)}
                              onCheckedChange={() => toggleEmailSelection(contact.email)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {contact.source === 'vip' ? 'VIP' : 'Contato'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-20 border border-dashed border-border rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Nenhum email cadastrado</p>
                    </div>
                  )}
                </div>

                {/* Manual Emails */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Adicionar Emails Manualmente</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={newManualEmail}
                      onChange={(e) => setNewManualEmail(e.target.value)}
                      placeholder="Digite um email..."
                      className="bg-muted/50 border-border flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualEmail();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddManualEmail}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {manualEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {manualEmails.map((email) => (
                        <Badge 
                          key={email} 
                          variant="secondary"
                          className="flex items-center gap-1 py-1"
                        >
                          <Mail className="w-3 h-3" />
                          {email}
                          <button
                            type="button"
                            onClick={() => handleRemoveManualEmail(email)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Editor Tabs */}
              <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as typeof editorMode)}>
                <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                  <TabsTrigger value="template" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Templates
                  </TabsTrigger>
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Paintbrush className="w-4 h-4" />
                    Editor Visual
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Código HTML
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="mt-4">
                  <div className="border border-border rounded-lg p-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-4">
                      Escolha um template pronto para começar rapidamente:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                      {TEMPLATE_LIBRARY.map((template) => {
                        const Icon = template.icon;
                        return (
                          <Card 
                            key={template.id}
                            className="bg-card border-border hover:border-primary/50 cursor-pointer transition-all"
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                              <p className="text-sm font-medium text-foreground">{template.name}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {template.category}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="visual" className="mt-4">
                  <EmailEditor 
                    initialHtml={formData.html_content}
                    onSave={handleEditorSave}
                    onPreview={handlePreview}
                  />
                </TabsContent>

                <TabsContent value="code" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Conteúdo HTML</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePreview(formData.html_content)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                    <Textarea
                      value={formData.html_content}
                      onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                      placeholder="<html>...</html>"
                      className="min-h-64 bg-muted/50 border-border font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Conteúdo Texto (opcional)</Label>
                    <Textarea
                      value={formData.text_content}
                      onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                      placeholder="Versão em texto puro do e-mail..."
                      className="min-h-24 bg-muted/50 border-border"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSave} variant="secondary">
                {editingCampaign ? 'Salvar Alterações' : 'Salvar Rascunho'}
              </Button>
              <Button 
                onClick={handleSendCampaign} 
                className="bg-primary hover:bg-primary/90"
                disabled={getTotalRecipients() === 0 || !formData.name || !formData.subject || !formData.html_content}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Campanha ({getTotalRecipients()})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh]" aria-describedby="preview-dialog-description">
          <DialogHeader>
            <DialogTitle>Preview do E-mail</DialogTitle>
            <p id="preview-dialog-description" className="text-sm text-muted-foreground">
              Visualização do conteúdo HTML do e-mail.
            </p>
          </DialogHeader>
          <div className="bg-white rounded-lg overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[600px] border-0"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Campanhas</p>
                <p className="text-2xl font-bold text-foreground">{campaigns.length}</p>
              </div>
              <Send className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold text-green-500">
                  {campaigns.filter(c => c.status === 'sent').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {campaigns.filter(c => c.status === 'draft').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ESPs Ativos</p>
                <p className="text-2xl font-bold text-primary">{espConfigs.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Send className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma campanha criada</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Crie sua primeira campanha de e-mail para engajar seus contatos.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Assunto: {campaign.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Criada em {format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>

                    {campaign.status === 'sent' && (
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Entrega</p>
                          <div className="flex items-center gap-2">
                            <Progress value={getDeliveryRate(campaign)} className="w-16 h-2" />
                            <span className="text-sm font-medium text-foreground">{getDeliveryRate(campaign)}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Abertura</p>
                          <div className="flex items-center gap-2">
                            <Progress value={getOpenRate(campaign)} className="w-16 h-2" />
                            <span className="text-sm font-medium text-foreground">{getOpenRate(campaign)}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Cliques</p>
                          <span className="text-sm font-medium text-foreground">{campaign.clicked_count}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePreview(campaign.html_content)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(campaign)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignManager;