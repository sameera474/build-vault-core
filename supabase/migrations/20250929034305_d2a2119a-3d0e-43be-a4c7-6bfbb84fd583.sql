-- Add foreign key relationship between projects and companies
ALTER TABLE public.projects 
ADD CONSTRAINT fk_projects_company_id 
FOREIGN KEY (company_id) 
REFERENCES public.companies(id) 
ON DELETE CASCADE;