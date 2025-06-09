import Dexie from "dexie"

// Function to handle version 16 migration
export async function migrateToVersion16() {
  try {
    // Get the database instance
    const db = new Dexie("daySegmentTracker")
    db.version(1).stores({
      settings: "key",
    })

    // Check if we've already migrated to version 16
    const migratedToV16 = await db.table("settings").get("migratedToVersion16")
    if (migratedToV16 && migratedToV16.value === true) {
      console.log("Version 16 migration already completed")
      return
    }

    console.log("Performing version 16 migration...")

    // Add color scheme setting if it doesn't exist
    const colorScheme = await db.table("settings").get("colorScheme")
    if (!colorScheme) {
      await db.table("settings").put({ key: "colorScheme", value: "default" })
      console.log("Added colorScheme setting")
    }

    // Add separate light and dark theme settings if they don't exist
    const lightTheme = await db.table("settings").get("lightTheme")
    if (!lightTheme) {
      await db.table("settings").put({ key: "lightTheme", value: "default" })
      console.log("Added lightTheme setting")
    }

    const darkTheme = await db.table("settings").get("darkTheme")
    if (!darkTheme) {
      await db.table("settings").put({ key: "darkTheme", value: "defaultDark" })
      console.log("Added darkTheme setting")
    }

    // Mark the migration as completed
    await db.table("settings").put({ key: "migratedToVersion16", value: true })
    console.log("Successfully migrated to database version 16")
  } catch (error) {
    console.error("Error during version 16 migration:", error)
  }
}
