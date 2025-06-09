"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/db"
import { useTheme } from "next-themes"
import { Upload, X, Save, EyeOff, Sun, Moon } from "lucide-react"

// Background image categories
const backgroundCategories = [
  {
    id: "nature",
    name: "Nature",
    backgrounds: [
      { id: "mountains", name: "Mountains", path: "/backgrounds/mountains.png" },
      { id: "ocean", name: "Ocean", path: "/backgrounds/ocean.png" },
      { id: "forest", name: "Forest", path: "/backgrounds/forest.png" },
    ],
  },
  {
    id: "abstract",
    name: "Abstract",
    backgrounds: [
      { id: "abstract", name: "Abstract", path: "/backgrounds/abstract.png" },
      { id: "gradient", name: "Gradient", path: "/backgrounds/gradient.png" },
      { id: "minimal", name: "Minimal", path: "/backgrounds/minimal.png" },
    ],
  },
]

// Background position options
const positionOptions = [
  { id: "center", name: "Center" },
  { id: "top", name: "Top" },
  { id: "bottom", name: "Bottom" },
  { id: "left", name: "Left" },
  { id: "right", name: "Right" },
  { id: "top-left", name: "Top Left" },
  { id: "top-right", name: "Top Right" },
  { id: "bottom-left", name: "Bottom Left" },
  { id: "bottom-right", name: "Bottom Right" },
]

// Default background settings
const defaultSettings = {
  backgroundImage: "",
  formOpacity: 0.95,
  backgroundBlur: 0,
  backgroundOverlay: "rgba(0,0,0,0)",
  backgroundPosition: "center",
  useSeparateThemeBackgrounds: false,
  lightBackgroundImage: "",
  darkBackgroundImage: "",
  backgroundSize: "cover",
}

