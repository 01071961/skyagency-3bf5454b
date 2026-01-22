import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Save, Download, Play, Trash2, ChevronLeft, ChevronRight,
  Type, Image as ImageIcon, Square, Circle, Layout, Sparkles, Loader2,
  Copy, Layers, Settings, Palette, Eye, FileDown, Lock,
  Crown, Zap, ArrowUpCircle, X, Share2, Link, FileText,
  Upload, Move, GripVertical, ImagePlus, Triangle, Star, Heart,
  Undo2, Redo2, ZoomIn, ZoomOut, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, MousePointer
} from 'lucide-react';
import { exportToPptx, exportToPdf } from '@/lib/presentation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
    rotation?: number;
  };
  locked?: boolean;
  visible?: boolean;
}

interface Slide {
  id: string;
  order: number;
  backgroundColor: string;
  elements: SlideElement[];
  transition: 'fade' | 'slide' | 'zoom' | 'none';
}

interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: string;
}

// 18 Professional Themes with better variety
const THEMES = [
  // Corporate
  { id: 'dark', name: 'Escuro Moderno', bg: '#0f0f0f', text: '#ffffff', accent: '#6366f1', category: 'corporativo' },
  { id: 'light', name: 'Claro Elegante', bg: '#fafafa', text: '#171717', accent: '#3b82f6', category: 'corporativo' },
  { id: 'blue', name: 'Azul Profissional', bg: '#0c1929', text: '#e2e8f0', accent: '#38bdf8', category: 'corporativo' },
  { id: 'corporate', name: 'Corporativo', bg: '#1e293b', text: '#f1f5f9', accent: '#0ea5e9', category: 'corporativo' },
  // Creative
  { id: 'gradient', name: 'Gradiente Roxo', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', accent: '#a855f7', category: 'criativo' },
  { id: 'sunset', name: 'Pôr do Sol', bg: 'linear-gradient(135deg, #2d1b69 0%, #1a0a3e 100%)', text: '#ffd6a5', accent: '#f97316', category: 'criativo' },
  { id: 'neon', name: 'Neon Cyberpunk', bg: '#0a0a0f', text: '#22d3ee', accent: '#ec4899', category: 'criativo' },
  { id: 'pastel', name: 'Pastel Suave', bg: '#fef7ed', text: '#78350f', accent: '#f59e0b', category: 'criativo' },
  // Nature
  { id: 'nature', name: 'Natureza', bg: '#0d2818', text: '#d8f3dc', accent: '#22c55e', category: 'natureza' },
  { id: 'ocean', name: 'Oceano', bg: '#0c4a6e', text: '#e0f2fe', accent: '#06b6d4', category: 'natureza' },
  { id: 'forest', name: 'Floresta', bg: '#14532d', text: '#bbf7d0', accent: '#4ade80', category: 'natureza' },
  { id: 'aurora', name: 'Aurora', bg: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', text: '#c7d2fe', accent: '#818cf8', category: 'natureza' },
  // Education
  { id: 'edu-classic', name: 'Educacional', bg: '#1e3a5f', text: '#dbeafe', accent: '#60a5fa', category: 'educacional' },
  { id: 'minimalist', name: 'Minimalista', bg: '#ffffff', text: '#171717', accent: '#525252', category: 'educacional' },
  { id: 'chalkboard', name: 'Lousa', bg: '#1a2e1a', text: '#d1fae5', accent: '#86efac', category: 'educacional' },
  // Sales & Marketing
  { id: 'sales-red', name: 'Vendas Impacto', bg: '#300a0a', text: '#fecaca', accent: '#ef4444', category: 'vendas' },
  { id: 'luxury', name: 'Luxo Premium', bg: '#1c1917', text: '#fef3c7', accent: '#d4a373', category: 'vendas' },
  { id: 'startup', name: 'Startup Tech', bg: '#020617', text: '#e2e8f0', accent: '#22c55e', category: 'vendas' },
];

const FONTS = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Roboto', name: 'Roboto' },
  { id: 'Poppins', name: 'Poppins' },
  { id: 'Playfair Display', name: 'Playfair' },
  { id: 'Space Grotesk', name: 'Space Grotesk' },
  { id: 'Montserrat', name: 'Montserrat' },
];

const createDefaultSlide = (order: number): Slide => ({
  id: crypto.randomUUID(),
  order,
  backgroundColor: '#0f0f0f',
  elements: [],
  transition: 'fade'
});

export default function VIPSlidesCreator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [presentation, setPresentation] = useState<Presentation>({
    id: crypto.randomUUID(),
    title: 'Nova Apresentação',
    slides: [createDefaultSlide(0)],
    theme: 'dark'
  });
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showThemesGallery, setShowThemesGallery] = useState(false);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<Presentation[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [leftSidebarTab, setLeftSidebarTab] = useState('slides');
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const currentSlide = presentation.slides[currentSlideIndex];

  useEffect(() => {
    checkAccess();
    loadSavedPresentations();
  }, [user]);

  // Save to history for undo/redo
  const saveToHistory = useCallback((newPresentation: Presentation) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, JSON.parse(JSON.stringify(newPresentation))];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPresentation(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPresentation(history[historyIndex + 1]);
    }
  };

  const checkAccess = async () => {
    if (!user) {
      setLoading(false);
      setHasAccess(false);
      return;
    }

    try {
      const { data: affiliate } = await supabase
        .from('vip_affiliates')
        .select('tier, status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle();

      let hasAccessResult = false;
      
      if (affiliate) {
        const tierLower = (affiliate.tier || 'bronze').toLowerCase();
        hasAccessResult = ['ouro', 'gold', 'platinum', 'platina', 'diamond', 'diamante'].includes(tierLower);
      }
      
      if (profile?.subscription_tier) {
        const subTierLower = profile.subscription_tier.toLowerCase();
        if (['gold', 'platinum', 'ouro', 'platina'].includes(subTierLower) && 
            profile.subscription_status === 'active') {
          hasAccessResult = true;
        }
      }
      
      setHasAccess(hasAccessResult);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPresentations = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('vip_presentations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const slidesData = Array.isArray(data.slides) ? data.slides : [createDefaultSlide(0)];
        const themeData = typeof data.theme === 'object' && data.theme !== null 
          ? (data.theme as { name?: string })?.name || 'dark' 
          : (typeof data.theme === 'string' ? data.theme : 'dark');
        
        const loadedPresentation = {
          id: data.id,
          title: data.title || 'Nova Apresentação',
          slides: slidesData as unknown as Slide[],
          theme: themeData
        };
        setPresentation(loadedPresentation);
        saveToHistory(loadedPresentation);
      }
    } catch (error) {
      console.error('Error loading presentations:', error);
    }
  };

  const addSlide = () => {
    const newSlide = createDefaultSlide(presentation.slides.length);
    const newPresentation = {
      ...presentation,
      slides: [...presentation.slides, newSlide]
    };
    setPresentation(newPresentation);
    saveToHistory(newPresentation);
    setCurrentSlideIndex(presentation.slides.length);
    toast.success('Slide adicionado');
  };

  const deleteSlide = (index: number) => {
    if (presentation.slides.length <= 1) {
      toast.error('Você precisa ter pelo menos 1 slide');
      return;
    }
    
    const newSlides = presentation.slides.filter((_, i) => i !== index);
    const newPresentation = { ...presentation, slides: newSlides };
    setPresentation(newPresentation);
    saveToHistory(newPresentation);
    setCurrentSlideIndex(Math.max(0, index - 1));
    toast.success('Slide removido');
  };

  const duplicateSlide = (index: number) => {
    const slideToDuplicate = presentation.slides[index];
    const newSlide: Slide = {
      ...JSON.parse(JSON.stringify(slideToDuplicate)),
      id: crypto.randomUUID(),
      order: presentation.slides.length
    };
    
    const newPresentation = {
      ...presentation,
      slides: [...presentation.slides.slice(0, index + 1), newSlide, ...presentation.slides.slice(index + 1)]
    };
    setPresentation(newPresentation);
    saveToHistory(newPresentation);
    setCurrentSlideIndex(index + 1);
    toast.success('Slide duplicado');
  };

  const addElement = (type: SlideElement['type'], shapeType?: string) => {
    const newElement: SlideElement = {
      id: crypto.randomUUID(),
      type,
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      width: type === 'text' ? 300 : 120,
      height: type === 'text' ? 60 : 120,
      content: type === 'text' ? 'Novo texto' : type === 'shape' ? (shapeType || 'square') : '',
      style: {
        fontSize: type === 'text' ? 32 : undefined,
        fontWeight: 'normal',
        fontFamily: 'Inter',
        textAlign: 'left',
        color: '#ffffff',
        backgroundColor: type === 'shape' ? '#6366f1' : 'transparent',
        borderRadius: shapeType === 'circle' ? 9999 : 8,
        opacity: 100,
        rotation: 0
      },
      locked: false,
      visible: true
    };

    const newPresentation = {
      ...presentation,
      slides: presentation.slides.map((slide, i) => 
        i === currentSlideIndex 
          ? { ...slide, elements: [...slide.elements, newElement] }
          : slide
      )
    };
    setPresentation(newPresentation);
    saveToHistory(newPresentation);
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => 
        i === currentSlideIndex 
          ? {
              ...slide,
              elements: slide.elements.map(el => 
                el.id === elementId ? { ...el, ...updates } : el
              )
            }
          : slide
      )
    }));
  };

  const deleteElement = (elementId: string) => {
    const newPresentation = {
      ...presentation,
      slides: presentation.slides.map((slide, i) => 
        i === currentSlideIndex 
          ? { ...slide, elements: slide.elements.filter(el => el.id !== elementId) }
          : slide
      )
    };
    setPresentation(newPresentation);
    saveToHistory(newPresentation);
    setSelectedElement(null);
    toast.success('Elemento removido');
  };

  // Drag and drop handlers
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const element = currentSlide?.elements.find(el => el.id === elementId);
    if (!element || element.locked || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scaleX = 960 / canvasRect.width;
    const scaleY = 540 / canvasRect.height;
    
    setDraggingElement(elementId);
    setDragOffset({
      x: (e.clientX - canvasRect.left) * scaleX - element.x,
      y: (e.clientY - canvasRect.top) * scaleY - element.y
    });
    setSelectedElement(elementId);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingElement || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scaleX = 960 / canvasRect.width;
    const scaleY = 540 / canvasRect.height;
    
    const element = currentSlide?.elements.find(el => el.id === draggingElement);
    if (!element) return;
    
    let newX = (e.clientX - canvasRect.left) * scaleX - dragOffset.x;
    let newY = (e.clientY - canvasRect.top) * scaleY - dragOffset.y;
    
    // Snap to grid (10px)
    const gridSize = 10;
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;
    
    // Bounds checking
    newX = Math.max(0, Math.min(960 - element.width, newX));
    newY = Math.max(0, Math.min(540 - element.height, newY));
    
    updateElement(draggingElement, { x: newX, y: newY });
  }, [draggingElement, dragOffset, currentSlide?.elements]);

  const handleMouseUp = () => {
    if (draggingElement) {
      saveToHistory(presentation);
      setDraggingElement(null);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingImage(true);
    try {
      const filePath = `${user.id}/slides/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vip-presentations')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('vip-presentations')
        .getPublicUrl(filePath);

      addImageElement(urlData.publicUrl);
      toast.success('Imagem adicionada!');
      setShowImageDialog(false);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrl = () => {
    if (!imageUrl.trim()) {
      toast.error('Digite uma URL válida');
      return;
    }
    addImageElement(imageUrl);
    setImageUrl('');
    setShowImageDialog(false);
    toast.success('Imagem adicionada!');
  };

  const addImageElement = (url: string) => {
    const newElement: SlideElement = {
      id: crypto.randomUUID(),
      type: 'image',
      x: 100,
      y: 100,
      width: 250,
      height: 180,
      content: url,
      style: {
        borderRadius: 8,
        opacity: 100,
        rotation: 0
      }
    };

    const newPresentation = {
      ...presentation,
      slides: presentation.slides.map((slide, i) => 
        i === currentSlideIndex 
          ? { ...slide, elements: [...slide.elements, newElement] }
          : slide
      )
    };
    setPresentation(newPresentation);
    saveToHistory(newPresentation);
    setSelectedElement(newElement.id);
  };

  const applyTheme = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      const newPresentation = {
        ...presentation,
        theme: themeId,
        slides: presentation.slides.map(s => ({ ...s, backgroundColor: theme.bg }))
      };
      setPresentation(newPresentation);
      saveToHistory(newPresentation);
      toast.success(`Tema "${theme.name}" aplicado!`);
      setShowThemesGallery(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Digite uma descrição para a IA');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('vip-slides-ai', {
        body: { prompt: aiPrompt, slidesCount: 5 }
      });

      if (error) throw error;

      if (data?.slides) {
        const newPresentation = {
          ...presentation,
          slides: data.slides.map((slide: any, index: number) => ({
            id: crypto.randomUUID(),
            order: index,
            backgroundColor: THEMES.find(t => t.id === presentation.theme)?.bg || '#0f0f0f',
            elements: slide.elements || [],
            transition: 'fade'
          }))
        };
        setPresentation(newPresentation);
        saveToHistory(newPresentation);
        toast.success('Apresentação gerada com IA!');
        setShowAIDialog(false);
        setAIPrompt('');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Erro ao gerar com IA. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const savePresentation = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vip_presentations')
        .upsert({
          id: presentation.id,
          user_id: user?.id,
          title: presentation.title,
          slides: presentation.slides as any,
          theme: { name: presentation.theme } as any,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Apresentação salva!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPdf(presentation);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
      setShowExportDialog(false);
    }
  };

  const handleExportPPTX = async () => {
    setExporting(true);
    try {
      await exportToPptx(presentation);
      toast.success('PowerPoint exportado com sucesso!');
    } catch (error) {
      console.error('Export PPTX error:', error);
      toast.error('Erro ao exportar PowerPoint');
    } finally {
      setExporting(false);
      setShowExportDialog(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareToken = crypto.randomUUID().slice(0, 8);
      const { error } = await supabase
        .from('vip_presentations')
        .upsert({
          id: presentation.id,
          user_id: user?.id,
          title: presentation.title,
          slides: presentation.slides as any,
          theme: presentation.theme,
          is_public: true,
          share_token: shareToken,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      const link = `${window.location.origin}/vip/share/${shareToken}`;
      setShareLink(link);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Erro ao gerar link');
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success('Link copiado!');
    }
  };

  const selectedEl = currentSlide?.elements.find(el => el.id === selectedElement);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando editor...</p>
        </div>
      </div>
    );
  }

  // Upgrade gate for non-Gold users
  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Criador de Slides VIP</h1>
          <p className="text-muted-foreground mb-6">
            Esta funcionalidade exclusiva está disponível apenas para membros <span className="text-amber-500 font-semibold">Ouro</span> ou <span className="text-purple-500 font-semibold">Platina</span>.
          </p>
        </div>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500" />
                <span>Criador de slides estilo Canva</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Geração de conteúdo com IA</span>
              </div>
              <div className="flex items-center gap-3">
                <FileDown className="w-5 h-5 text-amber-500" />
                <span>Exportação para PDF e PowerPoint</span>
              </div>
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-amber-500" />
                <span>18 templates profissionais exclusivos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            onClick={() => navigate('/vip/billing')}
          >
            <ArrowUpCircle className="w-5 h-5 mr-2" />
            Fazer Upgrade Agora
          </Button>
          <p className="text-sm text-muted-foreground">
            Assine Gold ou Platina e libere todos os recursos
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/vip/dashboard')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-border" />
            <Input
              value={presentation.title}
              onChange={(e) => setPresentation(prev => ({ ...prev, title: e.target.value }))}
              className="w-56 h-8 font-medium"
            />
            <Badge variant="outline" className="gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              VIP
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desfazer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refazer</TooltipContent>
            </Tooltip>
            
            <div className="h-6 w-px bg-border mx-2" />
            
            <Button variant="outline" size="sm" onClick={() => setShowAIDialog(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              IA
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Play className="w-4 h-4 mr-2" />
              Apresentar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            <Button size="sm" onClick={savePresentation} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 border-r bg-card flex flex-col">
            <Tabs value={leftSidebarTab} onValueChange={setLeftSidebarTab} className="flex flex-col h-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                <TabsTrigger value="slides" className="text-xs">Slides</TabsTrigger>
                <TabsTrigger value="elements" className="text-xs">Elementos</TabsTrigger>
                <TabsTrigger value="layers" className="text-xs">Layers</TabsTrigger>
              </TabsList>

              <TabsContent value="slides" className="flex-1 m-0 flex flex-col">
                <div className="p-2 border-b">
                  <Button size="sm" className="w-full" onClick={addSlide}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Slide
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {presentation.slides.map((slide, index) => (
                      <motion.div
                        key={slide.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "relative aspect-video rounded-lg cursor-pointer border-2 transition-all group overflow-hidden",
                          index === currentSlideIndex 
                            ? "border-primary shadow-lg shadow-primary/20" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setCurrentSlideIndex(index)}
                        style={{ background: slide.backgroundColor }}
                      >
                        <div className="absolute inset-0 p-1 overflow-hidden">
                          {slide.elements.slice(0, 3).map(el => (
                            <div
                              key={el.id}
                              className="absolute text-[5px] truncate"
                              style={{
                                left: `${(el.x / 960) * 100}%`,
                                top: `${(el.y / 540) * 100}%`,
                                color: el.style.color
                              }}
                            >
                              {el.type === 'text' ? el.content.slice(0, 20) : ''}
                            </div>
                          ))}
                        </div>
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                          {index + 1}
                        </span>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button 
                            className="p-1 bg-black/60 rounded hover:bg-primary/80"
                            onClick={(e) => { e.stopPropagation(); duplicateSlide(index); }}
                          >
                            <Copy className="w-3 h-3 text-white" />
                          </button>
                          <button 
                            className="p-1 bg-black/60 rounded hover:bg-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="elements" className="flex-1 m-0 overflow-auto">
                <div className="p-3 space-y-4">
                  {/* Text Elements */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Texto</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="h-12 flex-col gap-1" onClick={() => addElement('text')}>
                        <Type className="w-4 h-4" />
                        <span className="text-[10px]">Título</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-12 flex-col gap-1" onClick={() => addElement('text')}>
                        <Type className="w-3 h-3" />
                        <span className="text-[10px]">Corpo</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Shapes */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Formas</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="h-12 flex-col gap-1" onClick={() => addElement('shape', 'square')}>
                        <Square className="w-4 h-4" />
                        <span className="text-[10px]">Quadrado</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-12 flex-col gap-1" onClick={() => addElement('shape', 'circle')}>
                        <Circle className="w-4 h-4" />
                        <span className="text-[10px]">Círculo</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-12 flex-col gap-1" onClick={() => addElement('shape', 'triangle')}>
                        <Triangle className="w-4 h-4" />
                        <span className="text-[10px]">Triângulo</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Images */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Mídia</p>
                    <Button variant="outline" size="sm" className="w-full h-12 flex-col gap-1" onClick={() => setShowImageDialog(true)}>
                      <ImagePlus className="w-4 h-4" />
                      <span className="text-[10px]">Adicionar Imagem</span>
                    </Button>
                  </div>
                  
                  {/* Themes */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tema</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowThemesGallery(true)}>
                      <Palette className="w-4 h-4 mr-2" />
                      Galeria de Temas
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layers" className="flex-1 m-0 overflow-auto">
                <div className="p-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider px-1">
                    Elementos ({currentSlide?.elements.length || 0})
                  </p>
                  <div className="space-y-1">
                    {currentSlide?.elements.map((el, index) => (
                      <div
                        key={el.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedElement === el.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedElement(el.id)}
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                        {el.type === 'text' && <Type className="w-3 h-3" />}
                        {el.type === 'shape' && <Square className="w-3 h-3" />}
                        {el.type === 'image' && <ImageIcon className="w-3 h-3" />}
                        <span className="text-xs truncate flex-1">
                          {el.type === 'text' ? el.content.slice(0, 15) : el.type}
                        </span>
                        <button
                          className="p-1 hover:bg-destructive/20 rounded"
                          onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    {(!currentSlide?.elements.length) && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhum elemento
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-2 py-2 border-b">
              <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-16 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(150, zoom + 10))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setZoom(100)}>
                Ajustar
              </Button>
            </div>
            
            {/* Canvas */}
            <div 
              className="flex-1 flex items-center justify-center p-6 overflow-auto"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={canvasRef}
                className="relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-border"
                style={{
                  width: `${960 * (zoom / 100)}px`,
                  height: `${540 * (zoom / 100)}px`,
                  background: currentSlide?.backgroundColor || '#0f0f0f',
                  backgroundSize: 'cover',
                  minWidth: `${960 * (zoom / 100)}px`,
                  // Grid background
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), ${currentSlide?.backgroundColor || '#0f0f0f'}`,
                  backgroundPosition: '0 0, 0 0',
                }}
                onClick={() => setSelectedElement(null)}
              >
                {currentSlide?.elements.filter(el => el.visible !== false).map(element => (
                  <motion.div
                    key={element.id}
                    className={cn(
                      "absolute cursor-move select-none",
                      selectedElement === element.id && "ring-2 ring-primary ring-offset-1 ring-offset-transparent",
                      draggingElement === element.id && "cursor-grabbing z-50",
                      element.locked && "cursor-not-allowed opacity-70"
                    )}
                    style={{
                      left: element.x * (zoom / 100),
                      top: element.y * (zoom / 100),
                      width: element.width * (zoom / 100),
                      height: element.height * (zoom / 100),
                      opacity: (element.style.opacity || 100) / 100,
                      transform: `rotate(${element.style.rotation || 0}deg)`
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement(element.id);
                    }}
                    whileHover={{ scale: selectedElement !== element.id ? 1.01 : 1 }}
                  >
                    {element.type === 'text' && (
                      <div
                        className="w-full h-full flex items-center"
                        style={{
                          fontSize: (element.style.fontSize || 24) * (zoom / 100),
                          fontWeight: element.style.fontWeight,
                          fontFamily: element.style.fontFamily || 'Inter',
                          textAlign: element.style.textAlign || 'left',
                          color: element.style.color,
                          backgroundColor: element.style.backgroundColor === 'transparent' ? 'transparent' : element.style.backgroundColor,
                          padding: '4px'
                        }}
                        contentEditable={selectedElement === element.id}
                        suppressContentEditableWarning
                        onBlur={(e) => updateElement(element.id, { content: e.currentTarget.textContent || '' })}
                      >
                        {element.content}
                      </div>
                    )}
                    {element.type === 'shape' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: element.style.backgroundColor,
                          borderRadius: element.content === 'circle' ? '50%' : element.style.borderRadius
                        }}
                      />
                    )}
                    {element.type === 'image' && element.content && (
                      <img 
                        src={element.content} 
                        alt="" 
                        className="w-full h-full object-cover"
                        style={{ borderRadius: element.style.borderRadius }}
                        draggable={false}
                      />
                    )}
                    
                    {/* Resize Handles */}
                    {selectedElement === element.id && !element.locked && (
                      <>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-ne-resize" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-sm cursor-sw-resize" />
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-sm cursor-nw-resize" />
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-72 border-l bg-card flex flex-col">
            <div className="p-3 border-b">
              <h3 className="font-medium text-sm">Propriedades</h3>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3">
                {selectedEl ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      {selectedEl.type === 'text' && <Type className="w-4 h-4 text-primary" />}
                      {selectedEl.type === 'shape' && <Square className="w-4 h-4 text-primary" />}
                      {selectedEl.type === 'image' && <ImageIcon className="w-4 h-4 text-primary" />}
                      <span className="text-sm font-medium capitalize">{selectedEl.type}</span>
                    </div>
                    
                    {selectedEl.type === 'text' && (
                      <>
                        <div>
                          <Label className="text-xs">Texto</Label>
                          <Textarea
                            value={selectedEl.content}
                            onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Fonte</Label>
                          <Select
                            value={selectedEl.style.fontFamily || 'Inter'}
                            onValueChange={(value) => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, fontFamily: value }
                            })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONTS.map(font => (
                                <SelectItem key={font.id} value={font.id} style={{ fontFamily: font.id }}>
                                  {font.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Tamanho: {selectedEl.style.fontSize}px</Label>
                          <Slider
                            value={[selectedEl.style.fontSize || 24]}
                            onValueChange={([value]) => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, fontSize: value }
                            })}
                            min={12}
                            max={120}
                            step={1}
                          />
                        </div>
                        
                        <div className="flex gap-1">
                          <Button 
                            variant={selectedEl.style.fontWeight === 'bold' ? 'default' : 'outline'} 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, fontWeight: selectedEl.style.fontWeight === 'bold' ? 'normal' : 'bold' }
                            })}
                          >
                            <Bold className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant={selectedEl.style.textAlign === 'left' ? 'default' : 'outline'} 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, textAlign: 'left' }
                            })}
                          >
                            <AlignLeft className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant={selectedEl.style.textAlign === 'center' ? 'default' : 'outline'} 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, textAlign: 'center' }
                            })}
                          >
                            <AlignCenter className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant={selectedEl.style.textAlign === 'right' ? 'default' : 'outline'} 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, textAlign: 'right' }
                            })}
                          >
                            <AlignRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label className="text-xs">Cor</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={selectedEl.style.color || '#ffffff'}
                          onChange={(e) => updateElement(selectedEl.id, {
                            style: { ...selectedEl.style, color: e.target.value }
                          })}
                          className="h-8 w-12 p-1"
                        />
                        <Input
                          value={selectedEl.style.color || '#ffffff'}
                          onChange={(e) => updateElement(selectedEl.id, {
                            style: { ...selectedEl.style, color: e.target.value }
                          })}
                          className="h-8 flex-1 text-xs"
                        />
                      </div>
                    </div>
                    
                    {(selectedEl.type === 'shape' || selectedEl.type === 'text') && (
                      <div>
                        <Label className="text-xs">Fundo</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedEl.style.backgroundColor || '#6366f1'}
                            onChange={(e) => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, backgroundColor: e.target.value }
                            })}
                            className="h-8 w-12 p-1"
                          />
                          <Input
                            value={selectedEl.style.backgroundColor || 'transparent'}
                            onChange={(e) => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, backgroundColor: e.target.value }
                            })}
                            className="h-8 flex-1 text-xs"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-xs">Opacidade: {selectedEl.style.opacity || 100}%</Label>
                      <Slider
                        value={[selectedEl.style.opacity || 100]}
                        onValueChange={([value]) => updateElement(selectedEl.id, {
                          style: { ...selectedEl.style, opacity: value }
                        })}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Largura</Label>
                        <Input
                          type="number"
                          value={selectedEl.width}
                          onChange={(e) => updateElement(selectedEl.id, { width: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Altura</Label>
                        <Input
                          type="number"
                          value={selectedEl.height}
                          onChange={(e) => updateElement(selectedEl.id, { height: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full"
                      onClick={() => deleteElement(selectedEl.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <MousePointer className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Selecione um elemento</p>
                    <p className="text-xs mt-1">ou adicione um novo</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Slide Properties */}
            <div className="p-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Slide</p>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Fundo</Label>
                <Input
                  type="color"
                  value={currentSlide?.backgroundColor?.includes('gradient') ? '#000000' : (currentSlide?.backgroundColor || '#0f0f0f')}
                  onChange={(e) => {
                    setPresentation(prev => ({
                      ...prev,
                      slides: prev.slides.map((s, i) => 
                        i === currentSlideIndex ? { ...s, backgroundColor: e.target.value } : s
                      )
                    }));
                  }}
                  className="h-7 w-12 p-1"
                />
                <Select
                  value={currentSlide?.transition || 'fade'}
                  onValueChange={(value: Slide['transition']) => {
                    setPresentation(prev => ({
                      ...prev,
                      slides: prev.slides.map((s, i) => 
                        i === currentSlideIndex ? { ...s, transition: value } : s
                      )
                    }));
                  }}
                >
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Deslizar</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="none">Nenhuma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        {/* AI Generation Dialog */}
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Gerar com Inteligência Artificial
              </DialogTitle>
              <DialogDescription>
                Descreva o tema e a IA criará slides automaticamente.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Descreva sua apresentação</Label>
                <Textarea
                  placeholder="Ex: Apresentação sobre marketing digital para iniciantes..."
                  value={aiPrompt}
                  onChange={(e) => setAIPrompt(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>Cancelar</Button>
              <Button onClick={generateWithAI} disabled={generating || !aiPrompt.trim()}>
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Gerar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <div className="relative w-full aspect-video bg-black">
              <AnimatePresence mode="wait">
                <motion.div
                  key={previewIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                  style={{ background: presentation.slides[previewIndex]?.backgroundColor }}
                >
                  {presentation.slides[previewIndex]?.elements.map(element => (
                    <div
                      key={element.id}
                      className="absolute"
                      style={{
                        left: `${(element.x / 960) * 100}%`,
                        top: `${(element.y / 540) * 100}%`,
                        width: `${(element.width / 960) * 100}%`,
                        height: `${(element.height / 540) * 100}%`,
                        opacity: (element.style.opacity || 100) / 100
                      }}
                    >
                      {element.type === 'text' && (
                        <div style={{ fontSize: `${(element.style.fontSize || 24) / 960 * 100}vw`, fontWeight: element.style.fontWeight, color: element.style.color }}>
                          {element.content}
                        </div>
                      )}
                      {element.type === 'shape' && (
                        <div className="w-full h-full" style={{ backgroundColor: element.style.backgroundColor, borderRadius: element.content === 'circle' ? '50%' : element.style.borderRadius }} />
                      )}
                      {element.type === 'image' && element.content && (
                        <img src={element.content} alt="" className="w-full h-full object-cover" style={{ borderRadius: element.style.borderRadius }} />
                      )}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <Button variant="secondary" size="icon" onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))} disabled={previewIndex === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-white text-sm bg-black/50 px-3 py-1 rounded">{previewIndex + 1} / {presentation.slides.length}</span>
                <Button variant="secondary" size="icon" onClick={() => setPreviewIndex(Math.min(presentation.slides.length - 1, previewIndex + 1))} disabled={previewIndex === presentation.slides.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white" onClick={() => setShowPreview(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Exportar Apresentação
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={handleExportPDF} disabled={exporting}>
                {exporting ? <Loader2 className="w-8 h-8 animate-spin" /> : <FileText className="w-8 h-8 text-red-500" />}
                <span>PDF</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={handleExportPPTX} disabled={exporting}>
                {exporting ? <Loader2 className="w-8 h-8 animate-spin" /> : <FileDown className="w-8 h-8 text-orange-500" />}
                <span>PowerPoint</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Compartilhar
              </DialogTitle>
            </DialogHeader>
            
            {shareLink && (
              <div className="flex gap-2 py-4">
                <Input value={shareLink} readOnly className="flex-1 text-sm" />
                <Button onClick={copyShareLink} size="icon"><Link className="w-4 h-4" /></Button>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Upload Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-primary" />
                Adicionar Imagem
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => imageInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Clique para upload</p>
                  </>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou URL</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                <Button onClick={handleImageUrl} disabled={!imageUrl.trim()}>Adicionar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Themes Gallery Dialog */}
        <Dialog open={showThemesGallery} onOpenChange={setShowThemesGallery}>
          <DialogContent className="max-w-5xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Galeria de Temas Profissionais
              </DialogTitle>
              <DialogDescription>
                Escolha um tema para sua apresentação
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[60vh] pr-4">
              {['corporativo', 'criativo', 'natureza', 'educacional', 'vendas'].map(category => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">{category}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.filter(t => t.category === category).map((theme) => (
                      <motion.div
                        key={theme.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                          presentation.theme === theme.id ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-primary/50"
                        )}
                        onClick={() => applyTheme(theme.id)}
                      >
                        <div className="aspect-video flex items-center justify-center" style={{ background: theme.bg }}>
                          <div className="text-center p-4">
                            <h4 className="font-bold" style={{ color: theme.text }}>{theme.name}</h4>
                            <p className="text-xs mt-1" style={{ color: theme.accent }}>Exemplo</p>
                          </div>
                        </div>
                        {presentation.theme === theme.id && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Eye className="w-3 h-3" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
