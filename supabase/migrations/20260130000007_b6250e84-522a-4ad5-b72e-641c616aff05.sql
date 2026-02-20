-- Add 'propuesta' to valid states if check constraint exists
DO $$ 
BEGIN
  ALTER TABLE public.entrevistas DROP CONSTRAINT IF EXISTS entrevistas_estado_check;
  ALTER TABLE public.entrevistas ADD CONSTRAINT entrevistas_estado_check 
    CHECK (estado IN ('programada', 'reprogramada', 'realizada', 'cancelada', 'propuesta'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Add proposed_slots column
ALTER TABLE public.entrevistas 
ADD COLUMN IF NOT EXISTS proposed_slots JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.entrevistas.proposed_slots IS 'Array of objects with {start, end} for proposed interview slots';