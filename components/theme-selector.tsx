"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 bg-transparent" disabled>
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent" disabled>
          <Moon className="mr-2 h-4 w-4" />
          Oscuro
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent" disabled>
          <Monitor className="mr-2 h-4 w-4" />
          Sistema
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        className={cn("flex-1", theme === "light" && "bg-foreground text-background hover:bg-foreground/90")}
        onClick={() => setTheme("light")}
      >
        <Sun className="mr-2 h-4 w-4" />
        Claro
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        className={cn("flex-1", theme === "dark" && "bg-foreground text-background hover:bg-foreground/90")}
        onClick={() => setTheme("dark")}
      >
        <Moon className="mr-2 h-4 w-4" />
        Oscuro
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        className={cn("flex-1", theme === "system" && "bg-foreground text-background hover:bg-foreground/90")}
        onClick={() => setTheme("system")}
      >
        <Monitor className="mr-2 h-4 w-4" />
        Sistema
      </Button>
    </div>
  )
}
