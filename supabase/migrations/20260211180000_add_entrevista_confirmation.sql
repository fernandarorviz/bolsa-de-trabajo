
-- Add confirmada column to entrevistas table
ALTER TABLE public.entrevistas 
ADD COLUMN confirmada BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN public.entrevistas.confirmada IS 'NULL: Pendiente, TRUE: Confirmada, FALSE: Rechazada';
