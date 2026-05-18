-- Add location field for role components

ALTER TABLE career_components ADD COLUMN IF NOT EXISTS primary_location TEXT;
-- primary_location: location of the role (e.g., "San Francisco, CA", "Remote", "Hybrid - London")
-- Used for Role components to indicate where the job is based

-- Verify the schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'career_components'
ORDER BY ordinal_position;
