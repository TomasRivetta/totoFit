import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Moon, Info } from "lucide-react"
import { ThemeSelector } from "@/components/theme-selector"
import { ProfileEditor } from "@/components/profile-editor"
import { LogoutButton } from "@/components/logout-button"

async function getUserStats(userId: string) {
  const supabase = await createClient()

  // Obtener total de entrenamientos
  const { data: workouts } = await supabase.from("workouts").select("id, workout_date").eq("user_id", userId)

  // Obtener total de ejercicios
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id")
    .in("workout_id", workouts?.map((w) => w.id) || [])

  const totalWorkouts = workouts?.length || 0
  const totalExercises = exercises?.length || 0
  const uniqueDates = new Set(workouts?.map((w) => w.workout_date) || [])
  const totalDays = uniqueDates.size

  return { totalWorkouts, totalExercises, totalDays }
}

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

  const stats = await getUserStats(user.id)

  return (
    <div className="mx-auto min-h-screen max-w-lg p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajusta tu experiencia</p>
      </div>

      <div className="space-y-4">
        {/* Perfil */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <ProfileEditor currentName={profile?.display_name || "Usuario"} userId={user.id} />
          </CardContent>
        </Card>

        {/* Tema */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Moon className="h-5 w-5" />
              Apariencia
            </CardTitle>
            <CardDescription>Selecciona el tema de la aplicación</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-5 w-5" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Días entrenados</span>
              <span className="font-medium">{stats.totalDays}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de entrenamientos</span>
              <span className="font-medium">{stats.totalWorkouts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de ejercicios</span>
              <span className="font-medium">{stats.totalExercises}</span>
            </div>
          </CardContent>
        </Card>

        {/* Acerca de */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Acerca de TotoFit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Versión</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu compañero de entrenamiento minimalista para registrar rutinas y seguir tu progreso.
            </p>
          </CardContent>
        </Card>

        {/* Cerrar sesión */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
