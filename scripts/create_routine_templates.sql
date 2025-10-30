-- Create routine_templates table
CREATE TABLE IF NOT EXISTS routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create routine_template_exercises table
CREATE TABLE IF NOT EXISTS routine_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_template_id UUID NOT NULL REFERENCES routine_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  media_url TEXT,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  weight NUMERIC(5, 2) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add routine_name and duration_minutes columns to workouts table
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS routine_name TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routine_templates_user_id ON routine_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_template_exercises_template_id ON routine_template_exercises(routine_template_id);

-- Enable Row Level Security
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_template_exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for routine_templates
CREATE POLICY "Users can view their own routine templates"
  ON routine_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routine templates"
  ON routine_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine templates"
  ON routine_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine templates"
  ON routine_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for routine_template_exercises
CREATE POLICY "Users can view exercises from their routine templates"
  ON routine_template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routine_templates 
      WHERE routine_templates.id = routine_template_exercises.routine_template_id 
      AND routine_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercises for their routine templates"
  ON routine_template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routine_templates 
      WHERE routine_templates.id = routine_template_exercises.routine_template_id 
      AND routine_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises from their routine templates"
  ON routine_template_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routine_templates 
      WHERE routine_templates.id = routine_template_exercises.routine_template_id 
      AND routine_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from their routine templates"
  ON routine_template_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM routine_templates 
      WHERE routine_templates.id = routine_template_exercises.routine_template_id 
      AND routine_templates.user_id = auth.uid()
    )
  );
