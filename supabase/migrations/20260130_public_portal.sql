-- Permitir acceso público a vacantes publicadas
-- Nota: La tabla ya tiene RLS habilitado.
-- Necesitamos una política para el rol 'anon' (y 'authenticated' si no son staff)

CREATE POLICY "Vacantes publicadas son visibles para todos"
ON public.vacantes FOR SELECT
TO anon, authenticated
USING (estado = 'publicada');

-- Función RPC para registrar postulación pública
-- Security Definer para poder escribir en tablas protegidas (candidatos, postulaciones)
-- sin dar acceso directo de escritura a 'anon'.

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
  -- Intentar buscar por email (case insensitive si se desea, por ahora exacto como la constraint unique)
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
      estado_general
    ) VALUES (
      p_nombre,
      p_email,
      p_telefono,
      p_ubicacion,
      p_cv_url,
      p_linkedin_url,
      'activo'
    ) RETURNING id INTO v_candidato_id;
  ELSE
    -- Actualizar datos del candidato existente si se proporcionan nuevos (opcional, o solo actualizar vacios)
    -- Por simplicidad, actualizamos CV y LinkedIn si vienen
    UPDATE public.candidatos
    SET 
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

  -- 4. Obtener etapa inicial del pipeline ("Postulado")
  -- Asumimos que la etapa con orden 1 es la inicial, o buscamos por nombre 'Postulado'
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

  -- El trigger 'create_initial_historial' se encargará de crear el historial inicial

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Postulación registrada exitosamente',
    'postulacion_id', v_postulacion_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Grant execute info to anon/authenticated
GRANT EXECUTE ON FUNCTION public.registrar_postulacion TO anon, authenticated;
