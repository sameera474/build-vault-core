-- Enable RLS on laboratory_inventory if not already enabled
ALTER TABLE public.laboratory_inventory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view inventory items from their company
CREATE POLICY "Users can view inventory from their company"
ON public.laboratory_inventory
FOR SELECT
USING (
  company_id = get_user_company_id_safe(auth.uid())
  OR is_super_admin(auth.uid()) = true
);

-- Policy: Users can insert inventory items for their company
CREATE POLICY "Users can insert inventory for their company"
ON public.laboratory_inventory
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id_safe(auth.uid())
  OR is_super_admin(auth.uid()) = true
);

-- Policy: Users can update inventory items from their company
CREATE POLICY "Users can update inventory from their company"
ON public.laboratory_inventory
FOR UPDATE
USING (
  company_id = get_user_company_id_safe(auth.uid())
  OR is_super_admin(auth.uid()) = true
);

-- Policy: Users can delete inventory items from their company
CREATE POLICY "Users can delete inventory from their company"
ON public.laboratory_inventory
FOR DELETE
USING (
  company_id = get_user_company_id_safe(auth.uid())
  OR is_super_admin(auth.uid()) = true
);