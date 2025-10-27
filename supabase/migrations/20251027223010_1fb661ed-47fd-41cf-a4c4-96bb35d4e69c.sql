-- Create laboratory_inventory table
CREATE TABLE public.laboratory_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.laboratory_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for laboratory_inventory
CREATE POLICY "Users can view their company inventory"
ON public.laboratory_inventory
FOR SELECT
USING (company_id = (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create inventory for their company"
ON public.laboratory_inventory
FOR INSERT
WITH CHECK (company_id = (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their company inventory"
ON public.laboratory_inventory
FOR UPDATE
USING (company_id = (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their company inventory"
ON public.laboratory_inventory
FOR DELETE
USING (company_id = (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

-- Create index for better query performance
CREATE INDEX idx_laboratory_inventory_company ON public.laboratory_inventory(company_id);
CREATE INDEX idx_laboratory_inventory_project ON public.laboratory_inventory(project_id);