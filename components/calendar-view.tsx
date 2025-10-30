"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight, Dumbbell, TrendingUp, Flame, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type WorkoutDate = {
  workout_date: string
  id: string
  notes: string | null
  exercise_count: number
  routine_name: string | null
  duration_seconds: number | null
}

type CalendarViewProps = {
  workoutDates: WorkoutDate[]
}

// Formatear segundos a hh:mm:ss
const formatDuration = (seconds: number | null) => {
  if (!seconds) return null
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function CalendarView({ workoutDates }: CalendarViewProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const workoutsPerPage = 5
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Crear un mapa de fechas de entrenamiento para búsqueda rápida
  const workoutMap = new Map(workoutDates.map((w) => [w.workout_date, w]))

  // Obtener el primer y último día del mes actual
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Ajustar para que la semana empiece en lunes (0 = lunes, 6 = domingo)
  const startOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1

  // Calcular estadísticas
  const totalWorkouts = workoutDates.length
  const uniqueDates = new Set(workoutDates.map((w) => w.workout_date))
  const totalDays = uniqueDates.size

  // Entrenamientos del mes actual
  const currentMonthWorkouts = workoutDates.filter((w) => {
    const date = new Date(w.workout_date)
    return date.getMonth() === month && date.getFullYear() === year
  }).length

  // Calcular racha actual
  const calculateStreak = () => {
    if (workoutDates.length === 0) return 0

    const sortedDates = [...workoutDates].map((w) => new Date(w.workout_date)).sort((a, b) => b.getTime() - a.getTime())

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const lastWorkout = sortedDates[0]
    lastWorkout.setHours(0, 0, 0, 0)

    // Si el último entrenamiento no fue hoy ni ayer, la racha es 0
    if (lastWorkout.getTime() !== today.getTime() && lastWorkout.getTime() !== yesterday.getTime()) {
      return 0
    }

    let streak = 1
    let currentCheckDate = new Date(lastWorkout)

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i])
      prevDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(currentCheckDate)
      expectedDate.setDate(expectedDate.getDate() - 1)

      if (prevDate.getTime() === expectedDate.getTime()) {
        streak++
        currentCheckDate = prevDate
      } else {
        break
      }
    }

    return streak
  }

  const currentStreak = calculateStreak()

  // Navegar entre meses
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Formatear el mes y año
  const monthName = currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })

  // Generar los días del calendario
  const calendarDays = []
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null) // Días vacíos antes del primer día del mes
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const hasWorkout = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return workoutMap.has(dateStr)
  }

  const getWorkoutForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return workoutMap.get(dateStr)
  }

  const handleDeleteWorkout = async () => {
    if (!deletingWorkoutId) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Eliminar sets de ejercicios
      const { data: exercises } = await supabase
        .from("exercises")
        .select("id")
        .eq("workout_id", deletingWorkoutId)

      if (exercises) {
        for (const exercise of exercises) {
          await supabase
            .from("exercise_sets")
            .delete()
            .eq("exercise_id", exercise.id)
        }
      }

      // Eliminar ejercicios
      await supabase
        .from("exercises")
        .delete()
        .eq("workout_id", deletingWorkoutId)

      // Eliminar entrenamiento
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", deletingWorkoutId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting workout:", error)
      alert("Error al eliminar el entrenamiento")
    } finally {
      setIsDeleting(false)
      setDeletingWorkoutId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalDays}</p>
              <p className="text-center text-xs text-muted-foreground">Días totales</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-1">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{currentMonthWorkouts}</p>
              <p className="text-center text-xs text-muted-foreground">Este mes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-1">
              <Flame className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-center text-xs text-muted-foreground">Racha</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendario */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium capitalize">{monthName}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={goToToday}>
                Hoy
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Días de la semana */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
              <div key={day} className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-10" />
              }

              const workout = getWorkoutForDay(day)
              const today = isToday(day)
              const hasWorkoutDay = hasWorkout(day)

              if (hasWorkoutDay && workout) {
                return (
                  <Link
                    key={day}
                    href={`/entrenamientos/${workout.id}`}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-md text-sm transition-colors",
                      "bg-foreground font-medium text-background hover:bg-foreground/90",
                      today && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                    )}
                    title={`${workout.routine_name || "Entrenamiento"} - ${workout.exercise_count} ejercicios${workout.duration_seconds ? ` (${formatDuration(workout.duration_seconds)})` : ""}${workout.notes ? ` - ${workout.notes}` : ""}`}
                  >
                    {day}
                  </Link>
                )
              }

              return (
                <div
                  key={day}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-md text-sm transition-colors",
                    today && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                    "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-foreground" />
              <span>Día entrenado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de entrenamientos recientes */}
      {workoutDates.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Entrenamientos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {workoutDates.slice((currentPage - 1) * workoutsPerPage, currentPage * workoutsPerPage).map((workout) => {
                const date = new Date(workout.workout_date)
                const formattedDate = date.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })

                return (
                  <div
                    key={workout.id}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                  >
                    <Link
                      href={`/entrenamientos/${workout.id}`}
                      className="flex flex-1 items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{workout.routine_name || "Entrenamiento"}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {formattedDate} • {workout.exercise_count} ejercicios
                          {workout.duration_seconds && ` • ${formatDuration(workout.duration_seconds)}`}
                        </p>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        setDeletingWorkoutId(workout.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Paginador */}
            {workoutDates.length > workoutsPerPage && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {Math.ceil(workoutDates.length / workoutsPerPage)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(workoutDates.length / workoutsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(workoutDates.length / workoutsPerPage)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!deletingWorkoutId} onOpenChange={() => setDeletingWorkoutId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrenamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este entrenamiento y todos sus ejercicios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteWorkout} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
