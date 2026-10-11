-- Add new columns to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS persons_of_interest TEXT;

-- Update the updated_at column to auto-update on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
