import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface SortableBlockProps {
  id: string;
  children: ReactNode;
  isSelected?: boolean;
  className?: string;
}

export function SortableBlock({ 
  id, 
  children, 
  isSelected,
  className 
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative transition-all",
        isDragging && "opacity-80 shadow-2xl scale-[1.02]",
        className
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-md bg-background/95 border shadow-sm cursor-grab transition-opacity",
          "hover:bg-primary/10 active:cursor-grabbing",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}
