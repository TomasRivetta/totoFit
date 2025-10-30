"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
      alert("Error al cerrar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent" disabled={isLoading}>
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  )
}
