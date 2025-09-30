-- First, update any invalid compliance_status values to 'pending'
UPDATE public.test_reports 
SET compliance_status = 'pending' 
WHERE compliance_status NOT IN ('pending', 'pass', 'fail') OR compliance_status IS NULL;

-- Now drop the old constraint and add the new one
ALTER TABLE public.test_reports 
DROP CONSTRAINT IF EXISTS test_reports_compliance_status_check;

ALTER TABLE public.test_reports 
ADD CONSTRAINT test_reports_compliance_status_check 
CHECK (compliance_status IN ('pending', 'pass', 'fail'));