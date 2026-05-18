-- Add dedicated fields for Voice and Context components

ALTER TABLE career_components ADD COLUMN IF NOT EXISTS tone_keywords TEXT;
-- tone_keywords: comma-separated keywords describing tone/style (e.g., "direct, warm, analytical, storytelling-focused")
-- Used for Voice components

ALTER TABLE career_components ADD COLUMN IF NOT EXISTS related_terms TEXT;
-- related_terms: comma-separated related terms/products/concepts this explains
-- Used for Context components to link related ideas

-- Verify the schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'career_components'
ORDER BY ordinal_position;
