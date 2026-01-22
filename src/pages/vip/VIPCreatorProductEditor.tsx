'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Save, Eye, Package, DollarSign, 
  Image as ImageIcon, FileText, Settings, Upload, X, Loader2,
  Video, BookOpen, Headphones, Calendar, Code, Box,
  Globe, Users, CheckCircle2, ChevronLeft, ChevronRight,
  Plus, Trash2, Clock, Sparkles, ExternalLink, Info,
  FolderOpen, Download, Shield, Zap, Award, Search
} from 'lucide-react';

// Import advanced editor components
import { FullscreenWixEditor } from '@/pages/admin/components/products/BlockEditor/FullscreenWixEditor';
import CourseModulesManager from '@/pages/admin/components/products/CourseModulesManager';
import StorageFilePicker from '@/components/admin/StorageFilePicker';

// ============= Types =============
type ProductType = 'course' | 'ebook' | 'mentoring' | 'live_event' | 'files' | 'combo';
type PricingType = 'one_time' | 'subscription' | 'free';

interface ProductFile {
  url: string;
  name: string;
  type: string;
  size?: number;
  description?: string;
}

// ============= Constants =============
const PRODUCT_TYPES = [
  { value: 'course' as const, label: 'Curso Online / Videoaula', icon: Video, description: 'Módulos, aulas em vídeo, PDFs, certificado' },
  { value: 'ebook' as const, label: 'Ebook / Livro Digital', icon: BookOpen, description: 'PDF, EPUB, MOBI com amostra gratuita' },
  { value: 'mentoring' as const, label: 'Mentoria', icon: Headphones, description: 'Sessões ao vivo ou gravadas' },
  { value: 'live_event' as const, label: 'Evento ao Vivo', icon: Calendar, description: 'Webinars, workshops, eventos' },
  { value: 'files' as const, label: 'Software / Arquivos', icon: Code, description: 'Downloads com chaves de licença' },
  { value: 'combo' as const, label: 'Combo / Pacote', icon: Box, description: 'Múltiplos produtos combinados' },
];

const GUARANTEE_OPTIONS = [
  { value: 0, label: 'Sem garantia' },
  { value: 7, label: '7 dias' },
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
  { value: 60, label: '60 dias' },
];

const MENTORING_FORMATS = [
  { value: 'live', label: 'Ao Vivo (Zoom/Meet)' },
  { value: 'recorded', label: 'Gravado' },
  { value: 'hybrid', label: 'Híbrido' },
];

const EVENT_PLATFORMS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'youtube_live', label: 'YouTube Live' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'other', label: 'Outra' },
];

const WIZARD_STEPS = [
  { id: 'basic', label: 'Informações', icon: FileText, description: 'Nome, tipo e imagem' },
  { id: 'content', label: 'Conteúdo', icon: Package, description: 'Específico por tipo' },
  { id: 'files', label: 'Arquivos', icon: FolderOpen, description: 'Downloads e materiais' },
  { id: 'pricing', label: 'Preço', icon: DollarSign, description: 'Valores e garantia' },
  { id: 'advanced', label: 'Avançado', icon: Settings, description: 'Certificado, SEO, acesso' },
  { id: 'review', label: 'Publicar', icon: CheckCircle2, description: 'Revisar e publicar' },
];

// ============= Helper Functions =============
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

const getVimeoEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const regExp = /vimeo\.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
};

// ============= Zod Schema =============
const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
  slug: z.string().min(2, 'Slug é obrigatório').max(200),
  short_description: z.string().max(160, 'Máximo 160 caracteres').optional(),
  description: z.string().max(5000).optional(),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  product_type: z.enum(['course', 'ebook', 'mentoring', 'live_event', 'files', 'combo']),
  pricing_type: z.enum(['one_time', 'subscription', 'free']).default('one_time'),
  price: z.number().min(0).default(97),
  original_price: z.number().min(0).optional().nullable(),
  max_installments: z.number().min(1).max(12).default(12),
  guarantee_days: z.number().min(0).default(7),
  access_days: z.number().min(1).optional().nullable(),
  affiliate_enabled: z.boolean().default(true),
  affiliate_commission_rate: z.number().min(0).max(100).default(10),
  creator_commission_rate: z.number().min(0).max(100).default(70),
  platform_commission_rate: z.number().min(0).max(100).default(20),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  trailer_url: z.string().optional(),
  // Advanced settings
  enable_certificate: z.boolean().default(true),
  certificate_hours: z.number().min(1).default(10),
  drip_content: z.boolean().default(false),
  drip_interval_days: z.number().min(1).default(7),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// ============= Main Component =============
