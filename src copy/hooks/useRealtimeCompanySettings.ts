import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanySettingsData {
  id: string;
  company_name: string;
  legal_name?: string | null;
  cnpj?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  address_country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  logo_dark_url?: string | null;
  favicon_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  legal_representative_name?: string | null;
  legal_representative_cpf?: string | null;
  legal_representative_role?: string | null;
  legal_representative_signature_url?: string | null;
  academic_coordinator_name?: string | null;
  academic_coordinator_role?: string | null;
  academic_coordinator_signature_url?: string | null;
  certificate_template?: string | null;
  certificate_footer_text?: string | null;
  additional_signatories?: any[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const DEFAULT_SETTINGS: Partial<CompanySettingsData> = {
  company_name: 'SKY Brasil Academy',
  primary_color: '#3b82f6',
  secondary_color: '#10b981',
  address_country: 'Brasil',
  certificate_template: 'modern',
};

export function useRealtimeCompanySettings() {
  const [settings, setSettings] = useState<CompanySettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings(data as CompanySettingsData);
      } else {
        // Return default settings if none exist
        setSettings({
          id: '',
          ...DEFAULT_SETTINGS,
        } as CompanySettingsData);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching company settings:', err);
      setError(err.message);
      // Still provide defaults on error
      setSettings({
        id: '',
        ...DEFAULT_SETTINGS,
      } as CompanySettingsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('company-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_settings',
        },
        (payload) => {
          console.log('Company settings updated:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSettings(payload.new as CompanySettingsData);
          } else if (payload.eventType === 'DELETE') {
            setSettings({
              id: '',
              ...DEFAULT_SETTINGS,
            } as CompanySettingsData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refresh = () => {
    fetchSettings();
  };

  return {
    settings,
    loading,
    error,
    refresh,
  };
}
