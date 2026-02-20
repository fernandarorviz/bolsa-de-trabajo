-- Function to get vacancy statistics
CREATE OR REPLACE FUNCTION public.get_vacancy_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'by_location', (
      SELECT json_object_agg(location, count)
      FROM (
        SELECT ubicacion as location, count(*) as count
        FROM public.vacantes
        WHERE estado = 'publicada' AND ubicacion IS NOT NULL
        GROUP BY ubicacion
      ) t
    ),
    'by_area', (
      SELECT json_object_agg(area, count)
      FROM (
        SELECT area, count(*) as count
        FROM public.vacantes
        WHERE estado = 'publicada' AND area IS NOT NULL
        GROUP BY area
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;
