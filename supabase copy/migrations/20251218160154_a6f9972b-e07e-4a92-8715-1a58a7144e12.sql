-- Create trigger to automatically create enrollments when orders are marked as paid
-- This ensures customers who pay via Stripe, PIX, or any gateway get course access

CREATE OR REPLACE FUNCTION public.create_enrollments_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  access_days_val INTEGER;
  expires_at_val TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
    -- Only create enrollments if there's a user_id
    IF NEW.user_id IS NOT NULL THEN
      FOR item IN 
        SELECT oi.product_id, p.access_days 
        FROM public.order_items oi 
        JOIN public.products p ON p.id = oi.product_id 
        WHERE oi.order_id = NEW.id
      LOOP
        -- Calculate expiration date if access_days is set
        IF item.access_days IS NOT NULL THEN
          expires_at_val := now() + (item.access_days || ' days')::INTERVAL;
        ELSE
          expires_at_val := NULL;
        END IF;
        
        -- Insert or update enrollment
        INSERT INTO public.enrollments (user_id, product_id, order_id, status, enrolled_at, expires_at)
        VALUES (NEW.user_id, item.product_id, NEW.id, 'active'::enrollment_status, now(), expires_at_val)
        ON CONFLICT (user_id, product_id) DO UPDATE 
        SET order_id = EXCLUDED.order_id,
            status = 'active'::enrollment_status,
            enrolled_at = now(),
            expires_at = EXCLUDED.expires_at,
            updated_at = now();
            
        RAISE NOTICE '[Enrollment Trigger] Created/updated enrollment for user % product %', NEW.user_id, item.product_id;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_create_enrollments_on_payment ON public.orders;

-- Create new trigger
CREATE TRIGGER trg_create_enrollments_on_payment
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_enrollments_on_payment();

-- Add unique constraint on enrollments if not exists (needed for ON CONFLICT)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'enrollments_user_product_unique'
  ) THEN
    ALTER TABLE public.enrollments 
    ADD CONSTRAINT enrollments_user_product_unique UNIQUE (user_id, product_id);
  END IF;
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;