"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useThemeMounted } from "./theme-provider"

export function ThemeDebugger() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
  const mounted = useThemeMounted()
  const [htmlClasses, setHtmlClasses] = useState<string>("")

  useEffect(() => {
    if (typeof document !== "undefined") {
      setHtmlClasses(document.documentElement.className)
    }
  }, [theme, resolvedTheme])

  if (!mounted) return <div>Loading theme debugger...</div>

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Theme Debugger</CardTitle>
        <CardDescription>Use this to diagnose theme switching issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium">Current Theme:</div>
          <div className="text-sm">{theme}</div>

          <div className="text-sm font-medium">Resolved Theme:</div>
          <div className="text-sm">{resolvedTheme}</div>

          <div className="text-sm font-medium">System Theme:</div>
          <div className="text-sm">{systemTheme}</div>

          <div className="text-sm font-medium">Provider Mounted:</div>
          <div className="text-sm">{mounted ? "Yes" : "No"}</div>

          <div className="text-sm font-medium">HTML Classes:</div>
          <div className="text-sm break-all">{htmlClasses}</div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" onClick={() => setTheme("light")}>
            Set Light
          </Button>
          <Button size="sm" onClick={() => setTheme("dark")}>
            Set Dark
          </Button>
          <Button size="sm" onClick={() => setTheme("system")}>
            Set System
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (typeof document !== "undefined") {
                setHtmlClasses(document.documentElement.className)
              }
            }}
          >
            Refresh Classes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