export function AdvancedBackgroundSettings() {
  const [settings, setSettings] = useState(defaultSettings)
  const [previewSettings, setPreviewSettings] = useState(defaultSettings)
  const [activeTab, setActiveTab] = useState("general")
  const [activeCategory, setActiveCategory] = useState("nature")
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [overlayColor, setOverlayColor] = useState("#000000")
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing window
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const backgroundImage = await db.settings.get("backgroundImage")
        const formOpacity = await db.settings.get("formOpacity")
        const backgroundBlur = await db.settings.get("backgroundBlur")
        const backgroundOverlay = await db.settings.get("backgroundOverlay")
        const backgroundPosition = await db.settings.get("backgroundPosition")
        const useSeparateThemeBackgrounds = await db.settings.get("useSeparateThemeBackgrounds")
        const lightBackgroundImage = await db.settings.get("lightBackgroundImage")
        const darkBackgroundImage = await db.settings.get("darkBackgroundImage")
        const backgroundSize = await db.settings.get("backgroundSize")

        const loadedSettings = {
          backgroundImage: backgroundImage?.value || "",
          formOpacity: formOpacity?.value ?? 0.95,
          backgroundBlur: backgroundBlur?.value ?? 0,
          backgroundOverlay: backgroundOverlay?.value || "rgba(0,0,0,0)",
          backgroundPosition: backgroundPosition?.value || "center",
          useSeparateThemeBackgrounds: useSeparateThemeBackgrounds?.value ?? false,
          lightBackgroundImage: lightBackgroundImage?.value || "",
          darkBackgroundImage: darkBackgroundImage?.value || "",
          backgroundSize: backgroundSize?.value || "cover",
        }

        setSettings(loadedSettings)
        setPreviewSettings(loadedSettings)

        // Parse overlay color and opacity from rgba format
        if (backgroundOverlay?.value) {
          const rgbaMatch = backgroundOverlay.value.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?$$/)
          if (rgbaMatch) {
            const r = Number.parseInt(rgbaMatch[1])
            const g = Number.parseInt(rgbaMatch[2])
            const b = Number.parseInt(rgbaMatch[3])
            // Convert RGB to HEX
            const hexColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
              .toString(16)
              .padStart(2, "0")}`
            setOverlayColor(hexColor)
            setOverlayOpacity(rgbaMatch[4] ? Number.parseFloat(rgbaMatch[4]) : 0)
          }
        }

        // Set the active category based on the selected background
        if (backgroundImage?.value) {
          for (const category of backgroundCategories) {
            if (category.backgrounds.some((bg) => bg.path === backgroundImage.value)) {
              setActiveCategory(category.id)
              break
            }
          }
        }
      } catch (error) {
        console.error("Error loading background settings:", error)
        toast({
          title: "Error loading settings",
          description: "There was a problem loading your background settings.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted) {
      loadSettings()
    }
  }, [toast, mounted])

  // Check for changes
  useEffect(() => {
    if (mounted) {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(previewSettings))
    }
  }, [settings, previewSettings, mounted])

  // Apply preview settings to the UI
  useEffect(() => {
    if (mounted) {
      const currentTheme = theme === "dark" ? "dark" : "light"
      let bgImage = previewSettings.backgroundImage

      if (previewSettings.useSeparateThemeBackgrounds) {
        bgImage = currentTheme === "dark" ? previewSettings.darkBackgroundImage : previewSettings.lightBackgroundImage
      }

      // Apply background image
      if (bgImage) {
        document.documentElement.style.setProperty("--background-image", `url(${bgImage})`)
        document.documentElement.classList.add("has-background-image")
      } else {
        document.documentElement.style.removeProperty("--background-image")
        document.documentElement.classList.remove("has-background-image")
      }

      // Apply other settings
      document.documentElement.style.setProperty("--form-opacity", previewSettings.formOpacity.toString())
      document.documentElement.style.setProperty("--background-blur", `${previewSettings.backgroundBlur}px`)
      document.documentElement.style.setProperty("--background-overlay", previewSettings.backgroundOverlay)
      document.documentElement.style.setProperty("--background-position", previewSettings.backgroundPosition)
      document.documentElement.style.setProperty("--background-size", previewSettings.backgroundSize)
    }
  }, [previewSettings, theme, mounted])

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      // Read the file and set the custom image
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setCustomImage(result)
        updatePreviewSetting(
          previewSettings.useSeparateThemeBackgrounds
            ? theme === "dark"
              ? "darkBackgroundImage"
              : "lightBackgroundImage"
            : "backgroundImage",
          result,
        )
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle predefined background selection
  const handlePredefinedSelect = (path: string) => {
    setCustomImage(null)
    updatePreviewSetting(
      previewSettings.useSeparateThemeBackgrounds
        ? theme === "dark"
          ? "darkBackgroundImage"
          : "lightBackgroundImage"
        : "backgroundImage",
      path,
    )
  }

  // Update a single setting in the preview state
  const updatePreviewSetting = (key: string, value: any) => {
    setPreviewSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle overlay color and opacity change
  const handleOverlayChange = (color: string, opacity: number) => {
    setOverlayColor(color)
    setOverlayOpacity(opacity)

    // Convert HEX to RGB for the overlay
    const r = Number.parseInt(color.slice(1, 3), 16)
    const g = Number.parseInt(color.slice(3, 5), 16)
    const b = Number.parseInt(color.slice(5, 7), 16)
    const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`

    updatePreviewSetting("backgroundOverlay", rgba)
  }

  // Toggle separate theme backgrounds
  const handleToggleSeparateThemes = (enabled: boolean) => {
    updatePreviewSetting("useSeparateThemeBackgrounds", enabled)

    if (enabled) {
      // Initialize light/dark backgrounds with the current background
      if (!previewSettings.lightBackgroundImage) {
        updatePreviewSetting("lightBackgroundImage", previewSettings.backgroundImage)
      }
      if (!previewSettings.darkBackgroundImage) {
        updatePreviewSetting("darkBackgroundImage", previewSettings.backgroundImage)
      }
    }
  }

  // Apply settings
  const saveSettings = async () => {
    try {
      setIsSaving(true)

      // Save all settings to database
      await db.settings.put({ key: "backgroundImage", value: previewSettings.backgroundImage })
      await db.settings.put({ key: "formOpacity", value: previewSettings.formOpacity })
      await db.settings.put({ key: "backgroundBlur", value: previewSettings.backgroundBlur })
      await db.settings.put({ key: "backgroundOverlay", value: previewSettings.backgroundOverlay })
      await db.settings.put({ key: "backgroundPosition", value: previewSettings.backgroundPosition })
      await db.settings.put({ key: "useSeparateThemeBackgrounds", value: previewSettings.useSeparateThemeBackgrounds })
      await db.settings.put({ key: "lightBackgroundImage", value: previewSettings.lightBackgroundImage })
      await db.settings.put({ key: "darkBackgroundImage", value: previewSettings.darkBackgroundImage })
      await db.settings.put({ key: "backgroundSize", value: previewSettings.backgroundSize })

      // Update state
      setSettings(previewSettings)
      setHasChanges(false)

      toast({
        title: "Settings saved",
        description: "Your background settings have been updated.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving your settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset settings
  const resetSettings = () => {
    setPreviewSettings(defaultSettings)
    setCustomImage(null)
    setOverlayColor("#000000")
    setOverlayOpacity(0)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Cancel changes
  const cancelChanges = () => {
    setPreviewSettings(settings)
    setCustomImage(null)

    // Parse overlay color and opacity from saved settings
    if (settings.backgroundOverlay) {
      const rgbaMatch = settings.backgroundOverlay.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?$$/)
      if (rgbaMatch) {
        const r = Number.parseInt(rgbaMatch[1])
        const g = Number.parseInt(rgbaMatch[2])
        const b = Number.parseInt(rgbaMatch[3])
        const hexColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
          .toString(16)
          .padStart(2, "0")}`
        setOverlayColor(hexColor)
        setOverlayOpacity(rgbaMatch[4] ? Number.parseFloat(rgbaMatch[4]) : 0)
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Advanced Background Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize your app's background, appearance, and visual effects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={resetSettings} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading background settings...</p>
          </div>
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium">Theme-specific Backgrounds</h4>
                    <p className="text-sm text-muted-foreground">Use different backgrounds for light and dark modes</p>
                  </div>
                  <Switch
                    checked={previewSettings.useSeparateThemeBackgrounds}
                    onCheckedChange={handleToggleSeparateThemes}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-medium">Form Transparency</h4>
                  <p className="text-sm text-muted-foreground">Adjust the transparency of cards and dialogs</p>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>More Transparent</span>
                    <span>Less Transparent</span>
                  </div>
                  <Slider
                    value={[previewSettings.formOpacity]}
                    min={0.3}
                    max={1}
                    step={0.05}
                    onValueChange={(value) => updatePreviewSetting("formOpacity", value[0])}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    Opacity: {Math.round(previewSettings.formOpacity * 100)}%
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-medium">Current Theme</h4>
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <div className={`p-1 ${theme === "dark" ? "bg-secondary" : ""} rounded`}>
                      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </div>
                    <div className="grow text-sm">
                      {theme === "dark" ? "Dark mode active" : "Light mode active"} -
                      <span className="text-muted-foreground"> Preview will show current mode settings</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Background Image Tab */}
            <TabsContent value="background" className="space-y-6 pt-4">
              {previewSettings.useSeparateThemeBackgrounds && (
                <div className="rounded-md border p-3 bg-muted/30 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <p className="text-sm font-medium">
                      Editing {theme === "dark" ? "Dark Mode" : "Light Mode"} Background
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Switch theme to edit the other background</p>
                </div>
              )}

              <Tabs defaultValue="categories">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                  <TabsTrigger value="position">Position</TabsTrigger>
                </TabsList>

                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-4 pt-4">
                  <div className="flex gap-2 mb-4">
                    {backgroundCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={activeCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory(category.id)}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>

                  <RadioGroup
                    value={
                      previewSettings.useSeparateThemeBackgrounds
                        ? theme === "dark"
                          ? previewSettings.darkBackgroundImage
                          : previewSettings.lightBackgroundImage
                        : previewSettings.backgroundImage
                    }
                    onValueChange={handlePredefinedSelect}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  >
                    {backgroundCategories
                      .find((c) => c.id === activeCategory)
                      ?.backgrounds.map((bg) => (
                        <div key={bg.id} className="relative">
                          <RadioGroupItem value={bg.path} id={`bg-${bg.id}`} className="peer sr-only" />
                          <Label
                            htmlFor={`bg-${bg.id}`}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary overflow-hidden aspect-video"
                          >
                            <div className="w-full h-full relative">
                              <img
                                src={bg.path || "/placeholder.svg"}
                                alt={bg.name}
                                className="w-full h-full object-cover rounded-sm"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 flex items-end justify-start p-2 bg-gradient-to-t from-black/50 to-transparent">
                                <span className="text-xs text-white font-medium">{bg.name}</span>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    <div className="relative">
                      <RadioGroupItem value="" id="bg-none" className="peer sr-only" />
                      <Label
                        htmlFor="bg-none"
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary overflow-hidden aspect-video"
                      >
                        <EyeOff className="h-6 w-6 mb-2 text-muted-foreground" />
                        <span className="text-xs">No Background</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </TabsContent>

                {/* Custom Upload Tab */}
                <TabsContent value="custom" className="space-y-4 pt-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-md p-6">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    {customImage ? (
                      <div className="space-y-4 w-full">
                        <div className="relative w-full aspect-video rounded-md overflow-hidden">
                          <img
                            src={customImage || "/placeholder.svg"}
                            alt="Custom background"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setCustomImage(null)
                              updatePreviewSetting(
                                previewSettings.useSeparateThemeBackgrounds
                                  ? theme === "dark"
                                    ? "darkBackgroundImage"
                                    : "lightBackgroundImage"
                                  : "backgroundImage",
                                "",
                              )
                              if (fileInputRef.current) {
                                fileInputRef.current.value = ""
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium">Upload an image</h3>
                        <p className="text-sm text-muted-foreground mb-4">Drag and drop or click to browse (max 5MB)</p>
                        <Button onClick={() => fileInputRef.current?.click()}>Select Image</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Position Tab */}
                <TabsContent value="position" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-medium">Background Position</h4>
                      <p className="text-sm text-muted-foreground">Control how the background image is positioned</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {positionOptions.map((pos) => (
                        <Button
                          key={pos.id}
                          variant={previewSettings.backgroundPosition === pos.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => updatePreviewSetting("backgroundPosition", pos.id)}
                          className="justify-start"
                        >
                          {pos.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-base font-medium">Background Size</h4>
                    <p className="text-sm text-muted-foreground">How the background image should be sized</p>
                    <Select
                      value={previewSettings.backgroundSize}
                      onValueChange={(value) => updatePreviewSetting("backgroundSize", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover (Fill Screen)</SelectItem>
                        <SelectItem value="contain">Contain (Show Full Image)</SelectItem>
                        <SelectItem value="auto">Auto (Original Size)</SelectItem>
                        <SelectItem value="100% 100%">Stretch (Fit Screen)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Visual Effects Tab */}
            <TabsContent value="effects" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-medium">Background Blur</h4>
                  <p className="text-sm text-muted-foreground">Add a blur effect to the background image</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>No Blur</span>
                    <span>Maximum Blur</span>
                  </div>
                  <Slider
                    value={[previewSettings.backgroundBlur]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={(value) => updatePreviewSetting("backgroundBlur", value[0])}
                  />
                  <p className="text-xs text-muted-foreground text-right">Blur: {previewSettings.backgroundBlur}px</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-medium">Color Overlay</h4>
                  <p className="text-sm text-muted-foreground">Add a colored overlay on top of the background image</p>
                </div>
                <div className="flex items-end gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="overlay-color">Overlay Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: overlayColor }} />
                      <Input
                        id="overlay-color"
                        type="color"
                        value={overlayColor}
                        onChange={(e) => handleOverlayChange(e.target.value, overlayOpacity)}
                        className="w-full h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="overlay-opacity">Opacity</Label>
                    <Slider
                      id="overlay-opacity"
                      value={[overlayOpacity]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={(value) => handleOverlayChange(overlayColor, value[0])}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.round(overlayOpacity * 100)}%
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Preview</h3>
              <p className="text-sm text-muted-foreground">
                This is how the application will look with your selected settings.
              </p>
            </div>
            <div
              className="relative h-60 rounded-md overflow-hidden"
              style={{
                backgroundImage: previewSettings.useSeparateThemeBackgrounds
                  ? theme === "dark"
                    ? previewSettings.darkBackgroundImage
                      ? `url(${previewSettings.darkBackgroundImage})`
                      : "none"
                    : previewSettings.lightBackgroundImage
                      ? `url(${previewSettings.lightBackgroundImage})`
                      : "none"
                  : previewSettings.backgroundImage
                    ? `url(${previewSettings.backgroundImage})`
                    : "none",
                backgroundSize: previewSettings.backgroundSize,
                backgroundPosition: previewSettings.backgroundPosition,
                backgroundColor: "var(--background)",
              }}
            >
              {/* Background overlay */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: previewSettings.backgroundOverlay,
                  backdropFilter: `blur(${previewSettings.backgroundBlur}px)`,
                }}
              />

              {/* Sample content */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <Card
                  className="w-64"
                  style={{
                    opacity: previewSettings.formOpacity,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-2">Sample Card</h4>
                    <p className="text-xs text-muted-foreground">This is how cards will appear with your settings.</p>
                    <div className="flex justify-end mt-4">
                      <Button size="sm" className="mr-2" variant="outline">
                        Cancel
                      </Button>
                      <Button size="sm">Save</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            {hasChanges && (
              <Button variant="outline" onClick={cancelChanges} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button onClick={saveSettings} disabled={isSaving || !hasChanges} className="min-w-[100px]">
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
