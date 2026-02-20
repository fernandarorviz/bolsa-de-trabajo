
-- 1. Update get_dashboard_kpis with classification filter
CREATE OR REPLACE FUNCTION get_dashboard_kpis(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_cliente_id UUID DEFAULT NULL,
    p_reclutador_id UUID DEFAULT NULL,
    p_clasificacion TEXT DEFAULT NULL
)
RETURNS dashboard_kpis
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result dashboard_kpis;
BEGIN
WITH filtered_vacancies AS (
    SELECT 
        v.*,
        (EXTRACT(EPOCH FROM (v.fecha_cierre - v.fecha_publicacion)) / 86400)::NUMERIC as dias_cobertura
    FROM vacantes v
    WHERE 
        (p_start_date IS NULL OR v.created_at >= p_start_date) AND
        (p_end_date IS NULL OR v.created_at <= p_end_date) AND
        (p_cliente_id IS NULL OR v.cliente_id = p_cliente_id) AND
        (p_reclutador_id IS NULL OR v.reclutador_id = p_reclutador_id) AND
        (p_clasificacion IS NULL OR v.clasificacion = p_clasificacion::text::clasificacion_vacante)
),
filtered_postulaciones AS (
    SELECT p.*
    FROM postulaciones p
    JOIN filtered_vacancies v ON p.vacante_id = v.id
)
SELECT
    COUNT(*) FILTER (WHERE estado = 'publicada') as total_vacantes_activas,
    COUNT(*) FILTER (WHERE estado = 'cerrada') as total_vacantes_cerradas,
    ROUND(AVG(dias_cobertura) FILTER (WHERE estado = 'cerrada'), 1) as tiempo_promedio_cobertura,
    0 as tasa_rechazo_promedio,
    COUNT(p.id)::NUMERIC / NULLIF(COUNT(DISTINCT v.id), 0) as candidatos_por_vacante
INTO result
FROM filtered_vacancies v
LEFT JOIN filtered_postulaciones p ON p.vacante_id = v.id;

WITH rejection_stats AS (
    SELECT 
        (COUNT(*) FILTER (WHERE p.descartado) * 100.0 / NULLIF(COUNT(*), 0)) as rate
    FROM postulaciones p
    JOIN vacantes v ON p.vacante_id = v.id
    WHERE 
        (p_start_date IS NULL OR v.created_at >= p_start_date) AND
        (p_end_date IS NULL OR v.created_at <= p_end_date) AND
        (p_cliente_id IS NULL OR v.cliente_id = p_cliente_id) AND
        (p_reclutador_id IS NULL OR v.reclutador_id = p_reclutador_id) AND
        (p_clasificacion IS NULL OR v.clasificacion = p_clasificacion::text::clasificacion_vacante)
)
SELECT rate INTO result.tasa_rechazo_promedio FROM rejection_stats;

RETURN result;
END;
$$;

-- 2. Update get_vacancy_metrics with classification filter
CREATE OR REPLACE FUNCTION get_vacancy_metrics(
    p_periodo TEXT DEFAULT 'month',
    p_clasificacion TEXT DEFAULT NULL
)
RETURNS TABLE (
    periodo TEXT,
    nuevas INTEGER,
    cerradas INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
RETURN QUERY
SELECT 
    to_char(date_trunc(p_periodo, created_at), 'YYYY-MM-DD') as periodo_label,
    COUNT(*) FILTER (WHERE created_at IS NOT NULL)::INTEGER as nuevas,
    COUNT(*) FILTER (WHERE estado = 'cerrada')::INTEGER as cerradas
FROM vacantes
WHERE 
    created_at >= (now() - interval '6 months') AND
    (p_clasificacion IS NULL OR clasificacion = p_clasificacion::text::clasificacion_vacante)
GROUP BY 1
ORDER BY 1;
END;
$$;

-- 3. Update get_pipeline_metrics with classification filter
CREATE OR REPLACE FUNCTION get_pipeline_metrics(
    p_vacante_id UUID DEFAULT NULL,
    p_clasificacion TEXT DEFAULT NULL
)
RETURNS TABLE (
    etapa_nombre TEXT,
    color TEXT,
    orden INTEGER,
    count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
RETURN QUERY
SELECT 
    e.nombre,
    e.color,
    e.orden,
    COUNT(p.id)::INTEGER
FROM etapas_pipeline e
LEFT JOIN postulaciones p ON p.etapa_id = e.id 
    AND p.descartado = false
LEFT JOIN vacantes v ON p.vacante_id = v.id
WHERE 
    (p_vacante_id IS NULL OR p.vacante_id = p_vacante_id) AND
    (p_clasificacion IS NULL OR v.clasificacion = p_clasificacion::text::clasificacion_vacante)
GROUP BY e.id, e.nombre, e.color, e.orden
ORDER BY e.orden;
END;
$$;

-- 4. New function: Get Vacancies by Classification
CREATE OR REPLACE FUNCTION get_vacancies_by_classification(
    p_cliente_id UUID DEFAULT NULL,
    p_reclutador_id UUID DEFAULT NULL
)
RETURNS TABLE (
    clasificacion TEXT,
    count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
RETURN QUERY
SELECT 
    COALESCE(v.clasificacion::text, 'Sin Clasificación') as clasificacion,
    COUNT(*)::INTEGER as count
FROM vacantes v
WHERE 
    v.estado = 'publicada' AND
    (p_cliente_id IS NULL OR v.cliente_id = p_cliente_id) AND
    (p_reclutador_id IS NULL OR v.reclutador_id = p_reclutador_id)
GROUP BY v.clasificacion
ORDER BY count DESC;
END;
$$;
