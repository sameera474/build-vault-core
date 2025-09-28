-- Add unique constraint to prevent duplicate pending invitations
-- Simplified constraint without time comparison
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_invitations_company_email_pending
ON public.team_invitations (company_id, email)
WHERE accepted_at IS NULL;