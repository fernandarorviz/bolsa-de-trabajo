-- Add salary and benefits fields to vacantes table
ALTER TABLE public.vacantes
ADD COLUMN IF NOT EXISTS salario_mensual_bruto numeric,
ADD COLUMN IF NOT EXISTS moneda_salario text CHECK (moneda_salario IN ('MXN', 'USD', 'EUR', 'CAD')),
ADD COLUMN IF NOT EXISTS periodo_pago text CHECK (periodo_pago IN ('semanal', 'quincenal', 'mensual')),
ADD COLUMN IF NOT EXISTS prestaciones text,
ADD COLUMN IF NOT EXISTS descripcion_prestaciones text,
ADD COLUMN IF NOT EXISTS beneficios_adicionales text,
ADD COLUMN IF NOT EXISTS bonos text,
ADD COLUMN IF NOT EXISTS herramientas_trabajo text;

-- Add comments for clarity
COMMENT ON COLUMN public.vacantes.salario_mensual_bruto IS 'Salario mensual bruto';
COMMENT ON COLUMN public.vacantes.moneda_salario IS 'Divisa del salario mensual bruto';
COMMENT ON COLUMN public.vacantes.periodo_pago IS 'Periodo de pago del salario';
COMMENT ON COLUMN public.vacantes.prestaciones IS 'Resumen breve de prestaciones';
COMMENT ON COLUMN public.vacantes.descripcion_prestaciones IS 'Descripción detallada de prestaciones (HTML/Rich Text)';
COMMENT ON COLUMN public.vacantes.beneficios_adicionales IS 'Beneficios adicionales (HTML/Rich Text)';
COMMENT ON COLUMN public.vacantes.bonos IS 'Bonos ofrecidos (HTML/Rich Text)';
COMMENT ON COLUMN public.vacantes.herramientas_trabajo IS 'Herramientas de trabajo proporcionadas (HTML/Rich Text)';
