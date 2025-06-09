"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check, Save, RotateCcw, Sun, Moon, Bell, Calendar, Clock } from "lucide-react"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useTheme } from "next-themes"

// Define the theme interface
interface ColorScheme {
  id: string
  name: string
  description: string
  light: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    card: string
  }
  dark: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    card: string
  }
}

// Define color schemes with light and dark variants
const colorSchemes: Record<string, ColorScheme[]> = {
  classic: [
    {
      id: "default",
      name: "Default",
      description: "The default color scheme",
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
    {
      id: "gray",
      name: "Gray",
      description: "A neutral gray theme",
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
    {
      id: "black",
      name: "Black",
      description: "A sleek black theme",
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
  ],
  warm: [
    {
      id: "red",
      name: "Red",
      description: "A vibrant red theme",
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
    {
      id: "rose",
      name: "Rose",
      description: "A soft rose theme",
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
    {
      id: "orange",
      name: "Orange",
      description: "A warm orange theme",
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
    {
      id: "amber",
      name: "Amber",
      description: "A golden amber theme",
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
  ],
  cool: [
    {
      id: "green",
      name: "Green",
      description: "A refreshing green theme",
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
    {
      id: "teal",
      name: "Teal",
      description: "A calming teal theme",
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
    {
      id: "cyan",
      name: "Cyan",
      description: "A bright cyan theme",
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
    {
      id: "blue",
      name: "Blue",
      description: "A classic blue theme",
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
  ],
  vibrant: [
    {
      id: "indigo",
      name: "Indigo",
      description: "A deep indigo theme",
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
    {
      id: "violet",
      name: "Violet",
      description: "A rich violet theme",
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
    {
      id: "purple",
      name: "Purple",
      description: "A royal purple theme",
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
    {
      id: "pink",
      name: "Pink",
      description: "A playful pink theme",
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
  ],
}

// Flatten all themes for lookup
const allColorSchemes = Object.values(colorSchemes).flat()

export function ThemeSelector() {
  const [selectedScheme, setSelectedScheme] = useState<string>("default")
  const [currentScheme, setCurrentScheme] = useState<string>("default")
  const [activeTab, setActiveTab] = useState("classic")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Ensure component is mounted before accessing window
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load the current theme from the database
  useEffect(() => {
    const loadTheme = async () => {
      try {
        setIsLoading(true)
        const themeSetting = await db.settings.get("colorScheme")
        if (themeSetting) {
          setCurrentScheme(themeSetting.value || "default")
          setSelectedScheme(themeSetting.value || "default")
        }
      } catch (error) {
        console.error("Error loading theme:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted) {
      loadTheme()
    }
  }, [mounted])

  // Apply the selected color scheme for preview
  useEffect(() => {
    if (mounted && selectedScheme) {
      const scheme = allColorSchemes.find((scheme) => scheme.id === selectedScheme)
      if (scheme) {
        const isDark = theme === "dark"
        applyColorScheme(scheme, isDark)
      }

      // Check if the selected scheme is different from the current one
      setHasChanges(selectedScheme !== currentScheme)
    }
  }, [selectedScheme, currentScheme, mounted, theme])

  // Apply color scheme to CSS variables
  const applyColorScheme = (scheme: ColorScheme, isDark: boolean) => {
    const colors = isDark ? scheme.dark : scheme.light

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

    document.documentElement.style.setProperty("--border", isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)")
    document.documentElement.style.setProperty("--input", isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)")

    document.documentElement.style.setProperty("--ring", colors.primary)
  }

  // Handle color scheme selection
  const handleColorSchemeChange = (schemeId: string) => {
    setSelectedScheme(schemeId)
  }

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Save the selected color scheme to the database
  const saveColorScheme = async () => {
    try {
      setIsSaving(true)
      await db.settings.put({ key: "colorScheme", value: selectedScheme })
      setCurrentScheme(selectedScheme)
      setHasChanges(false)

      toast({
        title: "Theme saved",
        description: `Your theme has been updated to ${allColorSchemes.find((s) => s.id === selectedScheme)?.name || selectedScheme}.`,
      })
    } catch (error) {
      console.error("Error saving theme:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving your theme settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to default theme
  const resetToDefault = () => {
    setSelectedScheme("default")
  }

  // Cancel changes and revert to current theme
  const cancelChanges = () => {
    setSelectedScheme(currentScheme)
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Color Theme</h3>
          <p className="text-sm text-muted-foreground">Choose a color theme for the application.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault} disabled={isLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 rounded-md border p-2">
        <div className={`p-1 ${theme === "dark" ? "bg-secondary" : ""} rounded`}>
          <Moon className="h-4 w-4" />
        </div>
        <div className="grow text-sm">
          {theme === "dark" ? "Dark mode active" : "Light mode active"} -
          <span className="text-muted-foreground"> Each theme has specific light and dark variants</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading theme settings...</p>
          </div>
        </div>
      ) : (
        <>
          <Tabs defaultValue="classic" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="classic">Classic</TabsTrigger>
              <TabsTrigger value="warm">Warm</TabsTrigger>
              <TabsTrigger value="cool">Cool</TabsTrigger>
              <TabsTrigger value="vibrant">Vibrant</TabsTrigger>
            </TabsList>

            {Object.entries(colorSchemes).map(([category, schemes]) => (
              <TabsContent key={category} value={category} className="mt-0">
                <RadioGroup
                  value={selectedScheme}
                  onValueChange={handleColorSchemeChange}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2"
                >
                  {schemes.map((scheme) => (
                    <div key={scheme.id} className="relative">
                      <RadioGroupItem value={scheme.id} id={`scheme-${scheme.id}`} className="peer sr-only" />
                      <Label
                        htmlFor={`scheme-${scheme.id}`}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="mb-3 flex gap-2">
                          <div
                            className="h-10 w-10 rounded-full border shadow-sm flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: scheme.light.primary }}
                          >
                            <Sun className="h-5 w-5 text-white" />
                          </div>
                          <div
                            className="h-10 w-10 rounded-full border shadow-sm flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: scheme.dark.primary }}
                          >
                            <Moon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{scheme.name}</span>
                          {selectedScheme === scheme.id && <Check className="h-4 w-4" />}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </TabsContent>
            ))}
          </Tabs>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-4">
              Theme Preview ({theme === "dark" ? "Dark Mode" : "Light Mode"})
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Button Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Buttons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="sm" variant="destructive">
                      Delete
                    </Button>
                    <Button size="sm" disabled>
                      Disabled
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* UI Elements Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">UI Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preview-switch">Notifications</Label>
                    <Switch id="preview-switch" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preview-progress">Progress</Label>
                    <Progress value={65} className="h-2" id="preview-progress" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Alert</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Card Preview */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Day Segment Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                      <Sun className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Morning</p>
                        <p className="text-xs text-muted-foreground">6:00 - 9:00</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Work</p>
                        <p className="text-xs text-muted-foreground">9:00 - 12:00</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                      <Bell className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Lunch</p>
                        <p className="text-xs text-muted-foreground">12:00 - 13:00</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Afternoon</p>
                        <p className="text-xs text-muted-foreground">13:00 - 17:00</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                      <Moon className="h-5 w-5 text-pink-500" />
                      <div>
                        <p className="text-sm font-medium">Evening</p>
                        <p className="text-xs text-muted-foreground">17:00 - 22:00</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            {hasChanges && (
              <Button variant="outline" onClick={cancelChanges} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button onClick={saveColorScheme} disabled={isSaving || !hasChanges} className="min-w-[100px]">
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Theme
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
