import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Plus, Save, Undo, Redo, Loader2, ExternalLink, Settings2, Sparkles,
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical,
  Columns, Grid3X3, Palette, Eye, Layers, Copy, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Block, BlockType, BLOCK_TEMPLATES } from './types';
import { BlockSettings } from './BlockSettings';
import { createBlock, getDefaultLayout } from './blockFactory';
import { SortableBlockItem } from './SortableBlockItem';

interface WixStyleEditorProps {
  productId?: string;
  productName?: string;
  productDescription?: string;
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

const BLOCK_CATEGORIES = {
  hero: ['hero', 'hero-3d'] as BlockType[],
  layout: ['columns', 'gallery', 'divider', 'spacer'] as BlockType[],
  content: ['text', 'image', 'video'] as BlockType[],
  conversion: ['pricing', 'cta', 'countdown', 'guarantee'] as BlockType[],
  social: ['benefits', 'features', 'testimonials', 'faq'] as BlockType[],
};

const ICONS: Record<string, React.ElementType> = {
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical,
  Columns, Grid3X3, Sparkles
};

export function WixStyleEditor({
  productId,
  productName = '',
  productDescription = '',
  initialBlocks,
  onSave,
  isLoading,
  isSaving,
}: WixStyleEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks || getDefaultLayout(productName, productDescription)
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<Block[][]>([blocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showBlockPanel, setShowBlockPanel] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      setBlocks(initialBlocks as Block[]);
      setHistory([initialBlocks as Block[]]);
      setHistoryIndex(0);
    }
  }, [initialBlocks]);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

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

  const addBlock = (type: BlockType) => {
    const newBlock = createBlock(type, blocks.length);
    const newBlocks = [...blocks, newBlock];
    newBlocks.forEach((b, i) => b.order = i);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
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
    newBlocks.forEach((b, i) => b.order = i);
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
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    newBlocks.forEach((b, i) => b.order = i);
    
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const toggleVisibility = (blockId: string) => {
    updateBlock(blockId, { visible: !blocks.find(b => b.id === blockId)?.visible });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      
      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      newBlocks.forEach((b, i) => b.order = i);
      
      setBlocks(newBlocks);
      pushHistory(newBlocks);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(blocks);
    }
  };

  const { data: productData } = useQuery({
    queryKey: ['product-slug-wix', productId],
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

  const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full min-h-[600px] bg-background">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between p-3 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex === 0}>
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex === history.length - 1}>
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refazer (Ctrl+Y)</TooltipContent>
            </Tooltip>
            <div className="h-6 w-px bg-border mx-2" />
            <Badge variant="secondary" className="font-mono">
              {blocks.length} blocos
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBlockPanel(!showBlockPanel)}
            >
              <Layers className="w-4 h-4 mr-2" />
              {showBlockPanel ? 'Ocultar' : 'Mostrar'} Painel
            </Button>
            {productId && productUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={productUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visualizar
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="min-w-[100px]">
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
          {/* Left Panel - Block Library */}
          <AnimatePresence>
            {showBlockPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-r bg-muted/20 flex flex-col overflow-hidden"
              >
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Bloco
                  </h3>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-4">
                    {/* Hero Section */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Hero
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {BLOCK_CATEGORIES.hero.map(type => {
                          const template = BLOCK_TEMPLATES[type];
                          const Icon = ICONS[template.icon] || Layout;
                          return (
                            <button
                              key={type}
                              onClick={() => addBlock(type)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                            >
                              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                              <span className="text-xs font-medium">{template.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Layout Section */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Layout
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {BLOCK_CATEGORIES.layout.map(type => {
                          const template = BLOCK_TEMPLATES[type];
                          const Icon = ICONS[template.icon] || Layout;
                          return (
                            <button
                              key={type}
                              onClick={() => addBlock(type)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                            >
                              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                              <span className="text-xs font-medium">{template.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Conteúdo
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {BLOCK_CATEGORIES.content.map(type => {
                          const template = BLOCK_TEMPLATES[type];
                          const Icon = ICONS[template.icon] || Layout;
                          return (
                            <button
                              key={type}
                              onClick={() => addBlock(type)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                            >
                              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                              <span className="text-xs font-medium">{template.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conversion Section */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Conversão
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {BLOCK_CATEGORIES.conversion.map(type => {
                          const template = BLOCK_TEMPLATES[type];
                          const Icon = ICONS[template.icon] || Layout;
                          return (
                            <button
                              key={type}
                              onClick={() => addBlock(type)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                            >
                              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                              <span className="text-xs font-medium">{template.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Social Proof Section */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Prova Social
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {BLOCK_CATEGORIES.social.map(type => {
                          const template = BLOCK_TEMPLATES[type];
                          const Icon = ICONS[template.icon] || Layout;
                          return (
                            <button
                              key={type}
                              onClick={() => addBlock(type)}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                            >
                              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                              <span className="text-xs font-medium">{template.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center - Block Canvas (Drag & Drop) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
            <div className="p-3 border-b bg-background/50 flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Canvas - Arraste para reordenar
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 min-h-[200px]">
                      {blocks
                        .sort((a, b) => a.order - b.order)
                        .map(block => (
                          <SortableBlockItem
                            key={block.id}
                            block={block}
                            isSelected={selectedBlockId === block.id}
                            onSelect={() => setSelectedBlockId(block.id)}
                            onToggleVisibility={() => toggleVisibility(block.id)}
                            onDelete={() => deleteBlock(block.id)}
                            onDuplicate={() => duplicateBlock(block.id)}
                          />
                        ))}
                    </div>
                  </SortableContext>
                  
                  <DragOverlay>
                    {activeBlock && (
                      <div className="opacity-80">
                        <SortableBlockItem
                          block={activeBlock}
                          isSelected={false}
                          onSelect={() => {}}
                          onToggleVisibility={() => {}}
                          onDelete={() => {}}
                          onDuplicate={() => {}}
                          isDragOverlay
                        />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>

                {blocks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Adicione blocos do painel à esquerda</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Block Settings */}
          <div className="w-80 border-l flex flex-col bg-background overflow-hidden">
            <div className="p-3 border-b">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configurações
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {selectedBlock ? (
                  <BlockSettings
                    block={selectedBlock}
                    onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Settings2 className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-sm">Selecione um bloco para editar</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default WixStyleEditor;
