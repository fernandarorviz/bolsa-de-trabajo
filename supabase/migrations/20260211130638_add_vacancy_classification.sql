-- Create the classification enum
CREATE TYPE public.clasificacion_vacante AS ENUM (
  'operativa',
  'administrativa',
  'gerencial',
  'directiva'
);

-- Add classification column to vacantes
ALTER TABLE public.vacantes 
ADD COLUMN clasificacion public.clasificacion_vacante DEFAULT 'administrativa';

-- Add specialty levels to profiles (as an array of the enum)
ALTER TABLE public.profiles
ADD COLUMN especialidad_niveles public.clasificacion_vacante[] DEFAULT NULL;

-- Comment on columns
COMMENT ON COLUMN public.vacantes.clasificacion IS 'Clasificación del nivel de la vacante para reportes y gestión.';
COMMENT ON COLUMN public.profiles.especialidad_niveles IS 'Niveles de vacantes en los que se especializa el reclutador.';
