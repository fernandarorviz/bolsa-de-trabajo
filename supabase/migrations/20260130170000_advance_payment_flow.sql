-- Add 'pendiente_pago' to estado_vacante enum
ALTER TYPE public.estado_vacante ADD VALUE IF NOT EXISTS 'pendiente_pago';

-- Add 'tipo_factura' enum
CREATE TYPE public.tipo_factura AS ENUM ('anticipo', 'cierre');

-- Add 'tipo' column to facturacion
ALTER TABLE public.facturacion ADD COLUMN IF NOT EXISTS tipo public.tipo_factura DEFAULT 'cierre';

-- Trigger function to handle advance payment request (new vacancy)
CREATE OR REPLACE FUNCTION public.handle_new_vacancy_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'pendiente_pago' AND (OLD.estado IS NULL OR OLD.estado != 'pendiente_pago') THEN
        IF NOT EXISTS (SELECT 1 FROM public.facturacion WHERE vacante_id = NEW.id AND tipo = 'anticipo') THEN
            INSERT INTO public.facturacion (vacante_id, cliente_id, monto_total, estado, tipo)
            VALUES (NEW.id, NEW.cliente_id, 0, 'pendiente', 'anticipo');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on vacantes
CREATE TRIGGER on_vacancy_advance_request
    AFTER INSERT OR UPDATE ON public.vacantes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_vacancy_request();

-- Trigger function to handle payment of advance
CREATE OR REPLACE FUNCTION public.handle_advance_payment_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    v_vacante_id UUID;
    v_vacante_estado public.estado_vacante;
    v_factura_tipo public.tipo_factura;
BEGIN
    -- Get invoice info
    SELECT vacante_id, tipo INTO v_vacante_id, v_factura_tipo
    FROM public.facturacion
    WHERE id = NEW.facturacion_id;

    -- If payment is 'anticipo' and invoice is 'anticipo'
    IF NEW.tipo = 'anticipo' AND v_factura_tipo = 'anticipo' THEN
         -- Check vacante status
         SELECT estado INTO v_vacante_estado FROM public.vacantes WHERE id = v_vacante_id;
         
         IF v_vacante_estado = 'pendiente_pago' THEN
             UPDATE public.vacantes
             SET estado = 'publicada',
                 fecha_publicacion = now()
             WHERE id = v_vacante_id;
         END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on pagos
CREATE TRIGGER on_advance_payment_made
    AFTER INSERT ON public.pagos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_advance_payment_confirmation();
