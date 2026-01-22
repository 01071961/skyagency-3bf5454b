-- Criar tabela para armazenar verificações de compliance
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('compliant', 'review_needed', 'non_compliant', 'pending')),
  notes TEXT,
  checked_by UUID REFERENCES auth.users(id),
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage compliance checks
CREATE POLICY "Admins can manage compliance checks"
  ON compliance_checks
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_compliance_checks_updated_at
  BEFORE UPDATE ON compliance_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();