-- Enable PostGIS BEFORE any migration that creates geometry/geography columns.
-- Requires a role allowed to CREATE EXTENSION (superuser, or a provider that allowlists postgis).
CREATE EXTENSION IF NOT EXISTS postgis;
