'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  Plus, Trash2, GripVertical, Edit, Save, X, 
  Video, FileText, Download, Clock, Eye, EyeOff, Loader2,
  ClipboardList, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CloudFileUploader from '@/components/admin/CloudFileUploader';
import MultiFileUploader, { DownloadFile } from '@/components/admin/MultiFileUploader';
import VideoPreview from '@/components/admin/VideoPreview';
import LessonTextEditor from '@/components/admin/LessonTextEditor';
import QuizBulkImporter from '@/components/admin/QuizBulkImporter';
import AIQuizGenerator from '@/components/admin/AIQuizGenerator';
import QuizSettingsPanel, { QuizSettings, defaultQuizSettings } from '@/components/admin/QuizSettingsPanel';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface CourseModulesManagerProps {
  productId: string;
}

interface Module {
  id: string;
  name: string;
  description: string | null;
  position: number;
  is_free_preview: boolean;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  name: string;
  description: string | null;
  content_type: 'video' | 'text' | 'download' | 'quiz';
  video_url: string | null;
  video_duration: number | null;
  content_text: string | null;
  file_url: string | null;
  file_name: string | null;
  download_files: DownloadFile[] | null;
  position: number;
  is_free_preview: boolean;
}

const CONTENT_TYPES = [
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'text', label: 'Texto/Artigo', icon: FileText },
  { value: 'download', label: 'Download', icon: Download },
  { value: 'quiz', label: 'Quiz/Prova', icon: ClipboardList },
] as const;

