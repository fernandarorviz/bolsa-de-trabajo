-- Create Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs (table_name);

-- Trigger function to capture changes
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_uid UUID;
BEGIN
    -- Get current user ID (might be null for background processes)
    current_uid := auth.uid();

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (current_uid, 'INSERT', TG_TABLE_NAME, (row_to_json(NEW)->>'id')::UUID, row_to_json(NEW)::JSONB);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (current_uid, 'UPDATE', TG_TABLE_NAME, (row_to_json(NEW)->>'id')::UUID, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (current_uid, 'DELETE', TG_TABLE_NAME, (row_to_json(OLD)->>'id')::UUID, row_to_json(OLD)::JSONB);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to relevant tables
DO $$
DECLARE
    tab_name TEXT;
    target_tables TEXT[] := ARRAY['vacantes', 'candidatos', 'clientes', 'postulaciones', 'profiles'];
BEGIN
    FOREACH tab_name IN ARRAY target_tables
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_audit_log ON public.%I', tab_name);
        EXECUTE format('CREATE TRIGGER tr_audit_log AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log()', tab_name);
    END LOOP;
END;
$$;
