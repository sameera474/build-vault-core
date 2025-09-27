-- Create team_invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for team invitations
CREATE POLICY "Users can view their company invitations"
ON public.team_invitations 
FOR SELECT 
USING (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create invitations for their company"
ON public.team_invitations 
FOR INSERT 
WITH CHECK (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company invitations"
ON public.team_invitations 
FOR UPDATE 
USING (
  company_id = (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_team_invitations_company_id ON public.team_invitations(company_id);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(invitation_token);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);