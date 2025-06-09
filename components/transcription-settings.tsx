"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { TranscriptionDemo } from "./transcription-demo"

export function TranscriptionSettings() {
  const [settings, setSettings] = useState({
    autoProcess: true,
    improveAccuracy: true,
    removeFillerWords: false,
  })

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Get settings directly from the settings table
        const autoProcessSetting = await db.settings.get("transcription.autoProcess")
        const improveAccuracySetting = await db.settings.get("transcription.improveAccuracy")
        const removeFillerWordsSetting = await db.settings.get("transcription.removeFillerWords")

        setSettings({
          autoProcess: autoProcessSetting?.value !== undefined ? autoProcessSetting.value : true,
          improveAccuracy: improveAccuracySetting?.value !== undefined ? improveAccuracySetting.value : true,
          removeFillerWords: removeFillerWordsSetting?.value !== undefined ? removeFillerWordsSetting.value : false,
        })
      } catch (error) {
        console.error("Error loading transcription settings:", error)
      }
    }

    loadSettings()
  }, [])

  // Save settings to database
  const saveSettings = async () => {
    try {
      // Save settings directly to the settings table
      await db.settings.put({ key: "transcription.autoProcess", value: settings.autoProcess })
      await db.settings.put({ key: "transcription.improveAccuracy", value: settings.improveAccuracy })
      await db.settings.put({ key: "transcription.removeFillerWords", value: settings.removeFillerWords })
    } catch (error) {
      console.error("Error saving transcription settings:", error)
    }
  }

  // Handle setting changes
  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        [setting]: !prev[setting],
      }

      // Save settings when changed
      db.settings
        .put({ key: `transcription.${setting}`, value: newSettings[setting] })
        .catch((error) => console.error(`Error saving ${setting} setting:`, error))

      return newSettings
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transcription Settings</CardTitle>
          <CardDescription>Configure how voice recordings are transcribed to text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-process" className="flex flex-col space-y-1">
                <span>Auto-process transcriptions</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Automatically improve transcription quality
                </span>
              </Label>
              <Switch
                id="auto-process"
                checked={settings.autoProcess}
                onCheckedChange={() => handleSettingChange("autoProcess")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="improve-accuracy" className="flex flex-col space-y-1">
                <span>Improve accuracy</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Fix capitalization, punctuation, and common errors
                </span>
              </Label>
              <Switch
                id="improve-accuracy"
                checked={settings.improveAccuracy}
                onCheckedChange={() => handleSettingChange("improveAccuracy")}
                disabled={!settings.autoProcess}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="remove-filler-words" className="flex flex-col space-y-1">
                <span>Remove filler words</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Remove "um", "uh", "like", etc. from transcriptions
                </span>
              </Label>
              <Switch
                id="remove-filler-words"
                checked={settings.removeFillerWords}
                onCheckedChange={() => handleSettingChange("removeFillerWords")}
                disabled={!settings.autoProcess}
              />
            </div>
          </div>

          <Button onClick={saveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <TranscriptionDemo />
    </div>
  )
}
