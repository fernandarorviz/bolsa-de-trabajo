-- Add 'posiciones' column to 'vacantes' table
ALTER TABLE public.vacantes ADD COLUMN IF NOT EXISTS posiciones INTEGER DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.vacantes.posiciones IS 'Número de posiciones o vacantes requeridas para este puesto';
