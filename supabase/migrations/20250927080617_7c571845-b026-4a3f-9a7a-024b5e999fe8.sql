-- Create enums for Phase-1
DO $$ BEGIN
  CREATE TYPE public.side_enum AS ENUM ('left','right','middle');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.material_enum AS ENUM ('soil','concrete','aggregates','asphalt','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status_enum AS ENUM ('draft','submitted','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Material categories table for custom user-defined categories
CREATE TABLE IF NOT EXISTS public.material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to test_reports for Phase-1
ALTER TABLE public.test_reports
  ADD COLUMN IF NOT EXISTS material material_enum,
  ADD COLUMN IF NOT EXISTS custom_material text,
  ADD COLUMN IF NOT EXISTS road_name text,
  ADD COLUMN IF NOT EXISTS chainage_from text,
  ADD COLUMN IF NOT EXISTS chainage_to text,
  ADD COLUMN IF NOT EXISTS side side_enum,
  ADD COLUMN IF NOT EXISTS laboratory_test_no text,
  ADD COLUMN IF NOT EXISTS covered_chainage text,
  ADD COLUMN IF NOT EXISTS road_offset text,
  ADD COLUMN IF NOT EXISTS status report_status_enum DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS data_json jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS summary_json jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS graphs_json jsonb DEFAULT '{}';

-- Update status to draft where null
UPDATE public.test_reports SET status = 'draft' WHERE status IS NULL;

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_categories_company ON public.material_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_project ON public.test_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_status ON public.test_reports(status);
CREATE INDEX IF NOT EXISTS idx_test_reports_material ON public.test_reports(material);

-- Enable RLS on material_categories
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for material_categories
CREATE POLICY "Users can view their company material categories"
ON public.material_categories FOR SELECT
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create material categories for their company"
ON public.material_categories FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company material categories"
ON public.material_categories FOR UPDATE
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company material categories"
ON public.material_categories FOR DELETE
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Add trigger for updated_at on material_categories
CREATE TRIGGER update_material_categories_updated_at
  BEFORE UPDATE ON public.material_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();