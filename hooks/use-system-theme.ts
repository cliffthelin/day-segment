"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function useSystemTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Detect initial system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemTheme(mediaQuery.matches ? "dark" : "light")

    // Listen for changes in system preference
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light"
      setSystemTheme(newTheme)

      // If using system theme, update to match new system preference
      if (theme === "system") {
        // No need to call setTheme as next-themes handles this automatically
        // Just update our local state
        setSystemTheme(newTheme)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, setTheme])

  return {
    systemTheme,
    isUsingSystemTheme: theme === "system",
    currentTheme: theme,
    effectiveTheme: resolvedTheme || systemTheme,
    mounted,
  }
}
