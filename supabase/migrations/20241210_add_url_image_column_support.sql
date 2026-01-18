-- Migration: Add support for URL and Image column types in datasets
-- This migration adds:
-- 1. type_metadata column for storing column-specific configuration
-- 2. Updated column type constraints to include url and image types
-- 3. Performance indexes for the new column types

-- Add type_metadata column for storing column-specific configuration
ALTER TABLE public_datasets
ADD COLUMN IF NOT EXISTS type_metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE private_datasets
ADD COLUMN IF NOT EXISTS type_metadata JSONB DEFAULT '{}'::jsonb;

-- Drop existing column type constraints if they exist
ALTER TABLE public_datasets
DROP CONSTRAINT IF EXISTS valid_column_types;

ALTER TABLE private_datasets
DROP CONSTRAINT IF EXISTS valid_column_types;

-- Add updated column type constraints to include url and image
ALTER TABLE public_datasets
ADD CONSTRAINT valid_column_types
CHECK (
  schema_definition IS NULL OR
  schema_definition::jsonb @@ '
    $[*].type ? (@ == "text" || @ == "number" || @ == "date" || @ == "integer" ||
                @ == "checkbox" || @ == "money" || @ == "location" ||
                @ == "actor" || @ == "entity" || @ == "company" ||
                @ == "url" || @ == "image" || @ == "boolean")
  '::jsonpath
);

ALTER TABLE private_datasets
ADD CONSTRAINT valid_column_types
CHECK (
  schema_definition IS NULL OR
  schema_definition::jsonb @@ '
    $[*].type ? (@ == "text" || @ == "number" || @ == "date" || @ == "integer" ||
                @ == "checkbox" || @ == "money" || @ == "location" ||
                @ == "actor" || @ == "entity" || @ == "company" ||
                @ == "url" || @ == "image" || @ == "boolean")
  '::jsonpath
);

-- Add indexes for better performance on new column types
CREATE INDEX IF NOT EXISTS idx_public_datasets_type_metadata
ON public_datasets USING gin (type_metadata);

CREATE INDEX IF NOT EXISTS idx_private_datasets_type_metadata
ON private_datasets USING gin (type_metadata);

-- Add indexes for datasets that contain URL columns
CREATE INDEX IF NOT EXISTS idx_public_datasets_url_columns
ON public_datasets USING gin (schema_definition)
WHERE schema_definition::jsonb @@ '$[*] ? (@.type == "url")'::jsonpath;

CREATE INDEX IF NOT EXISTS idx_private_datasets_url_columns
ON private_datasets USING gin (schema_definition)
WHERE schema_definition::jsonb @@ '$[*] ? (@.type == "url")'::jsonpath;

-- Add indexes for datasets that contain Image columns
CREATE INDEX IF NOT EXISTS idx_public_datasets_image_columns
ON public_datasets USING gin (schema_definition)
WHERE schema_definition::jsonb @@ '$[*] ? (@.type == "image")'::jsonpath;

CREATE INDEX IF NOT EXISTS idx_private_datasets_image_columns
ON private_datasets USING gin (schema_definition)
WHERE schema_definition::jsonb @@ '$[*] ? (@.type == "image")'::jsonpath;

-- Add comments for documentation
COMMENT ON COLUMN public_datasets.type_metadata IS 'Column-specific metadata for advanced types (validation rules, defaults, constraints for url, image, money, location, etc.)';
COMMENT ON COLUMN private_datasets.type_metadata IS 'Column-specific metadata for advanced types (validation rules, defaults, constraints for url, image, money, location, etc.)';

-- Update any existing datasets with the new type_metadata column default
UPDATE public_datasets
SET type_metadata = '{}'::jsonb
WHERE type_metadata IS NULL;

UPDATE private_datasets
SET type_metadata = '{}'::jsonb
WHERE type_metadata IS NULL;