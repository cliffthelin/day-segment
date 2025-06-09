"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { Play, Upload, Trash2, Volume2, VolumeX } from "lucide-react"
import { db } from "@/lib/db"
import { useSetting } from "@/hooks/use-dexie-store"
import { SoundRecorder } from "@/components/sound-recorder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SoundOption {
  id: string
  name: string
  isDefault: boolean
  url?: string
}

interface SoundManagerProps {
  type: "timer" | "notification"
  title: string
  description: string
  onSoundChange?: (soundId: string) => Promise<void>
}

// All available default sounds
const ALL_DEFAULT_SOUNDS = [
  { id: "default", name: "Default" },
  { id: "clapping-106694", name: "Clapping" },
  { id: "dark-engine-logo-141942", name: "Dark Engine" },
  { id: "dark-guitar-130435", name: "Dark Guitar" },
  { id: "epic-glitch-hit-logo-142960", name: "Epic Glitch" },
  { id: "epic-hybrid-logo-157092", name: "Epic Hybrid" },
  { id: "happy-outro-8110", name: "Happy Outro" },
  { id: "intro-music-black-box-string-violin-12349", name: "String Violin" },
  { id: "joyful-messy-piano-116715", name: "Joyful Piano" },
  { id: "modern-tech-logo-13492", name: "Modern Tech" },
  { id: "quotend-of-chapter-2quot-290229", name: "End of Chapter" },
  { id: "reverse-logo-143857", name: "Reverse Logo" },
  { id: "short-melancholic-theme-on-piano-34024", name: "Melancholic Piano" },
  { id: "short-soothing-strings-guitar-music-324302", name: "Soothing Strings" },
  { id: "simple-clean-logo-13775", name: "Simple Clean" },
  { id: "techology-intro-short-version-185783", name: "Technology Intro" },
  { id: "trompetenmusik-184249", name: "Trumpet" },
  { id: "none", name: "No Sound" },
]

