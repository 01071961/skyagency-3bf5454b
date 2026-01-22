import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { 
  GripVertical, Eye, EyeOff, Trash2, Copy,
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical,
  Columns, Grid3X3, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Block, BlockType, BLOCK_TEMPLATES } from './types';

interface SortableBlockItemProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isDragOverlay?: boolean;
}

const ICONS: Record<string, React.ElementType> = {
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical,
  Columns, Grid3X3, Sparkles
};

export function SortableBlockItem({
  block,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
  onDuplicate,
  isDragOverlay = false,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: isDragOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const template = BLOCK_TEMPLATES[block.type];
  const Icon = ICONS[template?.icon] || Layout;

  const getBlockPreview = () => {
    switch (block.type) {
      case 'hero':
      case 'hero-3d':
        return (block as any).content?.headline || 'Hero';
      case 'text':
        return (block as any).content?.text?.slice(0, 50) || 'Texto';
      case 'video':
        return (block as any).content?.title || 'Vídeo';
      case 'benefits':
        return `${(block as any).content?.items?.length || 0} benefícios`;
      case 'features':
        return `${(block as any).content?.items?.length || 0} itens`;
      case 'testimonials':
        return `${(block as any).content?.items?.length || 0} depoimentos`;
      case 'faq':
        return `${(block as any).content?.items?.length || 0} perguntas`;
      case 'columns':
        return `Layout ${(block as any).content?.layout || '50-50'}`;
      case 'gallery':
        return `${(block as any).content?.images?.length || 0} imagens`;
      default:
        return template?.description || '';
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={false}
      animate={isDragging ? { scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' } : { scale: 1 }}
      className={cn(
        "group relative flex items-center gap-3 p-3 rounded-lg border bg-card transition-all cursor-pointer",
        isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5",
        !block.visible && "opacity-50",
        isDragging && "z-50 shadow-xl",
        isDragOverlay && "shadow-2xl border-primary"
      )}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(); }}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-muted transition-colors touch-none",
          isDragging && "cursor-grabbing"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Block Icon */}
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
        block.visible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Block Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{template?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{getBlockPreview()}</p>
      </div>

      {/* Actions */}
      <div 
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleVisibility(); }}
          title={block.visible ? 'Ocultar' : 'Mostrar'}
        >
          {block.visible ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(); }}
          title="Duplicar"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          title="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Order indicator */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted text-[10px] font-mono flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {block.order + 1}
      </div>
    </motion.div>
  );
}
