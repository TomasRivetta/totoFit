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
import { Dumbbell, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type RoutineCardProps = {
  template: {
    id: string
    name: string
    exercises: {
      id: string
      name: string
      sets: number
      reps: number
      weight: number
    }[]
  }
}

export function RoutineCard({ template }: RoutineCardProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Eliminar ejercicios de la rutina
      const { error: exercisesError } = await supabase
        .from("routine_template_exercises")
        .delete()
        .eq("routine_template_id", template.id)

      if (exercisesError) throw exercisesError

      // Eliminar la rutina
      const { error: templateError } = await supabase
        .from("routine_templates")
        .delete()
        .eq("id", template.id)

      if (templateError) throw templateError

      router.refresh()
    } catch (error) {
      console.error("Error deleting routine:", error)
      alert("Error al eliminar la rutina")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-medium">{template.name}</CardTitle>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Dumbbell className="h-3 w-3" />
                {template.exercises.length} ejercicio{template.exercises.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push(`/rutinas/editar/${template.id}`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {template.exercises.slice(0, 3).map((exercise, index) => (
            <div key={exercise.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <h4 className="text-sm font-medium leading-tight">{exercise.name}</h4>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span>
                    {exercise.sets} × {exercise.reps}
                  </span>
                  {exercise.weight > 0 && <span>{exercise.weight} kg</span>}
                </div>
              </div>
            </div>
          ))}
          {template.exercises.length > 3 && (
            <p className="pt-1 text-center text-xs text-muted-foreground">
              +{template.exercises.length - 3} ejercicio{template.exercises.length - 3 !== 1 ? "s" : ""} más
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rutina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la rutina "{template.name}" y todos sus
              ejercicios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
