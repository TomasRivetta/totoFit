import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dumbbell, ArrowLeft, Play } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

type RoutineTemplate = {
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

async function getRoutineTemplates(userId: string): Promise<RoutineTemplate[]> {
  const supabase = await createClient()

  const { data: templates, error } = await supabase
    .from("routine_templates")
    .select(
      `
      id,
      name,
      routine_template_exercises (
        id,
        name,
        sets,
        reps,
        weight
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching routine templates:", error)
    return []
  }

  return (
    templates?.map((template: any) => ({
      id: template.id,
      name: template.name,
      exercises: template.routine_template_exercises || [],
    })) || []
  )
}

export default async function IniciarRutinaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const templates = await getRoutineTemplates(user.id)

  return (
    <div className="mx-auto min-h-screen max-w-lg p-6 pb-24">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/inicio">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Iniciar Entrenamiento</h1>
            <p className="text-sm text-muted-foreground">Selecciona una rutina</p>
          </div>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No hay rutinas disponibles</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Primero crea una plantilla de rutina para poder entrenar
            </p>
            <Button asChild>
              <Link href="/rutinas/crear">Crear rutina</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">{template.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Dumbbell className="h-3 w-3" />
                      {template.exercises.length} ejercicio{template.exercises.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/rutinas/sesion/${template.id}`}>
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {template.exercises.slice(0, 4).map((exercise, index) => (
                  <div key={exercise.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium leading-tight">{exercise.name}</h4>
                      <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                        <span>
                          {exercise.sets} × {exercise.reps}
                        </span>
                        {exercise.weight > 0 && <span>{exercise.weight} kg</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {template.exercises.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{template.exercises.length - 4} ejercicio{template.exercises.length - 4 !== 1 ? "s" : ""} más
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
