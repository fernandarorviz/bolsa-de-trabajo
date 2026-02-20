
ALTER TABLE public.vacantes
ADD COLUMN IF NOT EXISTS rango_edad_min integer,
ADD COLUMN IF NOT EXISTS rango_edad_max integer,
ADD COLUMN IF NOT EXISTS genero text CHECK (genero IN ('masculino', 'femenino', 'indistinto')),
ADD COLUMN IF NOT EXISTS disponibilidad_viaje boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS categoria text,
ADD COLUMN IF NOT EXISTS subcategoria text,
ADD COLUMN IF NOT EXISTS idiomas_requeridos jsonb,
ADD COLUMN IF NOT EXISTS actividades_idiomas text,
ADD COLUMN IF NOT EXISTS conocimientos_tecnicos text,
ADD COLUMN IF NOT EXISTS experiencia_requerida text,
ADD COLUMN IF NOT EXISTS habilidades_tecnicas text,
ADD COLUMN IF NOT EXISTS estatus_carrera text,
ADD COLUMN IF NOT EXISTS carrera text;

COMMENT ON COLUMN public.vacantes.rango_edad_min IS 'Edad mínima requerida';
COMMENT ON COLUMN public.vacantes.rango_edad_max IS 'Edad máxima requerida';
COMMENT ON COLUMN public.vacantes.genero IS 'Género requerido: masculino, femenino o indistinto';
COMMENT ON COLUMN public.vacantes.disponibilidad_viaje IS 'Si requiere disponibilidad para viajar';
