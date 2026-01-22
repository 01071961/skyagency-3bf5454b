import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Save, Eye, EyeOff, Undo, Redo, Palette, Loader2,
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical,
  ExternalLink, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Block, BlockType, BLOCK_TEMPLATES, PageLayout } from './types';
import { BlockItem } from './BlockItem';
import { BlockSettings } from './BlockSettings';
import { createBlock, getDefaultLayout } from './blockFactory';

interface ModularBlockEditorProps {
  productId?: string;
  productName?: string;
  productDescription?: string;
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

const BLOCK_CATEGORIES = {
  layout: ['hero', 'divider', 'spacer'] as BlockType[],
  content: ['text', 'image', 'video'] as BlockType[],
  conversion: ['pricing', 'cta', 'countdown', 'guarantee'] as BlockType[],
  social: ['benefits', 'features', 'testimonials', 'faq'] as BlockType[],
};

const ICONS: Record<string, React.ElementType> = {
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical
};

export function ModularBlockEditor({
  productId,
  productName = '',
  productDescription = '',
  initialBlocks,
  onSave,
  isLoading,
  isSaving,
}: ModularBlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks || getDefaultLayout(productName, productDescription)
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<Block[][]>([blocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Update blocks when initial data changes
  useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      setBlocks(initialBlocks as Block[]);
      setHistory([initialBlocks as Block[]]);
      setHistoryIndex(0);
    }
  }, [initialBlocks]);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // History management
  const pushHistory = useCallback((newBlocks: Block[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  // Block operations
  const addBlock = (type: BlockType) => {
    const newBlock = createBlock(type, blocks.length);
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
    setShowAddMenu(false);
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    ) as Block[];
    setBlocks(newBlocks);
    pushHistory(newBlocks);
  };

  const deleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const duplicateBlock = (blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const block = blocks[blockIndex];
    const newBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: crypto.randomUUID(),
      order: block.order + 0.5,
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    // Reorder
    newBlocks.forEach((b, i) => b.order = i);
    
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const toggleVisibility = (blockId: string) => {
    updateBlock(blockId, { visible: !blocks.find(b => b.id === blockId)?.visible });
  };

  const handleReorder = (newOrder: Block[]) => {
    newOrder.forEach((block, index) => block.order = index);
    setBlocks(newOrder);
    pushHistory(newOrder);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(blocks);
    }
  };

  // Fetch product slug for preview URL
  const { data: productData } = useQuery({
    queryKey: ['product-slug-modular', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data } = await supabase
        .from('products')
        .select('slug, status')
        .eq('id', productId)
        .maybeSingle();
      return data;
    },
    enabled: !!productId,
    staleTime: 60000,
  });

  const productUrl = productData?.slug 
    ? productData.status === 'published' 
      ? `${window.location.origin}/produto/${productData.slug}` 
      : `${window.location.origin}/preview/${productData.slug}`
    : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex === 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex === history.length - 1}>
            <Redo className="w-4 h-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Badge variant="secondary">{blocks.length} blocos</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {productId && (
            <Button variant="outline" size="sm" asChild>
              <a href={productUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visualizar
              </a>
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Block List - Left Panel */}
        <div className="w-80 border-r flex flex-col bg-muted/30">
          <div className="p-4 border-b">
            <DropdownMenu open={showAddMenu} onOpenChange={setShowAddMenu}>
              <DropdownMenuTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Bloco
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <div className="p-2 text-xs font-semibold text-muted-foreground">Layout</div>
                {BLOCK_CATEGORIES.layout.map(type => {
                  const template = BLOCK_TEMPLATES[type];
                  const Icon = ICONS[template.icon] || Layout;
                  return (
                    <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
                      <Icon className="w-4 h-4 mr-2" />
                      {template.name}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <div className="p-2 text-xs font-semibold text-muted-foreground">Conteúdo</div>
                {BLOCK_CATEGORIES.content.map(type => {
                  const template = BLOCK_TEMPLATES[type];
                  const Icon = ICONS[template.icon] || Layout;
                  return (
                    <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
                      <Icon className="w-4 h-4 mr-2" />
                      {template.name}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <div className="p-2 text-xs font-semibold text-muted-foreground">Conversão</div>
                {BLOCK_CATEGORIES.conversion.map(type => {
                  const template = BLOCK_TEMPLATES[type];
                  const Icon = ICONS[template.icon] || Layout;
                  return (
                    <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
                      <Icon className="w-4 h-4 mr-2" />
                      {template.name}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <div className="p-2 text-xs font-semibold text-muted-foreground">Prova Social</div>
                {BLOCK_CATEGORIES.social.map(type => {
                  const template = BLOCK_TEMPLATES[type];
                  const Icon = ICONS[template.icon] || Layout;
                  return (
                    <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
                      <Icon className="w-4 h-4 mr-2" />
                      {template.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <Reorder.Group
              axis="y"
              values={blocks}
              onReorder={handleReorder}
              className="space-y-2"
            >
              <AnimatePresence>
                {blocks.sort((a, b) => a.order - b.order).map(block => (
                  <Reorder.Item key={block.id} value={block}>
                    <BlockItem
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onToggleVisibility={() => toggleVisibility(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                    />
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </ScrollArea>
        </div>

        {/* Settings Panel - Right */}
        <div className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-6">
              {selectedBlock ? (
                <BlockSettings
                  block={selectedBlock}
                  onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Settings2 className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum bloco selecionado</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Clique em um bloco na lista à esquerda para editar suas configurações,
                    ou adicione um novo bloco usando o botão acima.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default ModularBlockEditor;
