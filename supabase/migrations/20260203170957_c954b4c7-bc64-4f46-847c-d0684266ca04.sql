-- 1. Correct existing data
UPDATE public.candidatos c
SET user_id = u.id
FROM auth.users u
WHERE c.email = u.email 
AND c.user_id IS NULL;

-- 2. Update RPC to handle user_id
CREATE OR REPLACE FUNCTION public.registrar_postulacion(
  p_vacante_id UUID,
  p_nombre TEXT,
  p_email TEXT,
  p_telefono TEXT DEFAULT NULL,
  p_ubicacion TEXT DEFAULT NULL,
  p_cv_url TEXT DEFAULT NULL,
  p_linkedin_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidato_id UUID;
  v_postulacion_id UUID;
  v_etapa_inicial_id UUID;
  v_vacante_estado public.estado_vacante;
  v_user_id UUID := auth.uid(); -- Get current authenticated user
BEGIN
-- 1. Validar que la vacante existe y está publicada
SELECT estado INTO v_vacante_estado
FROM public.vacantes
WHERE id = p_vacante_id;

IF v_vacante_estado IS NULL THEN
RETURN jsonb_build_object('success', false, 'message', 'Vacante no encontrada');
END IF;

IF v_vacante_estado != 'publicada' THEN
RETURN jsonb_build_object('success', false, 'message', 'La vacante no está disponible para postulación');
END IF;

-- 2. Buscar o crear candidato
SELECT id INTO v_candidato_id
FROM public.candidatos
WHERE email = p_email;

IF v_candidato_id IS NULL THEN
-- Crear nuevo candidato
INSERT INTO public.candidatos (
      nombre, 
      email, 
      telefono, 
      ubicacion, 
      cv_url, 
      linkedin_url,
      estado_general,
      user_id
    ) VALUES (
      p_nombre,
      p_email,
      p_telefono,
      p_ubicacion,
      p_cv_url,
      p_linkedin_url,
'activo',
      v_user_id
    ) RETURNING id INTO v_candidato_id;
ELSE
-- Actualizar datos del candidato existente
UPDATE public.candidatos
SET 
      user_id = COALESCE(user_id, v_user_id),
      cv_url = COALESCE(p_cv_url, cv_url),
      linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
      telefono = COALESCE(p_telefono, telefono),
      ubicacion = COALESCE(p_ubicacion, ubicacion),
      updated_at = now()
WHERE id = v_candidato_id;
END IF;

-- 3. Verificar si ya existe postulación para esta vacante
IF EXISTS (
SELECT 1 FROM public.postulaciones 
WHERE vacante_id = p_vacante_id AND candidato_id = v_candidato_id
  ) THEN
RETURN jsonb_build_object('success', false, 'message', 'Ya te has postulado a esta vacante anteriormente');
END IF;

-- 4. Obtener etapa inicial del pipeline
SELECT id INTO v_etapa_inicial_id
FROM public.etapas_pipeline
ORDER BY orden ASC
LIMIT 1;

IF v_etapa_inicial_id IS NULL THEN
RETURN jsonb_build_object('success', false, 'message', 'Error de configuración: No hay etapas definidas en el pipeline');
END IF;

-- 5. Crear postulación
INSERT INTO public.postulaciones (
    vacante_id,
    candidato_id,
    etapa_id
  ) VALUES (
    p_vacante_id,
    v_candidato_id,
    v_etapa_inicial_id
  ) RETURNING id INTO v_postulacion_id;

RETURN jsonb_build_object(
'success', true, 
'message', 'Postulación registrada exitosamente',
'postulacion_id', v_postulacion_id
  );

EXCEPTION WHEN OTHERS THEN
RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;