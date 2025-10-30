import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Dumbbell, Clock, Calendar, StickyNote } from "lucide-react"
import Link from "next/link"
import { DeleteWorkoutButton } from "@/components/delete-workout-button"

type ExerciseSet = {
  id: string
  set_number: number
  reps: number
  weight: number
}

type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
  order_index: number
  exercise_sets: ExerciseSet[]
}

type Workout = {
  id: string
  workout_date: string
  notes: string | null
  routine_name: string | null
  duration_seconds: number | null
  exercises: Exercise[]
}

async function getWorkout(workoutId: string, userId: string): Promise<Workout | null> {
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
      exercises (
        id,
        name,
        sets,
        reps,
        weight,
        order_index,
        exercise_sets (
          id,
          set_number,
          reps,
          weight
        )
      )
    `,
    )
    .eq("id", workoutId)
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return null
  }

  const exercises = (data.exercises as any[])
    .map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      order_index: ex.order_index,
      exercise_sets: (ex.exercise_sets || []).sort(
        (a: any, b: any) => a.set_number - b.set_number
      ),
    }))
    .sort((a, b) => a.order_index - b.order_index)

  return {
    id: data.id,
    workout_date: data.workout_date,
    notes: data.notes,
    routine_name: data.routine_name,
    duration_seconds: data.duration_seconds,
    exercises,
  }
}

export default async function EntrenamientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { id } = await params
  const workout = await getWorkout(id, user.id)

  if (!workout) {
    notFound()
  }

  const workoutDate = new Date(workout.workout_date)
  const formattedDate = workoutDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Formatear duración
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/calendario">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {workout.routine_name || "Entrenamiento"}
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ejercicios</p>
                <p className="text-lg font-bold">{workout.exercises.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duración</p>
                <p className="text-lg font-bold">
                  {formatDuration(workout.duration_seconds)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notas */}
        {workout.notes && (
          <Card className="mt-3 border-border/50">
            <CardContent className="flex items-start gap-3 p-4">
              <StickyNote className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Notas</p>
                <p className="mt-1 text-sm">{workout.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de ejercicios */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Ejercicios realizados</h2>
        {workout.exercises.map((exercise, index) => (
          <Card key={exercise.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium leading-tight">{exercise.name}</h3>
                  
                  {/* Mostrar series individuales si existen */}
                  {exercise.exercise_sets && exercise.exercise_sets.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {exercise.exercise_sets.map((set) => (
                        <div key={set.id} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Serie {set.set_number}:</span>
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {set.weight} kg
                          </Badge>
                          <span className="text-muted-foreground">×</span>
                          <Badge variant="secondary" className="text-xs">
                            {set.reps} reps
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Fallback para entrenamientos antiguos sin series individuales
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {exercise.sets} series
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {exercise.reps} reps
                      </Badge>
                      {exercise.weight > 0 && (
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {exercise.weight} kg
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botón para eliminar */}
      <div className="mt-6">
        <DeleteWorkoutButton workoutId={workout.id} />
      </div>
    </div>
  )
}
