import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mail, User, Clock, CheckCircle, Trash2, Send, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  user_type: string | null;
  source: string | null;
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
}

const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mensagens.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.map(m => 
        m.id === id ? { ...m, read_at: new Date().toISOString() } : m
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.filter(m => m.id !== id));
      toast({
        title: 'Mensagem excluída',
        description: 'A mensagem foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a mensagem.',
        variant: 'destructive',
      });
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-admin-reply', {
        body: {
          recipientEmail: selectedMessage.email,
          recipientName: selectedMessage.name,
          message: replyText,
          submissionId: selectedMessage.id,
        },
      });

      if (error) throw error;

      // Update replied_at
      await supabase
        .from('contact_submissions')
        .update({ replied_at: new Date().toISOString() })
        .eq('id', selectedMessage.id);

      setMessages(messages.map(m => 
        m.id === selectedMessage.id ? { ...m, replied_at: new Date().toISOString() } : m
      ));

      toast({
        title: 'Resposta enviada!',
        description: `E-mail enviado para ${selectedMessage.email}`,
      });
      
      setReplyText('');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar a resposta. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getSourceBadge = (source: string | null) => {
    switch (source) {
      case 'vip':
        return <Badge className="bg-primary/20 text-primary border-primary/30">VIP</Badge>;
      case 'contact':
        return <Badge className="bg-secondary/20 text-secondary border-secondary/30">Contato</Badge>;
      default:
        return <Badge variant="outline">Geral</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
          <p className="text-muted-foreground mt-2">
            {messages.length} mensagens recebidas
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma mensagem recebida ainda.</p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`bg-card border-border hover:border-primary/50 transition-colors ${!message.read_at ? 'border-l-4 border-l-primary' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{message.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{message.email}</p>
                        </div>
                        {getSourceBadge(message.source)}
                        {message.user_type && (
                          <Badge variant="outline">{message.user_type}</Badge>
                        )}
                      </div>
                      
                      <p className="text-foreground line-clamp-2 mb-3">{message.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(message.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {message.read_at && (
                          <span className="flex items-center gap-1 text-green-500">
                            <Eye className="w-3 h-3" />
                            Lida
                          </span>
                        )}
                        {message.replied_at && (
                          <span className="flex items-center gap-1 text-blue-500">
                            <CheckCircle className="w-3 h-3" />
                            Respondida
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!message.read_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(message.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMessage(message);
                              if (!message.read_at) markAsRead(message.id);
                            }}
                            className="text-primary hover:text-primary/80"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">Responder Mensagem</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Mensagem de {message.name}:</p>
                              <p className="text-foreground">{message.message}</p>
                            </div>
                            <div>
                              <Textarea
                                placeholder="Digite sua resposta..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-32 bg-muted/50 border-border"
                              />
                            </div>
                            <Button
                              onClick={handleReply}
                              disabled={isSending || !replyText.trim()}
                              className="w-full bg-gradient-to-r from-primary to-secondary"
                            >
                              {isSending ? 'Enviando...' : 'Enviar Resposta'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(message.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactMessages;
