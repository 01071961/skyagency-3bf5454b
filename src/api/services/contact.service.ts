// Contact Service
import { supabase } from '@/integrations/supabase/client';
import type { ContactRequest, ContactResponse } from '../types';
import { ENDPOINTS } from '@/config';

export const contactService = {
  async submitContact(data: ContactRequest): Promise<ContactResponse> {
    const { data: response, error } = await supabase.functions.invoke(
      ENDPOINTS.contact.submit,
      { body: data }
    );

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem',
      };
    }

    return response as ContactResponse;
  },
};
