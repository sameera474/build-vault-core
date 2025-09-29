-- Fix the security definer view issue
-- Drop the existing view that was causing security concerns
DROP VIEW IF EXISTS companies_for_registration;

-- Recreate it as a regular view without SECURITY DEFINER
CREATE VIEW companies_for_registration AS
SELECT id, name, country, city, website, description
FROM companies 
WHERE is_active = true;