-- Add new fields to clientes table
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS sitio_web text,
ADD COLUMN IF NOT EXISTS descripcion text,
ADD COLUMN IF NOT EXISTS comentarios text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS cobranding_activo boolean DEFAULT false;

-- Create storage bucket for client logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for client-logos

-- Allow public read access to client logos
CREATE POLICY "Public Access Client Logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-logos');

-- Allow authenticated users (admin, coordinadores, reclutadores, and maybe the client themselves) to upload logos
-- For simplicity, let's allow authenticated users to upload for now, or match the role logic
CREATE POLICY "Authenticated Users Upload Client Logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-logos' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'coordinador') OR 
   public.has_role(auth.uid(), 'reclutador') OR
   public.has_role(auth.uid(), 'cliente'))
);

-- Allow updates (e.g. replacing a logo)
CREATE POLICY "Authenticated Users Update Client Logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-logos' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'coordinador') OR 
   public.has_role(auth.uid(), 'reclutador') OR
   public.has_role(auth.uid(), 'cliente'))
);

-- Add comments for documentation
COMMENT ON COLUMN public.clientes.sector IS 'Industry sector detailed';
COMMENT ON COLUMN public.clientes.sitio_web IS 'Company website URL';
COMMENT ON COLUMN public.clientes.descripcion IS 'Company description';
COMMENT ON COLUMN public.clientes.comentarios IS 'Internal comments about the client';
COMMENT ON COLUMN public.clientes.logo_url IS 'URL to the company logo in storage';
COMMENT ON COLUMN public.clientes.cobranding_activo IS 'Whether co-branding is active for this client';
