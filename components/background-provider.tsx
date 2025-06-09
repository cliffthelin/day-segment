"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { db } from "@/lib/db"
import { useTheme } from "next-themes"

interface BackgroundProviderProps {
  children: React.ReactNode
}

// Define color schemes with light and dark variants
const colorSchemes: Record<string, { light: Record<string, string>; dark: Record<string, string> }> = {
  default: {
    light: {
      primary: "hsl(221.2 83.2% 53.3%)",
      secondary: "hsl(215 27.9% 16.9%)",
      accent: "hsl(210 40% 96.1%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(222.2 84% 4.9%)",
      muted: "hsl(210 40% 96.1%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(217.2 91.2% 59.8%)",
      secondary: "hsl(215 27.9% 40%)",
      accent: "hsl(217.2 32.6% 17.5%)",
      background: "hsl(222.2 84% 4.9%)",
      foreground: "hsl(210 40% 98%)",
      muted: "hsl(217.2 32.6% 17.5%)",
      card: "hsl(222.2 84% 4.9%)",
    },
  },
  gray: {
    light: {
      primary: "hsl(220 14% 40%)",
      secondary: "hsl(220 14% 30%)",
      accent: "hsl(220 14% 90%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(220 14% 10%)",
      muted: "hsl(220 14% 95%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(220 14% 60%)",
      secondary: "hsl(220 14% 50%)",
      accent: "hsl(220 14% 25%)",
      background: "hsl(220 14% 10%)",
      foreground: "hsl(220 14% 95%)",
      muted: "hsl(220 14% 20%)",
      card: "hsl(220 14% 15%)",
    },
  },
  black: {
    light: {
      primary: "hsl(0 0% 10%)",
      secondary: "hsl(0 0% 20%)",
      accent: "hsl(0 0% 90%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(0 0% 0%)",
      muted: "hsl(0 0% 95%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(0 0% 80%)",
      secondary: "hsl(0 0% 70%)",
      accent: "hsl(0 0% 20%)",
      background: "hsl(0 0% 5%)",
      foreground: "hsl(0 0% 95%)",
      muted: "hsl(0 0% 15%)",
      card: "hsl(0 0% 10%)",
    },
  },
  red: {
    light: {
      primary: "hsl(0 72% 51%)",
      secondary: "hsl(0 72% 41%)",
      accent: "hsl(0 72% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(0 0% 10%)",
      muted: "hsl(0 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(0 72% 61%)",
      secondary: "hsl(0 72% 51%)",
      accent: "hsl(0 30% 20%)",
      background: "hsl(0 15% 10%)",
      foreground: "hsl(0 5% 95%)",
      muted: "hsl(0 20% 20%)",
      card: "hsl(0 15% 15%)",
    },
  },
  rose: {
    light: {
      primary: "hsl(346.8 77.2% 49.8%)",
      secondary: "hsl(346.8 77.2% 39.8%)",
      accent: "hsl(346.8 77.2% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(346.8 77.2% 15%)",
      muted: "hsl(346.8 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(346.8 77.2% 59.8%)",
      secondary: "hsl(346.8 77.2% 49.8%)",
      accent: "hsl(346.8 30% 20%)",
      background: "hsl(346.8 15% 10%)",
      foreground: "hsl(346.8 5% 95%)",
      muted: "hsl(346.8 20% 20%)",
      card: "hsl(346.8 15% 15%)",
    },
  },
  orange: {
    light: {
      primary: "hsl(24.6 95% 53.1%)",
      secondary: "hsl(24.6 95% 43.1%)",
      accent: "hsl(24.6 95% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(24.6 95% 15%)",
      muted: "hsl(24.6 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(24.6 95% 63.1%)",
      secondary: "hsl(24.6 95% 53.1%)",
      accent: "hsl(24.6 30% 20%)",
      background: "hsl(24.6 15% 10%)",
      foreground: "hsl(24.6 5% 95%)",
      muted: "hsl(24.6 20% 20%)",
      card: "hsl(24.6 15% 15%)",
    },
  },
  amber: {
    light: {
      primary: "hsl(38 92% 50%)",
      secondary: "hsl(38 92% 40%)",
      accent: "hsl(38 92% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(38 92% 15%)",
      muted: "hsl(38 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(38 92% 60%)",
      secondary: "hsl(38 92% 50%)",
      accent: "hsl(38 30% 20%)",
      background: "hsl(38 15% 10%)",
      foreground: "hsl(38 5% 95%)",
      muted: "hsl(38 20% 20%)",
      card: "hsl(38 15% 15%)",
    },
  },
  green: {
    light: {
      primary: "hsl(142.1 76.2% 36.3%)",
      secondary: "hsl(142.1 76.2% 26.3%)",
      accent: "hsl(142.1 76.2% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(142.1 76.2% 10%)",
      muted: "hsl(142.1 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(142.1 76.2% 46.3%)",
      secondary: "hsl(142.1 76.2% 36.3%)",
      accent: "hsl(142.1 30% 20%)",
      background: "hsl(142.1 15% 10%)",
      foreground: "hsl(142.1 5% 95%)",
      muted: "hsl(142.1 20% 20%)",
      card: "hsl(142.1 15% 15%)",
    },
  },
  teal: {
    light: {
      primary: "hsl(167.2 76.7% 41.8%)",
      secondary: "hsl(167.2 76.7% 31.8%)",
      accent: "hsl(167.2 76.7% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(167.2 76.7% 10%)",
      muted: "hsl(167.2 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(167.2 76.7% 51.8%)",
      secondary: "hsl(167.2 76.7% 41.8%)",
      accent: "hsl(167.2 30% 20%)",
      background: "hsl(167.2 15% 10%)",
      foreground: "hsl(167.2 5% 95%)",
      muted: "hsl(167.2 20% 20%)",
      card: "hsl(167.2 15% 15%)",
    },
  },
  cyan: {
    light: {
      primary: "hsl(189 94% 43%)",
      secondary: "hsl(189 94% 33%)",
      accent: "hsl(189 94% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(189 94% 10%)",
      muted: "hsl(189 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(189 94% 53%)",
      secondary: "hsl(189 94% 43%)",
      accent: "hsl(189 30% 20%)",
      background: "hsl(189 15% 10%)",
      foreground: "hsl(189 5% 95%)",
      muted: "hsl(189 20% 20%)",
      card: "hsl(189 15% 15%)",
    },
  },
  blue: {
    light: {
      primary: "hsl(217.2 91.2% 59.8%)",
      secondary: "hsl(217.2 91.2% 49.8%)",
      accent: "hsl(217.2 91.2% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(217.2 91.2% 10%)",
      muted: "hsl(217.2 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(217.2 91.2% 69.8%)",
      secondary: "hsl(217.2 91.2% 59.8%)",
      accent: "hsl(217.2 30% 20%)",
      background: "hsl(217.2 15% 10%)",
      foreground: "hsl(217.2 5% 95%)",
      muted: "hsl(217.2 20% 20%)",
      card: "hsl(217.2 15% 15%)",
    },
  },
  indigo: {
    light: {
      primary: "hsl(243 75% 59%)",
      secondary: "hsl(243 75% 49%)",
      accent: "hsl(243 75% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(243 75% 15%)",
      muted: "hsl(243 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(243 75% 69%)",
      secondary: "hsl(243 75% 59%)",
      accent: "hsl(243 30% 20%)",
      background: "hsl(243 15% 10%)",
      foreground: "hsl(243 5% 95%)",
      muted: "hsl(243 20% 20%)",
      card: "hsl(243 15% 15%)",
    },
  },
  violet: {
    light: {
      primary: "hsl(250 91% 66%)",
      secondary: "hsl(250 91% 56%)",
      accent: "hsl(250 91% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(250 91% 15%)",
      muted: "hsl(250 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(250 91% 76%)",
      secondary: "hsl(250 91% 66%)",
      accent: "hsl(250 30% 20%)",
      background: "hsl(250 15% 10%)",
      foreground: "hsl(250 5% 95%)",
      muted: "hsl(250 20% 20%)",
      card: "hsl(250 15% 15%)",
    },
  },
  purple: {
    light: {
      primary: "hsl(262.1 83.3% 57.8%)",
      secondary: "hsl(262.1 83.3% 47.8%)",
      accent: "hsl(262.1 83.3% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(262.1 83.3% 15%)",
      muted: "hsl(262.1 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(262.1 83.3% 67.8%)",
      secondary: "hsl(262.1 83.3% 57.8%)",
      accent: "hsl(262.1 30% 20%)",
      background: "hsl(262.1 15% 10%)",
      foreground: "hsl(262.1 5% 95%)",
      muted: "hsl(262.1 20% 20%)",
      card: "hsl(262.1 15% 15%)",
    },
  },
  pink: {
    light: {
      primary: "hsl(330 81% 60%)",
      secondary: "hsl(330 81% 50%)",
      accent: "hsl(330 81% 95%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(330 81% 15%)",
      muted: "hsl(330 20% 96%)",
      card: "hsl(0 0% 100%)",
    },
    dark: {
      primary: "hsl(330 81% 70%)",
      secondary: "hsl(330 81% 60%)",
      accent: "hsl(330 30% 20%)",
      background: "hsl(330 15% 10%)",
      foreground: "hsl(330 5% 95%)",
      muted: "hsl(330 20% 20%)",
      card: "hsl(330 15% 15%)",
    },
  },
}

