-- Add new project fields for comprehensive project management
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS contract_number TEXT,
ADD COLUMN IF NOT EXISTS contractor_name TEXT,
ADD COLUMN IF NOT EXISTS contractor_logo TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_logo TEXT,
ADD COLUMN IF NOT EXISTS consultant_name TEXT,
ADD COLUMN IF NOT EXISTS consultant_logo TEXT;

-- Update default values for prefix and codes
ALTER TABLE public.projects 
ALTER COLUMN project_prefix SET DEFAULT 'PU2',
ALTER COLUMN region_code SET DEFAULT 'R1',
ALTER COLUMN lab_code SET DEFAULT 'LAB';

-- Create project_roles table for role assignments
CREATE TABLE IF NOT EXISTS public.project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('project_manager', 'quality_manager', 'materials_engineer', 'technician', 'consultant')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(project_id, user_id, role)
);

-- Enable RLS on project_roles
ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_roles
CREATE POLICY "Users can view their company project roles"
ON public.project_roles FOR SELECT
USING (company_id = (
  SELECT company_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create project roles for their company"
ON public.project_roles FOR INSERT
WITH CHECK (company_id = (
  SELECT company_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their company project roles"
ON public.project_roles FOR UPDATE
USING (company_id = (
  SELECT company_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their company project roles"
ON public.project_roles FOR DELETE
USING (company_id = (
  SELECT company_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Create updated_at trigger for project_roles
CREATE TRIGGER project_roles_updated_at
  BEFORE UPDATE ON public.project_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update storage policies for logos bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for logos bucket
DROP POLICY IF EXISTS "Company users can upload logos" ON storage.objects;
CREATE POLICY "Company users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Company users can view their logos" ON storage.objects;
CREATE POLICY "Company users can view their logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Company users can update their logos" ON storage.objects;
CREATE POLICY "Company users can update their logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Company users can delete their logos" ON storage.objects;
CREATE POLICY "Company users can delete their logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);