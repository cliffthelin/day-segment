"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SoundManager } from "@/components/sound-manager"
import { useToast } from "@/components/ui/use-toast"
import { useSetting } from "@/hooks/use-dexie-store"

export function SoundSettings() {
  const { toast } = useToast()
  const [timerSound, setTimerSound] = useSetting("timerSound", "default")
  const [timerCompleteSound, setTimerCompleteSound] = useSetting("timerCompleteSound", "bell")

  // Handle sound change
  const handleSoundChange = async (type: string, soundId: string) => {
    try {
      if (type === "timer") {
        await setTimerSound(soundId)
      } else if (type === "timerComplete") {
        await setTimerCompleteSound(soundId)
      }

      toast({
        title: "Sound updated",
        description: `Your ${type === "timer" ? "timer start" : "timer completion"} sound has been updated.`,
      })

      return Promise.resolve()
    } catch (error) {
      console.error(`Error updating ${type} sound:`, error)
      toast({
        title: "Update failed",
        description: `There was an error updating your ${type === "timer" ? "timer start" : "timer completion"} sound.`,
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sound Settings</CardTitle>
        <CardDescription>Customize sounds for timers and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timer">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timer">Timer Sounds</TabsTrigger>
            <TabsTrigger value="notification">Notification Sounds</TabsTrigger>
          </TabsList>
          <TabsContent value="timer" className="space-y-6">
            <SoundManager
              type="timer"
              title="Timer Start Sound"
              description="Select a sound to play when you start a timer. You can also upload your own MP3 files below."
              onSoundChange={(soundId) => handleSoundChange("timer", soundId)}
            />
            <SoundManager
              type="timer"
              title="Timer Completion Sound"
              description="Select a sound to play when a timer completes. You can also upload your own MP3 files below."
              onSoundChange={(soundId) => handleSoundChange("timerComplete", soundId)}
            />
          </TabsContent>
          <TabsContent value="notification">
            <p className="text-sm text-muted-foreground mb-4">
              Notification sounds can be configured in the Notifications tab. You can upload custom MP3 files for each
              notification type.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
