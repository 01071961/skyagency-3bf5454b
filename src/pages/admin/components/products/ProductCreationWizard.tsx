'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  FileText, DollarSign, Package, Globe, Users, CheckCircle2,
  ChevronLeft, ChevronRight, Save, X, Plus,
  Video, BookOpen, Headphones, Calendar, Code, Box,
  Loader2, Eye, Upload, Trash2, Clock, Link2, Settings,
  Sparkles, AlertCircle, ExternalLink, Info, RefreshCw, Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CourseModulesManager from './CourseModulesManager';
import SalesPageEditor from './SalesPageEditor';
import AffiliateSettingsPanel from './AffiliateSettingsPanel';
import CloudFileUploader from '@/components/admin/CloudFileUploader';
import VideoPreview from '@/components/admin/VideoPreview';
import { useRealtimeProduct } from '@/hooks/useRealtimeProduct';

// Enhancement Components
import {
  AIProductAssistant,
  SEOScoreIndicator,
  ProfitCalculator,
  InstallmentSimulator,
  AffiliateEarningsSimulator,
  ReviewChecklist,
  MultiDevicePreview
} from './enhancements';

// ============= Types =============
interface ProductCreationWizardProps {
  productId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ProductType = 'course' | 'ebook' | 'mentoring' | 'live_event' | 'files' | 'combo';
type PricingType = 'one_time' | 'subscription' | 'free';

// ============= Constants =============
const PRODUCT_TYPES = [
  { value: 'course' as const, label: 'Curso Online / Videoaula', icon: Video, description: 'Módulos, aulas em vídeo, PDFs, certificado' },
  { value: 'ebook' as const, label: 'Ebook / Livro Digital', icon: BookOpen, description: 'PDF, EPUB, MOBI com amostra gratuita' },
  { value: 'mentoring' as const, label: 'Mentoria', icon: Headphones, description: 'Sessões ao vivo ou gravadas' },
  { value: 'live_event' as const, label: 'Evento ao Vivo', icon: Calendar, description: 'Webinars, workshops, eventos' },
  { value: 'files' as const, label: 'Software / Arquivos', icon: Code, description: 'Downloads com chaves de licença' },
  { value: 'combo' as const, label: 'Combo / Pacote', icon: Box, description: 'Múltiplos produtos combinados' },
];

const WIZARD_STEPS = [
  { id: 'basic', label: 'Informações Básicas', icon: FileText, description: 'Nome, tipo e imagem' },
  { id: 'pricing', label: 'Preço e Oferta', icon: DollarSign, description: 'Valores e parcelamento' },
  { id: 'content', label: 'Conteúdo', icon: Package, description: 'Específico por tipo' },
  { id: 'salespage', label: 'Página de Vendas', icon: Globe, description: 'Layout e conversão' },
  { id: 'affiliates', label: 'Afiliados', icon: Users, description: 'Comissões e materiais' },
  { id: 'review', label: 'Revisão', icon: CheckCircle2, description: 'Confirmar e publicar' },
];

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

const GUARANTEE_OPTIONS = [
  { value: 0, label: 'Sem garantia' },
  { value: 7, label: '7 dias' },
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
  { value: 60, label: '60 dias' },
  { value: 90, label: '90 dias' },
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

// ============= Helper Functions =============
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============= Zod Schemas =============

// Base schema (shared fields)
const baseSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres').max(200),
  short_description: z.string().max(160, 'Máximo 160 caracteres').optional(),
  description: z.string().max(5000).optional(),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  category_id: z.string().optional(),
  language: z.string().default('pt-BR'),
  tags: z.array(z.string()).default([]),
  product_type: z.enum(['course', 'ebook', 'mentoring', 'live_event', 'files', 'combo']),
  
  // Step 2: Pricing
  pricing_type: z.enum(['one_time', 'subscription', 'free']).default('one_time'),
  price: z.number().min(0).default(0),
  original_price: z.number().min(0).optional().nullable(),
  subscription_interval: z.string().default('monthly'),
  max_installments: z.number().min(1).max(12).default(12),
  guarantee_days: z.number().min(0).default(7),
  access_days: z.number().min(1).optional().nullable(),
  
  // Step 4: Sales Page (basic)
  sales_page_template: z.string().default('classic'),
  sales_page_published: z.boolean().default(false),
  testimonials: z.array(z.object({
    id: z.string(),
    name: z.string(),
    text: z.string(),
    avatar: z.string().optional(),
    role: z.string().optional(),
  })).default([]),
  faq: z.array(z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  })).default([]),
  
  // Step 5: Affiliates
  affiliate_enabled: z.boolean().default(true),
  affiliate_commission_rate: z.number().min(0).max(100).default(50),
  affiliate_free: z.boolean().default(false),
  
  // Status
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  
  // Content fields (shared)
  trailer_url: z.string().optional(),
  download_url: z.string().optional(),
});

// Dynamic content schemas per product type
const ebookContentSchema = z.object({
  ebook_files: z.array(z.object({
    id: z.string(),
    file_url: z.string(),
    file_name: z.string(),
    format: z.string(),
  })).default([]),
  preview_url: z.string().optional(),
  chapters: z.array(z.object({
    id: z.string(),
    title: z.string(),
    page: z.number().optional(),
  })).default([]),
});

const mentoringContentSchema = z.object({
  session_count: z.number().min(1).default(4),
  session_duration: z.number().min(15).default(60),
  mentoring_format: z.string().default('live'),
  calendar_link: z.string().optional(),
  auto_scheduling: z.boolean().default(false),
});

const liveEventContentSchema = z.object({
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  event_platform: z.string().default('zoom'),
  event_link: z.string().optional(),
  recording_available: z.boolean().default(false),
});

const filesContentSchema = z.object({
  software_files: z.array(z.object({
    id: z.string(),
    file_url: z.string(),
    file_name: z.string(),
  })).default([]),
  license_key_template: z.string().optional(),
  auto_generate_license: z.boolean().default(false),
  installation_instructions: z.string().optional(),
});

const comboContentSchema = z.object({
  included_products: z.array(z.string()).default([]),
  combo_discount: z.number().min(0).max(100).default(0),
});

