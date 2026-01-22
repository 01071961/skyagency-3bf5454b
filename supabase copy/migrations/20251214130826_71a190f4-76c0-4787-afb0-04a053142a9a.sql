-- Create settings table for AI assistant configuration
CREATE TABLE public.ai_assistant_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ai_assistant_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "Admins can manage AI settings"
  ON public.ai_assistant_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read settings (for chat to check if AI is enabled)
CREATE POLICY "Anyone can read AI settings"
  ON public.ai_assistant_settings
  FOR SELECT
  USING (true);

-- Insert default setting for AI assistant
INSERT INTO public.ai_assistant_settings (setting_key, setting_value)
VALUES ('chat_ai_enabled', '{"enabled": true}'::jsonb);