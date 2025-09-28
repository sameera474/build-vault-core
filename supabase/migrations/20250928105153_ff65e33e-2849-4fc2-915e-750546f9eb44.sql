-- Add delete policy for team invitations
CREATE POLICY "Users can delete their company invitations" 
ON public.team_invitations
FOR DELETE
USING (company_id = (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));