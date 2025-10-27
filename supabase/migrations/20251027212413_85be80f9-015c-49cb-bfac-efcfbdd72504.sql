-- Create construction_layers table for managing layer definitions
CREATE TABLE IF NOT EXISTS public.construction_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_layer_name_per_company UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.construction_layers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company layers"
  ON public.construction_layers FOR SELECT
  USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create layers for their company"
  ON public.construction_layers FOR INSERT
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company layers"
  ON public.construction_layers FOR UPDATE
  USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company layers"
  ON public.construction_layers FOR DELETE
  USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_construction_layers_updated_at
  BEFORE UPDATE ON public.construction_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Insert default layers for existing companies
INSERT INTO public.construction_layers (company_id, name, display_order, color, created_by)
SELECT 
  c.id as company_id,
  layer_data.name,
  layer_data.display_order,
  layer_data.color,
  (SELECT user_id FROM public.profiles WHERE company_id = c.id LIMIT 1) as created_by
FROM public.companies c
CROSS JOIN (
  VALUES
    ('CLEARING', 1, '#8B4513'),
    ('EXCAVATION', 2, '#A0522D'),
    ('SUB GRADE', 3, '#CD853F'),
    ('SHOULDER S.G.', 4, '#DEB887'),
    ('EMB LAYER 1', 5, '#F4A460'),
    ('EMB LAYER2', 6, '#D2691E'),
    ('EMB LAYER3', 7, '#FF8C00'),
    ('EMB LAYER4', 8, '#FFA500'),
    ('EMB LAYER5', 9, '#FFB347'),
    ('SB 1 LAYER', 10, '#808080'),
    ('SB 2 LAYER', 11, '#A9A9A9'),
    ('ABC 1ST', 12, '#4169E1'),
    ('ABC TOP', 13, '#1E90FF'),
    ('PRIME', 14, '#000000'),
    ('TACK C.', 15, '#2F4F4F'),
    ('WEARING', 16, '#DC143C'),
    ('SHO EMB 1', 17, '#FFD700'),
    ('SHO EMB 2', 18, '#FFA500'),
    ('SHOULDER', 19, '#DAA520')
) AS layer_data(name, display_order, color)
WHERE c.is_active = true
ON CONFLICT (company_id, name) DO NOTHING;