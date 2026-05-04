-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location column to landmarks (PostGIS geometry)
-- This is done via raw SQL because Prisma doesn't support PostGIS types natively
ALTER TABLE landmarks ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- Create spatial index for bounding box queries
CREATE INDEX IF NOT EXISTS landmarks_location_idx ON landmarks USING GIST (location);
