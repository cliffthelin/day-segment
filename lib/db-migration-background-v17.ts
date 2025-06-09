import { db } from "@/lib/db"

export async function migrateBackgroundSettingsV17() {
  try {
    // Check if we've already migrated to version 17 background settings
    const migratedBackgroundV17 = await db.settings.get("migratedBackgroundSettingsV17")
    if (migratedBackgroundV17 && migratedBackgroundV17.value === true) {
      console.log("Version 17 background settings migration already completed")
      return true
    }

    console.log("Performing version 17 background settings migration...")

    // Add background blur setting if it doesn't exist
    const backgroundBlur = await db.settings.get("backgroundBlur")
    if (!backgroundBlur) {
      await db.settings.put({ key: "backgroundBlur", value: 0 })
      console.log("Added backgroundBlur setting")
    }

    // Add background overlay setting if it doesn't exist
    const backgroundOverlay = await db.settings.get("backgroundOverlay")
    if (!backgroundOverlay) {
      await db.settings.put({ key: "backgroundOverlay", value: "rgba(0,0,0,0)" })
      console.log("Added backgroundOverlay setting")
    }

    // Add background position setting if it doesn't exist
    const backgroundPosition = await db.settings.get("backgroundPosition")
    if (!backgroundPosition) {
      await db.settings.put({ key: "backgroundPosition", value: "center" })
      console.log("Added backgroundPosition setting")
    }

    // Add useSeparateThemeBackgrounds setting if it doesn't exist
    const useSeparateThemeBackgrounds = await db.settings.get("useSeparateThemeBackgrounds")
    if (!useSeparateThemeBackgrounds) {
      await db.settings.put({ key: "useSeparateThemeBackgrounds", value: false })
      console.log("Added useSeparateThemeBackgrounds setting")
    }

    // Add lightBackgroundImage setting if it doesn't exist
    const lightBackgroundImage = await db.settings.get("lightBackgroundImage")
    if (!lightBackgroundImage) {
      // Use the existing background image if available
      const existingBg = await db.settings.get("backgroundImage")
      await db.settings.put({ key: "lightBackgroundImage", value: existingBg?.value || "" })
      console.log("Added lightBackgroundImage setting")
    }

    // Add darkBackgroundImage setting if it doesn't exist
    const darkBackgroundImage = await db.settings.get("darkBackgroundImage")
    if (!darkBackgroundImage) {
      // Use the existing background image if available
      const existingBg = await db.settings.get("backgroundImage")
      await db.settings.put({ key: "darkBackgroundImage", value: existingBg?.value || "" })
      console.log("Added darkBackgroundImage setting")
    }

    // Add backgroundSize setting if it doesn't exist
    const backgroundSize = await db.settings.get("backgroundSize")
    if (!backgroundSize) {
      await db.settings.put({ key: "backgroundSize", value: "cover" })
      console.log("Added backgroundSize setting")
    }

    // Mark the migration as completed
    await db.settings.put({ key: "migratedBackgroundSettingsV17", value: true })
    console.log("Successfully migrated to background settings version 17")
    return true
  } catch (error) {
    console.error("Error during version 17 background settings migration:", error)
    return false
  }
}
