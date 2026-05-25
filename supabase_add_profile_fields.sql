-- Add new profile fields to user_profiles table
-- Adds: website, linkedin_url, photo_path for better CV generation

-- Add website column
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Add linkedin_url column
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);

-- Add photo_path column (stores path to uploaded profile photo in Supabase storage)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS photo_path VARCHAR(500);

-- Add comment documenting the new fields
COMMENT ON COLUMN public.user_profiles.website IS 'URL to professional website or portfolio';
COMMENT ON COLUMN public.user_profiles.linkedin_url IS 'URL to LinkedIn profile';
COMMENT ON COLUMN public.user_profiles.photo_path IS 'Path to profile photo in storage (optional)';
