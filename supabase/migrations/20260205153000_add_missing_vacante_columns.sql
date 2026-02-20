-- Add missing columns to vacantes table
ALTER TABLE public.vacantes 
ADD COLUMN IF NOT EXISTS requiere_anticipo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS competencias_clave TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS anios_experiencia_min INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nivel_educativo_min TEXT;

-- Update schema cache (Supabase specific, happens automatically but good to note)
COMMENT ON COLUMN public.vacantes.requiere_anticipo IS 'Indica si el cliente requiere pagar un anticipo antes de publicar la vacante';
COMMENT ON COLUMN public.vacantes.competencias_clave IS 'Lista de etiquetas de habilidades y competencias requeridas';
COMMENT ON COLUMN public.vacantes.anios_experiencia_min IS 'Años mínimos de experiencia requeridos para el puesto';
COMMENT ON COLUMN public.vacantes.nivel_educativo_min IS 'Nivel mínimo de educación requerido (ej. Licenciatura, Maestría)';
