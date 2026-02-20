-- Convert competencias_clave from array to text
ALTER TABLE public.vacantes
ALTER COLUMN competencias_clave TYPE text USING array_to_string(competencias_clave, ', ');

-- Convert idiomas_requeridos from jsonb to text
-- We assume the jsonb structure was { "texto": "..." } or similar, so we extract the 'texto' property.
-- If it's just arbitrary json, casting to text might produce json string, which is fine for now as we will overwrite it with HTML.
-- Using ->>'texto' extracts the value if it exists, otherwise we might just cast.
-- Let's try to handle both cases or just cast to text if structure is unknown, but likely it was the object structure from previous code.
ALTER TABLE public.vacantes
ALTER COLUMN idiomas_requeridos TYPE text USING (
  CASE 
    WHEN jsonb_typeof(idiomas_requeridos) = 'object' AND idiomas_requeridos ? 'texto' THEN idiomas_requeridos->>'texto'
    ELSE idiomas_requeridos::text
  END
);
