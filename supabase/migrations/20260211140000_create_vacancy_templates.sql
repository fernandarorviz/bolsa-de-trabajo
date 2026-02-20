-- Create vacancy_templates table
CREATE TABLE IF NOT EXISTS public.vacancy_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nombre_plantilla TEXT NOT NULL,
    reclutador_id UUID REFERENCES auth.users(id),
    
    -- Fields mirrored from vacantes
    titulo TEXT,
    descripcion TEXT,
    ubicacion TEXT,
    area TEXT,
    tipo_contrato public.tipo_contrato DEFAULT 'tiempo_completo'::public.tipo_contrato,
    prioridad public.prioridad_vacante DEFAULT 'media'::public.prioridad_vacante,
    clasificacion public.clasificacion_vacante DEFAULT 'administrativa'::public.clasificacion_vacante,
    salario_min NUMERIC,
    salario_max NUMERIC,
    requiere_anticipo BOOLEAN DEFAULT false,
    posiciones INTEGER DEFAULT 1,
    rango_edad_min INTEGER,
    rango_edad_max INTEGER,
    genero TEXT,
    disponibilidad_viaje BOOLEAN DEFAULT false,
    categoria TEXT,
    subcategoria TEXT,
    nivel_educativo_min TEXT,
    carrera TEXT,
    estatus_carrera TEXT,
    anios_experiencia_min NUMERIC,
    idiomas_requeridos TEXT,
    actividades_idiomas TEXT,
    conocimientos_tecnicos TEXT,
    experiencia_requerida TEXT,
    habilidades_tecnicas TEXT,
    competencias_clave TEXT,
    salario_mensual_bruto NUMERIC,
    moneda_salario TEXT DEFAULT 'MXN',
    periodo_pago TEXT DEFAULT 'mensual',
    prestaciones TEXT,
    descripcion_prestaciones TEXT,
    beneficios_adicionales TEXT,
    bonos TEXT,
    herramientas_trabajo TEXT,
    preguntas_knockout JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.vacancy_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own templates"
    ON public.vacancy_templates
    FOR SELECT
    USING (
        auth.uid() = reclutador_id OR 
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can insert their own templates"
    ON public.vacancy_templates
    FOR INSERT
    WITH CHECK (auth.uid() = reclutador_id);

CREATE POLICY "Users can update their own templates"
    ON public.vacancy_templates
    FOR UPDATE
    USING (auth.uid() = reclutador_id)
    WITH CHECK (auth.uid() = reclutador_id);

CREATE POLICY "Users can delete their own templates"
    ON public.vacancy_templates
    FOR DELETE
    USING (auth.uid() = reclutador_id OR 
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_vacancy_templates_updated_at
    BEFORE UPDATE ON public.vacancy_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
