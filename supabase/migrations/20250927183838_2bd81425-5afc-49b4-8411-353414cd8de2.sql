-- Extend projects table for contractor/client/consultant information
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS contractor_name text,
  ADD COLUMN IF NOT EXISTS contractor_logo text,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS client_logo text,
  ADD COLUMN IF NOT EXISTS consultant_name text,
  ADD COLUMN IF NOT EXISTS consultant_logo text,
  ADD COLUMN IF NOT EXISTS project_prefix text NOT NULL DEFAULT 'PU2',
  ADD COLUMN IF NOT EXISTS region_code text NOT NULL DEFAULT 'R1',
  ADD COLUMN IF NOT EXISTS lab_code text NOT NULL DEFAULT 'LAB',
  ADD COLUMN IF NOT EXISTS contract_number text;

-- Create project_roads table
CREATE TABLE IF NOT EXISTS public.project_roads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_roads ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_roads
CREATE POLICY "Users can view their company project roads" 
ON public.project_roads 
FOR SELECT 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can create project roads for their company" 
ON public.project_roads 
FOR INSERT 
WITH CHECK (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their company project roads" 
ON public.project_roads 
FOR UPDATE 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their company project roads" 
ON public.project_roads 
FOR DELETE 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Extend test_reports table for new numbering system
ALTER TABLE public.test_reports
  ADD COLUMN IF NOT EXISTS doc_code text,
  ADD COLUMN IF NOT EXISTS yymmdd text,
  ADD COLUMN IF NOT EXISTS seq int,
  ADD COLUMN IF NOT EXISTS gps_latitude decimal,
  ADD COLUMN IF NOT EXISTS gps_longitude decimal,
  ADD COLUMN IF NOT EXISTS weather_conditions text,
  ADD COLUMN IF NOT EXISTS site_conditions text,
  ADD COLUMN IF NOT EXISTS time_of_test time,
  ADD COLUMN IF NOT EXISTS road_offset text,
  ADD COLUMN IF NOT EXISTS technician_id text;

-- Create unique indexes for report numbering
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_number_company
  ON public.test_reports(company_id, report_number);

CREATE UNIQUE INDEX IF NOT EXISTS uq_seq_key_project
  ON public.test_reports(company_id, project_id, doc_code, yymmdd, seq);

-- Create function to allocate next report number
CREATE OR REPLACE FUNCTION public.allocate_report_number(
  _company uuid, 
  _project uuid, 
  _doc_code text, 
  _date date
) 
RETURNS TABLE(report_number text, yymmdd text, seq int, project_prefix text, region_code text, lab_code text)
LANGUAGE plpgsql 
AS $$
DECLARE 
  v_d text := to_char(_date, 'YYMMDD');
  v_seq int;
  v_pref text; 
  v_reg text; 
  v_lab text;
BEGIN
  -- Get project prefix and codes
  SELECT p.project_prefix, p.region_code, p.lab_code
    INTO v_pref, v_reg, v_lab
  FROM public.projects p 
  WHERE p.id = _project AND p.company_id = _company;

  IF v_pref IS NULL THEN 
    RAISE EXCEPTION 'Project not found or missing prefix'; 
  END IF;

  -- Get next sequence number
  SELECT COALESCE(MAX(tr.seq), 0) + 1 INTO v_seq
  FROM public.test_reports tr
  WHERE tr.company_id = _company 
    AND tr.project_id = _project 
    AND tr.doc_code = _doc_code 
    AND tr.yymmdd = v_d;

  -- Return complete report number and components
  RETURN QUERY SELECT 
    format('%s-%s-%s-%s-%s-%s', v_pref, v_reg, v_lab, _doc_code, v_d, LPAD(v_seq::text, 2, '0')), 
    v_d, 
    v_seq,
    v_pref,
    v_reg,
    v_lab;
END $$;

-- Create test_doc_codes lookup table
CREATE TABLE IF NOT EXISTS public.test_doc_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  material_type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert test doc codes
INSERT INTO public.test_doc_codes (code, name, material_type, description) VALUES
  ('AGGSA', 'Sieve Analysis (Fine/Coarse Aggregates)', 'Aggregates', 'Particle size distribution analysis'),
  ('AL', 'Atterberg Limits', 'Soil', 'Liquid limit and plastic limit tests'),
  ('PRO', 'Proctor Compaction', 'Soil', 'Standard or modified Proctor compaction test'),
  ('CBR', 'CBR', 'Soil', 'California Bearing Ratio test'),
  ('AIV', 'Aggregate Impact Value', 'Aggregates', 'Impact resistance of aggregates'),
  ('FI', 'Shape Index (Flakiness)', 'Aggregates', 'Flakiness index test'),
  ('EI', 'Shape Index (Elongation)', 'Aggregates', 'Elongation index test'),
  ('WA', 'Water Absorption', 'Aggregates', 'Water absorption of aggregates'),
  ('LAAV', 'Los Angeles Abrasion Value', 'Aggregates', 'Abrasion resistance test'),
  ('FAGGSG', 'Bulk Specific Gravity (Fine)', 'Aggregates', 'Specific gravity of fine aggregates'),
  ('CAGGSG', 'Bulk Specific Gravity (Coarse)', 'Aggregates', 'Specific gravity of coarse aggregates'),
  ('SCDCSD', 'Clay Silt Dust Fraction', 'Aggregates', 'Clay, silt and dust content'),
  ('ACV', 'Aggregate Crushing Value', 'Aggregates', 'Crushing strength of aggregates'),
  ('BD', 'Bulk Density', 'Aggregates', 'Bulk density test'),
  ('CSC', 'Compressive Strength of Concrete', 'Concrete', 'Concrete cube compression test'),
  ('FD', 'Field Density', 'Soil', 'Field density test using sand cone or other methods'),
  ('SRB', 'Spread Rate of Binder', 'Asphalt', 'Binder application rate test'),
  ('DSC', 'Unit Weight/Density of Sand Cone', 'Soil', 'Sand cone density calibration'),
  ('ALR', 'Asphalt Laying Record', 'Asphalt', 'Asphalt laying temperature and conditions'),
  ('ACDC', 'Asphalt Core Density & Compaction', 'Asphalt', 'Core density and compaction degree'),
  ('DCP', 'DCP Field Test', 'Soil', 'Dynamic Cone Penetrometer test'),
  ('QE', 'Quantitative Extraction', 'Asphalt', 'Binder content extraction'),
  ('IG', 'Individual Gradations', 'Aggregates', 'Individual sieve analysis'),
  ('MDA', 'Hot Mix Design – Asphalt Wearing Course', 'Asphalt', 'Marshall mix design test')
ON CONFLICT (code) DO NOTHING;

-- Make test_doc_codes publicly readable
ALTER TABLE public.test_doc_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view test doc codes" 
ON public.test_doc_codes 
FOR SELECT 
USING (true);

-- Add tenant role enum if not exists
DO $$ BEGIN
    CREATE TYPE public.tenant_role AS ENUM ('admin', 'project_manager', 'quality_manager', 'material_engineer', 'technician', 'consultant_engineer', 'consultant_technician');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table to use tenant_role enum
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_role public.tenant_role DEFAULT 'technician';

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;