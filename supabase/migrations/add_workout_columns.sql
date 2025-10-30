-- Agregar columnas faltantes a la tabla workouts
ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS routine_name TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Crear índice para búsquedas por nombre de rutina
CREATE INDEX IF NOT EXISTS idx_workouts_routine_name ON public.workouts(routine_name);
