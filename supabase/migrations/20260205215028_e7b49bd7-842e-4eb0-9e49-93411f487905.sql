-- Update trigger function to handle vacancy closure on final payment
CREATE OR REPLACE FUNCTION public.handle_advance_payment_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    v_vacante_id UUID;
    v_vacante_estado public.estado_vacante;
    v_factura_tipo public.tipo_factura;
    v_factura_monto_total DECIMAL(12, 2);
    v_monto_pagado DECIMAL(12, 2);
BEGIN
-- Get invoice info
SELECT vacante_id, tipo, monto_total INTO v_vacante_id, v_factura_tipo, v_factura_monto_total
FROM public.facturacion
WHERE id = NEW.facturacion_id;

-- Calculate total paid for this invoice
SELECT SUM(monto) INTO v_monto_pagado
FROM public.pagos
WHERE facturacion_id = NEW.facturacion_id;

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

-- If payment is 'liquidación' and invoice is 'cierre'
-- AND the invoice is fully paid
IF NEW.tipo = 'liquidación' AND v_factura_tipo = 'cierre' THEN
    IF v_monto_pagado >= v_factura_monto_total THEN
        -- Update invoice status to 'pagada'
        UPDATE public.facturacion
        SET estado = 'pagada',
            updated_at = now()
        WHERE id = NEW.facturacion_id;

        -- Close the vacancy
        UPDATE public.vacantes
        SET estado = 'cerrada',
            fecha_cierre = now()
        WHERE id = v_vacante_id;
    END IF;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';