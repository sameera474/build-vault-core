-- Add 'client_admin' to the app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'client_admin' 
    AND enumtypid = 'app_role'::regtype
  ) THEN
    ALTER TYPE app_role ADD VALUE 'client_admin';
  END IF;
END $$;