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