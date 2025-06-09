"use client"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"
import { triggerHapticFeedback } from "@/lib/haptic-utils"

interface GeneralSettingsProps {
  highlightedSetting?: string | null
}

export function GeneralSettings({ highlightedSetting }: GeneralSettingsProps) {
  const [isDarkMode, setIsDarkMode] = useLocalStorage("darkMode", false)
  const [is24HourFormat, setIs24HourFormat] = useLocalStorage("24HourFormat", false)
  const [hapticFeedback, setHapticFeedback] = useLocalStorage("hapticFeedback", true)

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked)
    if (hapticFeedback) triggerHapticFeedback("medium", hapticFeedback)
  }

  const handle24HourFormatToggle = (checked: boolean) => {
    setIs24HourFormat(checked)
    if (hapticFeedback) triggerHapticFeedback("medium", hapticFeedback)
  }

  const handleHapticFeedbackToggle = (checked: boolean) => {
    setHapticFeedback(checked)
    if (checked) triggerHapticFeedback("medium", checked)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Display Preferences</h2>

        <div
          className={cn(
            "flex items-center justify-between rounded-lg border p-4",
            highlightedSetting === "general-preferences-dark-mode" && "bg-primary/10 border-primary",
          )}
          id="general-preferences-dark-mode"
        >
          <div className="space-y-0.5">
            <Label className="text-base" htmlFor="dark-mode">
              Dark Mode
            </Label>
            <p className="text-sm text-muted-foreground">Use dark theme for the application</p>
          </div>
          <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={handleDarkModeToggle} />
        </div>

        <div
          className={cn(
            "flex items-center justify-between rounded-lg border p-4",
            highlightedSetting === "general-preferences-24-hour-time" && "bg-primary/10 border-primary",
          )}
          id="general-preferences-24-hour-time"
        >
          <div className="space-y-0.5">
            <Label className="text-base" htmlFor="24-hour-format">
              24-Hour Time
            </Label>
            <p className="text-sm text-muted-foreground">Display time in 24-hour format</p>
          </div>
          <Switch id="24-hour-format" checked={is24HourFormat} onCheckedChange={handle24HourFormatToggle} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Interaction</h2>

        <div
          className={cn(
            "flex items-center justify-between rounded-lg border p-4",
            highlightedSetting === "general-preferences-haptic-feedback" && "bg-primary/10 border-primary",
          )}
          id="general-preferences-haptic-feedback"
        >
          <div className="space-y-0.5">
            <Label className="text-base" htmlFor="haptic-feedback">
              Haptic Feedback
            </Label>
            <p className="text-sm text-muted-foreground">Enable vibration when interacting with controls</p>
          </div>
          <Switch id="haptic-feedback" checked={hapticFeedback} onCheckedChange={handleHapticFeedbackToggle} />
        </div>
      </div>
    </div>
  )
}
