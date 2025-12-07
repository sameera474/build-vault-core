-- Enable RLS on construction_layers
ALTER TABLE public.construction_layers ENABLE ROW LEVEL SECURITY;

-- Allow users to view layers from their company or all layers for super admins
CREATE POLICY "Users can view construction layers"
ON public.construction_layers
FOR SELECT
USING (
  is_super_admin(auth.uid()) = true
  OR company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);

-- Allow company admins to insert layers
CREATE POLICY "Admins can insert construction layers"
ON public.construction_layers
FOR INSERT
WITH CHECK (
  company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);

-- Allow company admins to update their layers
CREATE POLICY "Admins can update construction layers"
ON public.construction_layers
FOR UPDATE
USING (
  company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);

-- Allow company admins to delete their layers
CREATE POLICY "Admins can delete construction layers"
ON public.construction_layers
FOR DELETE
USING (
  company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);