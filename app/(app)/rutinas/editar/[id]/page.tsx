"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Edit2, Check, X, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Exercise = {
  id: string
  name: string
  mediaUrl: string
  sets: number
  reps: number
  weight: number
  orderIndex: number
  isNew?: boolean
}

export default function EditarRutinaPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [loading, setLoading] = useState(true)
  const [routineName, setRoutineName] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    mediaUrl: "",
    sets: 3,
    reps: 10,
    weight: 0,
  })

  useEffect(() => {
    const loadRoutine = async () => {
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

      if (error || !data) {
        console.error("Error loading routine:", error)
        router.push("/rutinas")
        return
      }

      setRoutineName(data.name)
      const loadedExercises = (data.routine_template_exercises as any[])
        .map((ex) => ({
          id: ex.id,
          name: ex.name,
          mediaUrl: ex.media_url || "",
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          orderIndex: ex.order_index,
          isNew: false,
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex)

      setExercises(loadedExercises)
      setLoading(false)
    }

    loadRoutine()
  }, [templateId, router])

  const resetForm = () => {
    setExerciseForm({
      name: "",
      mediaUrl: "",
      sets: 3,
      reps: 10,
      weight: 0,
    })
  }

  const handleAddExercise = () => {
    if (!exerciseForm.name.trim()) return

    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: exerciseForm.name,
      mediaUrl: exerciseForm.mediaUrl,
      sets: exerciseForm.sets,
      reps: exerciseForm.reps,
      weight: exerciseForm.weight,
      orderIndex: exercises.length,
      isNew: true,
    }

    setExercises([...exercises, newExercise])
    resetForm()
    setIsAddingExercise(false)
  }

  const handleEditExercise = (id: string) => {
    const exercise = exercises.find((e) => e.id === id)
    if (exercise) {
      setExerciseForm({
        name: exercise.name,
        mediaUrl: exercise.mediaUrl,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
      })
      setEditingExerciseId(id)
    }
  }

  const handleUpdateExercise = () => {
    if (!exerciseForm.name.trim() || !editingExerciseId) return

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

  const handleSaveTemplate = async () => {
    if (!routineName.trim()) {
      alert("Por favor ingresa un nombre para la rutina")
      return
    }

    if (exercises.length === 0) {
      alert("Agrega al menos un ejercicio antes de guardar")
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      // Actualizar el nombre de la rutina
      const { error: updateError } = await supabase
        .from("routine_templates")
        .update({ name: routineName })
        .eq("id", templateId)

      if (updateError) throw updateError

      // Eliminar todos los ejercicios existentes
      const { error: deleteError } = await supabase
        .from("routine_template_exercises")
        .delete()
        .eq("routine_template_id", templateId)

      if (deleteError) throw deleteError

      // Insertar todos los ejercicios (nuevos y modificados)
      const exercisesToInsert = exercises.map((ex, index) => ({
        routine_template_id: templateId,
        name: ex.name,
        media_url: ex.mediaUrl || null,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        order_index: index,
      }))

      const { error: insertError } = await supabase
        .from("routine_template_exercises")
        .insert(exercisesToInsert)

      if (insertError) throw insertError

      router.push("/rutinas")
      router.refresh()
    } catch (error) {
      console.error("Error al actualizar rutina:", error)
      alert("Error al actualizar la rutina. Intenta de nuevo.")
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

  return (
    <div className="mx-auto min-h-screen max-w-lg p-6 pb-24">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/rutinas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Rutina</h1>
            <p className="text-sm text-muted-foreground">Modifica tu plantilla de entrenamiento</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="routineName">Nombre de la rutina</Label>
          <Input
            id="routineName"
            placeholder="Ej: Piernas, Pecho y Tríceps, Full Body..."
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
          />
        </div>
      </div>

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
                    <span>
                      {exercise.sets} series × {exercise.reps} reps
                    </span>
                    {exercise.weight > 0 && <span>{exercise.weight} kg</span>}
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

      <div className="space-y-3">
        {!isAddingExercise && !editingExerciseId && (
          <Button onClick={() => setIsAddingExercise(true)} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Agregar ejercicio
          </Button>
        )}

        {exercises.length > 0 && !isAddingExercise && !editingExerciseId && (
          <Button onClick={() => setShowSaveDialog(true)} className="w-full" size="lg">
            Guardar cambios
          </Button>
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar cambios</DialogTitle>
            <DialogDescription>¿Deseas guardar los cambios en la rutina "{routineName}"?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving || !routineName.trim()}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
