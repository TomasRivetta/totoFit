-- Agregar columna para tipo de ejercicio (weight = peso/reps, time = duración)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS exercise_type TEXT NOT NULL DEFAULT 'weight',
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Agregar constraint para validar el tipo de ejercicio
ALTER TABLE exercises 
ADD CONSTRAINT exercises_type_check CHECK (exercise_type IN ('weight', 'time'));

-- Agregar columnas a la tabla de plantillas de ejercicios
ALTER TABLE routine_template_exercises 
ADD COLUMN IF NOT EXISTS exercise_type TEXT NOT NULL DEFAULT 'weight',
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Agregar constraint para validar el tipo de ejercicio en plantillas
ALTER TABLE routine_template_exercises 
ADD CONSTRAINT routine_template_exercises_type_check CHECK (exercise_type IN ('weight', 'time'));

-- Agregar columna para duración en segundos a las series individuales
ALTER TABLE exercise_sets 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Hacer que weight pueda ser NULL para ejercicios de tiempo
ALTER TABLE exercise_sets 
ALTER COLUMN weight DROP NOT NULL;

-- Agregar constraint para que weight sea NULL cuando es ejercicio de tiempo
-- y duration_seconds sea NULL cuando es ejercicio de peso
ALTER TABLE exercise_sets 
ADD CONSTRAINT exercise_sets_type_data_check CHECK (
  (weight IS NOT NULL AND duration_seconds IS NULL) OR 
  (weight IS NULL AND duration_seconds IS NOT NULL)
);
