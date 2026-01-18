-- Migration: Add dataset synchronization support
-- Date: 2026-01-17
-- Description: Adds columns for Google Sheets synchronization to private_datasets and public_datasets tables

-- Add columns to private_datasets
ALTER TABLE private_datasets
  ADD COLUMN IF NOT EXISTS is_synced boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_config jsonb DEFAULT NULL;

-- Add columns to public_datasets
ALTER TABLE public_datasets
  ADD COLUMN IF NOT EXISTS is_synced boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_config jsonb DEFAULT NULL;

-- Create indexes for better query performance on synced datasets
CREATE INDEX IF NOT EXISTS idx_private_datasets_synced
  ON private_datasets(is_synced)
  WHERE is_synced = true;

CREATE INDEX IF NOT EXISTS idx_public_datasets_synced
  ON public_datasets(is_synced)
  WHERE is_synced = true;

-- Add comments to document the new columns
COMMENT ON COLUMN private_datasets.is_synced IS 'Indicates if this dataset is synchronized with an external source (Google Sheets)';
COMMENT ON COLUMN private_datasets.sync_config IS 'JSON configuration for dataset synchronization including spreadsheetId, sheetName, syncInterval, lastSyncAt, etc.';

COMMENT ON COLUMN public_datasets.is_synced IS 'Indicates if this dataset is synchronized with an external source (Google Sheets)';
COMMENT ON COLUMN public_datasets.sync_config IS 'JSON configuration for dataset synchronization including spreadsheetId, sheetName, syncInterval, lastSyncAt, etc.';

-- Example sync_config structure:
-- {
--   "spreadsheetId": "1ABC...",
--   "sheetName": "Sheet1",
--   "syncInterval": 10,
--   "isPaused": false,
--   "lastSyncAt": "2026-01-17T10:30:00Z",
--   "lastSyncStatus": "success",
--   "lastSyncError": null,
--   "sheetColumns": ["nombre", "monto", "fecha"],
--   "localColumns": ["categoria", "notas"],
--   "lastRowSynced": 150
-- }
