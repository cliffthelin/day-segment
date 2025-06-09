import { db } from "./db"

// Check if notifications are supported
export function areNotificationsSupported(): boolean {
  return "Notification" in window
}

// Check notification permission status
export async function checkNotificationPermission(): Promise<NotificationPermission> {
  if (!areNotificationsSupported()) {
    return "denied"
  }

  return Notification.permission
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!areNotificationsSupported()) {
    return "denied"
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    return "denied"
  }
}

// Show a notification
export function showNotification(title: string, options: NotificationOptions = {}): Notification | null {
  if (!areNotificationsSupported() || Notification.permission !== "granted") {
    return null
  }

  try {
    const notification = new Notification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      ...options,
    })

    return notification
  } catch (error) {
    console.error("Error showing notification:", error)
    return null
  }
}

// Play a notification sound
export async function playNotificationSound(sound = "default") {
  if (sound === "none") return

  try {
    let soundUrl = ""
    let volume = 0.7 // Default volume

    // Get volume setting from database
    try {
      const volumeSetting = await db.settings.get("notificationVolume")
      if (volumeSetting?.value !== undefined) {
        volume = volumeSetting.value
      }
    } catch (err) {
      console.error("Error getting volume setting:", err)
    }

    // Check if it's a default sound
    if (sound === "default" || sound === "bell" || sound === "chime") {
      soundUrl = `/sounds/${sound}.mp3`
    } else {
      // Try to find custom sound in database (uploaded or recorded)
      const customSound = await db.sounds.get(sound)
      if (customSound?.url) {
        soundUrl = customSound.url
      } else {
        // Fallback to default
        soundUrl = "/sounds/default.mp3"
      }
    }

    if (soundUrl) {
      const audio = new Audio(soundUrl)
      audio.volume = volume // Apply volume setting
      await audio.play()
    }
  } catch (error) {
    console.error("Error playing notification sound:", error)
  }
}
