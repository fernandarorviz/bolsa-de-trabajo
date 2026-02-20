-- Add cliente_id to vacancy_templates
ALTER TABLE public.vacancy_templates
ADD COLUMN cliente_id UUID REFERENCES public.clientes(id);

-- Update RLS policies to allow viewing templates if user has access to the client?
-- Actually, the existing policies are based on reclutador_id (owner) or admin. 
-- Templates are internal tools for recruiters. 
-- So standard policies should still hold (recruiters see their own templates).
-- But maybe we want recruiters to see templates for clients they are assigned to?
-- For now, let's keep it simple: Recruiter leads the template, but it IS associated with a client.
