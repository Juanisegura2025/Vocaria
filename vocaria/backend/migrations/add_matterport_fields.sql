-- Migration: Add Matterport integration fields
-- Date: 2025-06-06
-- Description: Adds fields for automatic Matterport data import

-- Add new fields to tours table
ALTER TABLE tours ADD COLUMN IF NOT EXISTS matterport_data_imported BOOLEAN DEFAULT FALSE;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS matterport_last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS matterport_share_url VARCHAR(500);
ALTER TABLE tours ADD COLUMN IF NOT EXISTS matterport_embed_url VARCHAR(500);
ALTER TABLE tours ADD COLUMN IF NOT EXISTS agent_context TEXT;

-- Add new fields to properties table for Matterport data
ALTER TABLE properties ADD COLUMN IF NOT EXISTS matterport_name VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS matterport_description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS matterport_visibility VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS matterport_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS matterport_modified_at TIMESTAMP WITH TIME ZONE;

-- Address fields from Matterport
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Dimensions from Matterport
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_area_floor REAL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_area_floor_indoor REAL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_volume REAL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS dimension_units VARCHAR(20) DEFAULT 'metric';

-- Structured data (JSON)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rooms_data JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floors_data JSONB;

-- URLs
ALTER TABLE properties ADD COLUMN IF NOT EXISTS share_url VARCHAR(500);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS embed_url VARCHAR(500);

-- Import metadata
ALTER TABLE properties ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS matterport_import_success BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS matterport_import_errors JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_matterport_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tours_matterport_data_imported ON tours(matterport_data_imported);
CREATE INDEX IF NOT EXISTS idx_properties_data_source ON properties(data_source);
CREATE INDEX IF NOT EXISTS idx_properties_matterport_success ON properties(matterport_import_success);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- Update existing tours to have default values
UPDATE tours SET matterport_data_imported = FALSE WHERE matterport_data_imported IS NULL;

-- Update existing properties to have default values
UPDATE properties SET data_source = 'manual' WHERE data_source IS NULL;
UPDATE properties SET matterport_import_success = FALSE WHERE matterport_import_success IS NULL;
UPDATE properties SET dimension_units = 'metric' WHERE dimension_units IS NULL;

-- Update trigger for properties updated_at
CREATE OR REPLACE FUNCTION update_properties_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_properties_updated_at_column();

-- Commit the changes
COMMIT;