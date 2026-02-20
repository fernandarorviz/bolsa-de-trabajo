-- Add perfil_completo column to candidatos table
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS perfil_completo BOOLEAN DEFAULT FALSE;

-- Update existing candidates: a profile is complete if it has nombre, email, telefono, ubicacion and cv_url
UPDATE candidatos 
SET perfil_completo = (
    nombre IS NOT NULL AND nombre != '' AND
    email IS NOT NULL AND email != '' AND
    telefono IS NOT NULL AND telefono != '' AND
    ubicacion IS NOT NULL AND ubicacion != '' AND
    cv_url IS NOT NULL AND cv_url != ''
);
