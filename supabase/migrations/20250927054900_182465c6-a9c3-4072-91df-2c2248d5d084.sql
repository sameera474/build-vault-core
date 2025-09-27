-- Create templates table for customizable report templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'test_report',
  fields JSONB NOT NULL DEFAULT '{}',
  calculations JSONB DEFAULT '{}',
  charts JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Excel-like spreadsheet data table
CREATE TABLE public.spreadsheet_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.test_reports(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id),
  cell_data JSONB NOT NULL DEFAULT '{}',
  formulas JSONB DEFAULT '{}',
  charts JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '[]',
  max_users INTEGER,
  max_reports INTEGER,
  max_storage_gb INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company subscriptions table  
CREATE TABLE public.company_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chainage data table for bar charts
CREATE TABLE public.chainage_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  chainage DECIMAL(10,2) NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL,
  test_value DECIMAL(10,4) NOT NULL,
  specification_min DECIMAL(10,4),
  specification_max DECIMAL(10,4),
  compliance_status TEXT NOT NULL DEFAULT 'pending',
  test_date DATE NOT NULL,
  technician_name TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chainage_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for templates
CREATE POLICY "Users can view their company templates" 
ON public.templates 
FOR SELECT 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can create templates for their company" 
ON public.templates 
FOR INSERT 
WITH CHECK (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their company templates" 
ON public.templates 
FOR UPDATE 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their company templates" 
ON public.templates 
FOR DELETE 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create RLS policies for spreadsheet data
CREATE POLICY "Users can view their company spreadsheet data" 
ON public.spreadsheet_data 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.test_reports tr 
  WHERE tr.id = spreadsheet_data.report_id 
  AND tr.company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
));

CREATE POLICY "Users can create spreadsheet data for their reports" 
ON public.spreadsheet_data 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.test_reports tr 
  WHERE tr.id = spreadsheet_data.report_id 
  AND tr.company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
));

CREATE POLICY "Users can update their company spreadsheet data" 
ON public.spreadsheet_data 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.test_reports tr 
  WHERE tr.id = spreadsheet_data.report_id 
  AND tr.company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
));

-- Create RLS policies for subscription plans (public read)
CREATE POLICY "Everyone can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Create RLS policies for company subscriptions
CREATE POLICY "Users can view their company subscription" 
ON public.company_subscriptions 
FOR SELECT 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their company subscription" 
ON public.company_subscriptions 
FOR UPDATE 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create RLS policies for chainage points
CREATE POLICY "Users can view their company chainage points" 
ON public.chainage_points 
FOR SELECT 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can create chainage points for their company" 
ON public.chainage_points 
FOR INSERT 
WITH CHECK (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their company chainage points" 
ON public.chainage_points 
FOR UPDATE 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their company chainage points" 
ON public.chainage_points 
FOR DELETE 
USING (company_id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Add super admin role to profiles
ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;

-- Create triggers for updated_at columns
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spreadsheet_data_updated_at
BEFORE UPDATE ON public.spreadsheet_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_subscriptions_updated_at
BEFORE UPDATE ON public.company_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chainage_points_updated_at
BEFORE UPDATE ON public.chainage_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_reports, max_storage_gb) VALUES
('Starter', 'Perfect for small teams', 29.99, 299.99, '["Basic Reports", "5 Templates", "Email Support"]', 5, 100, 10),
('Professional', 'For growing construction companies', 79.99, 799.99, '["Advanced Analytics", "Unlimited Templates", "Priority Support", "Excel Export", "Custom Branding"]', 25, 1000, 100),
('Enterprise', 'For large organizations', 199.99, 1999.99, '["Everything in Professional", "Super Admin Dashboard", "API Access", "Custom Integrations", "Dedicated Support"]', 100, 10000, 1000);

-- Insert default templates
INSERT INTO public.templates (company_id, name, description, template_type, fields, calculations, charts, is_default) VALUES
('00000000-0000-0000-0000-000000000000', 'Concrete Compression Test', 'Standard concrete compression test template', 'test_report', '{"specimen_id": "text", "test_date": "date", "load_at_failure": "number", "compressive_strength": "formula"}', '{"compressive_strength": "load_at_failure / cross_sectional_area"}', '{"strength_chart": {"type": "bar", "data": "compressive_strength"}}', true),
('00000000-0000-0000-0000-000000000000', 'Steel Tensile Test', 'Standard steel tensile test template', 'test_report', '{"specimen_id": "text", "test_date": "date", "ultimate_load": "number", "yield_strength": "number", "tensile_strength": "formula"}', '{"tensile_strength": "ultimate_load / original_area"}', '{"stress_strain": {"type": "line", "x_axis": "strain", "y_axis": "stress"}}', true);