// Combined form type
type FormData = z.infer<typeof baseSchema> & {
  // Ebook
  ebook_files?: { id: string; file_url: string; file_name: string; format: string }[];
  preview_url?: string;
  chapters?: { id: string; title: string; page?: number }[];
  // Mentoring
  session_count?: number;
  session_duration?: number;
  mentoring_format?: string;
  calendar_link?: string;
  auto_scheduling?: boolean;
  // Live Event
  event_date?: string;
  event_time?: string;
  event_platform?: string;
  event_link?: string;
  recording_available?: boolean;
  // Files
  software_files?: { id: string; file_url: string; file_name: string }[];
  license_key_template?: string;
  auto_generate_license?: boolean;
  installation_instructions?: string;
  // Combo
  included_products?: string[];
  combo_discount?: number;
};

// ============= Main Component =============
export default function ProductCreationWizard({ productId, onClose, onSuccess }: ProductCreationWizardProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [previousProductType, setPreviousProductType] = useState<ProductType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!productId); // True if creating new, false if editing
  const [showPreview, setShowPreview] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousFormDataRef = useRef<string>('');

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: '',
      slug: '',
      short_description: '',
      description: '',
      cover_image_url: '',
      category_id: '',
      language: 'pt-BR',
      tags: [],
      product_type: 'course',
      pricing_type: 'one_time',
      price: 0,
      original_price: null,
      subscription_interval: 'monthly',
      max_installments: 12,
      guarantee_days: 7,
      access_days: null,
      sales_page_template: 'classic',
      sales_page_published: false,
      testimonials: [],
      faq: [],
      affiliate_enabled: true,
      affiliate_commission_rate: 50,
      affiliate_free: false,
      status: 'draft',
      trailer_url: '',
      download_url: '',
      // Ebook
      ebook_files: [],
      preview_url: '',
      chapters: [],
      // Mentoring
      session_count: 4,
      session_duration: 60,
      mentoring_format: 'live',
      calendar_link: '',
      auto_scheduling: false,
      // Live Event
      event_date: '',
      event_time: '',
      event_platform: 'zoom',
      event_link: '',
      recording_available: false,
      // Files
      software_files: [],
      license_key_template: '',
      auto_generate_license: false,
      installation_instructions: '',
      // Combo
      included_products: [],
      combo_discount: 0,
    },
  });

  const watchedProductType = useWatch({ control: form.control, name: 'product_type' });
  const watchedPricingType = useWatch({ control: form.control, name: 'pricing_type' });
  const watchedPrice = useWatch({ control: form.control, name: 'price' });
  const watchedOriginalPrice = useWatch({ control: form.control, name: 'original_price' });
  const watchedCommissionRate = useWatch({ control: form.control, name: 'affiliate_commission_rate' });
  const watchedAffiliateEnabled = useWatch({ control: form.control, name: 'affiliate_enabled' });
  const watchedAffiliateFree = useWatch({ control: form.control, name: 'affiliate_free' });

  // Note: affiliate_free does NOT change the product price
  // It only grants free access to VIP affiliates while keeping the price visible for regular customers

  // Reset content-specific fields when product type changes
  useEffect(() => {
    if (previousProductType && previousProductType !== watchedProductType) {
      // Clear content-specific fields based on previous type
      const resetFields: Partial<FormData> = {};
      
      switch (previousProductType) {
        case 'ebook':
          resetFields.ebook_files = [];
          resetFields.preview_url = '';
          resetFields.chapters = [];
          break;
        case 'mentoring':
          resetFields.session_count = 4;
          resetFields.session_duration = 60;
          resetFields.mentoring_format = 'live';
          resetFields.calendar_link = '';
          resetFields.auto_scheduling = false;
          break;
        case 'live_event':
          resetFields.event_date = '';
          resetFields.event_time = '';
          resetFields.event_platform = 'zoom';
          resetFields.event_link = '';
          resetFields.recording_available = false;
          break;
        case 'files':
          resetFields.software_files = [];
          resetFields.license_key_template = '';
          resetFields.auto_generate_license = false;
          resetFields.installation_instructions = '';
          break;
        case 'combo':
          resetFields.included_products = [];
          resetFields.combo_discount = 0;
          break;
      }
      
      // Reset only content fields, not common fields
      Object.entries(resetFields).forEach(([key, value]) => {
        form.setValue(key as any, value);
      });
      
      toast.info('Conteúdo específico resetado para o novo tipo de produto');
    }
    setPreviousProductType(watchedProductType);
  }, [watchedProductType, previousProductType, form]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch other products for combo
  const { data: availableProducts } = useQuery({
    queryKey: ['available-products-for-combo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, cover_image_url')
        .eq('status', 'published')
        .neq('product_type', 'combo')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: watchedProductType === 'combo',
  });

  // Fetch existing product if editing - with retry and better error handling
  // IMPORTANT: This query should NOT refetch on window focus or when other queries are invalidated
  const { data: existingProduct, isLoading: loadingProduct, error: productError, refetch: refetchProduct } = useQuery({
    queryKey: ['product-wizard', productId],
    queryFn: async () => {
      if (!productId) return null;
      console.log('[Wizard] Fetching product:', productId);
      
      // Refresh session before critical queries
      const { error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError) {
        console.warn('[Wizard] Session refresh warning:', sessionError.message);
        // Don't throw on session refresh warning - continue with the query
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();
      
      if (error) {
        console.error('[Wizard] Product fetch error:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('[Wizard] Product not found:', productId);
        return null;
      }
      
      console.log('[Wizard] Product loaded successfully:', data.name);
      return data;
    },
    enabled: !!productId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 60000, // Increased to 60 seconds to prevent refetching during module/lesson operations
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Don't refetch if we already have data
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Populate form when editing
  useEffect(() => {
    if (existingProduct) {
      const externalIntegrations = existingProduct.external_integrations as any || {};
      
      form.reset({
        name: existingProduct.name || '',
        slug: existingProduct.slug || '',
        short_description: existingProduct.short_description || '',
        description: existingProduct.description || '',
        cover_image_url: existingProduct.cover_image_url || '',
        category_id: existingProduct.category_id || '',
        language: existingProduct.language || 'pt-BR',
        tags: (existingProduct as any).tags || [],
        product_type: (existingProduct.product_type as ProductType) || 'course',
        pricing_type: existingProduct.pricing_type || 'one_time',
        price: existingProduct.price || 0,
        original_price: existingProduct.original_price || null,
        subscription_interval: existingProduct.subscription_interval || 'monthly',
        max_installments: existingProduct.max_installments || 12,
        guarantee_days: existingProduct.guarantee_days || 7,
        access_days: existingProduct.access_days || null,
        sales_page_template: existingProduct.sales_page_template || 'classic',
        sales_page_published: existingProduct.sales_page_published || false,
        testimonials: Array.isArray(existingProduct.testimonials) 
          ? (existingProduct.testimonials as any[]).map(t => ({ ...t, id: t.id || generateId() }))
          : [],
        faq: Array.isArray(existingProduct.faq) 
          ? (existingProduct.faq as any[]).map(f => ({ ...f, id: f.id || generateId() }))
          : [],
        affiliate_enabled: existingProduct.affiliate_enabled ?? true,
        affiliate_commission_rate: existingProduct.affiliate_commission_rate || 50,
        status: existingProduct.status || 'draft',
        trailer_url: (existingProduct as any).trailer_url || '',
        download_url: existingProduct.download_url || '',
        // Type-specific fields from external_integrations
        ebook_files: externalIntegrations.ebook_files || [],
        preview_url: externalIntegrations.preview_url || '',
        chapters: externalIntegrations.chapters || [],
        session_count: externalIntegrations.session_count || 4,
        session_duration: externalIntegrations.session_duration || 60,
        mentoring_format: externalIntegrations.mentoring_format || 'live',
        calendar_link: externalIntegrations.calendar_link || '',
        auto_scheduling: externalIntegrations.auto_scheduling || false,
        event_date: externalIntegrations.event_date || '',
        event_time: externalIntegrations.event_time || '',
        event_platform: externalIntegrations.event_platform || 'zoom',
        event_link: externalIntegrations.event_link || '',
        recording_available: externalIntegrations.recording_available || false,
        software_files: externalIntegrations.software_files || [],
        license_key_template: externalIntegrations.license_key_template || '',
        auto_generate_license: externalIntegrations.auto_generate_license || false,
        installation_instructions: externalIntegrations.installation_instructions || '',
        included_products: externalIntegrations.included_products || [],
        combo_discount: externalIntegrations.combo_discount || 0,
      });
      
      setPreviousProductType(existingProduct.product_type as ProductType);
    }
  }, [existingProduct, form]);

  // Auto-generate slug from name
  const handleNameChange = useCallback((name: string) => {
    form.setValue('name', name);
    if (!productId || !form.getValues('slug')) {
      form.setValue('slug', generateSlug(name));
    }
  }, [form, productId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ publish, isAutoSave = false }: { publish: boolean; isAutoSave?: boolean }) => {
      setIsSaving(true);
      const data = form.getValues();
      
      // Validate slug uniqueness
      const { data: existingSlug } = await supabase
        .from('products')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', productId || '')
        .limit(1);
      
      let finalSlug = data.slug;
      if (existingSlug && existingSlug.length > 0) {
        finalSlug = `${data.slug}-${Date.now().toString(36)}`;
      }

      // Build external_integrations based on product type
      const externalIntegrations: Record<string, any> = {};
      
      switch (data.product_type) {
        case 'ebook':
          externalIntegrations.ebook_files = data.ebook_files;
          externalIntegrations.preview_url = data.preview_url;
          externalIntegrations.chapters = data.chapters;
          break;
        case 'mentoring':
          externalIntegrations.session_count = data.session_count;
          externalIntegrations.session_duration = data.session_duration;
          externalIntegrations.mentoring_format = data.mentoring_format;
          externalIntegrations.calendar_link = data.calendar_link;
          externalIntegrations.auto_scheduling = data.auto_scheduling;
          break;
        case 'live_event':
          externalIntegrations.event_date = data.event_date;
          externalIntegrations.event_time = data.event_time;
          externalIntegrations.event_platform = data.event_platform;
          externalIntegrations.event_link = data.event_link;
          externalIntegrations.recording_available = data.recording_available;
          break;
        case 'files':
          externalIntegrations.software_files = data.software_files;
          externalIntegrations.license_key_template = data.license_key_template;
          externalIntegrations.auto_generate_license = data.auto_generate_license;
          externalIntegrations.installation_instructions = data.installation_instructions;
          break;
        case 'combo':
          externalIntegrations.included_products = data.included_products;
          externalIntegrations.combo_discount = data.combo_discount;
          break;
      }

      // CRITICAL: Build payload that preserves sales_page_content from the database
      // The wizard form doesn't manage sales_page_content directly - it's handled by SalesPageEditor
      // So we must NOT overwrite it with undefined/null
      const basePayload = {
        name: data.name,
        slug: finalSlug,
        short_description: data.short_description || null,
        description: data.description || null,
        cover_image_url: data.cover_image_url || null,
        category_id: data.category_id || null,
        language: data.language,
        product_type: data.product_type,
        pricing_type: data.pricing_type,
        price: data.pricing_type === 'free' ? 0 : data.price,
        original_price: data.original_price || null,
        subscription_interval: data.subscription_interval,
        max_installments: data.max_installments,
        guarantee_days: data.guarantee_days,
        access_days: data.access_days || null,
        sales_page_template: data.sales_page_template,
        sales_page_published: publish ? true : data.sales_page_published,
        testimonials: data.testimonials,
        faq: data.faq,
        affiliate_enabled: data.affiliate_enabled,
        affiliate_commission_rate: data.affiliate_commission_rate,
        affiliate_free: data.affiliate_free,
        download_url: data.download_url || null,
        external_integrations: externalIntegrations,
        status: publish ? 'published' as const : data.status,
      };

      // For updates, we need to be careful not to overwrite sales_page_content
      // The SalesPageEditor handles that field separately
      // So we construct a partial update that excludes sales_page_content
      const payload = productId 
        ? basePayload  // Update: only update fields we manage
        : { ...basePayload, sales_page_content: null };  // Insert: initialize as null

      if (productId) {
        const { data: result, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: (result, { publish, isAutoSave }) => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      
      // Invalidate all related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-wizard', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-sales-page', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      
      if (isAutoSave) {
        setLastAutoSave(new Date());
        // Silent auto-save - no toast for normal auto-saves
      } else {
        const message = publish 
          ? `Produto publicado! Acesse: /produto/${result?.slug}` 
          : 'Rascunho salvo com sucesso!';
        toast.success(message);
        // DON'T close wizard - persist editing session
        // Only call onSuccess to refresh parent data
        onSuccess();
      }
    },
    onError: (error: any) => {
      setIsSaving(false);
      console.error('[ProductWizard] Save error:', error);
      toast.error(error.message || 'Erro ao salvar produto');
    }
  });

  // Realtime subscription for live updates
  const { forceRefresh } = useRealtimeProduct({
    productId: productId || undefined,
    enabled: !!productId,
    showNotifications: true,
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!productId) return; // Only auto-save for existing products

    autoSaveIntervalRef.current = setInterval(() => {
      const currentData = JSON.stringify(form.getValues());
      if (previousFormDataRef.current && currentData !== previousFormDataRef.current) {
        console.log('[AutoSave] Triggering auto-save...');
        setHasUnsavedChanges(true);
        saveMutation.mutate({ publish: false, isAutoSave: true });
      }
      previousFormDataRef.current = currentData;
    }, 30000);

    // Initialize previous data
    previousFormDataRef.current = JSON.stringify(form.getValues());

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [productId, form, saveMutation]);

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      const currentData = JSON.stringify(form.getValues());
      if (previousFormDataRef.current && currentData !== previousFormDataRef.current) {
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Navigation with auto-save
  const canGoNext = currentStep < WIZARD_STEPS.length - 1;
  const canGoPrev = currentStep > 0;
  
  const goNext = useCallback(async () => {
    if (!canGoNext) return;
    
    // Basic validation for step 1
    if (currentStep === 0) {
      const name = form.getValues('name');
      if (!name || name.length < 3) {
        toast.error('Nome do produto é obrigatório (mínimo 3 caracteres)');
        return;
      }
    }
    
    // Auto-save when advancing (only if product exists or we're past step 1)
    if (productId || currentStep >= 0) {
      try {
        // For new products on step 0, we need to create it first
        if (!productId && currentStep === 0) {
          setIsSaving(true);
          await saveMutation.mutateAsync({ publish: false, isAutoSave: true });
          setIsSaving(false);
          toast.success('Produto criado! Continue editando...', { duration: 2000 });
        } else if (productId && hasUnsavedChanges) {
          // For existing products, auto-save silently
          saveMutation.mutate({ publish: false, isAutoSave: true });
        }
      } catch (error) {
        console.error('[Wizard] Auto-save on advance failed:', error);
        // Continue anyway - don't block navigation
      }
    }
    
    setCurrentStep(prev => prev + 1);
  }, [canGoNext, currentStep, form, productId, hasUnsavedChanges, saveMutation]);
  
  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    
    // Auto-save when going back (only if there are changes)
    if (productId && hasUnsavedChanges) {
      saveMutation.mutate({ publish: false, isAutoSave: true });
    }
    
    setCurrentStep(prev => prev - 1);
  }, [canGoPrev, productId, hasUnsavedChanges, saveMutation]);

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // ============= Step Renderers =============

  const renderStepBasicInfo = () => (
    <div className="space-y-6">
      {/* AI Assistant & SEO Score */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <AIProductAssistant
            productType={watchedProductType}
            onApplyName={(name) => {
              form.setValue('name', name);
              form.setValue('slug', generateSlug(name));
            }}
            onApplyDescription={(desc) => form.setValue('short_description', desc)}
            onApplyTags={(tags) => form.setValue('tags', tags)}
          />
        </div>
        <Card className="p-4">
          <SEOScoreIndicator
            name={form.watch('name') || ''}
            shortDescription={form.watch('short_description') || ''}
            slug={form.watch('slug') || ''}
            tags={form.watch('tags') || []}
          />
        </Card>
      </div>

      <Separator />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Name */}
        <div className="lg:col-span-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Produto *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Curso Completo de Marketing Digital"
                    className="text-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Slug */}
        <div className="lg:col-span-2">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug (URL)</FormLabel>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/produto/</span>
                  <FormControl>
                    <Input 
                      {...field} 
                      onChange={(e) => field.onChange(generateSlug(e.target.value))}
                      placeholder="slug-do-produto"
                    />
                  </FormControl>
                </div>
                <FormDescription>URL amigável gerada automaticamente</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Short Description */}
        <div className="lg:col-span-2">
          <FormField
            control={form.control}
            name="short_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Curta</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Uma frase que resume o produto" 
                    maxLength={160}
                  />
                </FormControl>
                <FormDescription>{(field.value || '').length}/160 caracteres</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <div className="lg:col-span-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Completa</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Descreva detalhadamente o produto, benefícios, público-alvo..." 
                    rows={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cover Image */}
        <div className="lg:col-span-2">
          <Controller
            control={form.control}
            name="cover_image_url"
            render={({ field }) => (
              <div className="space-y-3">
                <CloudFileUploader
                  value={field.value || ''}
                  onChange={field.onChange}
                  accept="image/*"
                  label="Imagem de Capa"
                  placeholder="https://... ou faça upload"
                  folder="covers"
                  maxSizeMB={10}
                />
                {field.value && (
                  <img 
                    src={field.value} 
                    alt="Preview da capa" 
                    className="h-40 w-auto object-cover rounded-lg border shadow-sm" 
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                )}
              </div>
            )}
          />
        </div>

        {/* Category & Language */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <div className="lg:col-span-2">
          <Label>Tags / Palavras-chave</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (tagInput.trim()) {
                    const currentTags = form.getValues('tags') || [];
                    if (!currentTags.includes(tagInput.trim())) {
                      form.setValue('tags', [...currentTags, tagInput.trim()]);
                    }
                    setTagInput('');
                  }
                }
              }}
              placeholder="Digite e pressione Enter"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (tagInput.trim()) {
                  const currentTags = form.getValues('tags') || [];
                  if (!currentTags.includes(tagInput.trim())) {
                    form.setValue('tags', [...currentTags, tagInput.trim()]);
                  }
                  setTagInput('');
                }
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(form.watch('tags') || []).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => {
                    const currentTags = form.getValues('tags') || [];
                    form.setValue('tags', currentTags.filter(t => t !== tag));
                  }}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Product Type Selection */}
      <Separator />
      <div>
        <Label className="text-base font-semibold mb-4 block">Tipo de Produto *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRODUCT_TYPES.map((type) => (
            <Card
              key={type.value}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md",
                watchedProductType === type.value && "border-primary bg-primary/5 ring-2 ring-primary/20"
              )}
              onClick={() => form.setValue('product_type', type.value)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  watchedProductType === type.value ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <type.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepPricing = () => (
    <div className="space-y-6">
      {/* Profit Calculator & Installment Simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ProfitCalculator
          price={watchedPrice}
          commissionRate={watchedCommissionRate}
          affiliateEnabled={watchedAffiliateEnabled}
          maxInstallments={form.watch('max_installments') || 12}
        />
        <InstallmentSimulator
          price={watchedPrice}
          maxInstallments={form.watch('max_installments') || 12}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing Type */}
        <FormField
          control={form.control}
          name="pricing_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Venda *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="one_time">Compra Única</SelectItem>
                  <SelectItem value="subscription">Assinatura Recorrente</SelectItem>
                  <SelectItem value="free">Gratuito</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price */}
        {watchedPricingType !== 'free' && (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Original Price */}
        {watchedPricingType !== 'free' && (
          <FormField
            control={form.control}
            name="original_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Original (riscado)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                    placeholder="Deixe vazio se não houver"
                    min={0}
                    step={0.01}
                  />
                </FormControl>
                <FormDescription>Exibe preço anterior com desconto</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Installments (one-time only) */}
        {watchedPricingType === 'one_time' && (
          <FormField
            control={form.control}
            name="max_installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Máximo de Parcelas</FormLabel>
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(parseInt(v))}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Subscription Interval */}
        {watchedPricingType === 'subscription' && (
          <FormField
            control={form.control}
            name="subscription_interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intervalo da Assinatura</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Guarantee */}
        <FormField
          control={form.control}
          name="guarantee_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Garantia</FormLabel>
              <Select value={String(field.value)} onValueChange={(v) => field.onChange(parseInt(v))}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GUARANTEE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Access Days */}
        <FormField
          control={form.control}
          name="access_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dias de Acesso</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                  placeholder="Vazio = acesso vitalício"
                  min={1}
                />
              </FormControl>
              <FormDescription>Deixe vazio para acesso vitalício</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Discount Preview */}
      {watchedPrice > 0 && watchedOriginalPrice && watchedOriginalPrice > watchedPrice && (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-green-500">
                Desconto de {Math.round((1 - watchedPrice / watchedOriginalPrice) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">
                Economia de R$ {(watchedOriginalPrice - watchedPrice).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Affiliate Free Toggle - only shows if affiliate enabled */}
      {watchedAffiliateEnabled && (
        <Separator className="my-4" />
      )}
      {watchedAffiliateEnabled && (
        <FormField
          control={form.control}
          name="affiliate_free"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-primary/5 border-primary/20">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Gratuito para Afiliados VIP
                </FormLabel>
                <FormDescription>
                  Afiliados VIP terão acesso gratuito a este produto. Ideal para materiais de apoio.
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
      )}

      {/* Affiliate Free Preview */}
      {watchedAffiliateFree && (
        <Card className="p-4 bg-primary/10 border-primary/30">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-primary">
                Produto Exclusivo para Afiliados VIP
              </p>
              <p className="text-sm text-muted-foreground">
                O preço será exibido como "GRÁTIS" com badge "Exclusivo Afiliados VIP"
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderStepContent = () => {
    // Common trailer/video field
    const renderTrailerField = () => (
      <Controller
        control={form.control}
        name="trailer_url"
        render={({ field }) => (
          <div className="space-y-3">
            <CloudFileUploader
              value={field.value || ''}
              onChange={field.onChange}
              accept="video/mp4,video/webm"
              label="Trailer / Vídeo de Apresentação"
              placeholder="https://youtube.com/... ou faça upload"
              folder="trailers"
            />
            {field.value && <VideoPreview url={field.value} />}
          </div>
        )}
      />
    );

    switch (watchedProductType) {
      case 'course':
        return (
          <div className="space-y-6">
            {renderTrailerField()}
            <Separator />
            {productId ? (
              <CourseModulesManager productId={productId} />
            ) : (
              <Card className="p-6 border-dashed">
                <div className="text-center text-muted-foreground">
                  <Video className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Gestão de Módulos e Aulas</p>
                  <p className="text-sm">Salve o produto primeiro para gerenciar módulos e aulas.</p>
                </div>
              </Card>
            )}
          </div>
        );

      case 'ebook':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Arquivos do Ebook
                </CardTitle>
                <CardDescription>Upload de PDF, EPUB, MOBI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={form.control}
                  name="download_url"
                  render={({ field }) => (
                    <CloudFileUploader
                      value={field.value || ''}
                      onChange={field.onChange}
                      accept=".pdf,.epub,.mobi"
                      label="Arquivo Principal"
                      placeholder="Faça upload do ebook"
                      folder="ebooks"
                    />
                  )}
                />
                
                <Controller
                  control={form.control}
                  name="preview_url"
                  render={({ field }) => (
                    <CloudFileUploader
                      value={field.value || ''}
                      onChange={field.onChange}
                      accept=".pdf"
                      label="Amostra Gratuita (Preview)"
                      placeholder="Primeiros capítulos para preview"
                      folder="ebooks/previews"
                    />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capítulos (opcional)</CardTitle>
                <CardDescription>Lista de capítulos para exibir na página de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <Controller
                  control={form.control}
                  name="chapters"
                  render={({ field }) => (
                    <div className="space-y-3">
                      {(field.value || []).map((chapter, index) => (
                        <div key={chapter.id} className="flex gap-2 items-center">
                          <Input
                            value={chapter.title}
                            onChange={(e) => {
                              const updated = [...(field.value || [])];
                              updated[index] = { ...updated[index], title: e.target.value };
                              field.onChange(updated);
                            }}
                            placeholder={`Capítulo ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              field.onChange((field.value || []).filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          field.onChange([
                            ...(field.value || []),
                            { id: generateId(), title: '', page: 0 }
                          ]);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Capítulo
                      </Button>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'mentoring':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Headphones className="w-5 h-5" />
                  Configuração da Mentoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="session_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Sessões</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            min={1}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="session_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração por Sessão (min)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            min={15}
                            step={15}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mentoring_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MENTORING_FORMATS.map((fmt) => (
                              <SelectItem key={fmt.value} value={fmt.value}>{fmt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="calendar_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link do Calendário (Calendly/Cal.com)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://calendly.com/..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label>Agendamento Automático</Label>
                    <p className="text-xs text-muted-foreground">Permitir que alunos agendem sessões automaticamente</p>
                  </div>
                  <Controller
                    control={form.control}
                    name="auto_scheduling"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'live_event':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Configuração do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="event_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Evento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="event_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="event_platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plataforma</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EVENT_PLATFORMS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="event_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link de Acesso</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://zoom.us/..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label>Gravação Disponível Após</Label>
                    <p className="text-xs text-muted-foreground">Disponibilizar gravação do evento para participantes</p>
                  </div>
                  <Controller
                    control={form.control}
                    name="recording_available"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Arquivos para Download
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={form.control}
                  name="download_url"
                  render={({ field }) => (
                    <CloudFileUploader
                      value={field.value || ''}
                      onChange={field.onChange}
                      accept=".zip,.rar,.exe,.dmg,.pkg"
                      label="Arquivo Principal"
                      placeholder="Upload do arquivo (ZIP, RAR, etc.)"
                      folder="software"
                    />
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="license_key_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template de Chave de Licença</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="XXXX-XXXX-XXXX-XXXX" />
                      </FormControl>
                      <FormDescription>Use X para caracteres aleatórios</FormDescription>
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label>Gerar Licença Automaticamente</Label>
                    <p className="text-xs text-muted-foreground">Criar chave única para cada comprador</p>
                  </div>
                  <Controller
                    control={form.control}
                    name="auto_generate_license"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="installation_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instruções de Instalação</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} placeholder="Passo a passo para instalação..." />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'combo':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Produtos Incluídos no Combo
                </CardTitle>
                <CardDescription>Selecione os produtos que farão parte deste pacote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={form.control}
                  name="included_products"
                  render={({ field }) => (
                    <div className="space-y-3">
                      {availableProducts?.length === 0 ? (
                        <Card className="p-4 border-dashed text-center text-muted-foreground">
                          <p>Nenhum produto disponível para combo</p>
                          <p className="text-sm">Crie e publique outros produtos primeiro</p>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availableProducts?.map((product) => {
                            const isSelected = (field.value || []).includes(product.id);
                            return (
                              <Card
                                key={product.id}
                                className={cn(
                                  "p-3 cursor-pointer transition-all hover:border-primary",
                                  isSelected && "border-primary bg-primary/5"
                                )}
                                onClick={() => {
                                  const current = field.value || [];
                                  if (isSelected) {
                                    field.onChange(current.filter(id => id !== product.id));
                                  } else {
                                    field.onChange([...current, product.id]);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                                    {product.cover_image_url ? (
                                      <img src={product.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-5 h-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      R$ {product.price.toFixed(2)}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                      
                      {(field.value || []).length > 0 && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium">
                            {(field.value || []).length} produto(s) selecionado(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="combo_discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto do Combo (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          min={0}
                          max={100}
                        />
                      </FormControl>
                      <FormDescription>Desconto aplicado no valor total dos produtos</FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepSalesPage = () => {
    if (productId) {
      return <SalesPageEditor productId={productId} />;
    }
    
    return (
      <div className="space-y-6">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Dica</p>
              <p className="text-sm text-muted-foreground">
                Configure sua página de vendas agora. Ao publicar, ela estará disponível em:{' '}
                <code className="bg-muted px-1 rounded">/produto/{form.watch('slug') || '[slug]'}</code>
              </p>
            </div>
          </div>
        </Card>

        {/* Template Selection */}
        <FormField
          control={form.control}
          name="sales_page_template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template da Página</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="classic">Clássico - Simples e direto</SelectItem>
                  <SelectItem value="modern">Moderno - Com vídeo em destaque</SelectItem>
                  <SelectItem value="minimal">Minimalista - Foco no conteúdo</SelectItem>
                  <SelectItem value="professional">Profissional - Para cursos e mentorias</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Testimonials */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Depoimentos</CardTitle>
                <CardDescription>Adicione depoimentos de clientes</CardDescription>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const current = form.getValues('testimonials') || [];
                  form.setValue('testimonials', [
                    ...current,
                    { id: generateId(), name: '', text: '', avatar: '', role: '' }
                  ]);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="testimonials"
              render={({ field }) => (
                <div className="space-y-3">
                  {(field.value || []).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum depoimento adicionado</p>
                    </div>
                  ) : (
                    (field.value || []).map((testimonial, index) => (
                      <Card key={testimonial.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Nome</Label>
                                <Input
                                  value={testimonial.name}
                                  onChange={(e) => {
                                    const updated = [...(field.value || [])];
                                    updated[index] = { ...updated[index], name: e.target.value };
                                    field.onChange(updated);
                                  }}
                                  placeholder="Maria Silva"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Cargo (opcional)</Label>
                                <Input
                                  value={testimonial.role || ''}
                                  onChange={(e) => {
                                    const updated = [...(field.value || [])];
                                    updated[index] = { ...updated[index], role: e.target.value };
                                    field.onChange(updated);
                                  }}
                                  placeholder="CEO, Empresa XYZ"
                                />
                              </div>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="ml-2"
                              onClick={() => {
                                field.onChange((field.value || []).filter((_, i) => i !== index));
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs">Depoimento</Label>
                            <Textarea
                              value={testimonial.text}
                              onChange={(e) => {
                                const updated = [...(field.value || [])];
                                updated[index] = { ...updated[index], text: e.target.value };
                                field.onChange(updated);
                              }}
                              placeholder="Este produto mudou minha vida..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Perguntas Frequentes (FAQ)</CardTitle>
                <CardDescription>Responda dúvidas comuns dos compradores</CardDescription>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const current = form.getValues('faq') || [];
                  form.setValue('faq', [
                    ...current,
                    { id: generateId(), question: '', answer: '' }
                  ]);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="faq"
              render={({ field }) => (
                <div className="space-y-3">
                  {(field.value || []).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma pergunta adicionada</p>
                    </div>
                  ) : (
                    (field.value || []).map((item, index) => (
                      <Card key={item.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Label className="text-xs">Pergunta</Label>
                              <Input
                                value={item.question}
                                onChange={(e) => {
                                  const updated = [...(field.value || [])];
                                  updated[index] = { ...updated[index], question: e.target.value };
                                  field.onChange(updated);
                                }}
                                placeholder="Como funciona o acesso?"
                              />
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              className="ml-2"
                              onClick={() => {
                                field.onChange((field.value || []).filter((_, i) => i !== index));
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs">Resposta</Label>
                            <Textarea
                              value={item.answer}
                              onChange={(e) => {
                                const updated = [...(field.value || [])];
                                updated[index] = { ...updated[index], answer: e.target.value };
                                field.onChange(updated);
                              }}
                              placeholder="Após a compra, você receberá acesso imediato..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Publish Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label>Publicar página de vendas imediatamente</Label>
            <p className="text-xs text-muted-foreground">
              Se ativado, a página estará acessível assim que o produto for publicado
            </p>
          </div>
          <Controller
            control={form.control}
            name="sales_page_published"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>
    );
  };

  const renderStepAffiliates = () => {
    if (productId) {
      return <AffiliateSettingsPanel productId={productId} />;
    }
    
    return (
      <div className="space-y-6">
        {/* Permitir Afiliados */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label className="text-base">Permitir Afiliados</Label>
            <p className="text-sm text-muted-foreground">
              Afiliados poderão promover este produto e ganhar comissões
            </p>
          </div>
          <Controller
            control={form.control}
            name="affiliate_enabled"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        {form.watch('affiliate_enabled') && (
          <>
            {/* Grátis para Afiliados VIP - NOVA OPÇÃO */}
            <Card className="p-4 border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">Grátis para Afiliados VIP</Label>
                    <Badge variant="secondary" className="text-xs">Exclusivo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Afiliados VIP terão acesso gratuito ao produto. O preço permanece visível para clientes normais comprarem.
                  </p>
                  {watchedAffiliateFree && watchedPrice > 0 && (
                    <div className="mt-2 p-2 bg-green-500/10 rounded-md">
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Afiliados VIP: Acesso gratuito | Clientes: R$ {watchedPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                <Controller
                  control={form.control}
                  name="affiliate_free"
                  render={({ field }) => (
                    <Switch 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-green-500"
                    />
                  )}
                />
              </div>
            </Card>

            {/* Comissão */}
            <FormField
              control={form.control}
              name="affiliate_commission_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão para Afiliados (%)</FormLabel>
                  <div className="flex items-center gap-4">
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={100}
                        className="w-32"
                      />
                    </FormControl>
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <FormDescription>
                    Comissão padrão. Você pode definir taxas personalizadas por afiliado depois.
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Cálculo de comissão com simulador */}
            {watchedPrice > 0 && !watchedAffiliateFree && (
              <div className="space-y-4">
                <Card className="p-4 bg-green-500/10 border-green-500/30">
                  <p className="text-sm text-green-600">
                    O afiliado receberá <strong>R$ {(watchedPrice * watchedCommissionRate / 100).toFixed(2)}</strong> por venda 
                    ({watchedCommissionRate}% de R$ {watchedPrice.toFixed(2)})
                  </p>
                </Card>
                
                <AffiliateEarningsSimulator
                  price={watchedPrice}
                  commissionRate={watchedCommissionRate}
                />
              </div>
            )}

            {/* Materiais */}
            <Card className="p-6 border-dashed">
              <div className="text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Materiais de Divulgação</p>
                <p className="text-sm">Salve o produto primeiro para acessar o painel completo de afiliados com comissões por nível e materiais.</p>
              </div>
            </Card>
          </>
        )}
      </div>
    );
  };

  const renderStepReview = () => {
    const data = form.getValues();
    const productTypeInfo = PRODUCT_TYPES.find(t => t.value === data.product_type);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold">Revisão Final</p>
              <p className="text-sm text-muted-foreground">
                Confira todas as informações antes de salvar ou publicar seu produto.
              </p>
            </div>
          </div>
        </Card>

        {/* Review Checklist & Multi-Device Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ReviewChecklist
            data={{
              name: data.name,
              shortDescription: data.short_description,
              description: data.description,
              coverImage: data.cover_image_url,
              price: data.price,
              pricingType: data.pricing_type,
              productType: data.product_type,
              tags: data.tags,
              guaranteeDays: data.guarantee_days,
              affiliateEnabled: data.affiliate_enabled,
              commissionRate: data.affiliate_commission_rate,
              salesPagePublished: data.sales_page_published,
              trailerUrl: data.trailer_url,
            }}
          />
          <div className="xl:col-span-2">
            {productId && data.slug && (
              <MultiDevicePreview
                slug={data.slug}
                status={data.status}
              />
            )}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{data.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">{productTypeInfo?.label || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug:</span>
                <code className="text-xs bg-muted px-1 rounded">{data.slug || '-'}</code>
              </div>
              {data.cover_image_url && (
                <img src={data.cover_image_url} alt="" className="w-full h-24 object-cover rounded mt-2" />
              )}
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Preço e Oferta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="secondary">
                  {data.pricing_type === 'free' ? 'Gratuito' : 
                   data.pricing_type === 'subscription' ? 'Assinatura' : 'Compra Única'}
                </Badge>
              </div>
              {data.pricing_type !== 'free' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Preço:</span>
                    <span className="font-bold text-lg text-primary">
                      R$ {data.price.toFixed(2)}
                    </span>
                  </div>
                  {data.original_price && data.original_price > data.price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">De:</span>
                      <span className="line-through text-muted-foreground">
                        R$ {data.original_price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {data.pricing_type === 'one_time' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parcelas:</span>
                      <span>Até {data.max_installments}x</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Garantia:</span>
                <span>{data.guarantee_days ? `${data.guarantee_days} dias` : 'Sem garantia'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Affiliates Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Afiliados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={data.affiliate_enabled ? 'default' : 'secondary'}>
                  {data.affiliate_enabled ? 'Habilitado' : 'Desabilitado'}
                </Badge>
              </div>
              {data.affiliate_enabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comissão:</span>
                    <span className="font-medium">{data.affiliate_commission_rate}%</span>
                  </div>
                  {data.price > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor/venda:</span>
                      <span className="text-green-500 font-medium">
                        R$ {(data.price * data.affiliate_commission_rate / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Sales Page Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Página de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template:</span>
                <span className="capitalize">{data.sales_page_template}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={data.sales_page_published ? 'default' : 'secondary'}>
                  {data.sales_page_published ? 'Publicada' : 'Rascunho'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depoimentos:</span>
                <span>{(data.testimonials || []).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FAQs:</span>
                <span>{(data.faq || []).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ============= Main Render =============
  const renderCurrentStep = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'basic': return renderStepBasicInfo();
      case 'pricing': return renderStepPricing();
      case 'content': return renderStepContent();
      case 'salespage': return renderStepSalesPage();
      case 'affiliates': return renderStepAffiliates();
      case 'review': return renderStepReview();
      default: return null;
    }
  };

  // Track when product is first loaded to prevent showing loading on refetches
  useEffect(() => {
    if (existingProduct || !productId) {
      setHasLoadedOnce(true);
    }
  }, [existingProduct, productId]);
  
  // Show loading state ONLY on initial load, not on refetches
  // Once product is loaded, never show loading again (prevents flicker during module/lesson operations)
  if (loadingProduct && !hasLoadedOnce) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-3 text-muted-foreground">Carregando produto...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option - don't auto-close
  if (productError && productId) {
    console.error('[Wizard] Error state:', productError);
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Card className="max-w-md p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-semibold text-lg mb-2">Erro ao carregar produto</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {(productError as Error).message || 'Não foi possível carregar o produto. Verifique sua conexão.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => refetchProduct()}>
              <Loader2 className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r bg-card p-4 lg:p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">{productId ? 'Editar' : 'Criar'} Produto</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fechar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{currentStep + 1}/{WIZARD_STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <nav className="hidden lg:block space-y-1">
          {WIZARD_STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                  isActive && "bg-primary/10 text-primary",
                  !isActive && "hover:bg-muted"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-green-500 text-white",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>
                <div className="overflow-hidden">
                  <p className={cn(
                    "font-medium text-sm truncate",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Mobile Steps Indicator */}
        <div className="flex lg:hidden gap-1 overflow-x-auto pb-2">
          {WIZARD_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(index)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                index === currentStep && "bg-primary text-primary-foreground",
                index < currentStep && "bg-green-500/20 text-green-500",
                index > currentStep && "bg-muted text-muted-foreground"
              )}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Form {...form}>
          <form className="flex-1 flex flex-col overflow-hidden">
            {/* Step Header with Status Bar */}
            <div className="p-4 lg:p-6 border-b bg-card/50">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {(() => {
                      const StepIcon = WIZARD_STEPS[currentStep].icon;
                      return <StepIcon className="w-5 h-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{WIZARD_STEPS[currentStep].label}</h3>
                    <p className="text-sm text-muted-foreground">{WIZARD_STEPS[currentStep].description}</p>
                  </div>
                </div>
                
                {/* Status indicators */}
                <div className="flex items-center gap-3">
                  {/* Auto-save indicator */}
                  {productId && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {hasUnsavedChanges ? (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Alterações pendentes
                        </Badge>
                      ) : lastAutoSave ? (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Salvo {lastAutoSave.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Preview Button */}
                  {productId && form.getValues('slug') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className={cn(showPreview && "bg-primary/10")}
                          >
                            <Monitor className="w-4 h-4 mr-1" />
                            {showPreview ? 'Ocultar' : 'Preview'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Visualizar página de vendas ao vivo</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Refresh Button */}
                  {productId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={forceRefresh}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Atualizar dados (Realtime ativo)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>

            {/* Content Area with Optional Preview */}
            <div className="flex-1 flex overflow-hidden">
              {/* Step Content */}
              <div className={cn(
                "flex-1 overflow-y-auto p-4 lg:p-6 transition-all",
                showPreview && "lg:w-1/2"
              )}>
                <div className="max-w-4xl mx-auto">
                  {renderCurrentStep()}
                </div>
              </div>
              
              {/* Live Preview Panel */}
              {showPreview && productId && form.getValues('slug') && (
                <div className="hidden lg:flex w-1/2 border-l bg-muted/30 flex-col">
                  <div className="p-3 border-b bg-background flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Preview ao Vivo
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
                          if (iframe) iframe.src = iframe.src;
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Recarregar
                      </Button>
                      <a
                        href={form.getValues('status') === 'published' 
                          ? `/produto/${form.getValues('slug')}` 
                          : `/preview/${form.getValues('slug')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {form.getValues('status') === 'published' ? 'Ver página' : 'Preview'}
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 p-2">
                    <iframe
                      id="preview-iframe"
                      src={form.getValues('status') === 'published' 
                        ? `/produto/${form.getValues('slug')}` 
                        : `/preview/${form.getValues('slug')}`}
                      className="w-full h-full rounded-lg border bg-background shadow-inner"
                      title="Preview da página de vendas"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 lg:p-6 border-t bg-card/50">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goPrev}
                    disabled={!canGoPrev}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goNext}
                    disabled={!canGoNext}
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => saveMutation.mutate({ publish: false })}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Salvar Rascunho
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Salvar como rascunho (não publicado)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={() => saveMutation.mutate({ publish: true })}
                          disabled={isSaving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          )}
                          Publicar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Salvar e publicar o produto</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* Close Button - only manual close */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            if (hasUnsavedChanges) {
                              if (confirm('Você tem alterações não salvas. Deseja realmente fechar?')) {
                                onClose();
                              }
                            } else {
                              onClose();
                            }
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Fechar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Fechar wizard (não fecha automaticamente ao salvar)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