export default function VIPCreatorProductEditor() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [productFiles, setProductFiles] = useState<ProductFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form setup
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      short_description: '',
      description: '',
      cover_image_url: '',
      product_type: 'course',
      pricing_type: 'one_time',
      price: 97,
      original_price: 197,
      max_installments: 12,
      guarantee_days: 7,
      access_days: null,
      affiliate_enabled: true,
      affiliate_commission_rate: 10,
      creator_commission_rate: 70,
      platform_commission_rate: 20,
      status: 'draft',
      trailer_url: '',
      enable_certificate: true,
      certificate_hours: 10,
      drip_content: false,
      drip_interval_days: 7,
      meta_title: '',
      meta_description: '',
    },
  });

  const watchedName = useWatch({ control: form.control, name: 'name' });
  const watchedPrice = useWatch({ control: form.control, name: 'price' });
  const watchedOriginalPrice = useWatch({ control: form.control, name: 'original_price' });
  const watchedProductType = useWatch({ control: form.control, name: 'product_type' });
  const watchedCreatorRate = useWatch({ control: form.control, name: 'creator_commission_rate' });
  const watchedPlatformRate = useWatch({ control: form.control, name: 'platform_commission_rate' });
  const watchedAffiliateRate = useWatch({ control: form.control, name: 'affiliate_commission_rate' });
  const watchedTrailerUrl = useWatch({ control: form.control, name: 'trailer_url' });

  // Auto-generate slug
  useEffect(() => {
    if (watchedName && !productId) {
      const newSlug = generateSlug(watchedName);
      form.setValue('slug', newSlug);
    }
  }, [watchedName, productId, form]);

  // Fetch affiliate data
  const { data: affiliateData } = useQuery({
    queryKey: ['creator-affiliate', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('vip_affiliates')
        .select('id, is_creator, creator_commission_rate, platform_commission_rate, affiliate_commission_rate')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (affiliateData) {
      setAffiliateId(affiliateData.id);
      if (!productId) {
        form.setValue('creator_commission_rate', affiliateData.creator_commission_rate || 70);
        form.setValue('platform_commission_rate', affiliateData.platform_commission_rate || 20);
        form.setValue('affiliate_commission_rate', affiliateData.affiliate_commission_rate || 10);
      }
    }
  }, [affiliateData, productId, form]);

  // Fetch existing product
  const { data: existingProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ['creator-product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingProduct) {
      form.reset({
        name: existingProduct.name || '',
        slug: existingProduct.slug || '',
        short_description: existingProduct.short_description || '',
        description: existingProduct.description || '',
        cover_image_url: existingProduct.cover_image_url || '',
        product_type: (existingProduct.product_type as ProductType) || 'course',
        pricing_type: existingProduct.pricing_type || 'one_time',
        price: existingProduct.price || 97,
        original_price: existingProduct.original_price || null,
        max_installments: existingProduct.max_installments || 12,
        guarantee_days: existingProduct.guarantee_days || 7,
        access_days: existingProduct.access_days || null,
        affiliate_enabled: existingProduct.affiliate_enabled !== false,
        affiliate_commission_rate: existingProduct.affiliate_commission_rate || 10,
        creator_commission_rate: existingProduct.creator_commission_rate || 70,
        platform_commission_rate: existingProduct.platform_commission_rate || 20,
        status: existingProduct.status || 'draft',
        trailer_url: existingProduct.trailer_url || '',
        enable_certificate: true,
        certificate_hours: 10,
        drip_content: false,
        drip_interval_days: 7,
        meta_title: '',
        meta_description: '',
      });
      
      // Load product files from sales_page_content.files if exists
      try {
        const content = existingProduct.sales_page_content;
        if (content && typeof content === 'object' && 'files' in (content as object)) {
          const files = (content as any).files;
          if (Array.isArray(files)) {
            setProductFiles(files);
          }
        }
      } catch (e) {
        console.error('Error parsing files:', e);
      }
    }
  }, [existingProduct, form]);

  // Image upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx. 5MB)');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `creator/${user?.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('product-content')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-content')
        .getPublicUrl(data.path);

      form.setValue('cover_image_url', publicUrl);
      toast.success('Imagem enviada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro no upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Commission balance handler
  const handleCommissionChange = (field: 'creator' | 'platform' | 'affiliate', value: number) => {
    if (field === 'creator') {
      form.setValue('creator_commission_rate', value);
      const remaining = 100 - value;
      const platformRatio = (watchedPlatformRate || 20) / ((watchedPlatformRate || 20) + (watchedAffiliateRate || 10));
      form.setValue('platform_commission_rate', Math.round(remaining * platformRatio));
      form.setValue('affiliate_commission_rate', remaining - Math.round(remaining * platformRatio));
    } else if (field === 'platform') {
      form.setValue('platform_commission_rate', value);
      form.setValue('affiliate_commission_rate', 100 - (watchedCreatorRate || 70) - value);
    } else {
      form.setValue('affiliate_commission_rate', value);
      form.setValue('platform_commission_rate', 100 - (watchedCreatorRate || 70) - value);
    }
  };

  // Handle file from picker (single file selection)
  const handleFileSelected = (url: string, fileName: string) => {
    const newFile: ProductFile = {
      url,
      name: fileName,
      type: fileName.split('.').pop() || 'file',
      description: ''
    };
    setProductFiles(prev => [...prev, newFile]);
    toast.success('Arquivo adicionado!');
  };

  const removeFile = (index: number) => {
    setProductFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Save product mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { formData: ProductFormData; publish?: boolean }) => {
      if (!affiliateId) throw new Error('Dados do creator não encontrados');
      
      const { formData, publish } = data;
      
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        price: formData.price,
        original_price: formData.original_price,
        product_type: formData.product_type,
        cover_image_url: formData.cover_image_url || null,
        status: publish ? 'published' : formData.status,
        creator_id: affiliateId,
        creator_commission_rate: formData.creator_commission_rate,
        platform_commission_rate: formData.platform_commission_rate,
        affiliate_commission_rate: formData.affiliate_commission_rate,
        affiliate_enabled: formData.affiliate_enabled,
        guarantee_days: formData.guarantee_days,
        max_installments: formData.max_installments,
        access_days: formData.access_days,
        pricing_type: formData.pricing_type,
        trailer_url: formData.trailer_url || null,
        is_creator_product: true,
      };

      // Store files in sales_page_content JSON (merged with existing)
      let existingContent: Record<string, unknown> = {};
      try {
        if (existingProduct?.sales_page_content) {
          existingContent = typeof existingProduct.sales_page_content === 'string'
            ? JSON.parse(existingProduct.sales_page_content)
            : (existingProduct.sales_page_content as Record<string, unknown>);
        }
      } catch (e) {
        console.warn('Could not parse existing content');
      }

      const updatedContent = {
        ...existingContent,
        files: productFiles,
        settings: {
          enable_certificate: formData.enable_certificate,
          certificate_hours: formData.certificate_hours,
          drip_content: formData.drip_content,
          drip_interval_days: formData.drip_interval_days,
        }
      };

      (productData as any).sales_page_content = JSON.stringify(updatedContent);

      let result;
      if (productId) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creator-product'] });
      queryClient.invalidateQueries({ queryKey: ['creator-products'] });
      
      toast.success(
        variables.publish 
          ? '🎉 Produto publicado com sucesso!' 
          : 'Produto salvo!'
      );

      if (!productId && data?.id) {
        navigate(`/vip/creator/edit/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar produto');
    },
  });

  const handleSave = (publish: boolean = false) => {
    form.handleSubmit((formData) => {
      setIsSaving(true);
      saveMutation.mutate({ formData, publish }, {
        onSettled: () => setIsSaving(false),
      });
    })();
  };

  // Navigation
  const goToStep = (step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  // Calculate progress
  const completedFields = useMemo(() => {
    let count = 0;
    if (watchedName) count++;
    if (form.getValues('short_description')) count++;
    if (form.getValues('cover_image_url')) count++;
    if (watchedPrice > 0) count++;
    return count;
  }, [watchedName, watchedPrice, form]);

  const progress = Math.round((completedFields / 4) * 100);

  // Video embed URL
  const embedUrl = useMemo(() => {
    if (!watchedTrailerUrl) return null;
    return getYouTubeEmbedUrl(watchedTrailerUrl) || getVimeoEmbedUrl(watchedTrailerUrl);
  }, [watchedTrailerUrl]);

  // Product URL
  const productUrl = productId && existingProduct?.slug 
    ? `${window.location.origin}/produto/${existingProduct.slug}`
    : '';

  // ============= Dynamic Content Step by Product Type =============
  const renderDynamicContentStep = () => {
    switch (watchedProductType) {
      case 'course':
        return (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Gestão de Módulos e Aulas
                </CardTitle>
                <CardDescription>
                  Organize seu curso em módulos e adicione aulas em vídeo, PDFs e quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productId ? (
                  <CourseModulesManager productId={productId} />
                ) : (
                  <div className="py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Salve o Produto Primeiro</h3>
                    <p className="text-muted-foreground mb-4">
                      Para adicionar módulos e aulas, primeiro salve as informações básicas.
                    </p>
                    <Button onClick={() => handleSave(false)}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar e Continuar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );

      case 'ebook':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Configuração do Ebook
              </CardTitle>
              <CardDescription>
                Faça upload do arquivo principal e configure a amostra gratuita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main File */}
              <div className="space-y-3">
                <Label>Arquivo Principal (PDF/EPUB/MOBI)</Label>
                <StorageFilePicker
                  bucket="affiliate-files"
                  onSelect={(url, name) => {
                    setProductFiles(prev => [...prev.filter(f => !f.name.includes('ebook-main')), {
                      url,
                      name: `ebook-main-${name}`,
                      type: 'ebook',
                      description: 'Arquivo principal do ebook'
                    }]);
                    toast.success('Ebook adicionado!');
                  }}
                  trigger={
                    <Button variant="outline" type="button" className="w-full h-24 border-dashed">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                        <span>Selecionar Arquivo do Ebook</span>
                      </div>
                    </Button>
                  }
                />
                {productFiles.filter(f => f.name.includes('ebook-main')).map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="flex-1 truncate">{file.name.replace('ebook-main-', '')}</span>
                    <Button variant="ghost" size="icon" onClick={() => setProductFiles(prev => prev.filter(f => f !== file))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Preview Sample */}
              <Separator />
              <div className="space-y-3">
                <Label>Amostra Gratuita (Preview)</Label>
                <p className="text-sm text-muted-foreground">Primeiros capítulos para atrair compradores</p>
                <StorageFilePicker
                  bucket="affiliate-files"
                  onSelect={(url, name) => {
                    setProductFiles(prev => [...prev.filter(f => !f.name.includes('ebook-preview')), {
                      url,
                      name: `ebook-preview-${name}`,
                      type: 'preview',
                      description: 'Amostra gratuita'
                    }]);
                    toast.success('Amostra adicionada!');
                  }}
                  trigger={
                    <Button variant="outline" type="button">
                      <Upload className="w-4 h-4 mr-2" />
                      Adicionar Amostra
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'mentoring':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-primary" />
                Configuração da Mentoria
              </CardTitle>
              <CardDescription>
                Defina o formato, número de sessões e integração com calendário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Sessões</Label>
                  <Input 
                    type="number" 
                    min={1}
                    defaultValue={4}
                    placeholder="Ex: 4"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração por Sessão (minutos)</Label>
                  <Input 
                    type="number" 
                    min={15}
                    step={15}
                    defaultValue={60}
                    placeholder="Ex: 60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select defaultValue="live">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MENTORING_FORMATS.map((fmt) => (
                        <SelectItem key={fmt.value} value={fmt.value}>{fmt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link do Calendário (Calendly/Cal.com)</Label>
                  <Input placeholder="https://calendly.com/..." />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Agendamento Automático</Label>
                  <p className="text-xs text-muted-foreground">Permitir que alunos agendem sessões automaticamente</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        );

      case 'live_event':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Configuração do Evento ao Vivo
              </CardTitle>
              <CardDescription>
                Configure data, horário e plataforma do seu webinar ou workshop
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data do Evento</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input type="time" />
                </div>
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select defaultValue="zoom">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link de Acesso</Label>
                  <Input placeholder="https://zoom.us/j/..." />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Gravação Disponível Após</Label>
                  <p className="text-xs text-muted-foreground">Disponibilizar gravação para participantes</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        );

      case 'files':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Software / Arquivos para Download
              </CardTitle>
              <CardDescription>
                Configure os arquivos, chaves de licença e instruções de instalação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main File */}
              <div className="space-y-3">
                <Label>Arquivo Principal (ZIP, RAR, EXE, etc.)</Label>
                <StorageFilePicker
                  bucket="affiliate-files"
                  onSelect={(url, name) => {
                    setProductFiles(prev => [...prev.filter(f => !f.name.includes('software-main')), {
                      url,
                      name: `software-main-${name}`,
                      type: 'software',
                      description: 'Arquivo principal'
                    }]);
                    toast.success('Arquivo adicionado!');
                  }}
                  trigger={
                    <Button variant="outline" type="button" className="w-full h-24 border-dashed">
                      <div className="flex flex-col items-center gap-2">
                        <Code className="w-8 h-8 text-muted-foreground" />
                        <span>Selecionar Arquivo</span>
                      </div>
                    </Button>
                  }
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Template de Chave de Licença</Label>
                <Input placeholder="XXXX-XXXX-XXXX-XXXX" />
                <p className="text-xs text-muted-foreground">Use X para caracteres aleatórios</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Gerar Licença Automaticamente</Label>
                  <p className="text-xs text-muted-foreground">Criar chave única para cada comprador</p>
                </div>
                <Switch />
              </div>

              <div className="space-y-3">
                <Label>Instruções de Instalação</Label>
                <Textarea placeholder="Passo a passo para instalação..." rows={4} />
              </div>
            </CardContent>
          </Card>
        );

      case 'combo':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5 text-primary" />
                Produtos Incluídos no Combo
              </CardTitle>
              <CardDescription>
                Selecione os produtos que farão parte deste pacote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Selecionar Produtos para o Combo</p>
                <p className="text-sm mt-2">
                  Os produtos disponíveis aparecerão aqui para você selecionar
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Desconto do Combo (%)</Label>
                <Input type="number" min={0} max={100} placeholder="Ex: 20" />
                <p className="text-xs text-muted-foreground">Desconto aplicado no valor total dos produtos</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione um Tipo de Produto</h3>
              <p className="text-muted-foreground">
                Volte ao passo anterior e escolha o tipo de produto para configurar o conteúdo.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/vip/creator')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {productId ? 'Editar Produto' : 'Criar Novo Produto'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Passo {currentStep + 1} de {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {productUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={productUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={() => handleSave(true)} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                Publicar
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progress} className="h-1" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Side Navigation */}
          <div className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <div className="space-y-1">
                  {WIZARD_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                      <button
                        key={step.id}
                        onClick={() => goToStep(index)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                          isActive && "bg-primary text-primary-foreground",
                          !isActive && "hover:bg-muted",
                          isCompleted && "text-green-600"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          isActive && "bg-primary-foreground/20",
                          isCompleted && "bg-green-100",
                          !isActive && !isCompleted && "bg-muted"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{step.label}</p>
                          <p className={cn(
                            "text-xs",
                            isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>{step.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Form {...form}>
              <form className="space-y-6">
                
                {/* ============= STEP 0: BASIC INFO ============= */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Informações Básicas
                        </CardTitle>
                        <CardDescription>
                          Defina o nome, tipo e imagem do seu produto
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Product Type Selection */}
                        <FormField
                          control={form.control}
                          name="product_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Produto</FormLabel>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {PRODUCT_TYPES.map((type) => {
                                  const Icon = type.icon;
                                  return (
                                    <button
                                      key={type.value}
                                      type="button"
                                      onClick={() => field.onChange(type.value)}
                                      className={cn(
                                        "p-4 rounded-lg border-2 text-left transition-all",
                                        field.value === type.value
                                          ? "border-primary bg-primary/5"
                                          : "border-muted hover:border-primary/50"
                                      )}
                                    >
                                      <Icon className="w-6 h-6 mb-2 text-primary" />
                                      <p className="font-medium text-sm">{type.label}</p>
                                      <p className="text-xs text-muted-foreground">{type.description}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </FormItem>
                          )}
                        />

                        <Separator />

                        {/* Name */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Produto *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Ex: Curso Completo de Day Trade"
                                  className="text-lg"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Short Description */}
                        <FormField
                          control={form.control}
                          name="short_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição Curta</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Resumo em uma linha (máx. 160 caracteres)"
                                  maxLength={160}
                                />
                              </FormControl>
                              <FormDescription>
                                {(field.value?.length || 0)}/160 caracteres
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        {/* Description */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição Completa</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Descreva seu produto em detalhes..."
                                  rows={5}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Separator />

                        {/* Cover Image with Preview - Enhanced */}
                        <div className="space-y-4">
                          <Label className="text-base font-medium">Imagem de Capa</Label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Upload/Preview Area */}
                            <div className="space-y-3">
                              {form.watch('cover_image_url') ? (
                                <div className="relative group">
                                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border-2 border-primary/20 shadow-lg">
                                    <img 
                                      src={form.watch('cover_image_url')!} 
                                      alt="Preview" 
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                      >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Trocar
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => form.setValue('cover_image_url', '')}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Remover
                                      </Button>
                                    </div>
                                  </div>
                                  <Badge className="absolute top-2 left-2 bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Imagem Carregada
                                  </Badge>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => fileInputRef.current?.click()}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                                  }}
                                  onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                  }}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type.startsWith('image/')) {
                                      // Simular o evento de input
                                      const dataTransfer = new DataTransfer();
                                      dataTransfer.items.add(file);
                                      if (fileInputRef.current) {
                                        fileInputRef.current.files = dataTransfer.files;
                                        handleImageUpload({ target: { files: dataTransfer.files } } as any);
                                      }
                                    }
                                  }}
                                  className="aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                                >
                                  {uploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="relative">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <span className="text-xs font-bold text-primary">...</span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground animate-pulse">Enviando imagem...</p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                                      <div className="p-4 rounded-full bg-primary/10">
                                        <ImageIcon className="h-8 w-8 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-foreground">
                                          Clique ou arraste para enviar
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          PNG, JPG ou WEBP • Máximo 5MB
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Quick select from My Files */}
                              <StorageFilePicker
                                bucket="affiliate-files"
                                onSelect={(url, name) => {
                                  form.setValue('cover_image_url', url);
                                  toast.success('Imagem selecionada!');
                                }}
                                trigger={
                                  <Button variant="outline" type="button" className="w-full">
                                    <FolderOpen className="w-4 h-4 mr-2" />
                                    Selecionar de Meus Arquivos
                                  </Button>
                                }
                              />
                            </div>

                            {/* Video Preview */}
                            <div className="space-y-3">
                              <FormField
                                control={form.control}
                                name="trailer_url"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Vídeo de Apresentação</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                          {...field} 
                                          placeholder="Cole o link do YouTube ou Vimeo"
                                          className="pl-10"
                                        />
                                      </div>
                                    </FormControl>
                                    <FormDescription>
                                      Vídeo promocional para apresentar seu produto
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              
                              {embedUrl ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border shadow-lg">
                                  <iframe
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                  <Badge className="absolute top-2 left-2 bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Vídeo Válido
                                  </Badge>
                                </div>
                              ) : watchedTrailerUrl ? (
                                <div className="aspect-video rounded-xl border-2 border-dashed bg-destructive/5 flex flex-col items-center justify-center">
                                  <X className="h-8 w-8 text-destructive mb-2" />
                                  <p className="text-sm text-destructive font-medium">URL inválida</p>
                                  <p className="text-xs text-muted-foreground">Use links do YouTube ou Vimeo</p>
                                </div>
                              ) : (
                                <div className="aspect-video rounded-xl border-2 border-dashed bg-muted/50 flex flex-col items-center justify-center">
                                  <Video className="h-8 w-8 text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">Preview do vídeo</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ============= STEP 1: CONTENT (Dynamic by Type) ============= */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {renderDynamicContentStep()}
                  </div>
                )}

                {/* ============= STEP 2: FILES & DOWNLOADS ============= */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FolderOpen className="w-5 h-5" />
                          Arquivos e Downloads
                        </CardTitle>
                        <CardDescription>
                          Adicione materiais bônus, PDFs, planilhas e outros arquivos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* File Actions */}
                        <div className="flex flex-wrap gap-2">
                          <StorageFilePicker
                            bucket="affiliate-files"
                            onSelect={handleFileSelected}
                            trigger={
                              <Button variant="outline" type="button">
                                <FolderOpen className="w-4 h-4 mr-2" />
                                Selecionar de Meus Arquivos
                              </Button>
                            }
                          />
                          <Button variant="outline" type="button" onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = async (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (!files || !user) return;
                              
                              setUploading(true);
                              try {
                                for (const file of Array.from(files)) {
                                  const fileName = `${user.id}/${Date.now()}-${file.name}`;
                                  const { data, error } = await supabase.storage
                                    .from('affiliate-files')
                                    .upload(fileName, file);
                                  
                                  if (error) throw error;
                                  
                                  const { data: { publicUrl } } = supabase.storage
                                    .from('affiliate-files')
                                    .getPublicUrl(data.path);
                                  
                                  setProductFiles(prev => [...prev, {
                                    url: publicUrl,
                                    name: file.name,
                                    type: file.type,
                                    size: file.size
                                  }]);
                                }
                                toast.success('Arquivos enviados!');
                              } catch (error: any) {
                                toast.error(error.message || 'Erro no upload');
                              } finally {
                                setUploading(false);
                              }
                            };
                            input.click();
                          }}>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Enviando...' : 'Upload Novo'}
                          </Button>
                        </div>

                        {/* File List */}
                        {productFiles.length > 0 ? (
                          <div className="space-y-2">
                            <Label>Arquivos Adicionados ({productFiles.length})</Label>
                            <div className="border rounded-lg divide-y">
                              {productFiles.map((file, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                    {file.type?.includes('image') ? (
                                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                    ) : file.type?.includes('video') ? (
                                      <Video className="w-5 h-5 text-muted-foreground" />
                                    ) : file.type?.includes('pdf') ? (
                                      <FileText className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                      <Download className="w-5 h-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="icon"
                                      asChild
                                    >
                                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </Button>
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => removeFile(index)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-2">
                              Nenhum arquivo adicionado
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Adicione PDFs, planilhas, templates e materiais bônus
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ============= STEP 3: PRICING ============= */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Preço e Oferta
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Pricing Type */}
                        <FormField
                          control={form.control}
                          name="pricing_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modelo de Cobrança</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="one_time">Pagamento Único</SelectItem>
                                  <SelectItem value="subscription">Assinatura Mensal</SelectItem>
                                  <SelectItem value="free">Gratuito</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preço (R$)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="original_price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preço Original (opcional)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="Para mostrar desconto"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Discount Preview */}
                        {watchedOriginalPrice && watchedOriginalPrice > watchedPrice && (
                          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="flex items-center gap-4">
                              <Badge className="bg-green-500">
                                {Math.round(((watchedOriginalPrice - watchedPrice) / watchedOriginalPrice) * 100)}% OFF
                              </Badge>
                              <div>
                                <p className="text-sm text-muted-foreground line-through">
                                  De: {formatCurrency(watchedOriginalPrice)}
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                  Por: {formatCurrency(watchedPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <Separator />

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="max_installments"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Máximo de Parcelas</FormLabel>
                                <Select 
                                  value={String(field.value)} 
                                  onValueChange={(v) => field.onChange(parseInt(v))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                                      <SelectItem key={n} value={String(n)}>
                                        {n}x {n === 1 ? 'à vista' : `de ${formatCurrency(watchedPrice / n)}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="guarantee_days"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Garantia</FormLabel>
                                <Select 
                                  value={String(field.value)} 
                                  onValueChange={(v) => field.onChange(parseInt(v))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {GUARANTEE_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={String(option.value)}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        {/* Commissions */}
                        <div>
                          <h4 className="font-medium mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Distribuição de Comissões
                          </h4>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Você (Creator)</span>
                                <span className="font-bold text-green-600">{watchedCreatorRate}%</span>
                              </div>
                              <Slider
                                value={[watchedCreatorRate || 70]}
                                onValueChange={([v]) => handleCommissionChange('creator', v)}
                                min={50}
                                max={90}
                                step={5}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Sky Brasil (Plataforma)</span>
                                <span className="font-medium">{watchedPlatformRate}%</span>
                              </div>
                              <Slider
                                value={[watchedPlatformRate || 20]}
                                onValueChange={([v]) => handleCommissionChange('platform', v)}
                                min={10}
                                max={30}
                                step={5}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Afiliado</span>
                                <span className="font-medium text-primary">{watchedAffiliateRate}%</span>
                              </div>
                              <Slider
                                value={[watchedAffiliateRate || 10]}
                                onValueChange={([v]) => handleCommissionChange('affiliate', v)}
                                min={0}
                                max={30}
                                step={5}
                              />
                            </div>

                            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                              <span className="font-medium">Total</span>
                              <span className={cn(
                                "font-bold",
                                (watchedCreatorRate + watchedPlatformRate + watchedAffiliateRate) === 100 
                                  ? "text-green-600" 
                                  : "text-destructive"
                              )}>
                                {(watchedCreatorRate || 0) + (watchedPlatformRate || 0) + (watchedAffiliateRate || 0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ============= STEP 4: ADVANCED SETTINGS ============= */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    {/* Certificate Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Certificado
                        </CardTitle>
                        <CardDescription>
                          Configure a emissão automática de certificados
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="enable_certificate"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Emitir Certificado ao Concluir</FormLabel>
                                <FormDescription>
                                  Certificado profissional gerado automaticamente
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {form.watch('enable_certificate') && (
                          <FormField
                            control={form.control}
                            name="certificate_hours"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Carga Horária (horas)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Será exibida no certificado
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        )}
                      </CardContent>
                    </Card>

                    {/* Drip Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Liberação de Conteúdo
                        </CardTitle>
                        <CardDescription>
                          Configure como o conteúdo será liberado aos alunos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="drip_content"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Drip Content (Liberação Gradual)</FormLabel>
                                <FormDescription>
                                  Liberar módulos/aulas gradualmente
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {form.watch('drip_content') && (
                          <FormField
                            control={form.control}
                            name="drip_interval_days"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Intervalo entre liberações (dias)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Um novo módulo será liberado a cada X dias
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        )}

                        <Separator />

                        <FormField
                          control={form.control}
                          name="access_days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempo de Acesso (dias)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min={1}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="Deixe vazio para acesso vitalício"
                                />
                              </FormControl>
                              <FormDescription>
                                Deixe em branco para acesso vitalício
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* SEO Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Search className="w-5 h-5" />
                          SEO e Meta Tags
                        </CardTitle>
                        <CardDescription>
                          Otimize para mecanismos de busca
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="meta_title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Título</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder={watchedName || 'Título da página'}
                                  maxLength={60}
                                />
                              </FormControl>
                              <FormDescription>
                                {(field.value?.length || 0)}/60 caracteres
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="meta_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Descrição</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder={form.getValues('short_description') || 'Descrição para SEO'}
                                  maxLength={160}
                                  rows={3}
                                />
                              </FormControl>
                              <FormDescription>
                                {(field.value?.length || 0)}/160 caracteres
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ============= STEP 5: REVIEW & PUBLISH ============= */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Revisão Final
                        </CardTitle>
                        <CardDescription>
                          Confira todas as informações antes de publicar
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Product Preview Card */}
                        <div className="flex gap-4 p-4 bg-muted rounded-lg">
                          {form.watch('cover_image_url') ? (
                            <img 
                              src={form.watch('cover_image_url')!}
                              alt={watchedName}
                              className="w-32 h-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-32 h-20 rounded-lg bg-background flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{watchedName || 'Sem nome'}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {form.getValues('short_description') || 'Sem descrição'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {PRODUCT_TYPES.find(t => t.value === watchedProductType)?.label}
                              </Badge>
                              <span className="font-bold text-green-600">
                                {formatCurrency(watchedPrice)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Checklist */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Checklist de Publicação</h4>
                          
                          {[
                            { label: 'Nome do produto', done: !!watchedName },
                            { label: 'Descrição curta', done: !!form.getValues('short_description') },
                            { label: 'Imagem de capa', done: !!form.getValues('cover_image_url') },
                            { label: 'Preço definido', done: watchedPrice >= 0 },
                            { label: 'Comissões configuradas', done: (watchedCreatorRate + watchedPlatformRate + watchedAffiliateRate) === 100 },
                            { label: 'Arquivos adicionados', done: productFiles.length > 0 || watchedProductType !== 'files' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center",
                                item.done ? "bg-green-500" : "bg-muted"
                              )}>
                                {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        {/* Summary Cards */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Tipo</p>
                            <p className="font-medium">
                              {PRODUCT_TYPES.find(t => t.value === watchedProductType)?.label}
                            </p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Preço Final</p>
                            <p className="font-bold text-green-600">{formatCurrency(watchedPrice)}</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Sua Comissão</p>
                            <p className="font-medium">{watchedCreatorRate}% ({formatCurrency(watchedPrice * watchedCreatorRate / 100)})</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Publish Actions */}
                        <div className="flex flex-col gap-4">
                          <Button 
                            type="button"
                            size="lg" 
                            onClick={() => handleSave(true)} 
                            disabled={isSaving}
                            className="w-full"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4 mr-2" />
                            )}
                            🚀 Publicar Produto
                          </Button>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="lg" 
                            onClick={() => handleSave(false)} 
                            disabled={isSaving}
                            className="w-full"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar como Rascunho
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </form>
            </Form>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <div className="flex gap-2">
                {WIZARD_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToStep(index)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors",
                      index === currentStep
                        ? "bg-primary"
                        : index < currentStep
                          ? "bg-green-500"
                          : "bg-muted"
                    )}
                  />
                ))}
              </div>

              <Button
                onClick={nextStep}
                disabled={currentStep === WIZARD_STEPS.length - 1}
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
