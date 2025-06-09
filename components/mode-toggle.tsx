"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useThemeMounted } from "./theme-provider"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useThemeMounted()
  const { toast } = useToast()

  // Debug function to help diagnose theme issues
  const debugTheme = () => {
    console.log({
      currentTheme: theme,
      resolvedTheme,
      documentClassList: typeof document !== "undefined" ? document.documentElement.classList : "N/A",
      mounted,
    })

    toast({
      title: "Theme Debug Info",
      description: `Current: ${theme}, Resolved: ${resolvedTheme}, Mounted: ${mounted}`,
      duration: 5000,
    })
  }

  const handleThemeChange = (newTheme: string) => {
    console.log(`Setting theme to: ${newTheme}`)
    setTheme(newTheme)

    toast({
      title: `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated`,
      description: newTheme === "system" ? "Using your system preference" : `Switched to ${newTheme} mode`,
      duration: 2000,
    })
  }

  // If not mounted, show a placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  // Use resolvedTheme for the UI to ensure it matches what's actually shown
  const currentTheme = resolvedTheme || theme

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => debugTheme()}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")} className="flex items-center gap-2 cursor-pointer">
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {currentTheme === "light" && <span className="ml-auto text-xs opacity-60">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")} className="flex items-center gap-2 cursor-pointer">
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {currentTheme === "dark" && <span className="ml-auto text-xs opacity-60">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {currentTheme === "system" && <span className="ml-auto text-xs opacity-60">Active</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
