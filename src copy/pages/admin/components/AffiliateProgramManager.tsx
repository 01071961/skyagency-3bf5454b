import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Users, Mail, Send, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Program {
  id: string;
  name: string;
  description: string | null;
  attribution_rule: string;
  default_commission_rate: number;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  status: string;
}

export default function AffiliateProgramManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productCommissions, setProductCommissions] = useState<Record<string, number>>({});
  
  // Form states
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    attribution_rule: 'last_click',
    default_commission_rate: 10,
  });
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    commission_rate: 10,
    program_id: '',
  });

  // Fetch programs
  const { data: programs, isLoading: loadingPrograms } = useQuery({
    queryKey: ['affiliate-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Program[];
    }
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products-for-affiliate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, status')
        .eq('status', 'published')
        .order('name');
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch program products
  const { data: programProducts } = useQuery({
    queryKey: ['program-products', selectedProgram?.id],
    enabled: !!selectedProgram?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_program_products')
        .select('product_id, commission_rate')
        .eq('program_id', selectedProgram!.id);
      if (error) throw error;
      return data;
    }
  });

  // Fetch pending invites
  const { data: pendingInvites } = useQuery({
    queryKey: ['pending-invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Create/Update program
  const programMutation = useMutation({
    mutationFn: async (data: typeof programForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('affiliate_programs')
          .update({
            name: data.name,
            description: data.description,
            attribution_rule: data.attribution_rule,
            default_commission_rate: data.default_commission_rate,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('affiliate_programs')
          .insert({
            name: data.name,
            description: data.description,
            attribution_rule: data.attribution_rule,
            default_commission_rate: data.default_commission_rate,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-programs'] });
      setProgramDialogOpen(false);
      resetProgramForm();
      toast({ title: selectedProgram ? 'Programa atualizado!' : 'Programa criado!' });
    }
  });

  // Update program products
  const updateProductsMutation = useMutation({
    mutationFn: async ({ programId, products }: { programId: string; products: { product_id: string; commission_rate: number }[] }) => {
      // Delete existing
      await supabase
        .from('affiliate_program_products')
        .delete()
        .eq('program_id', programId);

      // Insert new
      if (products.length > 0) {
        const { error } = await supabase
          .from('affiliate_program_products')
          .insert(products.map(p => ({ ...p, program_id: programId })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-products'] });
      setProductsDialogOpen(false);
      toast({ title: 'Produtos atualizados!' });
    }
  });

  // Send invite
  const inviteMutation = useMutation({
    mutationFn: async (data: typeof inviteForm) => {
      if (!data.email) {
        throw new Error('Email é obrigatório');
      }
      
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      if (!token) {
        throw new Error('Você precisa estar logado para enviar convites');
      }
      
      // Clean program_id if "none" was selected
      const cleanData = {
        ...data,
        program_id: data.program_id === 'none' || data.program_id === '' ? null : data.program_id,
      };
      
      const res = await supabase.functions.invoke('send-affiliate-invite', {
        body: cleanData,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] });
      setInviteDialogOpen(false);
      resetInviteForm();
      toast({ title: 'Convite enviado!', description: 'O afiliado receberá um email com o link de aceitação.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao enviar convite', description: error.message, variant: 'destructive' });
    }
  });

  // Toggle program active
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('affiliate_programs')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-programs'] });
    }
  });

  const resetProgramForm = () => {
    setProgramForm({ name: '', description: '', attribution_rule: 'last_click', default_commission_rate: 10 });
    setSelectedProgram(null);
  };

  const resetInviteForm = () => {
    setInviteForm({ email: '', name: '', commission_rate: 10, program_id: '' });
  };

  const openEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setProgramForm({
      name: program.name,
      description: program.description || '',
      attribution_rule: program.attribution_rule,
      default_commission_rate: program.default_commission_rate,
    });
    setProgramDialogOpen(true);
  };

  const openProductsDialog = (program: Program) => {
    setSelectedProgram(program);
    if (programProducts) {
      setSelectedProducts(programProducts.map(p => p.product_id));
      const commissions: Record<string, number> = {};
      programProducts.forEach(p => { commissions[p.product_id] = p.commission_rate; });
      setProductCommissions(commissions);
    } else {
      setSelectedProducts([]);
      setProductCommissions({});
    }
    setProductsDialogOpen(true);
  };

  const handleSaveProducts = () => {
    if (!selectedProgram) return;
    
    const products = selectedProducts.map(productId => ({
      product_id: productId,
      commission_rate: productCommissions[productId] || selectedProgram.default_commission_rate,
    }));
    
    updateProductsMutation.mutate({ programId: selectedProgram.id, products });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Programas de Afiliação</h2>
          <p className="text-muted-foreground">Gerencie programas, produtos e convites</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Convidar Afiliado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Afiliado</DialogTitle>
                <DialogDescription>Envie um convite por email</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="Nome do afiliado"
                  />
                </div>
                <div>
                  <Label>Programa</Label>
                  <Select
                    value={inviteForm.program_id}
                    onValueChange={(v) => setInviteForm({ ...inviteForm, program_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um programa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (comissão padrão)</SelectItem>
                      {programs?.filter(p => p.is_active && p.id).map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Taxa de Comissão (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={inviteForm.commission_rate}
                    onChange={(e) => setInviteForm({ ...inviteForm, commission_rate: Number(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => inviteMutation.mutate(inviteForm)} disabled={inviteMutation.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetProgramForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Programa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedProgram ? 'Editar Programa' : 'Novo Programa'}</DialogTitle>
                <DialogDescription>Configure o programa de afiliação</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                    placeholder="Nome do programa"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                    placeholder="Descrição do programa"
                  />
                </div>
                <div>
                  <Label>Regra de Atribuição</Label>
                  <Select
                    value={programForm.attribution_rule}
                    onValueChange={(v) => setProgramForm({ ...programForm, attribution_rule: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_click">Último Clique</SelectItem>
                      <SelectItem value="first_click">Primeiro Clique</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {programForm.attribution_rule === 'last_click' 
                      ? 'Comissão vai para o último afiliado antes da compra'
                      : 'Comissão vai para o primeiro afiliado que indicou'}
                  </p>
                </div>
                <div>
                  <Label>Comissão Padrão (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={programForm.default_commission_rate}
                    onChange={(e) => setProgramForm({ ...programForm, default_commission_rate: Number(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProgramDialogOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={() => programMutation.mutate({ ...programForm, id: selectedProgram?.id })}
                  disabled={programMutation.isPending}
                >
                  {selectedProgram ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites && pendingInvites.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-yellow-500" />
              Convites Pendentes ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingInvites.map((invite: any) => (
                <Badge key={invite.id} variant="outline" className="border-yellow-500/30">
                  {invite.email} - {invite.commission_rate}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Programs Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Programas Ativos</CardTitle>
          <CardDescription>Configure comissões e produtos por programa</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPrograms ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : programs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum programa criado ainda. Crie um programa para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Programa</TableHead>
                  <TableHead>Atribuição</TableHead>
                  <TableHead>Comissão Padrão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs?.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{program.name}</p>
                        {program.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {program.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {program.attribution_rule === 'last_click' ? 'Último Clique' : 'Primeiro Clique'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-500 font-medium">{program.default_commission_rate}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={program.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {program.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(program.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openProductsDialog(program)} title="Gerenciar Produtos">
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditProgram(program)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => toggleActiveMutation.mutate({ id: program.id, is_active: !program.is_active })}
                          title={program.is_active ? 'Desativar' : 'Ativar'}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Products Dialog */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produtos do Programa: {selectedProgram?.name}</DialogTitle>
            <DialogDescription>
              Selecione os produtos e defina comissões específicas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {products?.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProducts([...selectedProducts, product.id]);
                      setProductCommissions({
                        ...productCommissions,
                        [product.id]: selectedProgram?.default_commission_rate || 10
                      });
                    } else {
                      setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                    }
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {selectedProducts.includes(product.id) && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Comissão:</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      className="w-20"
                      value={productCommissions[product.id] || selectedProgram?.default_commission_rate || 10}
                      onChange={(e) => setProductCommissions({
                        ...productCommissions,
                        [product.id]: Number(e.target.value)
                      })}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProducts} disabled={updateProductsMutation.isPending}>
              Salvar Produtos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
