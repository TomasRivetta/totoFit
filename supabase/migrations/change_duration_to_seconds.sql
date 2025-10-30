-- Renombrar duration_minutes a duration_seconds y mantener la data existente (convertir minutos a segundos)
ALTER TABLE public.workouts 
RENAME COLUMN duration_minutes TO duration_seconds;

-- Actualizar valores existentes: convertir minutos a segundos
UPDATE public.workouts 
SET duration_seconds = duration_seconds * 60
WHERE duration_seconds IS NOT NULL;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.workouts.duration_seconds IS 'Duración del entrenamiento en segundos';
