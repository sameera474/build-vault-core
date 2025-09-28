-- Update RLS policies for companies table to allow viewing all companies for authenticated users
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

-- Create new policy to allow authenticated users to view all companies
CREATE POLICY "Authenticated users can view all companies" 
ON companies 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Keep the existing update policy but only allow updating own company
-- Users can update their own company policy should remain unchanged