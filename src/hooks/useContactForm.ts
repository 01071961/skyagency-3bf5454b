import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContactFormData {
  name: string;
  email: string;
  userType?: string;
  message: string;
  source: "contact" | "vip";
  // Location fields
  city?: string;
  state?: string;
  // VIP specific fields
  channel?: string;
  platform?: string;
  followers?: string;
}

interface UseContactFormResult {
  submitForm: (data: ContactFormData) => Promise<{ success: boolean; message: string }>;
  isSubmitting: boolean;
  error: string | null;
}

export const useContactForm = (): UseContactFormResult => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForm = async (data: ContactFormData): Promise<{ success: boolean; message: string }> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: response, error: invokeError } = await supabase.functions.invoke(
        "submit-contact",
        {
          body: data,
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!response.success) {
        throw new Error(response.error || "Erro ao enviar mensagem");
      }

      return { success: true, message: response.message };
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao enviar mensagem. Tente novamente.";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitForm, isSubmitting, error };
};
