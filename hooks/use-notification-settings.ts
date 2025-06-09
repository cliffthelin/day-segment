"use client"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/db"

export interface NotificationSettings {
  // Segment change notifications
  segmentChangeEnabled: boolean
  segmentChangeAdvanceTime: number // minutes before segment change
  segmentChangeSound: string

  // Task reminders
  taskReminderEnabled: boolean
  taskReminderFrequency: "segment" | "daily" | "custom"
  taskReminderTime: string // HH:MM format for daily reminders
  taskReminderSound: string

  // Check-in reminders
  checkInReminderEnabled: boolean
  checkInReminderDelay: number // minutes after segment change
  checkInReminderSound: string
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  segmentChangeEnabled: false,
  segmentChangeAdvanceTime: 5,
  segmentChangeSound: "default",

  taskReminderEnabled: false,
  taskReminderFrequency: "daily",
  taskReminderTime: "09:00",
  taskReminderSound: "default",

  checkInReminderEnabled: false,
  checkInReminderDelay: 5,
  checkInReminderSound: "default",
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load notification settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const storedSettings = await db.settings.get("notificationSettings")

        if (storedSettings?.value) {
          setSettings(storedSettings.value)
        } else {
          // Initialize with default settings if none exist
          await db.settings.put({
            key: "notificationSettings",
            value: DEFAULT_NOTIFICATION_SETTINGS,
          })
          setSettings(DEFAULT_NOTIFICATION_SETTINGS)
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

  // Update notification settings
  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      try {
        setIsLoading(true)
        setError(null)

        // Update local state optimistically
        const updatedSettings = { ...settings, ...updates }
        setSettings(updatedSettings)

        // Update in database
        await db.settings.put({ key: "notificationSettings", value: updatedSettings })

        return updatedSettings
      } catch (err) {
        console.error("Error updating notification settings:", err)
        setError(err instanceof Error ? err : new Error("Failed to update notification settings"))

        // Revert to previous settings on error
        const storedSettings = await db.settings.get("notificationSettings")
        if (storedSettings?.value) {
          setSettings(storedSettings.value)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [settings],
  )

  return [settings, updateSettings, isLoading, error] as const
}
