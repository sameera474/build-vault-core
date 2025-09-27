-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_reports table
CREATE TABLE public.test_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  report_number TEXT NOT NULL,
  test_type TEXT NOT NULL,
  material_type TEXT,
  test_date DATE NOT NULL,
  technician_name TEXT,
  results JSONB,
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'pass', 'fail', 'review_required')),
  notes TEXT,
  file_path TEXT, -- Reference to storage file
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, report_number)
);

-- Enable RLS on both tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Users can view their company projects"
ON public.projects 
FOR SELECT 
USING (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create projects for their company"
ON public.projects 
FOR INSERT 
WITH CHECK (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company projects"
ON public.projects 
FOR UPDATE 
USING (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company projects"
ON public.projects 
FOR DELETE 
USING (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- RLS policies for test_reports
CREATE POLICY "Users can view their company test reports"
ON public.test_reports 
FOR SELECT 
USING (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create test reports for their company"
ON public.test_reports 
FOR INSERT 
WITH CHECK (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company test reports"
ON public.test_reports 
FOR UPDATE 
USING (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company test reports"
ON public.test_reports 
FOR DELETE 
USING (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_reports_updated_at
BEFORE UPDATE ON public.test_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_test_reports_company_id ON public.test_reports(company_id);
CREATE INDEX idx_test_reports_project_id ON public.test_reports(project_id);
CREATE INDEX idx_test_reports_test_date ON public.test_reports(test_date);
CREATE INDEX idx_test_reports_compliance_status ON public.test_reports(compliance_status);