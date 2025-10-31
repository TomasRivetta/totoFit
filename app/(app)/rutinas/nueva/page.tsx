"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Edit2, Check, X, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Exercise = {
  id: string
  name: string
  mediaUrl: string
  sets: number
  reps: number
  weight: number
  orderIndex: number
  exerciseType: 'weight' | 'time'
  durationSeconds: number | null
}

export default function NuevaRutinaPage() {
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [workoutNotes, setWorkoutNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Estado del formulario de ejercicio
  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    mediaUrl: "",
    sets: 3,
    reps: 10,
    weight: 0,
    exerciseType: 'weight' as 'weight' | 'time',
    durationMinutes: 0,
    durationSeconds: 0,
  })

  const resetForm = () => {
    setExerciseForm({
      name: "",
      mediaUrl: "",
      sets: 3,
      reps: 10,
      weight: 0,
      exerciseType: 'weight',
      durationMinutes: 0,
      durationSeconds: 0,
    })
  }

  const handleAddExercise = () => {
    if (!exerciseForm.name.trim()) return

    const totalSeconds = exerciseForm.durationMinutes * 60 + exerciseForm.durationSeconds

    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: exerciseForm.name,
      mediaUrl: exerciseForm.mediaUrl,
      sets: exerciseForm.sets,
      reps: exerciseForm.reps,
      weight: exerciseForm.weight,
      orderIndex: exercises.length,
      exerciseType: exerciseForm.exerciseType,
      durationSeconds: exerciseForm.exerciseType === 'time' ? totalSeconds : null,
    }

    setExercises([...exercises, newExercise])
    resetForm()
    setIsAddingExercise(false)
  }

  const handleEditExercise = (id: string) => {
    const exercise = exercises.find((e) => e.id === id)
    if (exercise) {
      const durationMins = exercise.durationSeconds ? Math.floor(exercise.durationSeconds / 60) : 0
      const durationSecs = exercise.durationSeconds ? exercise.durationSeconds % 60 : 0
      
      setExerciseForm({
        name: exercise.name,
        mediaUrl: exercise.mediaUrl,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        exerciseType: exercise.exerciseType,
        durationMinutes: durationMins,
        durationSeconds: durationSecs,
      })
      setEditingExerciseId(id)
    }
  }

  const handleUpdateExercise = () => {
    if (!exerciseForm.name.trim() || !editingExerciseId) return

    const totalSeconds = exerciseForm.durationMinutes * 60 + exerciseForm.durationSeconds

    setExercises(
      exercises.map((ex) =>
        ex.id === editingExerciseId
          ? {
              ...ex,
              name: exerciseForm.name,
              mediaUrl: exerciseForm.mediaUrl,
              sets: exerciseForm.sets,
              reps: exerciseForm.reps,
              weight: exerciseForm.weight,
              exerciseType: exerciseForm.exerciseType,
              durationSeconds: exerciseForm.exerciseType === 'time' ? totalSeconds : null,
            }
          : ex,
      ),
    )
    resetForm()
    setEditingExerciseId(null)
  }

  const handleDeleteExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id))
  }

  const handleCancelEdit = () => {
    resetForm()
    setIsAddingExercise(false)
    setEditingExerciseId(null)
  }

  const handleFinishWorkout = async () => {
    if (exercises.length === 0) {
      alert("Agrega al menos un ejercicio antes de finalizar")
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // Crear el workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          workout_date: new Date().toISOString().split("T")[0],
          notes: workoutNotes || null,
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Insertar todos los ejercicios
      const exercisesToInsert = exercises.map((ex) => ({
        workout_id: workout.id,
        name: ex.name,
        media_url: ex.mediaUrl || null,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.exerciseType === 'weight' ? ex.weight : null,
        order_index: ex.orderIndex,
        exercise_type: ex.exerciseType,
        duration_seconds: ex.exerciseType === 'time' ? ex.durationSeconds : null,
      }))

      const { error: exercisesError } = await supabase.from("exercises").insert(exercisesToInsert)

      if (exercisesError) throw exercisesError

      router.push("/inicio")
    } catch (error) {
      console.error("Error al guardar rutina:", error)
      alert("Error al guardar la rutina. Intenta de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Nueva Rutina</h1>
        <p className="text-sm text-muted-foreground">Agrega ejercicios a tu entrenamiento</p>
      </div>

      {/* Lista de ejercicios */}
      <div className="mb-4 space-y-3">
        {exercises.map((exercise, index) => (
          <Card key={exercise.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-2 flex items-start gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-medium leading-tight">{exercise.name}</h3>
                      {exercise.mediaUrl && (
                        <a
                          href={exercise.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Ver referencia
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="ml-8 flex gap-4 text-sm text-muted-foreground">
                    {exercise.exerciseType === 'weight' ? (
                      <>
                        <span>{exercise.sets} series × {exercise.reps} reps</span>
                        {exercise.weight > 0 && <span>{exercise.weight} kg</span>}
                      </>
                    ) : (
                      <span>
                        {exercise.sets} series × {Math.floor((exercise.durationSeconds || 0) / 60)}:{((exercise.durationSeconds || 0) % 60).toString().padStart(2, '0')} min
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditExercise(exercise.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteExercise(exercise.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulario para agregar/editar ejercicio */}
      {(isAddingExercise || editingExerciseId) && (
        <Card className="mb-4 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">{editingExerciseId ? "Editar ejercicio" : "Nuevo ejercicio"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del ejercicio</Label>
              <Input
                id="name"
                placeholder="Ej: Press de banca"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaUrl">Link a video o foto (opcional)</Label>
              <Input
                id="mediaUrl"
                type="url"
                placeholder="https://..."
                value={exerciseForm.mediaUrl}
                onChange={(e) => setExerciseForm({ ...exerciseForm, mediaUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exerciseType">Tipo de ejercicio</Label>
              <Select
                value={exerciseForm.exerciseType}
                onValueChange={(value: 'weight' | 'time') => setExerciseForm({ ...exerciseForm, exerciseType: value })}
              >
                <SelectTrigger id="exerciseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Peso y repeticiones</SelectItem>
                  <SelectItem value="time">Tiempo (duración)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exerciseForm.exerciseType === 'weight' ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sets">Series</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    value={exerciseForm.sets}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, sets: Number.parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    value={exerciseForm.reps}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, reps: Number.parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.5"
                    value={exerciseForm.weight}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, weight: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sets">Series</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    value={exerciseForm.sets}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, sets: Number.parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Minutos</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="0"
                    value={exerciseForm.durationMinutes}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, durationMinutes: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationSeconds">Segundos</Label>
                  <Input
                    id="durationSeconds"
                    type="number"
                    min="0"
                    max="59"
                    value={exerciseForm.durationSeconds}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, durationSeconds: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={editingExerciseId ? handleUpdateExercise : handleAddExercise}
                className="flex-1"
                disabled={!exerciseForm.name.trim()}
              >
                <Check className="mr-2 h-4 w-4" />
                {editingExerciseId ? "Actualizar" : "Agregar"}
              </Button>
              <Button onClick={handleCancelEdit} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="space-y-3">
        {!isAddingExercise && !editingExerciseId && (
          <Button onClick={() => setIsAddingExercise(true)} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Agregar ejercicio
          </Button>
        )}

        {exercises.length > 0 && !isAddingExercise && !editingExerciseId && (
          <Button onClick={() => setShowFinishDialog(true)} className="w-full" size="lg">
            Finalizar rutina
          </Button>
        )}
      </div>

      {/* Diálogo de finalizar rutina */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar rutina</DialogTitle>
            <DialogDescription>¿Quieres agregar notas sobre este entrenamiento?</DialogDescription>
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
              {isSaving ? "Guardando..." : "Guardar rutina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