// ============= Sortable Module Item =============
function SortableModuleItem({ 
  module, 
  moduleIndex, 
  totalModules,
  onEdit, 
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  children 
}: { 
  module: Module;
  moduleIndex: number;
  totalModules: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  children?: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <AccordionItem 
      ref={setNodeRef}
      style={style}
      value={module.id}
      className={cn(
        "border rounded-lg bg-card overflow-hidden",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-3 flex-1">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium">Módulo {moduleIndex + 1}: {module.name}</span>
              {module.is_free_preview && (
                <Badge variant="secondary" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Prévia Gratuita
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {module.lessons?.length || 0} aulas
            </p>
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[SortableModule] Edit button clicked for:', module.id);
                      // Small delay to ensure DnD doesn't intercept
                      setTimeout(() => onEdit(), 0);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar módulo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <AlertDialog>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Excluir módulo</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Módulo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o módulo "{module.name}"? 
                    Todas as {module.lessons?.length || 0} aulas serão removidas permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4">
        {module.description && (
          <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
        )}
        {children}
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="mt-3 w-full"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[SortableModule] Adicionar Aula button clicked for module:', module.id);
            onAddLesson();
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Aula
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

// ============= Sortable Lesson Item =============
function SortableLessonItem({ 
  lesson, 
  lessonIndex,
  onEdit, 
  onDelete 
}: { 
  lesson: Lesson;
  lessonIndex: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
        {lesson.content_type === 'video' && <Video className="w-4 h-4 text-primary" />}
        {lesson.content_type === 'text' && <FileText className="w-4 h-4 text-primary" />}
        {lesson.content_type === 'download' && <Download className="w-4 h-4 text-primary" />}
        {lesson.content_type === 'quiz' && <ClipboardList className="w-4 h-4 text-primary" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{lessonIndex + 1}. {lesson.name}</span>
          {lesson.is_free_preview && (
            <Badge variant="outline" className="text-xs flex-shrink-0">Prévia</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{CONTENT_TYPES.find(t => t.value === lesson.content_type)?.label}</span>
          {lesson.video_duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(lesson.video_duration)}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[SortableLesson] Edit button clicked for:', lesson.id);
                  // Small delay to ensure DnD doesn't intercept
                  setTimeout(() => onEdit(), 0);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar aula</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Excluir aula</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Aula</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a aula "{lesson.name}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

// ============= Main Component =============
export default function CourseModulesManager({ productId }: CourseModulesManagerProps) {
  const queryClient = useQueryClient();
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<UniqueIdentifier | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<UniqueIdentifier | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
  const [moduleForm, setModuleForm] = useState({
    name: '',
    description: '',
    is_free_preview: false,
  });
  
  const [lessonForm, setLessonForm] = useState({
    name: '',
    description: '',
    content_type: 'video' as 'video' | 'text' | 'download' | 'quiz',
    video_url: '',
    video_duration: null as number | null,
    content_text: '',
    file_url: '',
    file_name: '',
    download_files: [] as DownloadFile[],
    is_free_preview: false,
    quiz_questions: [] as Array<{
      question: string;
      options: string[];
      correct_index: number;
    }>,
    quiz_passing_score: 70,
    quiz_time_limit: null as number | null,
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch modules with lessons - with retry and better error handling
  const { data: modules, isLoading, error: modulesError, refetch: refetchModules } = useQuery({
    queryKey: ['course-modules', productId],
    queryFn: async () => {
      console.log('[CourseModules] Fetching modules for product:', productId);
      
      const { data: modulesData, error: modulesError } = await supabase
        .from('product_modules')
        .select('*')
        .eq('product_id', productId)
        .order('position');
      
      if (modulesError) {
        console.error('[CourseModules] Error fetching modules:', modulesError);
        throw modulesError;
      }
      
      if (!modulesData || modulesData.length === 0) {
        console.log('[CourseModules] No modules found');
        return [];
      }
      
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (mod) => {
          const { data: lessons, error: lessonsError } = await supabase
            .from('product_lessons')
            .select('*')
            .eq('module_id', mod.id)
            .order('position');
          
          if (lessonsError) {
            console.warn('[CourseModules] Error fetching lessons for module:', mod.id, lessonsError);
          }
          
          return { ...mod, lessons: lessons || [] };
        })
      );
      
      console.log('[CourseModules] Loaded', modulesWithLessons.length, 'modules');
      // Parse download_files from JSON for each lesson
      return modulesWithLessons.map(mod => ({
        ...mod,
        lessons: mod.lessons.map((lesson: any) => ({
          ...lesson,
          download_files: Array.isArray(lesson.download_files) ? lesson.download_files : []
        }))
      })) as Module[];
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 10000,
  });

  const moduleIds = useMemo(() => modules?.map(m => m.id) || [], [modules]);

  // Create/Update module - fixed to NOT redirect, properly update UI
  const moduleMutation = useMutation({
    mutationFn: async (data: typeof moduleForm & { id?: string }) => {
      console.log('[CourseModules] Saving module:', data.name, data.id ? '(update)' : '(create)');
      const maxPosition = modules?.length || 0;
      
      if (data.id) {
        const { error } = await supabase
          .from('product_modules')
          .update({
            name: data.name,
            description: data.description || null,
            is_free_preview: data.is_free_preview,
          })
          .eq('id', data.id);
        if (error) {
          console.error('[CourseModules] Update module error:', error);
          throw error;
        }
        return { type: 'update', id: data.id };
      } else {
        const { data: newModule, error } = await supabase
          .from('product_modules')
          .insert({
            product_id: productId,
            name: data.name,
            description: data.description || null,
            is_free_preview: data.is_free_preview,
            position: maxPosition,
          })
          .select()
          .single();
        if (error) {
          console.error('[CourseModules] Create module error:', error);
          throw error;
        }
        console.log('[CourseModules] Module created:', newModule?.id);
        return { type: 'create', id: newModule?.id };
      }
    },
    onSuccess: (result) => {
      console.log('[ModuleCreate] onSuccess chamado - wizard deve permanecer aberto');
      console.log('[ModuleCreate] Resultado:', result);
      
      // ONLY invalidate queries, close modal, show toast - NO REDIRECT, NO onClose, NO navigation
      queryClient.invalidateQueries({ queryKey: ['course-modules', productId] });
      setModuleDialogOpen(false);
      resetModuleForm();
      
      // Auto-expand the new module after creation
      if (result.type === 'create' && result.id) {
        console.log('[ModuleCreate] Auto-expandindo módulo recém-criado:', result.id);
        setExpandedModules(prev => [...prev, result.id!]);
      }
      
      toast.success(editingModule ? 'Módulo atualizado!' : 'Módulo criado com sucesso!');
      console.log('[ModuleCreate] Modal fechado, wizard permanece aberto');
    },
    onError: (error: any) => {
      console.warn('[ModuleCreate] ERRO - não deve fechar wizard:', error);
      // Show error but DO NOT close modal or redirect
      toast.error(error.message || 'Erro ao salvar módulo');
    }
  });

  // Delete module
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      await supabase.from('product_lessons').delete().eq('module_id', moduleId);
      const { error } = await supabase.from('product_modules').delete().eq('id', moduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', productId] });
      toast.success('Módulo excluído!');
    }
  });

  // Helper function to validate video URL - supports all major platforms
  const validateVideoUrl = (url: string): { valid: boolean; message?: string } => {
    if (!url || url.trim().length === 0) {
      return { valid: false, message: 'URL do vídeo é obrigatória' };
    }
    
    const trimmedUrl = url.trim();
    
    // YouTube patterns
    const youtubePattern = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    // Vimeo pattern
    const vimeoPattern = /(?:vimeo\.com\/)(\d+)/;
    // Direct video files
    const directPattern = /\.(mp4|webm|ogg|mov)(\?|$)/i;
    // Supabase storage
    const supabasePattern = /supabase\.co\/storage/;
    // Google Drive patterns
    const googleDrivePattern = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/;
    // OneDrive / SharePoint patterns
    const onedrivePattern = /(?:onedrive\.live\.com|1drv\.ms|sharepoint\.com)/;
    // Wistia pattern
    const wistiaPattern = /wistia\.(?:com|net)\/(?:medias|embed)/;
    // Loom pattern
    const loomPattern = /loom\.com\/(?:share|embed)/;
    
    if (
      youtubePattern.test(trimmedUrl) ||
      vimeoPattern.test(trimmedUrl) ||
      directPattern.test(trimmedUrl) ||
      supabasePattern.test(trimmedUrl) ||
      googleDrivePattern.test(trimmedUrl) ||
      onedrivePattern.test(trimmedUrl) ||
      wistiaPattern.test(trimmedUrl) ||
      loomPattern.test(trimmedUrl)
    ) {
      return { valid: true };
    }
    
    return { valid: false, message: 'URL inválida. Use YouTube, Vimeo, Google Drive, OneDrive, Loom, Wistia ou link direto (.mp4, .webm)' };
  };

  // Create/Update lesson - fixed to properly validate, save and close modal
  const lessonMutation = useMutation({
    mutationFn: async (data: typeof lessonForm & { id?: string; module_id: string }) => {
      console.log('[LessonMutation] Starting save for lesson:', data.name, 'type:', data.content_type);
      console.log('[LessonMutation] Module ID:', data.module_id);
      
      // Validate required fields
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Nome da aula é obrigatório');
      }
      if (!data.module_id) {
        throw new Error('Módulo não selecionado');
      }
      
      // Type-specific validation
      if (data.content_type === 'video') {
        console.log('[LessonVideo] Salvando aula de vídeo com URL:', data.video_url);
        
        if (data.video_url && data.video_url.trim().length > 0) {
          const validation = validateVideoUrl(data.video_url);
          if (!validation.valid) {
            console.error('[LessonVideo] URL validation failed:', validation.message);
            throw new Error(validation.message || 'URL do vídeo inválida');
          }
        }
      }
      
      const moduleData = modules?.find(m => m.id === data.module_id);
      const maxPosition = moduleData?.lessons?.length || 0;
      
      // Build payload based on content type
      const payload: any = {
        module_id: data.module_id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        content_type: data.content_type,
        is_free_preview: data.is_free_preview,
      };
      
      // Set type-specific fields, nullify others
      if (data.content_type === 'video') {
        payload.video_url = data.video_url?.trim() || null;
        payload.video_duration = data.video_duration || null;
        payload.content_text = null;
        payload.file_url = null;
        payload.file_name = null;
        // Video lessons can also have quiz attached
        payload.quiz_questions = data.quiz_questions && data.quiz_questions.length > 0 ? data.quiz_questions : null;
        payload.quiz_passing_score = data.quiz_questions && data.quiz_questions.length > 0 ? (data.quiz_passing_score || 70) : null;
        payload.quiz_time_limit = data.quiz_questions && data.quiz_questions.length > 0 ? data.quiz_time_limit : null;
        payload.quiz_required = data.quiz_questions && data.quiz_questions.length > 0 ? ((data as any).quiz_required || false) : false;
      } else if (data.content_type === 'text') {
        payload.video_url = null;
        payload.video_duration = null;
        payload.content_text = data.content_text?.trim() || null;
        payload.file_url = null;
        payload.file_name = null;
        payload.quiz_questions = null;
        payload.quiz_passing_score = null;
        payload.quiz_time_limit = null;
        payload.quiz_required = false;
      } else if (data.content_type === 'download') {
        payload.video_url = null;
        payload.video_duration = null;
        payload.content_text = null;
        payload.file_url = null;
        payload.file_name = null;
        payload.download_files = data.download_files || [];
        payload.quiz_questions = null;
        payload.quiz_passing_score = null;
        payload.quiz_time_limit = null;
        payload.quiz_required = false;
      } else if (data.content_type === 'quiz') {
        payload.video_url = null;
        payload.video_duration = null;
        payload.content_text = null;
        payload.file_url = null;
        payload.file_name = null;
        payload.quiz_questions = data.quiz_questions || [];
        payload.quiz_passing_score = data.quiz_passing_score || 70;
        payload.quiz_time_limit = data.quiz_time_limit || null;
        payload.quiz_required = (data as any).quiz_required || false;
      }
      
      console.log('[LessonMutation] Payload prepared:', JSON.stringify(payload, null, 2));
      
      if (data.id) {
        console.log('[LessonMutation] Updating existing lesson:', data.id);
        const { data: updatedLesson, error } = await supabase
          .from('product_lessons')
          .update(payload)
          .eq('id', data.id)
          .select()
          .maybeSingle();
        if (error) {
          console.error('[LessonMutation] Update lesson error:', error);
          throw error;
        }
        console.log('[LessonMutation] Lesson updated successfully:', updatedLesson?.id);
        return { type: 'update', id: updatedLesson?.id };
      } else {
        console.log('[LessonMutation] Creating new lesson with position:', maxPosition);
        const { data: newLesson, error } = await supabase
          .from('product_lessons')
          .insert({ ...payload, position: maxPosition })
          .select()
          .maybeSingle();
        if (error) {
          console.error('[LessonMutation] Create lesson error:', error);
          throw error;
        }
        console.log('[LessonMutation] Lesson created successfully:', newLesson?.id);
        return { type: 'create', id: newLesson?.id };
      }
    },
    onSuccess: (result) => {
      console.log('[LessonCreate] onSuccess - modal fechado, wizard permanece');
      console.log('[LessonCreate] Resultado:', result);
      
      // Capture moduleId before resetting
      const moduleIdToExpand = selectedModuleId;
      
      // ONLY invalidate queries, close modal, show toast - NO REDIRECT, NO onClose, NO navigation
      queryClient.invalidateQueries({ queryKey: ['course-modules', productId] });
      setLessonDialogOpen(false);
      
      // Reset form (this will clear selectedModuleId)
      setLessonForm({
        name: '',
        description: '',
        content_type: 'video',
        video_url: '',
        video_duration: null,
        content_text: '',
        file_url: '',
        file_name: '',
        download_files: [],
        is_free_preview: false,
        quiz_questions: [],
        quiz_passing_score: 70,
        quiz_time_limit: null,
      });
      setEditingLesson(null);
      setSelectedModuleId(null);
      
      // Auto-expand the module containing the new lesson (using captured value)
      if (moduleIdToExpand) {
        console.log('[LessonCreate] Auto-expandindo módulo:', moduleIdToExpand);
        setExpandedModules(prev => 
          prev.includes(moduleIdToExpand) ? prev : [...prev, moduleIdToExpand]
        );
      }
      
      const message = result.type === 'update' 
        ? 'Aula atualizada!' 
        : 'Aula criada com sucesso!';
      toast.success(message);
      console.log('[LessonCreate] Modal fechado, wizard permanece aberto');
    },
    onError: (error: any) => {
      console.warn('[LessonCreate] ERRO - não deve fechar wizard:', error);
      // Show specific error message, DO NOT close modal or redirect
      toast.error(error.message || 'Erro ao salvar aula');
    }
  });

  // Delete lesson
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase.from('product_lessons').delete().eq('id', lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', productId] });
      toast.success('Aula excluída!');
    }
  });

  // Reorder modules mutation
  const reorderModulesMutation = useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      const promises = updates.map(({ id, position }) =>
        supabase.from('product_modules').update({ position }).eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', productId] });
    }
  });

  // Reorder lessons mutation
  const reorderLessonsMutation = useMutation({
    mutationFn: async (updates: { id: string; position: number; module_id?: string }[]) => {
      const promises = updates.map(({ id, position, module_id }) => {
        const updateData: any = { position };
        if (module_id) updateData.module_id = module_id;
        return supabase.from('product_lessons').update(updateData).eq('id', id);
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', productId] });
    }
  });

  const resetModuleForm = () => {
    setModuleForm({ name: '', description: '', is_free_preview: false });
    setEditingModule(null);
  };

  const resetLessonForm = useCallback(() => {
    console.log('[ResetLessonForm] Resetting lesson form, clearing selectedModuleId');
    setLessonForm({
      name: '',
      description: '',
      content_type: 'video',
      video_url: '',
      video_duration: null,
      content_text: '',
      file_url: '',
      file_name: '',
      download_files: [],
      is_free_preview: false,
      quiz_questions: [],
      quiz_passing_score: 70,
      quiz_time_limit: null,
    });
    setEditingLesson(null);
    // Only clear module ID when explicitly resetting (not when opening add dialog)
    setSelectedModuleId(null);
  }, []);

  const openEditModule = useCallback((module: Module) => {
    console.log('[EditModule] Clicado em editar módulo ID:', module.id, 'Nome:', module.name);
    
    if (!module || !module.id) {
      console.error('[EditModule] Módulo inválido:', module);
      toast.error('Erro: módulo não encontrado');
      return;
    }
    
    // Set state in correct order
    setEditingModule(module);
    setModuleForm({
      name: module.name,
      description: module.description || '',
      is_free_preview: module.is_free_preview,
    });
    setModuleDialogOpen(true);
    
    console.log('[EditModule] Modal aberto com dados:', module.name);
  }, []);

  const openAddLesson = useCallback((moduleId: string) => {
    console.log('[AddLesson] Abrindo modal para módulo:', moduleId);
    
    if (!moduleId) {
      console.error('[AddLesson] moduleId is null or undefined');
      toast.error('Erro: módulo não identificado');
      return;
    }
    
    // Set module ID first, then reset form (keeping the module ID), then open dialog
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setLessonForm({
      name: '',
      description: '',
      content_type: 'video',
      video_url: '',
      video_duration: null,
      content_text: '',
      file_url: '',
      file_name: '',
      download_files: [],
      is_free_preview: false,
      quiz_questions: [],
      quiz_passing_score: 70,
      quiz_time_limit: null,
    });
    
    // Use setTimeout to ensure state is set before opening dialog
    setTimeout(() => {
      console.log('[AddLesson] Opening dialog for module:', moduleId);
      setLessonDialogOpen(true);
    }, 0);
  }, []);

  const openEditLesson = useCallback((lesson: Lesson) => {
    console.log('[EditLesson] Clicado em editar aula ID:', lesson.id, 'Nome:', lesson.name);
    
    if (!lesson || !lesson.id) {
      console.error('[EditLesson] Aula inválida:', lesson);
      toast.error('Erro: aula não encontrada');
      return;
    }
    
    // Set state in correct order
    setEditingLesson(lesson);
    setSelectedModuleId(lesson.module_id);
    // Handle migration from old file_url/file_name to download_files
    let downloadFiles: DownloadFile[] = [];
    if (lesson.download_files && Array.isArray(lesson.download_files) && lesson.download_files.length > 0) {
      downloadFiles = lesson.download_files;
    } else if (lesson.file_url) {
      // Migrate old single file to array
      downloadFiles = [{ url: lesson.file_url, name: lesson.file_name || 'Material', type: 'file' }];
    }
    
    setLessonForm({
      name: lesson.name,
      description: lesson.description || '',
      content_type: lesson.content_type as any,
      video_url: lesson.video_url || '',
      video_duration: lesson.video_duration,
      content_text: lesson.content_text || '',
      file_url: lesson.file_url || '',
      file_name: lesson.file_name || '',
      download_files: downloadFiles,
      is_free_preview: lesson.is_free_preview,
      quiz_questions: (lesson as any).quiz_questions || [],
      quiz_passing_score: (lesson as any).quiz_passing_score || 70,
      quiz_time_limit: (lesson as any).quiz_time_limit || null,
    });
    setLessonDialogOpen(true);
    
    console.log('[EditLesson] Modal aberto com dados:', lesson.name, 'tipo:', lesson.content_type);
  }, []);

  // DnD Handlers for Modules
  const handleModuleDragStart = useCallback((event: DragStartEvent) => {
    setActiveModuleId(event.active.id);
  }, []);

  const handleModuleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveModuleId(null);
    
    if (over && active.id !== over.id && modules) {
      const oldIndex = modules.findIndex(m => m.id === active.id);
      const newIndex = modules.findIndex(m => m.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(modules, oldIndex, newIndex);
        const updates = reordered.map((m, idx) => ({ id: m.id, position: idx }));
        reorderModulesMutation.mutate(updates);
      }
    }
  }, [modules, reorderModulesMutation]);

  // DnD Handlers for Lessons within a module
  const handleLessonDragEnd = useCallback((event: DragEndEvent, moduleId: string) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && modules) {
      const module = modules.find(m => m.id === moduleId);
      if (!module?.lessons) return;
      
      const oldIndex = module.lessons.findIndex(l => l.id === active.id);
      const newIndex = module.lessons.findIndex(l => l.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(module.lessons, oldIndex, newIndex);
        const updates = reordered.map((l, idx) => ({ id: l.id, position: idx }));
        reorderLessonsMutation.mutate(updates);
      }
    }
  }, [modules, reorderLessonsMutation]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalLessons = modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const totalDuration = modules?.reduce((acc, m) => 
    acc + (m.lessons?.reduce((lacc, l) => lacc + (l.video_duration || 0), 0) || 0), 0
  ) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Wrap the entire component to prevent event bubbling to parent wizard
  return (
    <div 
      className="space-y-6" 
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{modules?.length || 0}</p>
          <p className="text-sm text-muted-foreground">Módulos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalLessons}</p>
          <p className="text-sm text-muted-foreground">Aulas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{formatDuration(totalDuration) || '0:00'}</p>
          <p className="text-sm text-muted-foreground">Duração Total</p>
        </Card>
      </div>

      {/* Add Module Button */}
      <div className="flex justify-end">
        <Button 
          type="button"
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation();
            console.log('[CourseModules] Novo Módulo button clicked');
            resetModuleForm(); 
            setModuleDialogOpen(true); 
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Módulo
        </Button>
      </div>

      {/* Modules List with DnD */}
      {modules?.length === 0 ? (
        <Card className="p-8 text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-medium">Nenhum módulo criado</p>
          <p className="text-sm text-muted-foreground mb-4">
            Crie módulos e adicione aulas para estruturar seu curso.
          </p>
        <Button 
          type="button"
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation();
            console.log('[CourseModules] Criar Primeiro Módulo button clicked');
            resetModuleForm(); 
            setModuleDialogOpen(true); 
          }}
        >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Módulo
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleModuleDragStart}
          onDragEnd={handleModuleDragEnd}
        >
          <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
            <Accordion 
              type="multiple" 
              className="space-y-4"
              value={expandedModules}
              onValueChange={setExpandedModules}
            >
              {modules?.map((module, moduleIndex) => (
                <SortableModuleItem
                  key={module.id}
                  module={module}
                  moduleIndex={moduleIndex}
                  totalModules={modules.length}
                  onEdit={() => openEditModule(module)}
                  onDelete={() => deleteModuleMutation.mutate(module.id)}
                  onAddLesson={() => openAddLesson(module.id)}
                  onEditLesson={openEditLesson}
                  onDeleteLesson={(lessonId) => deleteLessonMutation.mutate(lessonId)}
                >
                  {/* Lessons with DnD */}
                  {module.lessons && module.lessons.length > 0 && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      modifiers={[restrictToVerticalAxis]}
                      onDragEnd={(e) => handleLessonDragEnd(e, module.id)}
                    >
                      <SortableContext 
                        items={module.lessons.map(l => l.id)} 
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <SortableLessonItem
                              key={lesson.id}
                              lesson={lesson}
                              lessonIndex={lessonIndex}
                              onEdit={() => openEditLesson(lesson)}
                              onDelete={() => deleteLessonMutation.mutate(lesson.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </SortableModuleItem>
              ))}
            </Accordion>
          </SortableContext>
        </DndContext>
      )}

      {/* Module Dialog - ISOLATED from parent events */}
      <Dialog 
        open={moduleDialogOpen} 
        onOpenChange={(open) => {
          console.log('[ModuleDialog] onOpenChange called with:', open);
          // Only allow closing through our explicit handlers
          if (!open && !moduleMutation.isPending) {
            setModuleDialogOpen(false);
          }
        }}
        modal={true}
      >
        <DialogContent 
          onPointerDownOutside={(e) => {
            e.preventDefault();
            console.log('[ModuleDialog] Click outside prevented');
          }}
          onEscapeKeyDown={(e) => {
            if (moduleMutation.isPending) {
              e.preventDefault();
              console.log('[ModuleDialog] ESC prevented during save');
            }
          }}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[ModuleCreate] Form submit - iniciando mutation');
              moduleMutation.mutate({ ...moduleForm, id: editingModule?.id });
            }}
          >
            <div className="space-y-4">
              <div>
                <Label>Nome do Módulo *</Label>
                <Input
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                  placeholder="Ex: Introdução ao Curso"
                  autoFocus
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="Descrição opcional do módulo"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Prévia Gratuita</Label>
                  <p className="text-xs text-muted-foreground">
                    Todas as aulas deste módulo serão liberadas gratuitamente
                  </p>
                </div>
                <Switch
                  checked={moduleForm.is_free_preview}
                  onCheckedChange={(checked) => setModuleForm({ ...moduleForm, is_free_preview: checked })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[ModuleDialog] Cancel clicked');
                  setModuleDialogOpen(false);
                  resetModuleForm();
                }}
                disabled={moduleMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={moduleMutation.isPending || !moduleForm.name.trim()}
              >
                {moduleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingModule ? 'Salvar' : 'Criar Módulo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog - ISOLATED from parent events */}
      <Dialog 
        open={lessonDialogOpen} 
        onOpenChange={(open) => {
          console.log('[LessonDialog] onOpenChange called with:', open);
          // Only allow closing through our explicit handlers
          if (!open && !lessonMutation.isPending) {
            setLessonDialogOpen(false);
          }
        }}
        modal={true}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            console.log('[LessonDialog] Click outside prevented');
          }}
          onEscapeKeyDown={(e) => {
            if (lessonMutation.isPending) {
              e.preventDefault();
              console.log('[LessonDialog] ESC prevented during save');
            }
          }}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label>Nome da Aula *</Label>
              <Input
                value={lessonForm.name}
                onChange={(e) => setLessonForm({ ...lessonForm, name: e.target.value })}
                placeholder="Ex: Aula 1 - Bem-vindo ao curso"
                autoFocus
              />
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                placeholder="Descrição opcional da aula"
                rows={2}
              />
            </div>
            
            <div>
              <Label>Tipo de Conteúdo</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {CONTENT_TYPES.map((type) => (
                  <Card
                    key={type.value}
                    className={cn(
                      "p-3 cursor-pointer transition-all hover:border-primary text-center",
                      lessonForm.content_type === type.value && "border-primary bg-primary/5"
                    )}
                    onClick={() => setLessonForm({ ...lessonForm, content_type: type.value })}
                  >
                    <type.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-sm">{type.label}</span>
                  </Card>
                ))}
              </div>
            </div>
            
            {lessonForm.content_type === 'video' && (
              <div className="space-y-4">
                <div>
                  <Label>URL do Vídeo *</Label>
                  <Input
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    className={cn(
                      lessonForm.video_url && !validateVideoUrl(lessonForm.video_url).valid && "border-destructive"
                    )}
                  />
                  {lessonForm.video_url && !validateVideoUrl(lessonForm.video_url).valid && (
                    <p className="text-xs text-destructive mt-1">
                      URL inválida. Use YouTube, Vimeo, Google Drive, OneDrive, Loom, Wistia ou link direto (.mp4, .webm)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta: YouTube, Vimeo, Google Drive, OneDrive, Loom, Wistia, links diretos (MP4, WebM) ou Supabase Storage
                  </p>
                </div>
                
                <CloudFileUploader
                  value=""
                  onChange={(url) => {
                    console.log('[LessonVideo] File uploaded, URL:', url);
                    setLessonForm({ ...lessonForm, video_url: url });
                  }}
                  accept="video/mp4,video/webm,video/quicktime"
                  label="Ou faça upload de um vídeo"
                  placeholder="Clique para fazer upload"
                  folder="lessons/videos"
                />
                
                {lessonForm.video_url && validateVideoUrl(lessonForm.video_url).valid && (
                  <VideoPreview url={lessonForm.video_url} className="mt-2" />
                )}
                
                <div>
                  <Label>Duração (segundos)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={lessonForm.video_duration || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setLessonForm({ ...lessonForm, video_duration: value > 0 ? value : null });
                    }}
                    placeholder="Ex: 600 (10 minutos) - opcional"
                  />
                  {lessonForm.video_duration && lessonForm.video_duration > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      = {Math.floor(lessonForm.video_duration / 60)}:{(lessonForm.video_duration % 60).toString().padStart(2, '0')} minutos
                    </p>
                  )}
                </div>

                {/* Quiz/Prova para esta Aula de Vídeo */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-base font-medium flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Prova desta Aula
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Adicione questões que o aluno deve responder após assistir o vídeo
                      </p>
                    </div>
                    <Switch
                      checked={lessonForm.quiz_questions.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked && lessonForm.quiz_questions.length === 0) {
                          setLessonForm({
                            ...lessonForm,
                            quiz_questions: [{ question: '', options: ['', '', '', ''], correct_index: 0 }]
                          });
                        } else if (!checked) {
                          setLessonForm({ ...lessonForm, quiz_questions: [] });
                        }
                      }}
                    />
                  </div>
                  
                  {lessonForm.quiz_questions.length > 0 && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <QuizSettingsPanel
                        settings={{
                          ...defaultQuizSettings,
                          passingScore: lessonForm.quiz_passing_score,
                          timeLimit: lessonForm.quiz_time_limit,
                          isRequired: (lessonForm as any).quiz_required || false,
                          certificateRequired: (lessonForm as any).quiz_required || false,
                          minimumScoreForCertificate: lessonForm.quiz_passing_score,
                        }}
                        onChange={(newSettings) => {
                          setLessonForm({
                            ...lessonForm,
                            quiz_passing_score: newSettings.passingScore,
                            quiz_time_limit: newSettings.timeLimit,
                            quiz_required: newSettings.isRequired,
                          } as any);
                        }}
                      />
                      
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Label>Questões ({lessonForm.quiz_questions.length})</Label>
                        <div className="flex gap-2 flex-wrap">
                          <AIQuizGenerator
                            lessonTitle={lessonForm.name || 'Prova da Aula'}
                            lessonContent={lessonForm.content_text || undefined}
                            videoUrl={lessonForm.video_url}
                            existingQuestions={lessonForm.quiz_questions}
                            onQuestionsGenerated={(questions) => {
                              setLessonForm({ ...lessonForm, quiz_questions: questions });
                            }}
                          />
                          <QuizBulkImporter
                            existingCount={lessonForm.quiz_questions.length}
                            onImport={(importedQuestions) => {
                              setLessonForm({
                                ...lessonForm,
                                quiz_questions: [...lessonForm.quiz_questions, ...importedQuestions]
                              });
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLessonForm({
                              ...lessonForm,
                              quiz_questions: [...lessonForm.quiz_questions, { question: '', options: ['', '', '', ''], correct_index: 0 }]
                            })}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                      
                      {lessonForm.quiz_questions.map((q, qIndex) => (
                        <Card key={qIndex} className="p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-primary min-w-[24px]">{qIndex + 1}.</span>
                            <div className="flex-1 space-y-3">
                              <Input
                                value={q.question}
                                onChange={(e) => {
                                  const newQuestions = [...lessonForm.quiz_questions];
                                  newQuestions[qIndex].question = e.target.value;
                                  setLessonForm({ ...lessonForm, quiz_questions: newQuestions });
                                }}
                                placeholder="Digite a pergunta..."
                              />
                              <div className="space-y-2">
                                {q.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`video-correct-${qIndex}`}
                                      checked={q.correct_index === optIndex}
                                      onChange={() => {
                                        const newQuestions = [...lessonForm.quiz_questions];
                                        newQuestions[qIndex].correct_index = optIndex;
                                        setLessonForm({ ...lessonForm, quiz_questions: newQuestions });
                                      }}
                                      className="accent-primary"
                                    />
                                    <Input
                                      value={opt}
                                      onChange={(e) => {
                                        const newQuestions = [...lessonForm.quiz_questions];
                                        newQuestions[qIndex].options[optIndex] = e.target.value;
                                        setLessonForm({ ...lessonForm, quiz_questions: newQuestions });
                                      }}
                                      placeholder={`Opção ${String.fromCharCode(65 + optIndex)}`}
                                      className={q.correct_index === optIndex ? 'border-green-500' : ''}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                const newQuestions = lessonForm.quiz_questions.filter((_, i) => i !== qIndex);
                                setLessonForm({ ...lessonForm, quiz_questions: newQuestions });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {lessonForm.content_type === 'text' && (
              <div>
                <Label>Conteúdo em Texto</Label>
                <LessonTextEditor
                  value={lessonForm.content_text}
                  onChange={(value) => setLessonForm({ ...lessonForm, content_text: value })}
                  placeholder="Escreva o conteúdo da aula aqui..."
                  minHeight="250px"
                  className="mt-2"
                />
              </div>
            )}
            
            {lessonForm.content_type === 'download' && (
              <div className="space-y-4">
                <MultiFileUploader
                  value={lessonForm.download_files}
                  onChange={(files) => setLessonForm({ 
                    ...lessonForm, 
                    download_files: files
                  })}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
                  label="Arquivos para Download"
                  folder="lessons/materials"
                />
              </div>
            )}
            
            {lessonForm.content_type === 'quiz' && (
              <div className="space-y-4">
                {/* Painel de Configurações Avançadas do Quiz */}
                <QuizSettingsPanel
                  settings={{
                    ...defaultQuizSettings,
                    passingScore: lessonForm.quiz_passing_score,
                    timeLimit: lessonForm.quiz_time_limit,
                    isRequired: (lessonForm as any).quiz_required || false,
                    certificateRequired: (lessonForm as any).quiz_required || false,
                    minimumScoreForCertificate: lessonForm.quiz_passing_score,
                  }}
                  onChange={(newSettings) => {
                    setLessonForm({
                      ...lessonForm,
                      quiz_passing_score: newSettings.passingScore,
                      quiz_time_limit: newSettings.timeLimit,
                      quiz_required: newSettings.isRequired,
                    } as any);
                  }}
                />
                
                {/* Quiz Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label>Questões ({lessonForm.quiz_questions.length})</Label>
                    <div className="flex gap-2 flex-wrap">
                      <AIQuizGenerator
                        lessonTitle={lessonForm.name || 'Quiz'}
                        lessonContent={lessonForm.content_text || undefined}
                        existingQuestions={lessonForm.quiz_questions}
                        onQuestionsGenerated={(questions) => {
                          setLessonForm({ ...lessonForm, quiz_questions: questions });
                        }}
                      />
                      <QuizBulkImporter
                        existingCount={lessonForm.quiz_questions.length}
                        onImport={(importedQuestions) => {
                          setLessonForm({
                            ...lessonForm,
                            quiz_questions: [
                              ...lessonForm.quiz_questions,
                              ...importedQuestions
                            ]
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLessonForm({
                          ...lessonForm,
                          quiz_questions: [
                            ...lessonForm.quiz_questions,
                            { question: '', options: ['', '', '', ''], correct_index: 0 }
                          ]
                        })}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Questão
                      </Button>
                    </div>
                  </div>
                  
                  {lessonForm.quiz_questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma questão adicionada</p>
                      <p className="text-xs">Clique em "Adicionar Questão" para começar</p>
                    </div>
                  )}
                  
                  {lessonForm.quiz_questions.map((q, qIndex) => (
                    <Card key={qIndex} className="p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-primary min-w-[24px]">{qIndex + 1}.</span>
                        <div className="flex-1 space-y-3">
                          <Input
                            value={q.question}
                            onChange={(e) => {
                              const newQuestions = [...lessonForm.quiz_questions];
                              newQuestions[qIndex].question = e.target.value;
                              setLessonForm({ ...lessonForm, quiz_questions: newQuestions });
                            }}
                            placeholder="Digite a pergunta..."
                          />
                          
                          <div className="space-y-2">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={q.correct_index === optIndex}
                                  onChange={() => {
                                    const newQuestions = [...lessonForm.quiz_questions];
                                    newQuestions[qIndex].correct_index = optIndex;
                                    setLessonForm({ ...lessonForm, quiz_questions: newQuestions });
                                  }}
                                  className="accent-primary"
                                />
                                <Input
                                  value={opt}
                                  onChange={(e) => {
                                    const newQuestions = [...lessonForm.quiz_questions];
                                    newQuestions[qIndex].options[optIndex] = e.target.value;
                                    setLessonForm({ ...lessonForm, quiz_questions: newQuestions });
                                  }}
                                  placeholder={`Opção ${String.fromCharCode(65 + optIndex)}`}
                                  className={q.correct_index === optIndex ? 'border-green-500' : ''}
                                />
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground">
                              Selecione o botão ao lado da opção correta
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            const newQuestions = lessonForm.quiz_questions.filter((_, i) => i !== qIndex);
                            setLessonForm({ ...lessonForm, quiz_questions: newQuestions });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label>Prévia Gratuita</Label>
                <p className="text-xs text-muted-foreground">
                  Esta aula estará disponível para não compradores
                </p>
              </div>
              <Switch
                checked={lessonForm.is_free_preview}
                onCheckedChange={(checked) => setLessonForm({ ...lessonForm, is_free_preview: checked })}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[LessonDialog] Cancel clicked - closing dialog only');
                setLessonDialogOpen(false);
                // Reset form after dialog closes
                setTimeout(() => {
                  setLessonForm({
                    name: '',
                    description: '',
                    content_type: 'video',
                    video_url: '',
                    video_duration: null,
                    content_text: '',
                    file_url: '',
                    file_name: '',
                    download_files: [],
                    is_free_preview: false,
                    quiz_questions: [],
                    quiz_passing_score: 70,
                    quiz_time_limit: null,
                  });
                  setEditingLesson(null);
                  setSelectedModuleId(null);
                }, 100);
              }}
              disabled={lessonMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[LessonCreate] Botão salvar clicado, tipo:', lessonForm.content_type);
                
                // Pre-validate video URL before mutation
                if (lessonForm.content_type === 'video' && lessonForm.video_url) {
                  const validation = validateVideoUrl(lessonForm.video_url);
                  if (!validation.valid) {
                    toast.error(validation.message || 'URL do vídeo inválida');
                    return;
                  }
                }
                
                if (!selectedModuleId) {
                  toast.error('Módulo não selecionado');
                  return;
                }
                
                lessonMutation.mutate({ 
                  ...lessonForm, 
                  id: editingLesson?.id, 
                  module_id: selectedModuleId 
                });
              }}
              disabled={lessonMutation.isPending || !lessonForm.name.trim() || !selectedModuleId}
            >
              {lessonMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingLesson ? 'Salvar' : 'Criar Aula'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
