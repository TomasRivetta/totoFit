"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

type ProfileEditorProps = {
  currentName: string
  userId: string
}

export function ProfileEditor({ currentName, userId }: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", userId)

      if (error) throw error

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setName(currentName)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Nombre</p>
          <p className="font-medium">{currentName}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          disabled={isSaving}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving || !name.trim()} className="flex-1">
          <Check className="mr-2 h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
        <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}
