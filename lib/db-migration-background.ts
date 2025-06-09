// Avoid circular dependency
import Dexie from "dexie"

// Get the database instance without importing from db.ts
const db = new Dexie("daySegmentTracker")
db.version(1).stores({
  segments: "++id, name, startTime, endTime",
  checkIns: "++id, date, segmentId",
  tasks: "++id, name, type, categoryId, isRecurring, isArchived",
  taskEntries: "++id, taskId, date, segmentId, status, [taskId+date], [date+segmentId]",
  subtasks: "++id, taskId, name, order",
  subtaskEntries: "++id, taskEntryId, subtaskId, isCompleted, [taskEntryId+subtaskId]",
  timerSessions: "++id, taskId, taskEntryId, date",
  metrics: "++id, name",
  settings: "key",
  suggestedPrompts: "++id, text, category, dateAdded, isCompleted",
  sounds: "id, name, type, dateAdded",
  categories: "++id, name, color, isDefault",
  taskTemplates: "++id, name, type, createdAt, usageCount, categoryId",
  collections: "++id, name, isRecurring, createdAt",
  taskCollections: "++id, taskId, collectionId, [taskId+collectionId]",
})

export async function migrateBackgroundSettings() {
  console.log("Running background settings migration...")

  try {
    // Check if background settings already exist
    const existingSettings = await db.settings.get("backgroundSettings")

    if (!existingSettings) {
      // Create default background settings
      await db.settings.put(
        {
          backgroundType: "none",
          backgroundPath: "",
          customBackgroundData: "",
          formOpacity: 80,
        },
        "backgroundSettings",
      )

      console.log("Created default background settings")
    } else {
      console.log("Background settings already exist, skipping migration")
    }

    return true
  } catch (error) {
    console.error("Error during background settings migration:", error)
    return false
  }
}

export async function migrateToBackgroundSettings() {
  try {
    // Check if we've already migrated
    const migrated = await db.settings.get("migratedToBackgroundSettings")
    if (migrated && migrated.value === true) {
      console.log("Background settings migration already completed")
      return
    }

    console.log("Migrating to background settings schema...")

    // Add new settings if they don't exist
    const backgroundImage = await db.settings.get("backgroundImage")
    if (!backgroundImage) {
      await db.settings.put({ key: "backgroundImage", value: "" })
      console.log("Added backgroundImage setting")
    }

    const formOpacity = await db.settings.get("formOpacity")
    if (!formOpacity) {
      await db.settings.put({ key: "formOpacity", value: 0.95 })
      console.log("Added formOpacity setting")
    }

    // Mark as migrated
    await db.settings.put({ key: "migratedToBackgroundSettings", value: true })
    console.log("Successfully migrated to background settings schema")
  } catch (error) {
    console.error("Error migrating to background settings:", error)
  }
}

// Function to handle version 16 migration
export async function migrateToVersion16() {
  try {
    // Check if we've already migrated to version 16
    const migratedToV16 = await db.settings.get("migratedToVersion16")
    if (migratedToV16 && migratedToV16.value === true) {
      console.log("Version 16 migration already completed")
      return
    }

    console.log("Performing version 16 migration...")

    // Add color scheme setting if it doesn't exist
    const colorScheme = await db.settings.get("colorScheme")
    if (!colorScheme) {
      await db.settings.put({ key: "colorScheme", value: "default" })
      console.log("Added colorScheme setting")
    }

    // Add separate light and dark theme settings if they don't exist
    const lightTheme = await db.settings.get("lightTheme")
    if (!lightTheme) {
      await db.settings.put({ key: "lightTheme", value: "default" })
      console.log("Added lightTheme setting")
    }

    const darkTheme = await db.settings.get("darkTheme")
    if (!darkTheme) {
      await db.settings.put({ key: "darkTheme", value: "defaultDark" })
      console.log("Added darkTheme setting")
    }

    // Mark the migration as completed
    await db.settings.put({ key: "migratedToVersion16", value: true })
    console.log("Successfully migrated to database version 16")
  } catch (error) {
    console.error("Error during version 16 migration:", error)
  }
}
