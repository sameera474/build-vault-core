-- Add approved_by field to test_reports table to track who approved/rejected the report
ALTER TABLE public.test_reports 
ADD COLUMN approved_by uuid REFERENCES auth.users(id);

-- Add approved_at timestamp to track when the approval/rejection happened
ALTER TABLE public.test_reports 
ADD COLUMN approved_at timestamp with time zone;

-- Add index for better query performance
CREATE INDEX idx_test_reports_approved_by ON public.test_reports(approved_by);

COMMENT ON COLUMN public.test_reports.approved_by IS 'User ID of the person who approved or rejected the report';
COMMENT ON COLUMN public.test_reports.approved_at IS 'Timestamp when the report was approved or rejected';