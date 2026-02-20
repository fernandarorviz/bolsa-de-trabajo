-- Add policy to allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Note: We might also want to ensure admins can select all profiles, but usually public read access is enabled or similar. 
-- Assuming read access is already there since the list shows up. Only UPDATE was failing.
