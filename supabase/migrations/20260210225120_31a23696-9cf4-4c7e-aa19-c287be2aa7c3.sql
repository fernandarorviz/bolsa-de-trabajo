-- Convert competencias_clave from array to text
ALTER TABLE public.vacantes
ALTER COLUMN competencias_clave TYPE text USING array_to_string(competencias_clave, ', ');

-- Convert idiomas_requeridos from jsonb to text
ALTER TABLE public.vacantes
ALTER COLUMN idiomas_requeridos TYPE text USING (
CASE 
WHEN jsonb_typeof(idiomas_requeridos) = 'object' AND idiomas_requeridos ? 'texto' THEN idiomas_requeridos->>'texto'
ELSE idiomas_requeridos::text
END
);