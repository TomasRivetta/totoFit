import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CalendarView } from "@/components/calendar-view"

type WorkoutDate = {
  workout_date: string
  id: string
  notes: string | null
  exercise_count: number
  routine_name: string | null
  duration_seconds: number | null
}

async function getWorkoutDates(userId: string): Promise<WorkoutDate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      id,
      workout_date,
      notes,
      routine_name,
      duration_seconds,
      exercises (count)
    `,
    )
    .eq("user_id", userId)
    .order("workout_date", { ascending: false })

  if (error) {
    console.error("Error fetching workout dates:", error)
    return []
  }

  return (
    data?.map((workout) => ({
      id: workout.id,
      workout_date: workout.workout_date,
      notes: workout.notes,
      routine_name: workout.routine_name,
      duration_seconds: workout.duration_seconds,
      exercise_count: Array.isArray(workout.exercises) ? workout.exercises.length : 0,
    })) || []
  )
}

export default async function CalendarioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const workoutDates = await getWorkoutDates(user.id)

  return (
    <div className="mx-auto min-h-screen max-w-lg p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <p className="text-sm text-muted-foreground">Visualiza tu progreso</p>
      </div>

      <CalendarView workoutDates={workoutDates} />
    </div>
  )
}
