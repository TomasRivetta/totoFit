import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dumbbell } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { RoutineCard } from "@/components/routine-card"

type RoutineTemplate = {
  id: string
  name: string
  created_at: string
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
      created_at,
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
      created_at: template.created_at,
      exercises: template.routine_template_exercises || [],
    })) || []
  )
}

export default async function RutinasPage() {
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Rutinas</h1>
          <p className="text-sm text-muted-foreground">Plantillas de entrenamiento</p>
        </div>
        <Button asChild size="sm">
          <Link href="/rutinas/crear">
            <Dumbbell className="mr-2 h-4 w-4" />
            Crear
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No hay rutinas aún</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Crea plantillas de rutinas para usarlas cuando entrenes
            </p>
            <Button asChild>
              <Link href="/rutinas/crear">Crear rutina</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <RoutineCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  )
}