export function SoundManager({ type, title, description, onSoundChange }: SoundManagerProps) {
  const { toast } = useToast()
  const [selectedSound, setSelectedSound, isLoading] = useSetting(`${type}Sound`, "default")
  const [volume, setVolume, volumeLoading] = useSetting(`${type}Volume`, 0.7) // Default to 70% volume
  const [customSounds, setCustomSounds] = useState<SoundOption[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [newSoundName, setNewSoundName] = useState("")
  const [activeTab, setActiveTab] = useState<string>("select")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Default sounds (all sounds except "none" are default sounds)
  const defaultSounds: SoundOption[] = ALL_DEFAULT_SOUNDS.map((sound) => ({
    id: sound.id,
    name: sound.name,
    isDefault: true,
  }))

  // Load custom sounds from IndexedDB
  useEffect(() => {
    const loadCustomSounds = async () => {
      try {
        // Check if the sounds table exists
        if (!db.sounds) {
          console.log("Sounds table not available yet, will retry later")
          return
        }

        // Use a simple equals query instead of a complex query
        const sounds = await db.sounds.filter((sound) => sound.type === type).toArray()

        setCustomSounds(
          sounds.map((sound) => ({
            id: sound.id,
            name: sound.name,
            isDefault: false,
            url: sound.url,
          })),
        )
      } catch (error) {
        console.error(`Error loading ${type} sounds:`, error)
      }
    }

    loadCustomSounds()
  }, [type])

  // Handle sound selection
  const handleSoundSelect = async (soundId: string) => {
    try {
      await setSelectedSound(soundId)
      if (onSoundChange) {
        await onSoundChange(soundId)
      }
      toast({
        title: "Sound updated",
        description: `Your ${type} sound has been updated.`,
      })
    } catch (error) {
      console.error(`Error updating ${type} sound:`, error)
      toast({
        title: "Update failed",
        description: `There was an error updating your ${type} sound.`,
        variant: "destructive",
      })
    }
  }

  // Handle volume change
  const handleVolumeChange = async (value: number[]) => {
    try {
      const newVolume = value[0]
      await setVolume(newVolume)

      // Update audio element volume if it exists
      if (audioRef.current) {
        audioRef.current.volume = newVolume
      }

      toast({
        title: "Volume updated",
        description: `Your ${type} sound volume has been set to ${Math.round(newVolume * 100)}%.`,
      })
    } catch (error) {
      console.error(`Error updating ${type} volume:`, error)
      toast({
        title: "Update failed",
        description: `There was an error updating your ${type} sound volume.`,
        variant: "destructive",
      })
    }
  }

  // Handle file upload
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Process the selected file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/mp3"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an MP3 file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an audio file smaller than 2MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      // Convert file to data URL
      const reader = new FileReader()
      reader.onload = async (event) => {
        if (!event.target?.result) {
          throw new Error("Failed to read file")
        }

        const dataUrl = event.target.result.toString()

        // Generate a unique ID for the sound
        const soundId = `custom-${Date.now()}`

        // Check if the sounds table exists
        if (!db.sounds) {
          throw new Error("Sounds table not available")
        }

        // Save to IndexedDB
        await db.sounds.add({
          id: soundId,
          name: newSoundName || file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          type,
          url: dataUrl,
          dateAdded: new Date().toISOString(),
        })

        // Update custom sounds list
        setCustomSounds([
          ...customSounds,
          {
            id: soundId,
            name: newSoundName || file.name.replace(/\.[^/.]+$/, ""),
            isDefault: false,
            url: dataUrl,
          },
        ])

        // Select the new sound
        await handleSoundSelect(soundId)

        // Reset form
        setNewSoundName("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        toast({
          title: "Sound uploaded",
          description: "Your custom sound has been added.",
        })
      }

      reader.onerror = () => {
        throw new Error("Error reading file")
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading sound:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your sound file.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Delete a custom sound
  const handleDeleteSound = async (soundId: string) => {
    try {
      // Check if the sounds table exists
      if (!db.sounds) {
        throw new Error("Sounds table not available")
      }

      // Remove from IndexedDB
      await db.sounds.delete(soundId)

      // Update custom sounds list
      setCustomSounds(customSounds.filter((sound) => sound.id !== soundId))

      // If the deleted sound was selected, switch to default
      if (selectedSound === soundId) {
        await handleSoundSelect("default")
      }

      toast({
        title: "Sound deleted",
        description: "Your custom sound has been removed.",
      })
    } catch (error) {
      console.error("Error deleting sound:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting your sound file.",
        variant: "destructive",
      })
    }
  }

  // Play a sound preview
  const playSound = (soundId: string) => {
    if (soundId === "none") {
      // No sound to play
      return
    }

    let soundUrl = ""

    // Check if it's a default sound (not "none" and not a custom sound)
    if (soundId !== "none" && !customSounds.some((s) => s.id === soundId)) {
      soundUrl = `/sounds/${soundId}.mp3`
    } else {
      // Find custom sound
      const customSound = customSounds.find((sound) => sound.id === soundId)
      if (customSound?.url) {
        soundUrl = customSound.url
      }
    }

    if (soundUrl && audioRef.current) {
      audioRef.current.src = soundUrl
      audioRef.current.volume = volume // Set volume based on user preference
      audioRef.current.play().catch((error) => {
        console.error("Error playing sound:", error)
        toast({
          title: "Sound Error",
          description: "Could not play the selected sound.",
          variant: "destructive",
        })
      })
    }
  }

  // Handle recording complete
  const handleRecordingComplete = async (soundId: string) => {
    // Refresh custom sounds list
    try {
      // Check if the sounds table exists
      if (!db.sounds) {
        throw new Error("Sounds table not available")
      }

      // Use a simple filter instead of a complex query
      const sounds = await db.sounds.filter((sound) => sound.type === type).toArray()

      setCustomSounds(
        sounds.map((sound) => ({
          id: sound.id,
          name: sound.name,
          isDefault: false,
          url: sound.url,
        })),
      )

      // Select the new sound
      await handleSoundSelect(soundId)

      // Switch back to select tab
      setActiveTab("select")
    } catch (error) {
      console.error(`Error refreshing ${type} sounds:`, error)
    }
  }

  // All sounds (default + custom)
  const allSounds = [...defaultSounds, ...customSounds]

  // Group sounds by category for better organization
  const categorizedSounds = {
    basic: ["default", "none"],
    effects: [
      "clapping-106694",
      "dark-engine-logo-141942",
      "epic-glitch-hit-logo-142960",
      "epic-hybrid-logo-157092",
      "modern-tech-logo-13492",
      "reverse-logo-143857",
      "simple-clean-logo-13775",
    ],
    music: [
      "dark-guitar-130435",
      "happy-outro-8110",
      "intro-music-black-box-string-violin-12349",
      "joyful-messy-piano-116715",
      "quotend-of-chapter-2quot-290229",
      "short-melancholic-theme-on-piano-34024",
      "short-soothing-strings-guitar-music-324302",
      "techology-intro-short-version-185783",
      "trompetenmusik-184249",
    ],
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="select">Select Sound</TabsTrigger>
          <TabsTrigger value="record">Record Sound</TabsTrigger>
          <TabsTrigger value="upload">Upload Sound</TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${type}-sound-select`}>Select Sound</Label>
            <div className="flex gap-2">
              <Select value={selectedSound} onValueChange={(value) => handleSoundSelect(value)} disabled={isLoading}>
                <SelectTrigger id={`${type}-sound-select`} className="flex-1">
                  <SelectValue placeholder="Select a sound" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Sound</SelectItem>

                  {/* Basic Sounds */}
                  <SelectItem value="default">Default</SelectItem>

                  {/* Sound Effects Group */}
                  <SelectItem disabled className="font-semibold text-muted-foreground py-1 mt-2">
                    Sound Effects
                  </SelectItem>
                  <SelectItem value="clapping-106694">Clapping</SelectItem>
                  <SelectItem value="dark-engine-logo-141942">Dark Engine</SelectItem>
                  <SelectItem value="epic-glitch-hit-logo-142960">Epic Glitch</SelectItem>
                  <SelectItem value="epic-hybrid-logo-157092">Epic Hybrid</SelectItem>
                  <SelectItem value="modern-tech-logo-13492">Modern Tech</SelectItem>
                  <SelectItem value="reverse-logo-143857">Reverse Logo</SelectItem>
                  <SelectItem value="simple-clean-logo-13775">Simple Clean</SelectItem>

                  {/* Music Group */}
                  <SelectItem disabled className="font-semibold text-muted-foreground py-1 mt-2">
                    Music
                  </SelectItem>
                  <SelectItem value="dark-guitar-130435">Dark Guitar</SelectItem>
                  <SelectItem value="happy-outro-8110">Happy Outro</SelectItem>
                  <SelectItem value="intro-music-black-box-string-violin-12349">String Violin</SelectItem>
                  <SelectItem value="joyful-messy-piano-116715">Joyful Piano</SelectItem>
                  <SelectItem value="quotend-of-chapter-2quot-290229">End of Chapter</SelectItem>
                  <SelectItem value="short-melancholic-theme-on-piano-34024">Melancholic Piano</SelectItem>
                  <SelectItem value="short-soothing-strings-guitar-music-324302">Soothing Strings</SelectItem>
                  <SelectItem value="techology-intro-short-version-185783">Technology Intro</SelectItem>
                  <SelectItem value="trompetenmusik-184249">Trumpet</SelectItem>

                  {/* Custom Sounds Group */}
                  {customSounds.length > 0 && (
                    <>
                      <SelectItem disabled className="font-semibold text-muted-foreground py-1 mt-2">
                        Your Custom Sounds
                      </SelectItem>
                      {customSounds.map((sound) => (
                        <SelectItem key={sound.id} value={sound.id}>
                          {sound.name} {sound.id.startsWith("recorded-") ? "(Recorded)" : "(Custom)"}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => playSound(selectedSound)}
                disabled={selectedSound === "none"}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={`${type}-volume-slider`}>Volume ({Math.round(volume * 100)}%)</Label>
            </div>
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <Slider
                id={`${type}-volume-slider`}
                min={0}
                max={1}
                step={0.05}
                value={[volume]}
                onValueChange={handleVolumeChange}
                className="flex-1"
                disabled={volumeLoading}
              />
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Sound Browser */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Sound Browser</h4>

            {/* Basic Sounds */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Basic</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categorizedSounds.basic
                  .filter((id) => id !== "none")
                  .map((soundId) => {
                    const sound = defaultSounds.find((s) => s.id === soundId)
                    return sound ? (
                      <div key={sound.id} className="flex items-center justify-between p-2 border rounded-md">
                        <span className="truncate">{sound.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => playSound(sound.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null
                  })}
              </div>
            </div>

            {/* Sound Effects */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Sound Effects</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categorizedSounds.effects.map((soundId) => {
                  const sound = defaultSounds.find((s) => s.id === soundId)
                  return sound ? (
                    <div key={sound.id} className="flex items-center justify-between p-2 border rounded-md">
                      <span className="truncate">{sound.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => playSound(sound.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null
                })}
              </div>
            </div>

            {/* Music */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Music</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categorizedSounds.music.map((soundId) => {
                  const sound = defaultSounds.find((s) => s.id === soundId)
                  return sound ? (
                    <div key={sound.id} className="flex items-center justify-between p-2 border rounded-md">
                      <span className="truncate">{sound.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => playSound(sound.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          </div>

          {customSounds.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h5 className="text-sm font-medium text-muted-foreground">Your Custom Sounds</h5>
              <div className="space-y-2">
                {customSounds.map((sound) => (
                  <div key={sound.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center">
                      <Volume2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate">
                        {sound.name}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {sound.id.startsWith("recorded-") ? "(Recorded)" : "(Uploaded)"}
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => playSound(sound.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSound(sound.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="record">
          <SoundRecorder type={type} onRecordingComplete={handleRecordingComplete} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-2">
            <Label>Upload MP3 Sound</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Sound name"
                value={newSoundName}
                onChange={(e) => setNewSoundName(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleFileUpload} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload MP3"}
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Upload MP3 files (max 2MB)</p>
              <p className="text-xs text-muted-foreground">
                You can find free MP3 sound effects online or convert your own audio files to MP3 format.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden audio element for previews */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
