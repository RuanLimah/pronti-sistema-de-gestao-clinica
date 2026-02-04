
-- Add custom_limits column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_limits JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN clients.custom_limits IS 'Custom limits that override plan limits for specific clients';
