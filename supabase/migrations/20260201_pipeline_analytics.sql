-- Analytics RPC for Pipeline Velocity (Time in Stage)

CREATE OR REPLACE FUNCTION get_pipeline_velocity(
    p_vacante_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    etapa_nombre TEXT,
    etapa_orden INTEGER,
    promedio_dias NUMERIC,
    total_candidatos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH stage_durations AS (
        SELECT 
            e.nombre as etapa_nombre,
            e.orden as etapa_orden,
            EXTRACT(EPOCH FROM (COALESCE(h.fecha_fin, now()) - h.fecha_inicio)) / 86400 as dias_en_etapa
        FROM historial_etapas h
        JOIN etapas_pipeline e ON h.etapa_id = e.id
        JOIN postulaciones p ON h.postulacion_id = p.id
        LEFT JOIN vacantes v ON p.vacante_id = v.id
        WHERE 
            (p_vacante_id IS NULL OR p.vacante_id = p_vacante_id) AND
            (p_start_date IS NULL OR v.created_at >= p_start_date) AND
            (p_end_date IS NULL OR v.created_at <= p_end_date)
    )
    SELECT 
        sd.etapa_nombre,
        sd.etapa_orden,
        ROUND(AVG(sd.dias_en_etapa)::NUMERIC, 1) as promedio_dias,
        COUNT(*)::INTEGER as total_candidatos
    FROM stage_durations sd
    GROUP BY sd.etapa_nombre, sd.etapa_orden
    ORDER BY sd.etapa_orden;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pipeline_velocity TO authenticated;
