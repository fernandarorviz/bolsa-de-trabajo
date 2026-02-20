ALTER TABLE public.audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 2. Add comment to clarify the relationship for PostgREST
COMMENT ON CONSTRAINT audit_logs_user_id_fkey ON public.audit_logs IS 'Relationship to profiles for audit log user tracking';