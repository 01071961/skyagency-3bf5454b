import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  layout: {
    style: string;
    borderColor: string;
    fontFamily: string;
    backgroundColor: string;
    accentColor: string;
    [key: string]: any;
  };
  preview_image_url: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TranscriptTemplate {
  id: string;
  name: string;
  description: string | null;
  layout: {
    style: string;
    showModuleDetails: boolean;
    showGrades: boolean;
    showHours: boolean;
    [key: string]: any;
  };
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCertificateTemplates() {
  const queryClient = useQueryClient();

  // Fetch certificate templates
  const { data: certificateTemplates, isLoading: loadingCertificates } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as CertificateTemplate[];
    }
  });

  // Fetch transcript templates
  const { data: transcriptTemplates, isLoading: loadingTranscripts } = useQuery({
    queryKey: ['transcript-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcript_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as TranscriptTemplate[];
    }
  });

  // Get default templates
  const defaultCertificateTemplate = certificateTemplates?.find(t => t.is_default);
  const defaultTranscriptTemplate = transcriptTemplates?.find(t => t.is_default);

  // Create certificate template
  const createCertificateTemplate = useMutation({
    mutationFn: async (data: Partial<CertificateTemplate>) => {
      const { error } = await supabase
        .from('certificate_templates')
        .insert({
          name: data.name || '',
          description: data.description,
          layout: data.layout as any,
          preview_image_url: data.preview_image_url,
          is_default: data.is_default,
          is_active: data.is_active
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast.success('Template de certificado criado!');
    },
    onError: (error) => {
      console.error('Create template error:', error);
      toast.error('Erro ao criar template');
    }
  });

  // Update certificate template
  const updateCertificateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CertificateTemplate> }) => {
      const { error } = await supabase
        .from('certificate_templates')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast.success('Template atualizado!');
    },
    onError: (error) => {
      console.error('Update template error:', error);
      toast.error('Erro ao atualizar template');
    }
  });

  // Set default certificate template
  const setDefaultCertificateTemplate = useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .neq('id', id);
      
      // Then set the new default
      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast.success('Template padrão atualizado!');
    }
  });

  // Create transcript template
  const createTranscriptTemplate = useMutation({
    mutationFn: async (data: Partial<TranscriptTemplate>) => {
      const { error } = await supabase
        .from('transcript_templates')
        .insert({
          name: data.name || '',
          description: data.description,
          layout: data.layout as any,
          is_default: data.is_default,
          is_active: data.is_active
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript-templates'] });
      toast.success('Template de histórico criado!');
    }
  });

  // Update transcript template
  const updateTranscriptTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TranscriptTemplate> }) => {
      const { error } = await supabase
        .from('transcript_templates')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript-templates'] });
      toast.success('Template atualizado!');
    }
  });

  // Set default transcript template
  const setDefaultTranscriptTemplate = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('transcript_templates')
        .update({ is_default: false })
        .neq('id', id);
      
      const { error } = await supabase
        .from('transcript_templates')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript-templates'] });
      toast.success('Template padrão atualizado!');
    }
  });

  return {
    // Certificate Templates
    certificateTemplates,
    loadingCertificates,
    defaultCertificateTemplate,
    createCertificateTemplate,
    updateCertificateTemplate,
    setDefaultCertificateTemplate,
    
    // Transcript Templates
    transcriptTemplates,
    loadingTranscripts,
    defaultTranscriptTemplate,
    createTranscriptTemplate,
    updateTranscriptTemplate,
    setDefaultTranscriptTemplate
  };
}
