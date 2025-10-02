-- Add first_name and last_name columns to user_invitations table
ALTER TABLE public.user_invitations
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN public.user_invitations.first_name IS 'First name of the invited user';
COMMENT ON COLUMN public.user_invitations.last_name IS 'Last name of the invited user';

