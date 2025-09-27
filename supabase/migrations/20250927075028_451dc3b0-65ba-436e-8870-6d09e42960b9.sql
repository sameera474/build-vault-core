-- First, let's see what values are currently allowed and fix the constraint
-- Drop the existing constraint if it exists
ALTER TABLE public.test_reports DROP CONSTRAINT IF EXISTS test_reports_compliance_status_check;

-- Add the correct constraint that allows the proper compliance status values
ALTER TABLE public.test_reports 
ADD CONSTRAINT test_reports_compliance_status_check 
CHECK (compliance_status IN ('pending', 'approved', 'rejected', 'in_review', 'completed'));