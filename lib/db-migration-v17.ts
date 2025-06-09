import { db } from "./db"

export async function migrateToVersion17() {
  console.log("Starting migration to version 17...")

  try {
    // Check if we've already migrated
    const migratedToV17 = await db.settings.get("migratedToVersion17")
    if (migratedToV17 && migratedToV17.value === true) {
      console.log("Already migrated to version 17, skipping")
      return
    }

    // Add new settings for export/import functionality
    await ensureSettingExists("settingsExportHistory", [])
    await ensureSettingExists("lastSettingsImport", null)

    // Ensure haptic feedback setting exists
    await ensureSettingExists("hapticFeedback", true)

    // Mark migration as complete
    await db.settings.put({ key: "migratedToVersion17", value: true })
    console.log("Migration to version 17 completed successfully")
  } catch (error) {
    console.error("Error during migration to version 17:", error)
    // Don't throw the error - we want the app to continue working even if migration fails
  }
}

// Helper function to ensure a setting exists
async function ensureSettingExists(key: string, defaultValue: any) {
  try {
    const setting = await db.settings.get(key)
    if (!setting) {
      console.log(`Adding missing setting: ${key}`)
      await db.settings.put({ key, value: defaultValue })
    } else {
      console.log(`Setting ${key} already exists, skipping`)
    }
  } catch (error) {
    console.error(`Error ensuring setting ${key} exists:`, error)
  }
}
