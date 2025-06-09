"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { Bell, Save, Loader2, Clock, Volume2, AlertTriangle } from "lucide-react"
import { db } from "@/lib/db"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function NotificationSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(true)

  // Notification settings
  const [settings, setSettings] = useState({
    // Segment change notifications
    segmentChangeEnabled: false,
    segmentChangeAdvanceTime: 5, // minutes before segment change
    segmentChangeSound: "default",

    // Task reminders
    taskReminderEnabled: false,
    taskReminderFrequency: "daily", // "segment" | "daily" | "custom"
    taskReminderTime: "09:00", // HH:MM format for daily reminders
    taskReminderSound: "default",

    // Check-in reminders
    checkInReminderEnabled: false,
    checkInReminderDelay: 5, // minutes after segment change
    checkInReminderSound: "default",

    // Voice check-in reminders
    voiceCheckInReminderEnabled: false,
    voiceCheckInReminderFrequency: "daily",
    voiceCheckInReminderTime: "18:00",

    // General notification settings
    notificationVolume: 0.7,
  })

  // Check if notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = typeof window !== "undefined" && "Notification" in window
      setIsSupported(supported)

      if (supported) {
        setPermissionStatus(Notification.permission as NotificationPermission)
      }
    }

    checkSupport()
  }, [])

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load notification settings from database
        const storedSettings = await db.settings.get("notificationSettings")

        if (storedSettings?.value) {
          setSettings(storedSettings.value)
        } else {
          // Initialize with default settings if none exist
          await db.settings.put({
            key: "notificationSettings",
            value: settings,
          })
        }
      } catch (err) {
        console.error("Error loading notification settings:", err)
        setError(err instanceof Error ? err : new Error("Failed to load notification settings"))
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Request notification permission
  const handleRequestPermission = async () => {
    if (!isSupported) return

    try {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)

      if (permission === "granted") {
        toast({
          title: "Notifications enabled",
          description: "You will now receive notifications based on your settings.",
        })

        // Show a test notification
        const notification = new Notification("Notifications Enabled", {
          body: "You will now receive notifications from Day Segment Tracker.",
          icon: "/icons/icon-192x192.png",
        })

        // Close the notification after 5 seconds
        setTimeout(() => notification.close(), 5000)
      } else {
        toast({
          title: "Notification permission denied",
          description: "Please enable notifications in your browser settings to receive alerts.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err)
      toast({
        title: "Error enabling notifications",
        description: "There was a problem enabling notifications. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Save notification settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)

      // Save settings to database
      await db.settings.put({
        key: "notificationSettings",
        value: settings,
      })

      toast({
        title: "Notification settings saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (err) {
      console.error("Error saving notification settings:", err)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your notification settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle toggle changes
  const handleToggleChange = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle select changes
  const handleSelectChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle slider changes
  const handleSliderChange = (key: string, value: number[]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value[0],
    }))
  }

  // Handle input changes
  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle sound change
  const handleSoundChange = (type: string, soundId: string) => {
    setSettings((prev) => ({
      ...prev,
      [`${type}Sound`]: soundId,
    }))

    // Play a preview of the selected sound
    const audio = new Audio(`/sounds/${soundId}.mp3`)
    audio.volume = settings.notificationVolume
    audio.play()
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure when and how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Notifications Not Supported</AlertTitle>
            <AlertDescription>
              Your browser doesn't support notifications. Please try using a modern browser like Chrome, Firefox, or
              Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure when and how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Configure when and how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {permissionStatus !== "granted" && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertTitle>Enable Notifications</AlertTitle>
            <AlertDescription>
              <p className="mb-2">You need to grant permission to receive notifications from this app.</p>
              <Button onClick={handleRequestPermission} size="sm">
                Enable Notifications
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Segment Change Notifications</h3>
              <p className="text-sm text-muted-foreground">Get notified when your day moves to a new segment</p>
            </div>
            <Switch
              checked={settings.segmentChangeEnabled}
              onCheckedChange={(checked) => handleToggleChange("segmentChangeEnabled", checked)}
              disabled={permissionStatus !== "granted"}
            />
          </div>

          {settings.segmentChangeEnabled && (
            <div className="space-y-4 pl-6 border-l">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Notification Timing
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    min={0}
                    max={15}
                    step={1}
                    value={[settings.segmentChangeAdvanceTime]}
                    onValueChange={(value) => handleSliderChange("segmentChangeAdvanceTime", value)}
                    className="flex-1"
                    disabled={permissionStatus !== "granted"}
                  />
                  <span className="w-16 text-right">{settings.segmentChangeAdvanceTime} min</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.segmentChangeAdvanceTime === 0
                    ? "Notify exactly at segment change"
                    : `Notify ${settings.segmentChangeAdvanceTime} minutes before segment change`}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  Notification Sound
                </Label>
                <Select
                  value={settings.segmentChangeSound}
                  onValueChange={(value) => handleSoundChange("segmentChange", value)}
                  disabled={permissionStatus !== "granted"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sound" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="none">No Sound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Task Reminders</h3>
              <p className="text-sm text-muted-foreground">Get reminded about incomplete tasks</p>
            </div>
            <Switch
              checked={settings.taskReminderEnabled}
              onCheckedChange={(checked) => handleToggleChange("taskReminderEnabled", checked)}
              disabled={permissionStatus !== "granted"}
            />
          </div>

          {settings.taskReminderEnabled && (
            <div className="space-y-4 pl-6 border-l">
              <div className="space-y-2">
                <Label htmlFor="task-frequency">Reminder Frequency</Label>
                <Select
                  value={settings.taskReminderFrequency}
                  onValueChange={(value) => handleSelectChange("taskReminderFrequency", value)}
                  disabled={permissionStatus !== "granted"}
                >
                  <SelectTrigger id="task-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="segment">Every segment change</SelectItem>
                    <SelectItem value="daily">Once daily</SelectItem>
                    <SelectItem value="custom">Custom schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.taskReminderFrequency === "daily" && (
                <div className="space-y-2">
                  <Label htmlFor="task-time">Daily Reminder Time</Label>
                  <Input
                    id="task-time"
                    type="time"
                    value={settings.taskReminderTime}
                    onChange={(e) => handleInputChange("taskReminderTime", e.target.value)}
                    disabled={permissionStatus !== "granted"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notification Sound</Label>
                <Select
                  value={settings.taskReminderSound}
                  onValueChange={(value) => handleSoundChange("taskReminder", value)}
                  disabled={permissionStatus !== "granted"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sound" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="none">No Sound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Check-in Reminders</h3>
              <p className="text-sm text-muted-foreground">Get reminded to complete your segment check-ins</p>
            </div>
            <Switch
              checked={settings.checkInReminderEnabled}
              onCheckedChange={(checked) => handleToggleChange("checkInReminderEnabled", checked)}
              disabled={permissionStatus !== "granted"}
            />
          </div>

          {settings.checkInReminderEnabled && (
            <div className="space-y-4 pl-6 border-l">
              <div className="space-y-2">
                <Label>Reminder Delay</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    min={0}
                    max={30}
                    step={5}
                    value={[settings.checkInReminderDelay]}
                    onValueChange={(value) => handleSliderChange("checkInReminderDelay", value)}
                    className="flex-1"
                    disabled={permissionStatus !== "granted"}
                  />
                  <span className="w-16 text-right">{settings.checkInReminderDelay} min</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.checkInReminderDelay === 0
                    ? "Remind immediately at segment change"
                    : `Remind ${settings.checkInReminderDelay} minutes after segment change if not completed`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notification Sound</Label>
                <Select
                  value={settings.checkInReminderSound}
                  onValueChange={(value) => handleSoundChange("checkInReminder", value)}
                  disabled={permissionStatus !== "granted"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sound" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="none">No Sound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Voice Check-in Reminders</h3>
              <p className="text-sm text-muted-foreground">Get reminded to record your voice check-ins</p>
            </div>
            <Switch
              checked={settings.voiceCheckInReminderEnabled}
              onCheckedChange={(checked) => handleToggleChange("voiceCheckInReminderEnabled", checked)}
              disabled={permissionStatus !== "granted"}
            />
          </div>

          {settings.voiceCheckInReminderEnabled && (
            <div className="space-y-4 pl-6 border-l">
              <div className="space-y-2">
                <Label htmlFor="voice-frequency">Reminder Frequency</Label>
                <Select
                  value={settings.voiceCheckInReminderFrequency}
                  onValueChange={(value) => handleSelectChange("voiceCheckInReminderFrequency", value)}
                  disabled={permissionStatus !== "granted"}
                >
                  <SelectTrigger id="voice-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="segment">Every segment change</SelectItem>
                    <SelectItem value="daily">Once daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.voiceCheckInReminderFrequency === "daily" && (
                <div className="space-y-2">
                  <Label htmlFor="voice-time">Daily Reminder Time</Label>
                  <Input
                    id="voice-time"
                    type="time"
                    value={settings.voiceCheckInReminderTime}
                    onChange={(e) => handleInputChange("voiceCheckInReminderTime", e.target.value)}
                    disabled={permissionStatus !== "granted"}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              Notification Volume
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[settings.notificationVolume]}
                onValueChange={(value) => handleSliderChange("notificationVolume", value)}
                className="flex-1"
              />
              <span className="w-16 text-right">{Math.round(settings.notificationVolume * 100)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Notification Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
