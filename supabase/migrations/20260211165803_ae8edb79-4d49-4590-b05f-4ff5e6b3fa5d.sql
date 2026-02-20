-- 1. Ensure 'cliente' role exists in the enum
DO $$ 
BEGIN
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';
EXCEPTION
WHEN others THEN NULL;
END $$;

-- 2. Fix profiles SELECT policy
DROP POLICY IF EXISTS "Usuarios pueden ver todos los perfiles" ON public.profiles;
CREATE POLICY "Usuarios pueden ver perfiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR 
    public.has_any_role(auth.uid())
);

-- 3. Fix vacantes SELECT policy for clients
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver vacantes" ON public.vacantes;

CREATE POLICY "Personal puede ver todas las vacantes"
ON public.vacantes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'coordinador', 'reclutador', 'ejecutivo')
    )
);

CREATE POLICY "Clientes pueden ver sus propias vacantes"
ON public.vacantes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.cliente_id = public.vacantes.cliente_id
    )
);

-- 4. Ensure public access to published vacancies remains active
DO $$ 
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vacantes' AND policyname = 'Vacantes publicadas son visibles para todos'
) THEN
    CREATE POLICY "Vacantes publicadas son visibles para todos"
    ON public.vacantes FOR SELECT
    TO anon, authenticated
    USING (estado = 'publicada');
END IF;
END $$;