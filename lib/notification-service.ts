import { showNotification, playNotificationSound, checkNotificationPermission } from "./notification-utils"
import { db } from "./db"
import type { NotificationSettings } from "@/hooks/use-notification-settings"
import type { Segment, Task } from "./db"

// Get notification settings
async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const settings = await db.settings.get("notificationSettings")
    return settings?.value || null
  } catch (error) {
    console.error("Error getting notification settings:", error)
    return null
  }
}

// Segment change notification
export async function notifySegmentChange(segment: Segment): Promise<void> {
  const settings = await getNotificationSettings()
  if (!settings || !settings.segmentChangeEnabled) return

  const permission = await checkNotificationPermission()
  if (permission !== "granted") return

  // Show notification
  const notification = showNotification(`${segment.name} Segment Started`, {
    body: `Your day has moved to the ${segment.name} segment.`,
    tag: `segment-change-${segment.id}`,
    requireInteraction: false,
    silent: settings.segmentChangeSound === "none",
  })

  // Play sound
  if (settings.segmentChangeSound !== "none") {
    playNotificationSound(settings.segmentChangeSound)
  }

  // Handle notification click
  if (notification) {
    notification.onclick = () => {
      window.focus()
      notification.close()
      window.location.href = "/dashboard"
    }
  }
}

// Task reminder notification
export async function notifyTaskReminder(tasks: Task[]): Promise<void> {
  const settings = await getNotificationSettings()
  if (!settings || !settings.taskReminderEnabled || tasks.length === 0) return

  const permission = await checkNotificationPermission()
  if (permission !== "granted") return

  // Format task list for notification
  const taskCount = tasks.length
  const taskList = tasks
    .slice(0, 3)
    .map((task) => task.name)
    .join(", ")
  const additionalTasks = taskCount > 3 ? ` and ${taskCount - 3} more` : ""

  // Show notification
  const notification = showNotification(`Task Reminder`, {
    body: `You have ${taskCount} pending tasks: ${taskList}${additionalTasks}`,
    tag: "task-reminder",
    requireInteraction: true,
    silent: settings.taskReminderSound === "none",
  })

  // Play sound
  if (settings.taskReminderSound !== "none") {
    playNotificationSound(settings.taskReminderSound)
  }

  // Handle notification click
  if (notification) {
    notification.onclick = () => {
      window.focus()
      notification.close()
      window.location.href = "/tasks"
    }
  }
}

// Check-in reminder notification
export async function notifyCheckInReminder(segment: Segment): Promise<void> {
  const settings = await getNotificationSettings()
  if (!settings || !settings.checkInReminderEnabled) return

  const permission = await checkNotificationPermission()
  if (permission !== "granted") return

  // Show notification
  const notification = showNotification(`Check-in Reminder`, {
    body: `Don't forget to complete your check-in for the ${segment.name} segment.`,
    tag: `check-in-reminder-${segment.id}`,
    requireInteraction: true,
    silent: settings.checkInReminderSound === "none",
  })

  // Play sound
  if (settings.checkInReminderSound !== "none") {
    playNotificationSound(settings.checkInReminderSound)
  }

  // Handle notification click
  if (notification) {
    notification.onclick = () => {
      window.focus()
      notification.close()
      window.location.href = "/dashboard"
    }
  }
}
