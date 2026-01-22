import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Database, Trash2, Search, Filter, MapPin, Building2, Users, MessageSquare, Mail, RefreshCw, ChevronDown, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Brazilian states and regions
const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre', region: 'Norte' },
  { code: 'AL', name: 'Alagoas', region: 'Nordeste' },
  { code: 'AP', name: 'Amapá', region: 'Norte' },
  { code: 'AM', name: 'Amazonas', region: 'Norte' },
  { code: 'BA', name: 'Bahia', region: 'Nordeste' },
  { code: 'CE', name: 'Ceará', region: 'Nordeste' },
  { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { code: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
  { code: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
  { code: 'MA', name: 'Maranhão', region: 'Nordeste' },
  { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  { code: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
  { code: 'PA', name: 'Pará', region: 'Norte' },
  { code: 'PB', name: 'Paraíba', region: 'Nordeste' },
  { code: 'PR', name: 'Paraná', region: 'Sul' },
  { code: 'PE', name: 'Pernambuco', region: 'Nordeste' },
  { code: 'PI', name: 'Piauí', region: 'Nordeste' },
  { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
  { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
  { code: 'RO', name: 'Rondônia', region: 'Norte' },
  { code: 'RR', name: 'Roraima', region: 'Norte' },
  { code: 'SC', name: 'Santa Catarina', region: 'Sul' },
  { code: 'SP', name: 'São Paulo', region: 'Sudeste' },
  { code: 'SE', name: 'Sergipe', region: 'Nordeste' },
  { code: 'TO', name: 'Tocantins', region: 'Norte' },
];

const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

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

interface ChatConversation {
  id: string;
  visitor_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  subject: string | null;
  status: string;
  created_at: string;
}

// Helper to extract state from phone number (DDD)
const extractStateFromPhone = (phone: string | null): string | null => {
  if (!phone) return null;
  const cleanPhone = phone.replace(/\D/g, '');
  const ddd = cleanPhone.slice(0, 2);
  
  const dddToState: Record<string, string> = {
    '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
    '21': 'RJ', '22': 'RJ', '24': 'RJ',
    '27': 'ES', '28': 'ES',
    '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
    '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
    '47': 'SC', '48': 'SC', '49': 'SC',
    '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
    '61': 'DF',
    '62': 'GO', '64': 'GO',
    '63': 'TO',
    '65': 'MT', '66': 'MT',
    '67': 'MS',
    '68': 'AC',
    '69': 'RO',
    '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
    '79': 'SE',
    '81': 'PE', '87': 'PE',
    '82': 'AL',
    '83': 'PB',
    '84': 'RN',
    '85': 'CE', '88': 'CE',
    '86': 'PI', '89': 'PI',
    '91': 'PA', '93': 'PA', '94': 'PA',
    '92': 'AM', '97': 'AM',
    '95': 'RR',
    '96': 'AP',
    '98': 'MA', '99': 'MA',
  };
  
  return dddToState[ddd] || null;
};

const DatabaseManager = () => {
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'contacts' | 'conversations'>('contacts');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [contactsRes, conversationsRes] = await Promise.all([
        supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_conversations').select('*').order('created_at', { ascending: false }),
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (conversationsRes.error) throw conversationsRes.error;

      setContacts(contactsRes.data || []);
      setConversations(conversationsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter conversations by state/region based on phone DDD
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      // Search filter
      const matchesSearch = !searchQuery || 
        conv.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.visitor_phone?.includes(searchQuery);

      if (!matchesSearch) return false;

      // State/Region filter
      if (selectedState !== 'all' || selectedRegion !== 'all') {
        const state = extractStateFromPhone(conv.visitor_phone);
        if (!state) return false;

        if (selectedState !== 'all' && state !== selectedState) return false;
        if (selectedRegion !== 'all') {
          const stateInfo = BRAZILIAN_STATES.find(s => s.code === state);
          if (!stateInfo || stateInfo.region !== selectedRegion) return false;
        }
      }

      return true;
    });
  }, [conversations, searchQuery, selectedState, selectedRegion]);

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      if (!searchQuery) return true;
      return contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.message?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [contacts, searchQuery]);

  // Group conversations by state
  const conversationsByState = useMemo(() => {
    const groups: Record<string, ChatConversation[]> = {};
    conversations.forEach(conv => {
      const state = extractStateFromPhone(conv.visitor_phone) || 'Desconhecido';
      if (!groups[state]) groups[state] = [];
      groups[state].push(conv);
    });
    return groups;
  }, [conversations]);

  // Group by region
  const conversationsByRegion = useMemo(() => {
    const groups: Record<string, number> = {};
    REGIONS.forEach(region => { groups[region] = 0; });
    groups['Desconhecido'] = 0;

    conversations.forEach(conv => {
      const state = extractStateFromPhone(conv.visitor_phone);
      if (state) {
        const stateInfo = BRAZILIAN_STATES.find(s => s.code === state);
        if (stateInfo) {
          groups[stateInfo.region]++;
        } else {
          groups['Desconhecido']++;
        }
      } else {
        groups['Desconhecido']++;
      }
    });
    return groups;
  }, [conversations]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const items = activeTab === 'contacts' ? filteredContacts : filteredConversations;
      setSelectedItems(new Set(items.map(i => i.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedItems(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    try {
      const table = deleteType === 'contacts' ? 'contact_submissions' : 'chat_conversations';
      
      // If deleting conversations, also delete related messages first
      if (deleteType === 'conversations') {
        for (const id of selectedItems) {
          await supabase.from('chat_messages').delete().eq('conversation_id', id);
        }
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', Array.from(selectedItems));

      if (error) throw error;

      toast.success(`${selectedItems.size} registro(s) excluído(s)`);
      setSelectedItems(new Set());
      setShowDeleteDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao excluir registros');
    }
  };

  const openDeleteDialog = (type: 'contacts' | 'conversations') => {
    if (selectedItems.size === 0) {
      toast.error('Selecione ao menos um registro');
      return;
    }
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  // CSV/Excel Export Functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma or newline
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Exportação concluída!');
  };

  const exportContacts = () => {
    const exportData = filteredContacts.map(c => ({
      Nome: c.name,
      Email: c.email,
      Tipo: c.user_type || '',
      Fonte: c.source || 'contato',
      Mensagem: c.message,
      Data: format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      Status: c.replied_at ? 'Respondido' : c.read_at ? 'Lido' : 'Novo'
    }));
    exportToCSV(exportData, 'contatos');
  };

  const exportConversations = () => {
    const exportData = filteredConversations.map(c => {
      const state = extractStateFromPhone(c.visitor_phone);
      const stateInfo = state ? BRAZILIAN_STATES.find(s => s.code === state) : null;
      return {
        Nome: c.visitor_name || 'Anônimo',
        Email: c.visitor_email || '',
        Telefone: c.visitor_phone || '',
        Estado: stateInfo ? `${stateInfo.code} - ${stateInfo.name}` : 'Desconhecido',
        Região: stateInfo?.region || 'Desconhecida',
        Assunto: c.subject || '',
        Status: c.status === 'active' ? 'Ativa' : 'Encerrada',
        Data: format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      };
    });
    exportToCSV(exportData, 'conversas');
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
          <h1 className="text-3xl font-bold">Banco de Dados</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie todos os registros por estado e região
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            variant="secondary" 
            onClick={activeTab === 'contacts' ? exportContacts : exportConversations}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Region Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {REGIONS.map(region => (
          <Card 
            key={region} 
            className={`cursor-pointer transition-all hover:border-primary/50 ${selectedRegion === region ? 'border-primary' : ''}`}
            onClick={() => {
              setSelectedRegion(selectedRegion === region ? 'all' : region);
              setSelectedState('all');
            }}
          >
            <CardContent className="p-4 text-center">
              <MapPin className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="font-semibold text-lg">{conversationsByRegion[region] || 0}</p>
              <p className="text-xs text-muted-foreground">{region}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v); setSelectedState('all'); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Regiões</SelectItem>
                {REGIONS.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                {BRAZILIAN_STATES
                  .filter(s => selectedRegion === 'all' || s.region === selectedRegion)
                  .map(state => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedItems.size > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => openDeleteDialog(activeTab as 'contacts' | 'conversations')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir ({selectedItems.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedItems(new Set()); }}>
        <TabsList>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contatos ({filteredContacts.length})
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas ({filteredConversations.length})
          </TabsTrigger>
          <TabsTrigger value="by-state" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Por Estado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4">
          <Card>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.size === filteredContacts.length && filteredContacts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.has(contact.id)}
                          onCheckedChange={(checked) => handleSelectItem(contact.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.user_type || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{contact.source || 'contato'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(contact.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {contact.replied_at ? (
                          <Badge className="bg-green-500/20 text-green-500">Respondido</Badge>
                        ) : contact.read_at ? (
                          <Badge className="bg-blue-500/20 text-blue-500">Lido</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-500">Novo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="mt-4">
          <Card>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.size === filteredConversations.length && filteredConversations.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.map(conv => {
                    const state = extractStateFromPhone(conv.visitor_phone);
                    const stateInfo = state ? BRAZILIAN_STATES.find(s => s.code === state) : null;
                    return (
                      <TableRow key={conv.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedItems.has(conv.id)}
                            onCheckedChange={(checked) => handleSelectItem(conv.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{conv.visitor_name || 'Anônimo'}</TableCell>
                        <TableCell>{conv.visitor_email || '-'}</TableCell>
                        <TableCell>{conv.visitor_phone || '-'}</TableCell>
                        <TableCell>
                          {stateInfo ? (
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {stateInfo.code}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{conv.subject || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                            {conv.status === 'active' ? 'Ativa' : 'Encerrada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(conv.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="by-state" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(conversationsByState)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([stateCode, convs]) => {
                const stateInfo = BRAZILIAN_STATES.find(s => s.code === stateCode);
                return (
                  <Card key={stateCode}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {stateInfo ? `${stateInfo.code} - ${stateInfo.name}` : stateCode}
                        </span>
                        <Badge>{convs.length}</Badge>
                      </CardTitle>
                      {stateInfo && (
                        <p className="text-xs text-muted-foreground">{stateInfo.region}</p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-2">
                          {convs.slice(0, 10).map(conv => (
                            <div key={conv.id} className="text-sm flex items-center justify-between border-b border-border/50 pb-1">
                              <span className="truncate">{conv.visitor_name || 'Anônimo'}</span>
                              <Badge variant="outline" className="text-xs">
                                {conv.status === 'active' ? 'Ativa' : 'Encerrada'}
                              </Badge>
                            </div>
                          ))}
                          {convs.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{convs.length - 10} mais...
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Você está prestes a excluir <strong>{selectedItems.size}</strong> registro(s).
              {deleteType === 'conversations' && (
                <span className="block mt-2 text-destructive">
                  Atenção: Todas as mensagens associadas também serão excluídas!
                </span>
              )}
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseManager;
