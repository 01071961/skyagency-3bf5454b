import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical,
  Columns, Grid3X3, Sparkles, Book, TrendingUp, Target, Laptop, Calendar,
  Mail, CreditCard, ArrowUpCircle, BarChart3, Undo, Redo, Save, Eye,
  Palette, Zap, Video
} from 'lucide-react';
import { BlockType } from '@/pages/admin/components/products/BlockEditor/types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlock: (type: BlockType) => void;
  onAction: (action: 'save' | 'undo' | 'redo' | 'preview' | 'settings') => void;
}

const BLOCK_COMMANDS = [
  { type: 'hero-3d' as BlockType, label: 'Hero 3D', icon: Sparkles, category: 'Hero', description: 'Seção hero com efeitos 3D' },
  { type: 'hero' as BlockType, label: 'Hero Simples', icon: Layout, category: 'Hero', description: 'Seção hero tradicional' },
  { type: 'text' as BlockType, label: 'Texto', icon: Type, category: 'Conteúdo', description: 'Bloco de texto' },
  { type: 'image' as BlockType, label: 'Imagem', icon: Image, category: 'Conteúdo', description: 'Bloco de imagem' },
  { type: 'video' as BlockType, label: 'Vídeo', icon: Video, category: 'Conteúdo', description: 'Bloco de vídeo' },
  { type: 'columns' as BlockType, label: 'Colunas', icon: Columns, category: 'Layout', description: 'Layout em colunas' },
  { type: 'gallery' as BlockType, label: 'Galeria', icon: Grid3X3, category: 'Layout', description: 'Galeria de imagens' },
  { type: 'benefits' as BlockType, label: 'Benefícios', icon: CheckCircle, category: 'Social', description: 'Lista de benefícios' },
  { type: 'features' as BlockType, label: 'Recursos', icon: Star, category: 'Social', description: 'Lista de recursos' },
  { type: 'testimonials' as BlockType, label: 'Depoimentos', icon: Users, category: 'Social', description: 'Seção de depoimentos' },
  { type: 'faq' as BlockType, label: 'FAQ', icon: HelpCircle, category: 'Social', description: 'Perguntas frequentes' },
  { type: 'pricing' as BlockType, label: 'Preços', icon: DollarSign, category: 'Conversão', description: 'Tabela de preços' },
  { type: 'cta' as BlockType, label: 'CTA', icon: MousePointer, category: 'Conversão', description: 'Call-to-action' },
  { type: 'countdown' as BlockType, label: 'Countdown', icon: Clock, category: 'Conversão', description: 'Timer de contagem' },
  { type: 'guarantee' as BlockType, label: 'Garantia', icon: Shield, category: 'Conversão', description: 'Seção de garantia' },
  { type: 'lead-form' as BlockType, label: 'Formulário Lead', icon: Mail, category: 'Funil', description: 'Captura de leads' },
  { type: 'checkout' as BlockType, label: 'Checkout', icon: CreditCard, category: 'Funil', description: 'Bloco de checkout' },
  { type: 'order-bump' as BlockType, label: 'Order Bump', icon: ArrowUpCircle, category: 'Funil', description: 'Oferta adicional' },
  { type: 'upsell' as BlockType, label: 'Upsell', icon: TrendingUp, category: 'Funil', description: 'Oferta de upsell' },
  { type: 'divider' as BlockType, label: 'Divisor', icon: Minus, category: 'Layout', description: 'Linha divisória' },
  { type: 'spacer' as BlockType, label: 'Espaçador', icon: MoveVertical, category: 'Layout', description: 'Espaço vertical' },
];

const ACTION_COMMANDS = [
  { action: 'save' as const, label: 'Salvar', icon: Save, shortcut: '⌘S', description: 'Salvar alterações' },
  { action: 'undo' as const, label: 'Desfazer', icon: Undo, shortcut: '⌘Z', description: 'Desfazer última ação' },
  { action: 'redo' as const, label: 'Refazer', icon: Redo, shortcut: '⌘⇧Z', description: 'Refazer ação' },
  { action: 'preview' as const, label: 'Prévia', icon: Eye, shortcut: '⌘P', description: 'Visualizar página' },
  { action: 'settings' as const, label: 'Configurações', icon: Palette, shortcut: '⌘,', description: 'Abrir configurações' },
];

export function CommandPalette({ open, onOpenChange, onAddBlock, onAction }: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border shadow-2xl">
        <CommandInput placeholder="Buscar blocos ou ações..." className="h-12" />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {/* Actions */}
          <CommandGroup heading="Ações Rápidas">
            {ACTION_COMMANDS.map((cmd) => (
              <CommandItem
                key={cmd.action}
                onSelect={() => {
                  onAction(cmd.action);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <cmd.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{cmd.label}</div>
                  <div className="text-xs text-muted-foreground">{cmd.description}</div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {cmd.shortcut}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          {/* Blocks by Category */}
          {['Hero', 'Conteúdo', 'Layout', 'Conversão', 'Social', 'Funil'].map((category) => {
            const blocks = BLOCK_COMMANDS.filter((b) => b.category === category);
            if (blocks.length === 0) return null;
            
            return (
              <CommandGroup key={category} heading={`Adicionar ${category}`}>
                {blocks.map((block) => (
                  <CommandItem
                    key={block.type}
                    onSelect={() => {
                      onAddBlock(block.type);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                      <block.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{block.label}</div>
                      <div className="text-xs text-muted-foreground">{block.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {block.category}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

// Keyboard shortcuts hook
export function useEditorShortcuts({
  onSave,
  onUndo,
  onRedo,
  onCommandPalette,
}: {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCommandPalette: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 's') {
        e.preventDefault();
        onSave();
      }
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
      if (modifier && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        onRedo();
      }
      if (modifier && e.key === 'k') {
        e.preventDefault();
        onCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onUndo, onRedo, onCommandPalette]);
}

// Floating keyboard hints
export function KeyboardHints({ className }: { className?: string }) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      <Badge variant="outline" className="font-mono gap-1 px-2 py-0.5">
        <span>{mod}K</span>
        <span className="text-muted-foreground/60">Buscar</span>
      </Badge>
      <Badge variant="outline" className="font-mono gap-1 px-2 py-0.5">
        <span>{mod}S</span>
        <span className="text-muted-foreground/60">Salvar</span>
      </Badge>
      <Badge variant="outline" className="font-mono gap-1 px-2 py-0.5">
        <span>{mod}Z</span>
        <span className="text-muted-foreground/60">Desfazer</span>
      </Badge>
    </motion.div>
  );
}
