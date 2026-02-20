-- Create evaluations table
CREATE TABLE public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  vacante_id UUID REFERENCES public.vacantes(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

-- Policies for evaluaciones table
CREATE POLICY "Usuarios autenticados pueden ver evaluaciones"
ON public.evaluaciones FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Reclutadores pueden gestionar evaluaciones"
ON public.evaluaciones FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'coordinador') OR 
  public.has_role(auth.uid(), 'reclutador')
);

-- Trigger for updated_at
CREATE TRIGGER update_evaluaciones_updated_at BEFORE UPDATE ON public.evaluaciones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for evaluations
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evaluations', 'evaluations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can view evaluations"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evaluations');

CREATE POLICY "Recruiters can upload evaluations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evaluations' AND
  (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coordinador') OR 
    public.has_role(auth.uid(), 'reclutador')
  )
);

CREATE POLICY "Recruiters can update/delete evaluations"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evaluations' AND
  (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'coordinador') OR 
    public.has_role(auth.uid(), 'reclutador')
  )
);