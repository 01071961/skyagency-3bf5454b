import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Eye, 
  DollarSign, 
  ShoppingCart, 
  ExternalLink, 
  Users,
  MoreVertical,
  Archive,
  CheckCircle,
  Copy,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductCreationWizard from './products/ProductCreationWizard';

export default function ProductCatalogManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showWizard, setShowWizard] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | undefined>();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'draft' | 'published' | 'archived');
      }
      if (typeFilter !== 'all') {
        query = query.eq('product_type', typeFilter as 'course' | 'ebook' | 'mentoring' | 'live_event' | 'files' | 'combo');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: !showWizard,
    staleTime: showWizard ? Infinity : 30000,
    enabled: !showWizard,
  });

  const { data: stats } = useQuery({
    queryKey: ['product-stats'],
    queryFn: async () => {
      const [productsRes, ordersRes] = await Promise.all([
        supabase.from('products').select('status, price, affiliate_enabled'),
        supabase.from('order_items').select('price, product_id')
      ]);

      const totalProducts = productsRes.data?.length || 0;
      const published = productsRes.data?.filter(p => p.status === 'published').length || 0;
      const draft = productsRes.data?.filter(p => p.status === 'draft').length || 0;
      const affiliateEnabled = productsRes.data?.filter(p => p.affiliate_enabled).length || 0;
      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + Number(o.price), 0) || 0;
      const totalSales = ordersRes.data?.length || 0;

      return { totalProducts, published, draft, affiliateEnabled, totalRevenue, totalSales };
    },
    enabled: !showWizard,
    staleTime: showWizard ? Infinity : 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Produto removido!');
    },
    onError: () => toast.error('Erro ao remover produto')
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'publish' | 'archive' | 'delete' }) => {
      if (action === 'delete') {
        const { error } = await supabase.from('products').delete().in('id', ids);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .update({ status: action === 'publish' ? 'published' : 'archived' })
          .in('id', ids);
        if (error) throw error;
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      setSelectedProducts(new Set());
      const messages = {
        publish: 'Produtos publicados!',
        archive: 'Produtos arquivados!',
        delete: 'Produtos removidos!'
      };
      toast.success(messages[action]);
    },
    onError: () => toast.error('Erro na ação em lote')
  });

  const filteredProducts = useMemo(() => products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; label: string }> = {
      draft: { bg: 'bg-yellow-500/20 text-yellow-400', label: 'Rascunho' },
      published: { bg: 'bg-green-500/20 text-green-400', label: 'Publicado' },
      archived: { bg: 'bg-muted text-muted-foreground', label: 'Arquivado' }
    };
    const { bg, label } = config[status] || config.draft;
    return <Badge className={cn(bg, "text-xs")}>{label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      course: 'Curso',
      ebook: 'E-book',
      mentoring: 'Mentoria',
      live_event: 'Evento',
      files: 'Arquivos',
      combo: 'Combo'
    };
    return <Badge variant="outline" className="text-xs">{labels[type] || type}</Badge>;
  };

  const openEditWizard = useCallback((productId: string) => {
    setEditingProductId(productId);
    setShowWizard(true);
  }, []);

  const openNewWizard = useCallback(() => {
    setEditingProductId(undefined);
    setShowWizard(true);
  }, []);

  const closeWizard = useCallback(() => {
    setShowWizard(false);
    setEditingProductId(undefined);
  }, []);

  const handleWizardSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['product-stats'] });
    closeWizard();
  }, [queryClient, closeWizard]);

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts?.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts?.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProducts(newSet);
  };

  if (showWizard) {
    return (
      <ProductCreationWizard
        productId={editingProductId}
        onClose={closeWizard}
        onSuccess={handleWizardSuccess}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{stats?.totalProducts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/20 shrink-0">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Publicados</p>
                <p className="text-lg sm:text-2xl font-bold">{stats?.published || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/20 shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Afiliados</p>
                <p className="text-lg sm:text-2xl font-bold">{stats?.affiliateEnabled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hidden sm:block">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20 shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Vendas</p>
                <p className="text-lg sm:text-2xl font-bold">{stats?.totalSales || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hidden lg:block">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/20 shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Receita</p>
                <p className="text-lg sm:text-2xl font-bold">R$ {(stats?.totalRevenue || 0).toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Responsive */}
      <Card className="bg-card border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            {/* Search + Create Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={openNewWizard} className="bg-primary hover:bg-primary/90 shrink-0">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Criar</span>
              </Button>
            </div>

            {/* Filters Row */}
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] sm:w-[140px] text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px] sm:w-[140px] text-xs sm:text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="course">Curso</SelectItem>
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="mentoring">Mentoria</SelectItem>
                  <SelectItem value="live_event">Evento</SelectItem>
                  <SelectItem value="files">Arquivos</SelectItem>
                  <SelectItem value="combo">Combo</SelectItem>
                </SelectContent>
              </Select>

              {/* Bulk Actions */}
              {selectedProducts.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      Ações ({selectedProducts.size})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => bulkActionMutation.mutate({ ids: Array.from(selectedProducts), action: 'publish' })}>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Publicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkActionMutation.mutate({ ids: Array.from(selectedProducts), action: 'archive' })}>
                      <Archive className="h-4 w-4 mr-2 text-yellow-500" />
                      Arquivar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        if (confirm(`Excluir ${selectedProducts.size} produtos?`)) {
                          bulkActionMutation.mutate({ ids: Array.from(selectedProducts), action: 'delete' });
                        }
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>Produtos ({filteredProducts?.length || 0})</span>
            {filteredProducts && filteredProducts.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-normal">
                <Checkbox
                  checked={selectedProducts.size === filteredProducts.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-muted-foreground text-xs hidden sm:inline">Selecionar todos</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden divide-y divide-border">
                {filteredProducts?.map((product) => (
                  <div key={product.id} className="p-3 sm:p-4">
                    <div className="flex gap-3">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                        className="mt-1 shrink-0"
                      />
                      
                      {product.cover_image_url && (
                        <img 
                          src={product.cover_image_url} 
                          alt="" 
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded object-cover shrink-0" 
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate">/{product.slug}</p>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                const route = product.status === 'published' 
                                  ? `/produto/${product.slug}` 
                                  : `/preview/${product.slug}`;
                                window.open(route, '_blank');
                              }}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Página
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditWizard(product.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/produto/${product.slug}`);
                                toast.success('Link copiado!');
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm('Excluir este produto?')) {
                                    deleteMutation.mutate(product.id);
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {getTypeBadge(product.product_type)}
                          {getStatusBadge(product.status)}
                          {product.affiliate_enabled && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                              {product.affiliate_commission_rate || 50}%
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">R$ {Number(product.price).toFixed(2)}</span>
                          {product.original_price && (
                            <span className="text-xs text-muted-foreground line-through">
                              R$ {Number(product.original_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {!filteredProducts?.length && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedProducts.size === filteredProducts?.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={() => toggleSelect(product.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.cover_image_url && (
                                <img src={product.cover_image_url} alt="" className="w-10 h-10 rounded object-cover" />
                              )}
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">/{product.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(product.product_type)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold">R$ {Number(product.price).toFixed(2)}</p>
                              {product.original_price && (
                                <p className="text-xs text-muted-foreground line-through">R$ {Number(product.original_price).toFixed(2)}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.affiliate_enabled ? (
                              <Badge className="bg-cyan-500/20 text-cyan-400">
                                {product.affiliate_commission_rate || 50}%
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Off</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(product.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  const route = product.status === 'published' 
                                    ? `/produto/${product.slug}` 
                                    : `/preview/${product.slug}`;
                                  window.open(route, '_blank');
                                }}
                                title="Ver página"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEditWizard(product.id)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive" 
                                onClick={() => {
                                  if (confirm('Excluir este produto?')) {
                                    deleteMutation.mutate(product.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!filteredProducts?.length && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum produto encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
