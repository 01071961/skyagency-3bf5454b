-- Add additional_signatories column to company_settings for multiple responsible persons
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS additional_signatories jsonb DEFAULT '[]'::jsonb;

-- Add document generation logs table
CREATE TABLE IF NOT EXISTS public.document_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  document_type text NOT NULL,
  document_id uuid,
  document_number text,
  recipient_name text,
  recipient_email text,
  product_id uuid REFERENCES public.products(id),
  metadata jsonb DEFAULT '{}',
  status text DEFAULT 'generated',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_logs ENABLE ROW LEVEL SECURITY;

-- Policies for document_logs
CREATE POLICY "Admins can view all document logs"
  ON public.document_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own document logs"
  ON public.document_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert document logs"
  ON public.document_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add comment for documentation
COMMENT ON TABLE public.document_logs IS 'Audit log for all generated documents (certificates, transcripts, etc.)';