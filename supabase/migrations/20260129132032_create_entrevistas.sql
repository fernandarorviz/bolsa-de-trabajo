-- Create Enums
CREATE TYPE public.tipo_entrevista AS ENUM ('interna', 'cliente', 'tecnica', 'seguimiento');
CREATE TYPE public.modalidad_entrevista AS ENUM ('presencial', 'online');
CREATE TYPE public.estado_entrevista AS ENUM ('programada', 'reprogramada', 'realizada', 'cancelada');

-- Create Table
CREATE TABLE public.entrevistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
    candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
    etapa_pipeline_id UUID NOT NULL REFERENCES public.etapas_pipeline(id),
    tipo_entrevista public.tipo_entrevista NOT NULL,
    modalidad public.modalidad_entrevista NOT NULL DEFAULT 'online',
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    link_reunion TEXT,
    ubicacion TEXT,
    estado public.estado_entrevista NOT NULL DEFAULT 'programada',
    notas TEXT,
    creada_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (fecha_fin > fecha_inicio)
);

-- Enable RLS
ALTER TABLE public.entrevistas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read for authenticated users" ON public.entrevistas
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.entrevistas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.entrevistas
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON public.entrevistas
    FOR DELETE
    TO authenticated
    USING (true);

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.entrevistas
    FOR EACH ROW EXECUTE PROCEDURE public.moddatetime (updated_at);
