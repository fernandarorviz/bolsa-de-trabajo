-- Migration for Candidate Login and Profile Module
-- 1. Alter candidates table to add user_id reference
ALTER TABLE public.candidatos 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN resumen_profesional TEXT,
ADD COLUMN experiencia JSONB DEFAULT '[]'::jsonb,
ADD COLUMN educacion JSONB DEFAULT '[]'::jsonb,
ADD COLUMN habilidades TEXT[];

-- Create index for faster lookups by user_id
CREATE INDEX idx_candidatos_user_id ON public.candidatos(user_id);

-- 2. Trigger to link new auth users to existing candidates by email
CREATE OR REPLACE FUNCTION public.link_candidate_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidato_id UUID;
BEGIN
  -- Check if user metadata has role 'candidato' (or if we want to default logic)
  -- Allowing flexible check: either explicit role or no role but matching email in candidates
  
  -- Attempt to find existing candidate by email
  SELECT id INTO v_candidato_id
  FROM public.candidatos
  WHERE email = NEW.email;

  IF v_candidato_id IS NOT NULL THEN
    -- Link existing candidate
    UPDATE public.candidatos
    SET user_id = NEW.id
    WHERE id = v_candidato_id;
  ELSE
    -- If user is explicitly registering as candidate and no record exists, create one
    -- Note: This depends on how we handle registration. 
    -- If registration form sends `data: { role: 'candidato' }`, we create the record.
    IF (NEW.raw_user_meta_data->>'role') = 'candidato' THEN
       INSERT INTO public.candidatos (
         email, 
         nombre,
         user_id
       ) VALUES (
         NEW.email,
         COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
         NEW.id
       );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger execution
CREATE TRIGGER on_auth_user_created_link_candidate
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_candidate_on_signup();

-- 3. Storage Bucket for CVs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Helper policy for authenticated users to upload their own CV
CREATE POLICY "Candidatos authenticated upload CV"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidatos authenticated select own CV"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Also allow recruiters to view CVs (this might need refinement based on folder structure)
-- Ideally: folder structure `user_id/filename`

-- 4. RLS Update for Candidates
-- Enable RLS just in case (already enabled in previous migration)
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

-- Allow candidates to view and edit their own profile
CREATE POLICY "Candidatos view own profile"
ON public.candidatos FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_any_role(auth.uid()) -- Recruiters can see all
);

CREATE POLICY "Candidatos update own profile"
ON public.candidatos FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow candidates to fetch their applications
CREATE POLICY "Candidatos view own applications"
ON public.postulaciones FOR SELECT
TO authenticated
USING (
  candidato_id IN (SELECT id FROM public.candidatos WHERE user_id = auth.uid()) OR
  public.has_any_role(auth.uid())
);
