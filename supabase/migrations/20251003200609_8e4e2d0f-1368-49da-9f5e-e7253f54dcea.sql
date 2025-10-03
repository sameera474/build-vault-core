-- Add is_demo_user column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_demo_user boolean DEFAULT false;

-- Update existing demo users to mark them as demo users
UPDATE public.profiles 
SET is_demo_user = true 
WHERE email IN (
  'john.manager@alpha.com',
  'sarah.quality@alpha.com',
  'mike.tech@beta.com',
  'emily.admin@beta.com',
  'robert.supervisor@gamma.com'
);

-- Create index for faster demo user queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo_user 
ON public.profiles(is_demo_user) 
WHERE is_demo_user = true;