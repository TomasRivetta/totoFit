"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type DeleteWorkoutButtonProps = {
  workoutId: string
}

export function DeleteWorkoutButton({ workoutId }: DeleteWorkoutButtonProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Eliminar sets de ejercicios
      const { data: exercises } = await supabase
        .from("exercises")
        .select("id")
        .eq("workout_id", workoutId)

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
        .eq("workout_id", workoutId)

      // Eliminar entrenamiento
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId)

      if (error) throw error

      router.push("/calendario")
      router.refresh()
    } catch (error) {
      console.error("Error deleting workout:", error)
      alert("Error al eliminar el entrenamiento")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar entrenamiento
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
