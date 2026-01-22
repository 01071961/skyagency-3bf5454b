// Contact form hook
import { useState } from 'react';
import { contactService } from '@/api/services';
import type { ContactRequest, ContactResponse } from '@/api/types';

export interface UseContactResult {
  submitForm: (data: ContactRequest) => Promise<ContactResponse>;
  isSubmitting: boolean;
  error: string | null;
}

export const useContact = (): UseContactResult => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForm = async (data: ContactRequest): Promise<ContactResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await contactService.submitContact(data);

      if (!result.success) {
        const errorMsg = result.error || 'Erro ao enviar mensagem';
        setError(errorMsg);
        return result;
      }

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem. Tente novamente.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitForm, isSubmitting, error };
};
