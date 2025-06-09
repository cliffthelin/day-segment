"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface InteractiveExampleProps {
  title: string
  description?: string
  children: React.ReactNode
}

export function InteractiveExample({ title, description, children }: InteractiveExampleProps) {
  const [isReset, setIsReset] = useState(false)

  const handleReset = () => {
    setIsReset(true)
    setTimeout(() => setIsReset(false), 100) // Quick reset to trigger child component resets
  }

  return (
    <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <span>{title}</span>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 w-7 p-0">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Reset example</span>
          </Button>
        </CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="pt-0">{!isReset && children}</CardContent>
      <CardFooter className="bg-amber-100/50 dark:bg-amber-900/20 text-xs text-muted-foreground py-1 px-3">
        Try it out! Click the refresh icon to reset.
      </CardFooter>
    </Card>
  )
}
