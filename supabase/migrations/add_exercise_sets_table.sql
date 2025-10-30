-- Crear tabla para almacenar las series individuales de cada ejercicio
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT exercise_sets_set_number_check CHECK (set_number > 0)
);

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);

-- Habilitar RLS
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias series
CREATE POLICY "Users can view their own exercise sets"
  ON exercise_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE e.id = exercise_sets.exercise_id
      AND w.user_id = auth.uid()
    )
  );

-- Política para que los usuarios puedan insertar sus propias series
CREATE POLICY "Users can insert their own exercise sets"
  ON exercise_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE e.id = exercise_sets.exercise_id
      AND w.user_id = auth.uid()
    )
  );

-- Política para que los usuarios puedan actualizar sus propias series
CREATE POLICY "Users can update their own exercise sets"
  ON exercise_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE e.id = exercise_sets.exercise_id
      AND w.user_id = auth.uid()
    )
  );

-- Política para que los usuarios puedan eliminar sus propias series
CREATE POLICY "Users can delete their own exercise sets"
  ON exercise_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE e.id = exercise_sets.exercise_id
      AND w.user_id = auth.uid()
    )
  );
