-- Add is_retest and original_report_id fields to test_reports for tracking retests
ALTER TABLE public.test_reports 
ADD COLUMN IF NOT EXISTS is_retest BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_report_id UUID REFERENCES public.test_reports(id) ON DELETE SET NULL;

-- Create index for faster retest lookups
CREATE INDEX IF NOT EXISTS idx_test_reports_original_report_id ON public.test_reports(original_report_id) WHERE original_report_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_reports_is_retest ON public.test_reports(is_retest) WHERE is_retest = TRUE;