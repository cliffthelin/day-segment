import { db } from "./db"

export async function migrateToTaskBoard() {
  try {
    // Check if we've already migrated
    const migrated = await db.settings.get("migratedToTaskBoard")
    if (migrated) return

    // Get all tasks
    const tasks = await db.tasks.toArray()

    // Get all task completions
    const taskCompletions = await db.taskCompletions.toArray()

    // Group task completions by taskId
    const completionsByTaskId = taskCompletions.reduce(
      (acc, completion) => {
        if (!acc[completion.taskId]) {
          acc[completion.taskId] = []
        }
        acc[completion.taskId].push(completion)
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Update tasks with status and timestamps
    for (const task of tasks) {
      const completions = completionsByTaskId[task.id] || []

      // Sort completions by time
      completions.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

      if (completions.length > 0) {
        // If there are completions, mark as completed
        const latestCompletion = completions[completions.length - 1]

        if (task.type === "checkbox") {
          // For checkbox tasks, use the latest completion time
          await db.tasks.update(task.id, {
            status: "completed",
            startedAt: latestCompletion.time, // Assume started at the same time for existing tasks
            completedAt: latestCompletion.time,
            tallyTimestamps: [],
          })
        } else {
          // For tally tasks, use all completion times
          const timestamps = completions.map((c) => c.time)
          await db.tasks.update(task.id, {
            status: "completed",
            startedAt: timestamps[0], // First tally is when it started
            completedAt: timestamps[timestamps.length - 1], // Last tally is when it completed
            tallyTimestamps: timestamps,
          })
        }
      } else {
        // If no completions, keep as todo
        await db.tasks.update(task.id, {
          status: "todo",
          startedAt: null,
          completedAt: null,
          tallyTimestamps: [],
        })
      }
    }

    // Mark as migrated
    await db.settings.put({ key: "migratedToTaskBoard", value: true })

    console.log("Successfully migrated to task board schema")
  } catch (error) {
    console.error("Error migrating to task board:", error)
  }
}
