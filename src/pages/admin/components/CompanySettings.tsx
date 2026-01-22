import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Building, MapPin, Phone, Mail, Globe, Upload, Save, 
  User, FileSignature, Palette, Award, Image, Search, 
  HelpCircle, AlertTriangle, CheckCircle, Loader2, Plus, Trash2,
  FileText
} from 'lucide-react';
import { MaskedInput } from '@/components/ui/masked-input';
import { useCepLookup } from '@/hooks/useCepLookup';
import { useAuditLog } from '@/hooks/useAuditLog';
import { 
  companySettingsSchema, 
  isValidCNPJ, 
  formatCNPJ, 
  formatCEP, 
  formatPhone, 
  formatCPF 
} from '@/lib/validators/company.schema';
import { isValidCPF } from '@/lib/validators/common';

interface CompanyData {
  id?: string;
  company_name: string;
  legal_name: string;
  cnpj: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  legal_representative_name: string;
  legal_representative_cpf: string;
  legal_representative_role: string;
  legal_representative_signature_url: string;
  academic_coordinator_name: string;
  academic_coordinator_role: string;
  academic_coordinator_signature_url: string;
  certificate_template: string;
  certificate_footer_text: string;
  certificate_template_id?: string;
  transcript_template_id?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const initialData: CompanyData = {
  company_name: '',
  legal_name: '',
  cnpj: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  address_country: 'Brasil',
  phone: '',
  email: '',
  website: '',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  primary_color: '#3b82f6',
  secondary_color: '#10b981',
  legal_representative_name: '',
  legal_representative_cpf: '',
  legal_representative_role: '',
  legal_representative_signature_url: '',
  academic_coordinator_name: '',
  academic_coordinator_role: '',
  academic_coordinator_signature_url: '',
  certificate_template: 'modern',
  certificate_footer_text: ''
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const CompanySettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CompanyData>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const { lookupCep, loading: lookingUpCep } = useCepLookup();
  const { logAction } = useAuditLog();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoDarkInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const legalSignatureRef = useRef<HTMLInputElement>(null);
  const academicSignatureRef = useRef<HTMLInputElement>(null);

  // Fetch certificate templates
  const { data: certTemplates } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('certificate_templates')
        .select('id, name, is_default')
        .eq('is_active', true)
        .order('name');
      return data || [];
    }
  });

  // Fetch transcript templates
  const { data: transcriptTemplates } = useQuery({
    queryKey: ['transcript-templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transcript_templates')
        .select('id, name, is_default')
        .eq('is_active', true)
        .order('name');
      return data || [];
    }
  });

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    setLoading(true);
    try {
      const { data: companyData, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (companyData) {
        setData(companyData as CompanyData);
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'cnpj':
        if (value && !isValidCNPJ(value)) return 'CNPJ inválido';
        break;
      case 'legal_representative_cpf':
        if (value && !isValidCPF(value)) return 'CPF inválido';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        break;
      case 'address_zip':
        if (value && !/^\d{5}-?\d{3}$/.test(value)) return 'CEP inválido';
        break;
    }
    return null;
  };

  const handleFieldChange = (field: keyof CompanyData, value: string) => {
    // Apply formatting
    let formattedValue = value;
    if (field === 'cnpj') formattedValue = formatCNPJ(value);
    else if (field === 'address_zip') formattedValue = formatCEP(value);
    else if (field === 'phone') formattedValue = formatPhone(value);
    else if (field === 'legal_representative_cpf') formattedValue = formatCPF(value);

    setData(prev => ({ ...prev, [field]: formattedValue }));

    // Validate
    const error = validateField(field, formattedValue);
    setErrors(prev => {
      if (error) return { ...prev, [field]: error };
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleCepLookup = async () => {
    const address = await lookupCep(data.address_zip);
    if (address) {
      setData(prev => ({
        ...prev,
        address_street: address.street,
        address_complement: address.complement,
        address_neighborhood: address.neighborhood,
        address_city: address.city,
        address_state: address.state
      }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate required field
    if (!data.company_name.trim()) {
      toast.error('Nome da empresa é obrigatório');
      setErrors(prev => ({ ...prev, company_name: 'Obrigatório' }));
      return;
    }

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    setSaving(true);

    try {
      const isUpdate = !!data.id;
      
      if (isUpdate) {
        const { error } = await supabase
          .from('company_settings')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', data.id);

        if (error) throw error;
        
        // Log the update action
        await logAction({
          action: 'company_settings_updated',
          targetTable: 'company_settings',
          targetId: data.id,
          details: { company_name: data.company_name }
        });
      } else {
        const { data: newData, error } = await supabase
          .from('company_settings')
          .insert({
            ...data,
            updated_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        if (newData) {
          setData(newData as CompanyData);
          
          // Log the create action
          await logAction({
            action: 'company_settings_created',
            targetTable: 'company_settings',
            targetId: newData.id,
            details: { company_name: data.company_name }
          });
        }
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof CompanyData
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo: 2MB');
      return;
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PNG, JPG ou WebP');
      return;
    }

    setUploadingField(field);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `company/${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('admin-files')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('admin-files')
        .getPublicUrl(fileName);

      setData(prev => ({ ...prev, [field]: urlData.publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingField(null);
    }
  };

  const FieldTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações da Empresa</h2>
          <p className="text-muted-foreground">
            Configure as informações da empresa para certificados e documentos
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || Object.keys(errors).length > 0}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Existem {Object.keys(errors).length} campo(s) com erro. Corrija antes de salvar.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="legal">Responsáveis</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
              <CardDescription>
                Dados básicos da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Nome Fantasia *
                    <FieldTooltip content="Nome comercial da empresa que aparecerá nos documentos" />
                  </Label>
                  <Input
                    value={data.company_name}
                    onChange={(e) => handleFieldChange('company_name', e.target.value)}
                    placeholder="Nome da empresa"
                    className={errors.company_name ? 'border-destructive' : ''}
                  />
                  {errors.company_name && (
                    <p className="text-xs text-destructive">{errors.company_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Razão Social
                    <FieldTooltip content="Nome registrado oficialmente no CNPJ" />
                  </Label>
                  <Input
                    value={data.legal_name}
                    onChange={(e) => handleFieldChange('legal_name', e.target.value)}
                    placeholder="Razão social completa"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    CNPJ
                    <FieldTooltip content="Formato: 00.000.000/0000-00" />
                  </Label>
                  <div className="relative">
                    <Input
                      value={data.cnpj}
                      onChange={(e) => handleFieldChange('cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className={errors.cnpj ? 'border-destructive pr-8' : 'pr-8'}
                    />
                    {data.cnpj && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        {isValidCNPJ(data.cnpj) ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                  {errors.cnpj && (
                    <p className="text-xs text-destructive">{errors.cnpj}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefone
                    <FieldTooltip content="Formato: (XX) XXXXX-XXXX" />
                  </Label>
                  <Input
                    value={data.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> E-mail
                  </Label>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="contato@empresa.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Website
                </Label>
                <Input
                  value={data.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  placeholder="https://www.empresa.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
              <CardDescription>
                Endereço completo da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    CEP
                    <FieldTooltip content="Digite o CEP e clique na lupa para buscar o endereço" />
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={data.address_zip}
                      onChange={(e) => handleFieldChange('address_zip', e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className={`flex-1 ${errors.address_zip ? 'border-destructive' : ''}`}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={handleCepLookup}
                      disabled={lookingUpCep || data.address_zip.replace(/\D/g, '').length !== 8}
                    >
                      {lookingUpCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.address_zip && (
                    <p className="text-xs text-destructive">{errors.address_zip}</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Rua/Avenida</Label>
                  <Input
                    value={data.address_street}
                    onChange={(e) => handleFieldChange('address_street', e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={data.address_number}
                    onChange={(e) => handleFieldChange('address_number', e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={data.address_complement}
                    onChange={(e) => handleFieldChange('address_complement', e.target.value)}
                    placeholder="Sala, Andar, etc."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Bairro</Label>
                  <Input
                    value={data.address_neighborhood}
                    onChange={(e) => handleFieldChange('address_neighborhood', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={data.address_city}
                    onChange={(e) => handleFieldChange('address_city', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={data.address_state}
                    onChange={(e) => handleFieldChange('address_state', e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input
                    value={data.address_country}
                    onChange={(e) => handleFieldChange('address_country', e.target.value)}
                    placeholder="Brasil"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Identidade Visual
              </CardTitle>
              <CardDescription>
                Logos e cores da empresa (máx. 2MB por imagem)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logos */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <Label>Logo Principal</Label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors relative"
                    onClick={() => !uploadingField && logoInputRef.current?.click()}
                  >
                    {uploadingField === 'logo_url' && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    {data.logo_url ? (
                      <img src={data.logo_url} alt="Logo" className="max-h-24 mx-auto" />
                    ) : (
                      <div className="py-8">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Clique para enviar</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'logo_url')}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Logo (Modo Escuro)</Label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors bg-gray-900 relative"
                    onClick={() => !uploadingField && logoDarkInputRef.current?.click()}
                  >
                    {uploadingField === 'logo_dark_url' && (
                      <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    {data.logo_dark_url ? (
                      <img src={data.logo_dark_url} alt="Logo Dark" className="max-h-24 mx-auto" />
                    ) : (
                      <div className="py-8">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-400">Clique para enviar</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={logoDarkInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'logo_dark_url')}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Favicon</Label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors relative"
                    onClick={() => !uploadingField && faviconInputRef.current?.click()}
                  >
                    {uploadingField === 'favicon_url' && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    {data.favicon_url ? (
                      <img src={data.favicon_url} alt="Favicon" className="h-16 w-16 mx-auto" />
                    ) : (
                      <div className="py-8">
                        <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">32x32 ou 64x64</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/x-icon"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'favicon_url')}
                  />
                </div>
              </div>

              <Separator />

              {/* Colors */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Cor Primária</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={data.primary_color}
                      onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                      className="h-12 w-12 rounded cursor-pointer"
                    />
                    <Input
                      value={data.primary_color}
                      onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Cor Secundária</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={data.secondary_color}
                      onChange={(e) => handleFieldChange('secondary_color', e.target.value)}
                      className="h-12 w-12 rounded cursor-pointer"
                    />
                    <Input
                      value={data.secondary_color}
                      onChange={(e) => handleFieldChange('secondary_color', e.target.value)}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Tab */}
        <TabsContent value="legal">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Responsável Legal
                </CardTitle>
                <CardDescription>
                  Representante legal da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={data.legal_representative_name}
                    onChange={(e) => handleFieldChange('legal_representative_name', e.target.value)}
                    placeholder="Nome do representante"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    CPF
                    <FieldTooltip content="Formato: 000.000.000-00" />
                  </Label>
                  <div className="relative">
                    <Input
                      value={data.legal_representative_cpf}
                      onChange={(e) => handleFieldChange('legal_representative_cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={errors.legal_representative_cpf ? 'border-destructive pr-8' : 'pr-8'}
                    />
                    {data.legal_representative_cpf && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        {isValidCPF(data.legal_representative_cpf) ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                  {errors.legal_representative_cpf && (
                    <p className="text-xs text-destructive">{errors.legal_representative_cpf}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={data.legal_representative_role}
                    onChange={(e) => handleFieldChange('legal_representative_role', e.target.value)}
                    placeholder="Ex: Diretor Executivo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Assinatura Digital
                    <FieldTooltip content="Envie uma imagem PNG com fundo transparente da assinatura" />
                  </Label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors relative"
                    onClick={() => !uploadingField && legalSignatureRef.current?.click()}
                  >
                    {uploadingField === 'legal_representative_signature_url' && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    {data.legal_representative_signature_url ? (
                      <img 
                        src={data.legal_representative_signature_url} 
                        alt="Assinatura" 
                        className="max-h-16 mx-auto"
                      />
                    ) : (
                      <div className="py-4">
                        <FileSignature className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Enviar assinatura (PNG)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={legalSignatureRef}
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'legal_representative_signature_url')}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Coordenador Acadêmico
                </CardTitle>
                <CardDescription>
                  Responsável acadêmico (para certificados)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={data.academic_coordinator_name}
                    onChange={(e) => handleFieldChange('academic_coordinator_name', e.target.value)}
                    placeholder="Nome do coordenador"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo/Título</Label>
                  <Input
                    value={data.academic_coordinator_role}
                    onChange={(e) => handleFieldChange('academic_coordinator_role', e.target.value)}
                    placeholder="Ex: Coordenador Pedagógico"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Assinatura Digital
                    <FieldTooltip content="Envie uma imagem PNG com fundo transparente da assinatura" />
                  </Label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors relative"
                    onClick={() => !uploadingField && academicSignatureRef.current?.click()}
                  >
                    {uploadingField === 'academic_coordinator_signature_url' && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    {data.academic_coordinator_signature_url ? (
                      <img 
                        src={data.academic_coordinator_signature_url} 
                        alt="Assinatura" 
                        className="max-h-16 mx-auto"
                      />
                    ) : (
                      <div className="py-4">
                        <FileSignature className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Enviar assinatura (PNG)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={academicSignatureRef}
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'academic_coordinator_signature_url')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Configurações de Certificados e Históricos
              </CardTitle>
              <CardDescription>
                Configurações padrão para geração de certificados e históricos escolares
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Certificate Template Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Template de Certificado
                  </Label>
                  <Select
                    value={data.certificate_template_id || ''}
                    onValueChange={(value) => setData(p => ({ ...p, certificate_template_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {certTemplates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} {template.is_default && '(Padrão)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Template usado na geração de certificados de conclusão
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Template de Histórico Escolar
                  </Label>
                  <Select
                    value={data.transcript_template_id || ''}
                    onValueChange={(value) => setData(p => ({ ...p, transcript_template_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {transcriptTemplates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} {template.is_default && '(Padrão)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Template usado na geração de históricos escolares
                  </p>
                </div>
              </div>

              <Separator />

              {/* Legacy template selection (visual) */}
              <div className="space-y-4">
                <Label>Estilo Visual (Legado)</Label>
                <div className="grid grid-cols-3 gap-4">
                  {['modern', 'classic', 'minimal'].map((template) => (
                    <motion.div
                      key={template}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setData(p => ({ ...p, certificate_template: template }))}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        data.certificate_template === template 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="aspect-[4/3] bg-muted rounded mb-3 flex items-center justify-center">
                        <Award className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium capitalize text-center">{template}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texto de Rodapé do Certificado</Label>
                <Textarea
                  value={data.certificate_footer_text}
                  onChange={(e) => handleFieldChange('certificate_footer_text', e.target.value)}
                  placeholder="Texto que aparecerá no rodapé de todos os certificados..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: "Este certificado é válido em todo território nacional conforme Lei XXX"
                </p>
              </div>

              <Separator />

              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2">Preview do Certificado</h4>
                <div className="aspect-[16/9] bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className="h-full flex flex-col items-center justify-between py-6 px-8 text-center">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      {data.logo_url ? (
                        <img src={data.logo_url} alt="Logo" className="h-10" />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: data.primary_color }}
                        >
                          <Award className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <span className="text-sm font-medium" style={{ color: data.primary_color }}>
                        {data.company_name || 'Nome da Empresa'}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Certificado de Conclusão</p>
                      <h3 className="text-lg font-bold" style={{ color: data.primary_color }}>
                        Nome do Aluno
                      </h3>
                      <p className="text-xs text-gray-600">
                        Concluiu com sucesso o curso<br />
                        <strong>Nome do Curso</strong>
                      </p>
                    </div>
                    
                    {/* Signatures */}
                    <div className="flex justify-center gap-12">
                      <div className="text-center">
                        {data.legal_representative_signature_url && (
                          <img 
                            src={data.legal_representative_signature_url} 
                            alt="Assinatura" 
                            className="h-6 mx-auto mb-1"
                          />
                        )}
                        <div className="w-20 border-t border-gray-400 mb-1" />
                        <p className="text-[10px] text-gray-500">
                          {data.legal_representative_name || 'Responsável Legal'}
                        </p>
                      </div>
                      <div className="text-center">
                        {data.academic_coordinator_signature_url && (
                          <img 
                            src={data.academic_coordinator_signature_url} 
                            alt="Assinatura" 
                            className="h-6 mx-auto mb-1"
                          />
                        )}
                        <div className="w-20 border-t border-gray-400 mb-1" />
                        <p className="text-[10px] text-gray-500">
                          {data.academic_coordinator_name || 'Coordenador'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanySettings;
