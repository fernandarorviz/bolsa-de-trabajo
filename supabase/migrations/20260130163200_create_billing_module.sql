-- Create Enums
DO $$ BEGIN
    CREATE TYPE public.estado_factura AS ENUM ('pendiente', 'solicitada', 'facturada', 'pagada', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_pago AS ENUM ('anticipo', 'liquidación');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Facturación table
CREATE TABLE IF NOT EXISTS public.facturacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    monto_total DECIMAL(12, 2) DEFAULT 0.00,
    estado public.estado_factura DEFAULT 'pendiente' NOT NULL,
    fecha_solicitud TIMESTAMP WITH TIME ZONE,
    url_factura TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Pagos table
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facturacion_id UUID NOT NULL REFERENCES public.facturacion(id) ON DELETE CASCADE,
    monto DECIMAL(12, 2) NOT NULL,
    tipo public.tipo_pago NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metodo_pago TEXT,
    notas TEXT,
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.facturacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Policies for Admins and Coordinators
DO $$ BEGIN
    CREATE POLICY "Admins and coordinators can manage facturacion"
    ON public.facturacion FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'coordinador')
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins and coordinators can manage pagos"
    ON public.pagos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'coordinador')
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Automated Billing Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_hired_candidate()
RETURNS TRIGGER AS $$
DECLARE
    v_cliente_id UUID;
    v_vacante_id UUID;
    v_es_final BOOLEAN;
BEGIN
    -- Check if the new etapa is marked as "final" (Hired)
    SELECT es_final INTO v_es_final FROM public.etapas_pipeline WHERE id = NEW.etapa_id;
    
    IF v_es_final AND (OLD.etapa_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.etapas_pipeline WHERE id = OLD.etapa_id AND es_final)) THEN
        -- Get vacancy and client info
        SELECT id, cliente_id INTO v_vacante_id, v_cliente_id 
        FROM public.vacantes 
        WHERE id = NEW.vacante_id;
        
        -- Create billing record if it doesn't exist for this vacancy/client
        IF NOT EXISTS (SELECT 1 FROM public.facturacion WHERE vacante_id = v_vacante_id AND cliente_id = v_cliente_id AND estado != 'cancelada') THEN
            INSERT INTO public.facturacion (vacante_id, cliente_id, estado)
            VALUES (v_vacante_id, v_cliente_id, 'pendiente');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on postulaciones
DROP TRIGGER IF EXISTS tr_on_hired_candidate ON public.postulaciones;
CREATE TRIGGER tr_on_hired_candidate
AFTER UPDATE OF etapa_id ON public.postulaciones
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_hired_candidate();

-- Grant access
GRANT ALL ON public.facturacion TO authenticated;
GRANT ALL ON public.pagos TO authenticated;
GRANT ALL ON public.facturacion TO service_role;
GRANT ALL ON public.pagos TO service_role;
