import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, LayoutGrid, List, RefreshCw, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CampaignCard from './campaigns/CampaignCard';
import CampaignStats from './campaigns/CampaignStats';
import CampaignDialog from './campaigns/CampaignDialog';
import TemplateCard from './campaigns/TemplateCard';
import CampaignAIAssistant from './campaigns/CampaignAIAssistant';
import { TEMPLATE_LIBRARY } from './EmailTemplateLibrary';

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

interface ContactEmail {
  email: string;
  name: string;
  source: string;
}

const CampaignManagerNew = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [contactEmails, setContactEmails] = useState<ContactEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns');
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [campaignsRes, contactsRes] = await Promise.all([
        supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_submissions').select('email, name, source').order('created_at', { ascending: false }),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      setCampaigns(campaignsRes.data || []);
      
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

  const handleSave = async (data: {
    name: string;
    subject: string;
    html_content: string;
    text_content: string;
    recipients: string[];
  }) => {
    try {
      const payload = {
        name: data.name,
        subject: data.subject,
        html_content: data.html_content,
        text_content: data.text_content || null,
        total_recipients: data.recipients.length,
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
        description: `Campanha "${data.name}" salva com sucesso.`,
      });

      setEditingCampaign(null);
      fetchData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a campanha.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleSend = async (data: {
    name: string;
    subject: string;
    html_content: string;
    text_content: string;
    recipients: string[];
  }) => {
    try {
      // First save the campaign
      const payload = {
        name: data.name,
        subject: data.subject,
        html_content: data.html_content,
        text_content: data.text_content || null,
        status: 'sending',
        total_recipients: data.recipients.length,
      };

      let campaignId = editingCampaign?.id;

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
        description: `Enviando para ${data.recipients.length} destinatário(s).`,
      });

      // Send emails
      let sentCount = 0;
      let failedCount = 0;

      for (const email of data.recipients) {
        try {
          const { data: responseData, error } = await supabase.functions.invoke('send-campaign-email', {
            body: {
              to: email,
              subject: data.subject,
              html: data.html_content,
              campaignId,
            },
          });

          if (error || responseData?.error || !responseData?.success) {
            failedCount++;
          } else {
            sentCount++;
          }
        } catch {
          failedCount++;
        }
      }

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({
          status: failedCount === data.recipients.length ? 'failed' : 'sent',
          sent_at: new Date().toISOString(),
          sent_count: sentCount,
        })
        .eq('id', campaignId);

      toast({
        title: sentCount > 0 ? 'Campanha enviada!' : 'Falha no envio',
        description: sentCount > 0 
          ? `${sentCount} email(s) enviado(s)${failedCount > 0 ? `, ${failedCount} falha(s)` : ''}.`
          : 'Não foi possível enviar os e-mails.',
        variant: sentCount > 0 ? 'default' : 'destructive',
      });

      setEditingCampaign(null);
      fetchData();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a campanha.',
        variant: 'destructive',
      });
      throw error;
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

  const handleEdit = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setIsDialogOpen(true);
  };

  const handlePreview = (html: string) => {
    setPreviewHtml(html);
    setShowPreview(true);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </span>
            E-mail Marketing
          </h2>
          <p className="text-muted-foreground mt-1">
            Crie campanhas profissionais com templates modernos e IA
          </p>
        </div>
        
        <Button 
          onClick={() => {
            setEditingCampaign(null);
            setIsDialogOpen(true);
          }}
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <CampaignStats campaigns={campaigns} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="campaigns" className="gap-2">
              Campanhas
              <span className="text-xs bg-muted/80 px-2 py-0.5 rounded-full">
                {campaigns.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              Templates
              <span className="text-xs bg-muted/80 px-2 py-0.5 rounded-full">
                {TEMPLATE_LIBRARY.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'campaigns' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-muted/50 border-border"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-muted/50 border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="sent">Enviadas</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border border-border rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          {filteredCampaigns.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Nenhuma campanha encontrada' 
                    : 'Crie sua primeira campanha'}
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Comece a engajar sua audiência com campanhas profissionais de e-mail marketing.'}
                </p>
                {!searchQuery && filterStatus === 'all' && (
                  <Button 
                    onClick={() => {
                      setEditingCampaign(null);
                      setIsDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Campanha
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
                : 'space-y-4'
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPreview={() => handlePreview(campaign.html_content)}
                />
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TEMPLATE_LIBRARY.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => {
                  setEditingCampaign(null);
                  setIsDialogOpen(true);
                }}
                onPreview={() => handlePreview(template.html_content)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Campaign Dialog */}
      <CampaignDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        campaign={editingCampaign}
        contactEmails={contactEmails}
        onSave={handleSave}
        onSend={handleSend}
      />

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Pré-visualização</DialogTitle>
          </DialogHeader>
          <div className="bg-background rounded-lg overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[600px] border-0"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign AI Assistant */}
      <CampaignAIAssistant 
        campaignData={{
          name: editingCampaign?.name || '',
          subject: editingCampaign?.subject || '',
          html_content: editingCampaign?.html_content || '',
          recipientCount: editingCampaign?.total_recipients || 0,
        }}
      />
    </div>
  );
};

export default CampaignManagerNew;
