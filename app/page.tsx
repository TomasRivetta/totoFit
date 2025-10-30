import { Button } from "@/components/ui/button"
import { Dumbbell } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-foreground">
            <Dumbbell className="h-10 w-10 text-background" />
          </div>
        </div>
        <h1 className="mb-4 text-balance text-5xl font-bold tracking-tight">TotoFit</h1>
        <p className="mb-8 text-pretty text-lg text-muted-foreground">
          Tu compañero de entrenamiento minimalista. Registra tus rutinas, sigue tu progreso y mantén la motivación.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="min-w-[140px]">
            <Link href="/auth/registro">Comenzar</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-w-[140px] bg-transparent">
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
