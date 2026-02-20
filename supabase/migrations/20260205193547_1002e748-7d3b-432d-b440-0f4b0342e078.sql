-- Enriquecer Vacantes con datos estructurados
ALTER TABLE vacantes 
ADD COLUMN IF NOT EXISTS competencias_clave text[],
ADD COLUMN IF NOT EXISTS anios_experiencia_min integer,
ADD COLUMN IF NOT EXISTS nivel_educativo_min text;

-- Añadir soporte para análisis de IA en Postulaciones
ALTER TABLE postulaciones
ADD COLUMN IF NOT EXISTS ia_compatibility_score integer CHECK (ia_compatibility_score >= 0 AND ia_compatibility_score <= 100),
ADD COLUMN IF NOT EXISTS ia_match_analysis text,
ADD COLUMN IF NOT EXISTS ia_missing_skills text[];