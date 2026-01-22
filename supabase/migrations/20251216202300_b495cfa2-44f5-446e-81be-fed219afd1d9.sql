-- Add affiliate_id column to pix_transactions for tracking affiliate activation payments
ALTER TABLE pix_transactions ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES vip_affiliates(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pix_transactions_affiliate_id ON pix_transactions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_tipo ON pix_transactions(tipo);