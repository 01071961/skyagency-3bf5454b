-- Add DELETE policy for chat_messages (admins only)
CREATE POLICY "Admins can delete chat messages"
ON public.chat_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create automation_rules table for AI assistant automation
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'vip_lead', 'new_conversation', 'abandoned_form', 'low_rating', 'inactivity', 'keyword'
  trigger_config JSONB NOT NULL DEFAULT '{}', -- Configuration for the trigger (e.g., keywords, thresholds)
  action_type TEXT NOT NULL, -- 'send_email', 'assign_admin', 'add_tag', 'notify_slack', 'create_task'
  action_config JSONB NOT NULL DEFAULT '{}', -- Configuration for the action (e.g., template_id, admin_id)
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for automation_rules
CREATE POLICY "Admins can manage automation rules"
ON public.automation_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create automation_logs table to track rule executions
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB,
  action_result JSONB,
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'skipped'
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for automation_logs
CREATE POLICY "Admins can view automation logs"
ON public.automation_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert automation logs"
ON public.automation_logs
FOR INSERT
WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON public.automation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();