-- ============================================================
-- SECURITY FIXES + CERTIFICATES TABLE + LINKEDIN FIELDS
-- v4.2.0 Complete Implementation (Fixed)
-- ============================================================

-- ============================================================
-- 1. FIX RLS on withdrawals table - use correct columns
-- ============================================================

DROP POLICY IF EXISTS "withdrawals_select_own" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_insert_own" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_update_admin" ON public.withdrawals;

-- Users see withdrawals linked to their affiliate account or requested by them
CREATE POLICY "withdrawals_select_own" ON public.withdrawals 
FOR SELECT USING (
  auth.uid() = requested_by OR 
  affiliate_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Users can only insert their own (linked to their affiliate)
CREATE POLICY "withdrawals_insert_own" ON public.withdrawals 
FOR INSERT WITH CHECK (
  auth.uid() = requested_by OR
  affiliate_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid())
);

-- Only admins can update (for approval/rejection)
CREATE POLICY "withdrawals_update_admin" ON public.withdrawals 
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 2. CREATE generated_certificates table for PDF tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.generated_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  course_certificate_id UUID REFERENCES course_certificates(id) ON DELETE SET NULL,
  template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT DEFAULT 'system',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'failed', 'revoked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.generated_certificates ENABLE ROW LEVEL SECURITY;

-- Policies for generated_certificates
DROP POLICY IF EXISTS "generated_certs_select_own" ON public.generated_certificates;
DROP POLICY IF EXISTS "generated_certs_insert_system" ON public.generated_certificates;
DROP POLICY IF EXISTS "generated_certs_update_admin" ON public.generated_certificates;

CREATE POLICY "generated_certs_select_own" ON public.generated_certificates
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "generated_certs_insert_system" ON public.generated_certificates
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "generated_certs_update_admin" ON public.generated_certificates
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_generated_certs_user ON public.generated_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_certs_product ON public.generated_certificates(product_id);

-- ============================================================
-- 3. TRIGGER to generate certificate record after simulator pass
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_certificate_after_simulator_pass()
RETURNS TRIGGER AS $$
DECLARE
  _product_id UUID;
  _template_id UUID;
  _existing_cert UUID;
BEGIN
  -- Only trigger on pass
  IF NEW.passed = true AND (OLD IS NULL OR OLD.passed IS DISTINCT FROM true) THEN
    -- Get product_id from simulator
    SELECT product_id INTO _product_id 
    FROM public.exam_simulators 
    WHERE id = NEW.simulator_id;
    
    IF _product_id IS NOT NULL THEN
      -- Check if certificate already exists
      SELECT id INTO _existing_cert
      FROM public.generated_certificates
      WHERE user_id = NEW.user_id AND product_id = _product_id;
      
      -- Only create if doesn't exist
      IF _existing_cert IS NULL THEN
        -- Get default template
        SELECT id INTO _template_id 
        FROM public.certificate_templates 
        WHERE is_default = true 
        LIMIT 1;
        
        -- Insert pending certificate
        INSERT INTO public.generated_certificates (
          user_id, 
          product_id, 
          template_id, 
          status,
          metadata
        ) VALUES (
          NEW.user_id,
          _product_id,
          _template_id,
          'pending',
          jsonb_build_object(
            'simulator_id', NEW.simulator_id,
            'score', NEW.score,
            'attempt_id', NEW.id
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_generate_certificate_on_pass ON public.simulator_attempts;
CREATE TRIGGER trigger_generate_certificate_on_pass
AFTER INSERT OR UPDATE ON public.simulator_attempts
FOR EACH ROW
EXECUTE FUNCTION public.generate_certificate_after_simulator_pass();