export default function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const { theme } = useTheme()

  // Apply theme when theme mode changes
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const colorScheme = await db.settings.get("colorScheme")
        if (colorScheme && colorScheme.value) {
          applyColorScheme(colorScheme.value, theme === "dark")
        }

        // Apply background settings based on current theme
        applyBackgroundSettings(theme === "dark")
      } catch (error) {
        console.error("Error applying theme on mode change:", error)
      }
    }

    if (isLoaded) {
      applyTheme()
    }
  }, [theme, isLoaded])

  useEffect(() => {
    // Function to load and apply background settings
    const loadBackgroundSettings = async () => {
      try {
        // Apply color scheme
        const colorScheme = await db.settings.get("colorScheme")
        if (colorScheme && colorScheme.value) {
          applyColorScheme(colorScheme.value, theme === "dark")
        }

        // Apply background settings
        applyBackgroundSettings(theme === "dark")

        setIsLoaded(true)
      } catch (error) {
        console.error("Error loading background settings:", error)
        setIsLoaded(true)
      }
    }

    loadBackgroundSettings()
  }, [theme])

  // Function to apply background settings based on current theme
  const applyBackgroundSettings = async (isDark: boolean) => {
    try {
      // Check if theme-specific backgrounds are enabled
      const useSeparateThemeBackgrounds = await db.settings.get("useSeparateThemeBackgrounds")

      // Determine which background image to use
      let backgroundImage
      if (useSeparateThemeBackgrounds?.value === true) {
        if (isDark) {
          const darkBg = await db.settings.get("darkBackgroundImage")
          backgroundImage = darkBg?.value || ""
        } else {
          const lightBg = await db.settings.get("lightBackgroundImage")
          backgroundImage = lightBg?.value || ""
        }
      } else {
        const bg = await db.settings.get("backgroundImage")
        backgroundImage = bg?.value || ""
      }

      // Apply background image
      if (backgroundImage) {
        document.documentElement.style.setProperty("--background-image", `url(${backgroundImage})`)
        document.documentElement.classList.add("has-background-image")
      } else {
        document.documentElement.style.removeProperty("--background-image")
        document.documentElement.classList.remove("has-background-image")
      }

      // Load and apply other background settings
      const formOpacity = await db.settings.get("formOpacity")
      document.documentElement.style.setProperty("--form-opacity", (formOpacity?.value || 0.95).toString())

      const backgroundBlur = await db.settings.get("backgroundBlur")
      document.documentElement.style.setProperty("--background-blur", `${backgroundBlur?.value || 0}px`)

      const backgroundOverlay = await db.settings.get("backgroundOverlay")
      document.documentElement.style.setProperty("--background-overlay", backgroundOverlay?.value || "rgba(0,0,0,0)")

      const backgroundPosition = await db.settings.get("backgroundPosition")
      document.documentElement.style.setProperty("--background-position", backgroundPosition?.value || "center")

      const backgroundSize = await db.settings.get("backgroundSize")
      document.documentElement.style.setProperty("--background-size", backgroundSize?.value || "cover")

      console.log(`Applied background settings for ${isDark ? "dark" : "light"} mode`)
    } catch (error) {
      console.error("Error applying background settings:", error)
    }
  }

  // Function to apply a color scheme
  const applyColorScheme = (schemeId: string, isDark: boolean) => {
    try {
      // Get the selected color scheme
      const scheme = colorSchemes[schemeId] || colorSchemes.default
      const colors = isDark ? scheme.dark : scheme.light

      // Apply the color scheme to CSS variables
      document.documentElement.style.setProperty("--primary", colors.primary)
      document.documentElement.style.setProperty("--primary-foreground", isDark ? "hsl(0 0% 10%)" : "hsl(0 0% 98%)")

      document.documentElement.style.setProperty("--secondary", colors.secondary)
      document.documentElement.style.setProperty("--secondary-foreground", isDark ? "hsl(0 0% 10%)" : "hsl(0 0% 98%)")

      document.documentElement.style.setProperty("--accent", colors.accent)
      document.documentElement.style.setProperty("--accent-foreground", colors.foreground)

      document.documentElement.style.setProperty("--background", colors.background)
      document.documentElement.style.setProperty("--foreground", colors.foreground)

      document.documentElement.style.setProperty("--muted", colors.muted)
      document.documentElement.style.setProperty(
        "--muted-foreground",
        isDark ? "hsl(215 20.2% 65.1%)" : "hsl(215.4 16.3% 46.9%)",
      )

      document.documentElement.style.setProperty("--card", colors.card)
      document.documentElement.style.setProperty("--card-foreground", colors.foreground)

      document.documentElement.style.setProperty(
        "--border",
        isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)",
      )
      document.documentElement.style.setProperty(
        "--input",
        isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)",
      )

      document.documentElement.style.setProperty("--ring", colors.primary)

      console.log(`Applied ${isDark ? "dark" : "light"} theme: ${schemeId}`)
    } catch (error) {
      console.error("Error applying color scheme:", error)
    }
  }

  return <>{children}</>
}
