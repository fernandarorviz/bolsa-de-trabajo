-- Migration to fix client vacancy visibility and profile access (v2)

-- 2. Fix profiles SELECT policy
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles" ON public.profiles;
CREATE POLICY "Usuarios pueden ver perfiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR 
    public.has_any_role(auth.uid())
);

-- 3. Fix vacantes SELECT policies
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver vacantes" ON public.vacantes;
DROP POLICY IF EXISTS "Personal puede ver todas las vacantes" ON public.vacantes;
DROP POLICY IF EXISTS "Clientes pueden ver sus propias vacantes" ON public.vacantes;
DROP POLICY IF EXISTS "Vacantes publicadas son visibles para todos" ON public.vacantes;

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

CREATE POLICY "Vacantes publicadas son visibles para todos"
ON public.vacantes FOR SELECT
TO anon, authenticated
USING (estado = 'publicada');