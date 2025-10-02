-- Add photo_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.photo_url IS 'URL to user profile photo stored in profile-photos bucket';

