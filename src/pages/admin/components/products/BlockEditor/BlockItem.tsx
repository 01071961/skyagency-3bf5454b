import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GripVertical, Eye, EyeOff, Trash2, Settings, Copy, Pencil,
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Block, BlockType, BLOCK_TEMPLATES } from './types';

interface BlockItemProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const ICONS: Record<string, React.ElementType> = {
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical
};

export function BlockItem({
  block,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
  onDuplicate,
  isDragging,
  dragHandleProps,
}: BlockItemProps) {
  const template = BLOCK_TEMPLATES[block.type];
  const Icon = ICONS[template.icon] || Layout;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card
        className={cn(
          "p-3 cursor-pointer transition-all duration-200",
          "hover:border-primary/50 hover:shadow-md",
          isSelected && "border-primary ring-2 ring-primary/20",
          !block.visible && "opacity-50",
          isDragging && "shadow-xl rotate-1"
        )}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(); }}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Icon */}
          <div className={cn(
            "p-2 rounded-lg",
            block.visible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{template.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {template.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(); }}
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleVisibility(); }}
              title={block.visible ? 'Ocultar' : 'Mostrar'}
            >
              {block.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(); }}
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
