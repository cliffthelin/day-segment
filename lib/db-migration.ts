import { db } from "@/lib/db"
import { addSampleTasks } from "./db-migration-tasks"
import { migrateToBackgroundSettings } from "./db-migration-background"
import { migrateToVersion16 } from "./db-migration-background"
import { migrateBackgroundSettingsV17 } from "./db-migration-background-v17"

export async function runMigrations() {
  let status = true
  try {
    console.log("Starting database migrations...")

    // Run background settings migrations
    await migrateToBackgroundSettings()

    // Run version 16 migration
    await migrateToVersion16()

    // Run version 17 migrations
    await migrateBackgroundSettingsV17()

    // Add sample tasks if needed - only if user has no tasks
    const taskCount = await db.tasks.count()
    if (taskCount === 0) {
      status = await addSampleTasks()
    }

    return status
  } catch (e) {
    console.error("Error during migrations:", e)
    return false
  }
}
