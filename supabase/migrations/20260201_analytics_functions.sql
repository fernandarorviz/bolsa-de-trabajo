-- Analytics RPCs for Admin Dashboard

-- 1. Helper Type for Dashboard KPIs
CREATE TYPE dashboard_kpis AS (
    total_vacantes_activas INTEGER,
    total_vacantes_cerradas INTEGER,
    tiempo_promedio_cobertura NUMERIC,
    tasa_rechazo_promedio NUMERIC,
    candidatos_por_vacante NUMERIC
);

-- 2. RPC: Get Dashboard KPIs (General Overview)
CREATE OR REPLACE FUNCTION get_dashboard_kpis(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_cliente_id UUID DEFAULT NULL,
    p_reclutador_id UUID DEFAULT NULL
)
RETURNS dashboard_kpis
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result dashboard_kpis;
BEGIN
    -- Base query for vacancies filtering
    WITH filtered_vacancies AS (
        SELECT 
            v.*,
            (EXTRACT(EPOCH FROM (v.fecha_cierre - v.fecha_publicacion)) / 86400)::NUMERIC as dias_cobertura
        FROM vacantes v
        WHERE 
            (p_start_date IS NULL OR v.created_at >= p_start_date) AND
            (p_end_date IS NULL OR v.created_at <= p_end_date) AND
            (p_cliente_id IS NULL OR v.cliente_id = p_cliente_id) AND
            (p_reclutador_id IS NULL OR v.reclutador_id = p_reclutador_id)
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
        0 as tasa_rechazo_promedio, -- Placeholder calc below
        COUNT(p.id)::NUMERIC / NULLIF(COUNT(DISTINCT v.id), 0) as candidatos_por_vacante
    INTO result
    FROM filtered_vacancies v
    LEFT JOIN filtered_postulaciones p ON p.vacante_id = v.id;

    -- Calculate avg rejection (if needed specific logic, can be complex. 
    -- Simplified: % of applications that are 'descartado')
    WITH rejection_stats AS (
        SELECT 
            (COUNT(*) FILTER (WHERE p.descartado) * 100.0 / NULLIF(COUNT(*), 0)) as rate
        FROM postulaciones p
        JOIN vacantes v ON p.vacante_id = v.id
        WHERE 
            (p_start_date IS NULL OR v.created_at >= p_start_date) AND
            (p_end_date IS NULL OR v.created_at <= p_end_date) AND
            (p_cliente_id IS NULL OR v.cliente_id = p_cliente_id) AND
            (p_reclutador_id IS NULL OR v.reclutador_id = p_reclutador_id)
    )
    SELECT rate INTO result.tasa_rechazo_promedio FROM rejection_stats;

    RETURN result;
END;
$$;

-- 3. RPC: Get Vacancy Metrics (Charts)
CREATE OR REPLACE FUNCTION get_vacancy_metrics(
    p_periodo TEXT DEFAULT 'month' -- 'week', 'month', 'year'
)
RETURNS TABLE (
    periodo TEXT,
    nuevas INTEGER,
    cerradas INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_char(date_trunc(p_periodo, created_at), 'YYYY-MM-DD') as periodo_label,
        COUNT(*) FILTER (WHERE created_at IS NOT NULL)::INTEGER as nuevas,
        COUNT(*) FILTER (WHERE estado = 'cerrada')::INTEGER as cerradas
    FROM vacantes
    WHERE created_at >= (now() - interval '6 months')
    GROUP BY 1
    ORDER BY 1;
END;
$$;

-- 4. RPC: Pipeline Metrics (Funnel)
CREATE OR REPLACE FUNCTION get_pipeline_metrics(
    p_vacante_id UUID DEFAULT NULL
)
RETURNS TABLE (
    etapa_nombre TEXT,
    color TEXT,
    orden INTEGER,
    count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
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
        AND (p_vacante_id IS NULL OR p.vacante_id = p_vacante_id)
        AND p.descartado = false
    GROUP BY e.id, e.nombre, e.color, e.orden
    ORDER BY e.orden;
END;
$$;

-- 5. RPC: Recruiter Metrics
CREATE OR REPLACE FUNCTION get_recruiter_metrics(
     p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
     p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    reclutador_nombre TEXT,
    vacantes_asignadas INTEGER,
    vacantes_cerradas INTEGER,
    tiempo_promedio_cierre NUMERIC,
    tasa_exito NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pr.nombre, 'Sin Asignar') as reclutador_nombre,
        COUNT(*)::INTEGER as vacantes_asignadas,
        COUNT(*) FILTER (WHERE v.estado = 'cerrada')::INTEGER as vacantes_cerradas,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.fecha_cierre - v.fecha_publicacion)) / 86400)::NUMERIC, 1) as tiempo_promedio,
        ROUND((COUNT(*) FILTER (WHERE v.estado = 'cerrada')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 1) as tasa_exito
    FROM vacantes v
    LEFT JOIN profiles pr ON v.reclutador_id = pr.id
    WHERE 
        (p_start_date IS NULL OR v.created_at >= p_start_date) AND
        (p_end_date IS NULL OR v.created_at <= p_end_date)
    GROUP BY pr.id, pr.nombre
    ORDER BY vacantes_cerradas DESC;
END;
$$;

-- 6. RPC: Client Metrics
CREATE OR REPLACE FUNCTION get_client_metrics()
RETURNS TABLE (
    cliente_nombre TEXT,
    vacantes_totales INTEGER,
    vacantes_activas INTEGER,
    candidatos_totales INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.nombre,
        COUNT(DISTINCT v.id)::INTEGER as vacantes_totales,
        COUNT(DISTINCT v.id) FILTER (WHERE v.estado = 'publicada')::INTEGER as vacantes_activas,
        COUNT(p.id)::INTEGER as candidatos_totales
    FROM clientes c
    LEFT JOIN vacantes v ON v.cliente_id = c.id
    LEFT JOIN postulaciones p ON p.vacante_id = v.id
    GROUP BY c.id, c.nombre
    ORDER BY vacantes_totales DESC
    LIMIT 10;
END;
$$;

-- Grant permissions (if needed, though Security Definer helps handle this usually, explicit grants to authenticated are good practice)
GRANT EXECUTE ON FUNCTION get_dashboard_kpis TO authenticated;
GRANT EXECUTE ON FUNCTION get_vacancy_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_pipeline_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_recruiter_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_metrics TO authenticated;
