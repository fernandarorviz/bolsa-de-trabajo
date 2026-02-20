
-- Fix relationships in vacantes table to point to public.profiles
-- This enables PostgREST automatic joins (e.g. vacantes(reclutador:profiles(*)))

-- 1. Reclutador Relationship
ALTER TABLE public.vacantes
DROP CONSTRAINT IF EXISTS vacantes_reclutador_id_fkey;

ALTER TABLE public.vacantes
ADD CONSTRAINT vacantes_reclutador_id_fkey 
FOREIGN KEY (reclutador_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 2. Ejecutivo Relationship
ALTER TABLE public.vacantes
DROP CONSTRAINT IF EXISTS vacantes_ejecutivo_id_fkey;

ALTER TABLE public.vacantes
ADD CONSTRAINT vacantes_ejecutivo_id_fkey 
FOREIGN KEY (ejecutivo_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 3. Candidate hired relationship (already points to candidatos, which is in public)
-- This is just for reference as it was previously added in public.vacantes
