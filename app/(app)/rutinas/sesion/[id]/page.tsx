"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, Clock, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"

type Exercise = {
  id: string
  name: string
  mediaUrl: string | null
  sets: number
  reps: number
  weight: number
  orderIndex: number
}

type SetData = {
  setNumber: number
  weight: number
  reps: number
}

type RoutineTemplate = {
  id: string
  name: string
  exercises: Exercise[]
}

export default function SesionRutinaPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<RoutineTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [workoutNotes, setWorkoutNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  // Almacenar los datos de cada serie: exerciseId -> array de SetData
  const [exerciseSets, setExerciseSets] = useState<Record<string, SetData[]>>({})

  // Timer que actualiza cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  // Formatear tiempo transcurrido
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Cargar la plantilla de rutina
  useEffect(() => {
    const loadTemplate = async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("routine_templates")
        .select(
          `
          id,
          name,
          routine_template_exercises (
            id,
            name,
            media_url,
            sets,
            reps,
            weight,
            order_index
          )
        `,
        )
        .eq("id", templateId)
        .single()

      if (error) {
        console.error("Error loading template:", error)
        router.push("/rutinas/iniciar")
        return
      }

      const exercises = (data.routine_template_exercises as any[])
        .map((ex) => ({
          id: ex.id,
          name: ex.name,
          mediaUrl: ex.media_url,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          orderIndex: ex.order_index,
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex)

      setTemplate({
        id: data.id,
        name: data.name,
        exercises,
      })

      // Inicializar las series con los valores de la plantilla
      const initialSets: Record<string, SetData[]> = {}
      exercises.forEach((ex) => {
        const sets: SetData[] = []
        for (let i = 1; i <= ex.sets; i++) {
          sets.push({
            setNumber: i,
            weight: ex.weight,
            reps: ex.reps,
          })
        }
        initialSets[ex.id] = sets
      })
      setExerciseSets(initialSets)
      setLoading(false)
    }

    loadTemplate()
  }, [templateId, router])

  const handleFinishWorkout = async () => {
    if (!template) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // Calcular duración en tiempo real desde startTime
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

      // Crear el workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          workout_date: new Date().toISOString().split("T")[0],
          notes: workoutNotes || null,
          routine_name: template.name,
          duration_seconds: elapsedSeconds,
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Insertar todos los ejercicios y sus series
      for (const ex of template.exercises) {
        const sets = exerciseSets[ex.id] || []
        
        // Insertar el ejercicio
        const { data: exerciseData, error: exerciseError } = await supabase
          .from("exercises")
          .insert({
            workout_id: workout.id,
            name: ex.name,
            media_url: ex.mediaUrl,
            sets: ex.sets,
            reps: ex.reps,
            weight: sets[0]?.weight ?? ex.weight, // Peso de la primera serie como referencia
            order_index: ex.orderIndex,
          })
          .select()
          .single()

        if (exerciseError) throw exerciseError

        // Insertar las series individuales
        const setsToInsert = sets.map((set) => ({
          exercise_id: exerciseData.id,
          set_number: set.setNumber,
          reps: set.reps,
          weight: set.weight,
        }))

        const { error: setsError } = await supabase.from("exercise_sets").insert(setsToInsert)

        if (setsError) throw setsError
      }

      router.push("/inicio")
    } catch (error) {
      console.error("Error al guardar entrenamiento:", error)
      alert("Error al guardar el entrenamiento. Intenta de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-lg p-6 pb-24">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando rutina...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg p-6 pb-24">
      {/* Header con timer */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
            <p className="text-sm text-muted-foreground">{template.exercises.length} ejercicios</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
            <Clock className="h-5 w-5" />
            <span className="text-lg font-mono font-semibold">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      {/* Lista de ejercicios */}
      <div className="mb-6 space-y-3">
        {template.exercises.map((exercise, index) => (
          <Card key={exercise.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium leading-tight">{exercise.name}</h3>
                    {exercise.mediaUrl && (
                      <a
                        href={exercise.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {/* Series individuales */}
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Series:</p>
                    {(exerciseSets[exercise.id] || []).map((set, setIndex) => (
                      <div key={setIndex} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12">Serie {set.setNumber}:</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={set.weight}
                          onChange={(e) => {
                            const newWeight = parseFloat(e.target.value) || 0
                            setExerciseSets((prev) => {
                              const sets = [...(prev[exercise.id] || [])]
                              sets[setIndex] = { ...sets[setIndex], weight: newWeight }
                              return { ...prev, [exercise.id]: sets }
                            })
                          }}
                          className="h-8 w-20"
                          placeholder="Peso"
                        />
                        <span className="text-xs text-muted-foreground">kg</span>
                        <span className="text-xs text-muted-foreground">×</span>
                        <Input
                          type="number"
                          min="0"
                          value={set.reps}
                          onChange={(e) => {
                            const newReps = parseInt(e.target.value) || 0
                            setExerciseSets((prev) => {
                              const sets = [...(prev[exercise.id] || [])]
                              sets[setIndex] = { ...sets[setIndex], reps: newReps }
                              return { ...prev, [exercise.id]: sets }
                            })
                          }}
                          className="h-8 w-16"
                          placeholder="Reps"
                        />
                        <span className="text-xs text-muted-foreground">reps</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botón de finalizar */}
      <Button onClick={() => setShowFinishDialog(true)} className="w-full" size="lg">
        <CheckCircle2 className="mr-2 h-5 w-5" />
        Finalizar Día
      </Button>

      {/* Diálogo de finalizar */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar entrenamiento</DialogTitle>
            <DialogDescription>
              Has entrenado durante {formatTime(elapsedTime)}. ¿Quieres agregar notas?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Buen entrenamiento, me sentí con energía..."
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinishDialog(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleFinishWorkout} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar entrenamiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
