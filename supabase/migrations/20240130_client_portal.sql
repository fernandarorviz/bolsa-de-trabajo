-- Migration to add client portal features

-- 1. Add 'cliente' to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cliente';

-- 2. Add cliente_id to profiles table to link users to clients
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id);

-- 3. Create feedback_cliente table
CREATE TABLE IF NOT EXISTS feedback_cliente (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vacante_id uuid NOT NULL REFERENCES vacantes(id),
    candidato_id uuid NOT NULL REFERENCES candidatos(id),
    decision text NOT NULL CHECK (decision IN ('aprobado', 'rechazado')),
    comentario text,
    created_at timestamptz DEFAULT now() NOT NULL,
    usuario_cliente_id uuid DEFAULT auth.uid() REFERENCES profiles(id)
);

-- 4. Enable RLS on feedback_cliente
ALTER TABLE feedback_cliente ENABLE ROW LEVEL SECURITY;

-- 5. Policies for feedback_cliente
-- Client can insert their own feedback
CREATE POLICY "Clientes can insert their own feedback" 
ON feedback_cliente FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = usuario_cliente_id AND
    EXISTS (
        SELECT 1 FROM vacantes v
        JOIN profiles p ON p.cliente_id = v.cliente_id
        WHERE v.id = feedback_cliente.vacante_id
        AND p.id = auth.uid()
    )
);

-- Clients can view feedback they created
CREATE POLICY "Clientes can view their own feedback" 
ON feedback_cliente FOR SELECT 
TO authenticated 
USING (auth.uid() = usuario_cliente_id);

-- internal staff (recruiters, admins, etc) can view all feedback
CREATE POLICY "Staff can view all feedback" 
ON feedback_cliente FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'reclutador', 'coordinador', 'ejecutivo')
    )
);
