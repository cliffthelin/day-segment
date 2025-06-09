"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSetting } from "@/hooks/use-dexie-store"
import { allThemes } from "@/components/theme-customizer"

export function ColorPreview() {
  const [primaryColor, setPrimaryColor] = useSetting("primaryColor", "default")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const selectedTheme = allThemes.find((t) => t.id === primaryColor)
  const themeName = selectedTheme?.name || "Default"

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-medium">Color Preview: {themeName}</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>

          <div className="space-y-2">
            <Progress value={45} className="w-full" />
            <Progress value={75} className="w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
