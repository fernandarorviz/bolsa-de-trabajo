-- Allow recruiters to upload CVs
CREATE POLICY "Recruiters can upload CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'coordinador') OR 
   public.has_role(auth.uid(), 'reclutador'))
);

-- Allow recruiters to view all CVs
CREATE POLICY "Recruiters can view all CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'coordinador') OR 
   public.has_role(auth.uid(), 'reclutador'))
);
