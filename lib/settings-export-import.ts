import { db } from "./db"

/**
 * Settings export format
 */
export interface SettingsExport {
  metadata: {
    exportDate: string
    appVersion: string
    schemaVersion: number
  }
  settings: {
    key: string
    value: any
  }[]
}

/**
 * Export all settings to a JSON file
 */
export async function exportSettings(): Promise<{ success: boolean; error?: string; data?: SettingsExport }> {
  try {
    // Get all settings from the database
    const settings = await db.settings.toArray()

    if (!settings || settings.length === 0) {
      return { success: false, error: "No settings found to export" }
    }

    // Create the export object
    const exportData: SettingsExport = {
      metadata: {
        exportDate: new Date().toISOString(),
        appVersion: "1.0.0", // This should be dynamically determined in a real app
        schemaVersion: 16, // Current schema version
      },
      settings: settings,
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error("Error exporting settings:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Download settings as a JSON file
 */
export function downloadSettingsFile(data: SettingsExport): void {
  try {
    // Convert the data to a JSON string
    const jsonString = JSON.stringify(data, null, 2)

    // Create a blob with the JSON data
    const blob = new Blob([jsonString], { type: "application/json" })

    // Create a URL for the blob
    const url = URL.createObjectURL(blob)

    // Generate a filename with the current date
    const date = new Date()
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`
    const filename = `day-segment-tracker-settings-${formattedDate}.json`

    // Create a link element
    const link = document.createElement("a")
    link.href = url
    link.download = filename

    // Append the link to the body
    document.body.appendChild(link)

    // Click the link to trigger the download
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading settings file:", error)
    throw error
  }
}

/**
 * Import settings from a JSON file
 */
export async function importSettings(
  file: File,
): Promise<{ success: boolean; error?: string; imported: number; skipped: number }> {
  try {
    // Read the file content
    const fileContent = await readFileContent(file)

    // Parse the JSON
    const importData = JSON.parse(fileContent) as SettingsExport

    // Validate the import data
    if (!importData || !importData.metadata || !importData.settings || !Array.isArray(importData.settings)) {
      return { success: false, error: "Invalid settings file format", imported: 0, skipped: 0 }
    }

    // Check schema version compatibility
    if (importData.metadata.schemaVersion > 16) {
      return {
        success: false,
        error: `The settings file is from a newer version of the app (schema version ${importData.metadata.schemaVersion}) and cannot be imported.`,
        imported: 0,
        skipped: 0,
      }
    }

    // Import the settings
    let imported = 0
    let skipped = 0

    await db.transaction("rw", db.settings, async () => {
      for (const setting of importData.settings) {
        // Skip invalid settings
        if (!setting.key) {
          skipped++
          continue
        }

        // Check if the setting already exists
        const existingSetting = await db.settings.get(setting.key)

        if (existingSetting) {
          // Update existing setting
          await db.settings.update(setting.key, { value: setting.value })
        } else {
          // Add new setting
          await db.settings.add(setting)
        }

        imported++
      }
    })

    return { success: true, imported, skipped }
  } catch (error) {
    console.error("Error importing settings:", error)
    return { success: false, error: (error as Error).message, imported: 0, skipped: 0 }
  }
}

/**
 * Read file content as text
 */
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string)
      } else {
        reject(new Error("Failed to read file content"))
      }
    }
    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }
    reader.readAsText(file)
  })
}
