"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { Check, Moon, Sun, Monitor } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSetting } from "@/hooks/use-dexie-store"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// Expanded theme color options organized by color families
const themeColors = {
  essentials: [
    {
      name: "Default",
      primaryColor: "hsl(221.2 83.2% 53.3%)",
      id: "default",
    },
    {
      name: "Gray",
      primaryColor: "hsl(215 16% 47%)",
      id: "gray",
    },
    {
      name: "Black",
      primaryColor: "hsl(0 0% 0%)",
      id: "black",
    },
  ],
  warm: [
    {
      name: "Red",
      primaryColor: "hsl(0 72% 51%)",
      id: "red",
    },
    {
      name: "Rose",
      primaryColor: "hsl(346.8 77.2% 49.8%)",
      id: "rose",
    },
    {
      name: "Pink",
      primaryColor: "hsl(330 81% 60%)",
      id: "pink",
    },
    {
      name: "Orange",
      primaryColor: "hsl(24.6 95% 53.1%)",
      id: "orange",
    },
    {
      name: "Amber",
      primaryColor: "hsl(38 92% 50%)",
      id: "amber",
    },
    {
      name: "Yellow",
      primaryColor: "hsl(54 100% 62%)",
      id: "yellow",
    },
  ],
  cool: [
    {
      name: "Lime",
      primaryColor: "hsl(85 78% 42%)",
      id: "lime",
    },
    {
      name: "Green",
      primaryColor: "hsl(142.1 76.2% 36.3%)",
      id: "green",
    },
    {
      name: "Emerald",
      primaryColor: "hsl(152 76% 44%)",
      id: "emerald",
    },
    {
      name: "Teal",
      primaryColor: "hsl(167.2 76.7% 41.8%)",
      id: "teal",
    },
    {
      name: "Cyan",
      primaryColor: "hsl(189 94% 43%)",
      id: "cyan",
    },
    {
      name: "Sky",
      primaryColor: "hsl(198 93% 60%)",
      id: "sky",
    },
  ],
  vibrant: [
    {
      name: "Blue",
      primaryColor: "hsl(217.2 91.2% 59.8%)",
      id: "blue",
    },
    {
      name: "Indigo",
      primaryColor: "hsl(243 75% 59%)",
      id: "indigo",
    },
    {
      name: "Violet",
      primaryColor: "hsl(250 91% 66%)",
      id: "violet",
    },
    {
      name: "Purple",
      primaryColor: "hsl(262.1 83.3% 57.8%)",
      id: "purple",
    },
    {
      name: "Fuchsia",
      primaryColor: "hsl(289 100% 66%)",
      id: "fuchsia",
    },
    {
      name: "Magenta",
      primaryColor: "hsl(328 85% 60%)",
      id: "magenta",
    },
  ],
}

// Flatten all themes for lookup
export const allThemes = Object.values(themeColors).flat()

export function ThemeCustomizer() {
  const { theme: currentTheme, setTheme, resolvedTheme } = useTheme()
  const [primaryColor, setPrimaryColor, isLoading] = useSetting("primaryColor", "default")
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("essentials")

  // Ensure component is mounted before accessing window
  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply the primary color theme
  useEffect(() => {
    if (mounted && primaryColor && primaryColor !== "default") {
      const selectedTheme = allThemes.find((t) => t.id === primaryColor)
      if (selectedTheme) {
        document.documentElement.style.setProperty("--primary", selectedTheme.primaryColor)

        // Also set a darker version for hover states
        const hslValues = selectedTheme.primaryColor.match(/hsl$$([^)]+)$$/)?.[1].split(" ")
        if (hslValues && hslValues.length >= 3) {
          const h = hslValues[0]
          const s = hslValues[1]
          const l = Number.parseFloat(hslValues[2])
          // Make the color 10% darker for hover states
          const darkerL = Math.max(0, l - 10) + "%"
          document.documentElement.style.setProperty("--primary-dark", `hsl(${h} ${s} ${darkerL})`)
        }
      } else {
        document.documentElement.style.removeProperty("--primary")
        document.documentElement.style.removeProperty("--primary-dark")
      }
    } else if (mounted) {
      document.documentElement.style.removeProperty("--primary")
      document.documentElement.style.removeProperty("--primary-dark")
    }
  }, [primaryColor, mounted])

  const handleThemeChange = (theme: string) => {
    setTheme(theme)
    toast({
      title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} theme activated`,
      description: theme === "system" ? "Using your system preference" : `Switched to ${theme} mode`,
      duration: 2000,
    })
  }

  const handleColorChange = async (colorId: string) => {
    try {
      await setPrimaryColor(colorId)
      const selectedTheme = allThemes.find((t) => t.id === colorId)
      toast({
        title: "Theme color updated",
        description: `Your theme color has been set to ${selectedTheme?.name || colorId}.`,
      })
    } catch (error) {
      console.error("Error updating theme color:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your theme color.",
        variant: "destructive",
      })
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Display Mode</h3>
            <p className="text-sm text-muted-foreground">
              Choose between light, dark, or system mode for the application.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                variant={currentTheme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("light")}
                className="w-full flex items-center justify-center gap-2"
              >
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </Button>
              <Button
                variant={currentTheme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("dark")}
                className="w-full flex items-center justify-center gap-2"
              >
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </Button>
              <Button
                variant={currentTheme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("system")}
                className="w-full flex items-center justify-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                <span>System</span>
              </Button>
            </div>
            {currentTheme === "system" && (
              <p className="text-xs text-muted-foreground mt-2">
                Currently using {resolvedTheme === "dark" ? "dark" : "light"} mode based on your system preference.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Primary Color</h3>
              <p className="text-sm text-muted-foreground">Select a primary color for buttons and accents.</p>
            </div>

            <Tabs defaultValue="essentials" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="essentials">Essentials</TabsTrigger>
                <TabsTrigger value="warm">Warm</TabsTrigger>
                <TabsTrigger value="cool">Cool</TabsTrigger>
                <TabsTrigger value="vibrant">Vibrant</TabsTrigger>
              </TabsList>

              {Object.entries(themeColors).map(([category, colors]) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <RadioGroup
                    defaultValue={primaryColor}
                    value={primaryColor}
                    onValueChange={handleColorChange}
                    className="grid grid-cols-3 gap-2 pt-2"
                  >
                    {colors.map((theme) => (
                      <div key={theme.id}>
                        <RadioGroupItem value={theme.id} id={`theme-${theme.id}`} className="peer sr-only" />
                        <Label
                          htmlFor={`theme-${theme.id}`}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div
                            className="mb-2 h-8 w-8 rounded-full border shadow-sm"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm">{theme.name}</span>
                            {primaryColor === theme.id && <Check className="h-4 w-4" />}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </TabsContent>
              ))}
            </Tabs>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Selected: {allThemes.find((t) => t.id === primaryColor)?.name || "Default"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Color Preview</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
