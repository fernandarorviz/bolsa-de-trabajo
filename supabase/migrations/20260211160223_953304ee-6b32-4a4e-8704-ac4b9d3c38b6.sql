-- Add knockout questions column to vacantes table

ALTER TABLE public.vacantes

ADD COLUMN IF NOT EXISTS preguntas_knockout jsonb DEFAULT '[]'::jsonb;




-- Add comment for clarity

COMMENT ON COLUMN public.vacantes.preguntas_knockout IS 'List of knockout questions and their rules for filtering candidates';