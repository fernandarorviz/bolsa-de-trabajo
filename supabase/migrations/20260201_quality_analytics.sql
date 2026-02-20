-- Analytics RPC for Quality Dashboard (Rejection Reasons)

CREATE OR REPLACE FUNCTION get_rejection_reasons(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    motivo TEXT,
    count INTEGER,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH total_discarded AS (
        SELECT COUNT(*)::NUMERIC as total
        FROM postulaciones
        WHERE descartado = true
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date)
    )
    SELECT 
        COALESCE(p.motivo_descarte, 'Sin motivo especificado') as motivo,
        COUNT(*)::INTEGER as count,
        ROUND((COUNT(*) * 100.0 / NULLIF((SELECT total FROM total_discarded), 0)), 1) as percentage
    FROM postulaciones p
    WHERE p.descartado = true
    AND (p_start_date IS NULL OR p.created_at >= p_start_date)
    AND (p_end_date IS NULL OR p.created_at <= p_end_date)
    GROUP BY COALESCE(p.motivo_descarte, 'Sin motivo especificado')
    ORDER BY count DESC
    LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION get_rejection_reasons TO authenticated;

-- RPC to get average time to discard (Early Rejection Efficiency)
CREATE OR REPLACE FUNCTION get_time_to_discard_metrics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    promedio_dias_descarte NUMERIC,
    descartes_rapidos_count INTEGER, -- Descartados en menos de 3 días
    total_descartados INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result RECORD;
BEGIN
    SELECT 
        ROUND(AVG(EXTRACT(EPOCH FROM (p.fecha_ultima_actualizacion - p.fecha_postulacion)) / 86400)::NUMERIC, 1),
        COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (p.fecha_ultima_actualizacion - p.fecha_postulacion)) / 86400 < 3),
        COUNT(*)
    INTO result
    FROM postulaciones p
    WHERE p.descartado = true
    AND (p_start_date IS NULL OR p.created_at >= p_start_date)
    AND (p_end_date IS NULL OR p.created_at <= p_end_date);

    promedio_dias_descarte := result.round;
    descartes_rapidos_count := result.count;
    total_descartados := result.total_descartados;
    RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION get_time_to_discard_metrics TO authenticated;
