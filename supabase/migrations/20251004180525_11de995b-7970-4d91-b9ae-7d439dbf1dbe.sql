-- Add 'supervisor' to the tenant_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'supervisor' 
    AND enumtypid = 'tenant_role'::regtype
  ) THEN
    ALTER TYPE tenant_role ADD VALUE 'supervisor';
  END IF;
END $$;