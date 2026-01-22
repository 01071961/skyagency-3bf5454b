import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { Mail, FileText, Clock, CheckCircle, XCircle, Eye, Edit2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: string;
  template_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

const EmailManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [templatesRes, logsRes] = await Promise.all([
        supabase.from('email_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (logsRes.error) throw logsRes.error;

      setTemplates(templatesRes.data || []);
      setLogs(logsRes.data || []);
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

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateForm.name,
            subject: templateForm.subject,
            html_content: templateForm.html_content,
            text_content: templateForm.text_content || null,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            name: templateForm.name,
            subject: templateForm.subject,
            html_content: templateForm.html_content,
            text_content: templateForm.text_content || null,
            variables: [],
          });

        if (error) throw error;
      }

      toast({
        title: 'Template salvo!',
        description: 'O template foi salvo com sucesso.',
      });
      
      fetchData();
      setEditingTemplate(null);
      setTemplateForm({ name: '', subject: '', html_content: '', text_content: '' });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o template.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Enviado</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Falhou</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciador de E-mails</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie templates e visualize o histórico de envios
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {template.name}
                    </CardTitle>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Assunto: {template.subject}
                    </p>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">{template.name}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <div 
                              className="bg-white rounded-lg p-4"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(template.html_content) }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setTemplateForm({
                            name: template.name,
                            subject: template.subject,
                            html_content: template.html_content,
                            text_content: template.text_content || '',
                          });
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {editingTemplate && (
            <Card className="mt-6 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Editar Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Nome</Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Assunto</Label>
                    <Input
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Conteúdo HTML</Label>
                  <Textarea
                    value={templateForm.html_content}
                    onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })}
                    className="min-h-48 bg-muted/50 border-border font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveTemplate} className="bg-primary hover:bg-primary/90">
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({ name: '', subject: '', html_content: '', text_content: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Destinatário</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Assunto</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nenhum e-mail enviado ainda.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">{log.recipient_name || '-'}</p>
                              <p className="text-xs text-muted-foreground">{log.recipient_email}</p>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-foreground">{log.subject}</td>
                          <td className="p-4">{getStatusBadge(log.status)}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailManager;
