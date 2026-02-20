-- Add fiscal data columns to clientes table
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS rfc text,
ADD COLUMN IF NOT EXISTS razon_social text,
ADD COLUMN IF NOT EXISTS direccion_fiscal text,
ADD COLUMN IF NOT EXISTS regimen_fiscal text,
ADD COLUMN IF NOT EXISTS cp text,
ADD COLUMN IF NOT EXISTS constancia_fiscal_url text;

-- Add comments for documentation
COMMENT ON COLUMN public.clientes.rfc IS 'Registro Federal de Contribuyentes';
COMMENT ON COLUMN public.clientes.razon_social IS 'Legal name for billing';
COMMENT ON COLUMN public.clientes.direccion_fiscal IS 'Full fiscal address';
COMMENT ON COLUMN public.clientes.regimen_fiscal IS 'Tax regime code/description';
COMMENT ON COLUMN public.clientes.cp IS 'Postal code for fiscal address';
COMMENT ON COLUMN public.clientes.constancia_fiscal_url IS 'URL to the uploaded tax id document';