import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, TrendingUp } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

const motivationalQuotes = [
  "El único mal entrenamiento es el que no hiciste",
  "Tu cuerpo puede soportar casi cualquier cosa. Es tu mente la que debes convencer",
  "No se trata de ser el mejor. Se trata de ser mejor que ayer",
  "El dolor que sientes hoy será la fuerza que sientas mañana",
  "La disciplina es hacer lo que debe hacerse, cuando debe hacerse",
  "Los resultados no vienen de la comodidad",
  "Cada día es una nueva oportunidad para mejorar",
]

async function getWorkoutStats(userId: string) {
  const supabase = await createClient()

  // Obtener todos los entrenamientos del usuario
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("workout_date")
    .eq("user_id", userId)
    .order("workout_date", { ascending: false })

  if (error) {
    console.error("Error fetching workouts:", error)
    return { totalDays: 0, thisMonth: 0 }
  }

  // Contar días únicos de entrenamiento
  const uniqueDates = new Set(workouts?.map((w) => w.workout_date) || [])
  const totalDays = uniqueDates.size

  // Contar entrenamientos del mes actual
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonth =
    workouts?.filter((w) => {
      const date = new Date(w.workout_date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }).length || 0

  return { totalDays, thisMonth }
}

export default async function InicioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

  const stats = await getWorkoutStats(user.id)

  // Seleccionar frase motivacional aleatoria
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]

  return (
    <div className="mx-auto min-h-screen max-w-lg p-6">
      {/* Header con saludo y toggle de tema */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hola, {profile?.display_name || "Usuario"}</h1>
          <p className="text-sm text-muted-foreground">Listo para entrenar hoy</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Frase motivacional */}
      <Card className="mb-6 border-border/50 bg-card">
        <CardContent className="p-6">
          <p className="text-balance text-center text-lg font-medium leading-relaxed">{randomQuote}</p>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.totalDays}</p>
                <p className="text-sm text-muted-foreground">Días entrenados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-2">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.thisMonth}</p>
                <p className="text-sm text-muted-foreground">Este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón para iniciar rutina */}
      <Button asChild size="lg" className="w-full">
        <Link href="/rutinas/iniciar">
          <Dumbbell className="mr-2 h-5 w-5" />
          Iniciar Rutina
        </Link>
      </Button>
    </div>
  )
}
