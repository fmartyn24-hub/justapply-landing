-- Ensure all required columns exist in the applications table
-- This is safe to run multiple times

ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS persons_of_interest TEXT;

-- Verify the schema (view the table structure)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
ORDER BY ordinal_position;
