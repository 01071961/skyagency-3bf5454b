'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  handle?: boolean;
}

export default function SortableItem({ 
  id, 
  children, 
  className,
  disabled = false,
  handle = true
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

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
        "flex items-start gap-2",
        isDragging && "opacity-50 shadow-lg bg-background rounded-lg",
        className
      )}
    >
      {handle && !disabled && (
        <div 
          {...attributes} 
          {...listeners} 
          className={cn(
            "cursor-grab active:cursor-grabbing p-1 mt-2 rounded hover:bg-muted transition-colors",
            "touch-none select-none flex-shrink-0"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
