import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import type { Json } from '@/integrations/supabase/types';

interface AuditLogParams {
  action: string;
  targetTable?: string;
  targetId?: string;
  details?: Json;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (params: AuditLogParams): Promise<void> => {
    const { action, targetTable, targetId, details } = params;

    try {
      await supabase.from('admin_audit_log').insert([{
        admin_id: user?.id || null,
        action,
        target_table: targetTable || null,
        target_id: targetId || null,
        details: details || null,
        ip_address: null
      }]);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const logDocumentGeneration = async (params: {
    documentType: 'certificate' | 'transcript' | 'report';
    documentId?: string;
    documentNumber?: string;
    recipientName?: string;
    recipientEmail?: string;
    productId?: string;
    metadata?: Json;
  }): Promise<void> => {
    const { documentType, documentId, documentNumber, recipientName, recipientEmail, productId, metadata } = params;

    try {
      await supabase.from('document_logs').insert([{
        user_id: user?.id || null,
        document_type: documentType,
        document_id: documentId || null,
        document_number: documentNumber || null,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        product_id: productId || null,
        metadata: metadata || null,
        status: 'generated'
      }]);
    } catch (error) {
      console.error('Error logging document generation:', error);
    }
  };

  return { logAction, logDocumentGeneration };
}
