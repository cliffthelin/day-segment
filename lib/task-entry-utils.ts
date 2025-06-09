import { db, type TaskEntry, type SubtaskEntry } from "./db"

/**
 * Creates a new task entry for a given task
 */
export async function createTaskEntry(
  taskId: string,
  status: "completed" | "partial" | "skipped" = "completed",
  completionValue = 1,
  options: {
    segmentId?: string
    notes?: string
    metrics?: Record<string, number>
    duration?: number
    tallyCount?: number
    sourceTrigger?: string
  } = {},
): Promise<string> {
  // Get the task
  const task = await db.tasks.get(taskId)
  if (!task) {
    throw new Error(`Task with ID ${taskId} not found`)
  }

  // Get the segment name if segmentId is provided
  let segmentName
  if (options.segmentId) {
    const segment = await db.segments.get(options.segmentId)
    segmentName = segment?.name
  }

  // Create the entry
  const now = new Date()
  const entry: TaskEntry = {
    id: `entry-${taskId}-${Date.now()}`,
    taskId,
    date: now.toISOString().split("T")[0],
    time: now.toISOString(),
    segmentId: options.segmentId || task.preferredSegment,
    segmentName,
    status,
    completionValue,
    notes: options.notes,
    metrics: options.metrics,
    duration: options.duration,
    tallyCount: options.tallyCount,
    createdAt: now.toISOString(),
  }

  // Add the entry to the database
  const entryId = await db.taskEntries.add(entry)

  // Update the task's usage statistics
  await db.tasks.update(taskId, {
    lastUsed: now.toISOString(),
    usageCount: (task.usageCount || 0) + 1,
  })

  return entryId
}

/**
 * Gets all entries for a specific task
 */
export async function getTaskEntries(taskId: string): Promise<TaskEntry[]> {
  return db.taskEntries.where("taskId").equals(taskId).sortBy("time")
}

/**
 * Gets all entries for a specific date
 */
export async function getEntriesByDate(date: string): Promise<TaskEntry[]> {
  return db.taskEntries.where("date").equals(date).toArray()
}

/**
 * Gets all entries for a specific segment
 */
export async function getEntriesBySegment(segmentId: string): Promise<TaskEntry[]> {
  return db.taskEntries.where("segmentId").equals(segmentId).toArray()
}

/**
 * Creates subtask entries for a task entry
 */
export async function createSubtaskEntries(taskEntryId: string, completedSubtaskIds: string[]): Promise<void> {
  // Get the task entry
  const taskEntry = await db.taskEntries.get(taskEntryId)
  if (!taskEntry) {
    throw new Error(`Task entry with ID ${taskEntryId} not found`)
  }

  // Get all subtasks for this task
  const subtasks = await db.subtasks.where("taskId").equals(taskEntry.taskId).toArray()

  // Create entries for each subtask
  const now = new Date().toISOString()
  const subtaskEntries: SubtaskEntry[] = subtasks.map((subtask) => ({
    id: `subtask-entry-${subtask.id}-${Date.now()}`,
    taskEntryId,
    subtaskId: subtask.id,
    isCompleted: completedSubtaskIds.includes(subtask.id),
    completedAt: completedSubtaskIds.includes(subtask.id) ? now : undefined,
    notes: "",
  }))

  // Add the entries to the database
  await db.subtaskEntries.bulkAdd(subtaskEntries)
}

/**
 * Create a task entry from a drag and drop operation
 */
export async function createTaskEntryFromDragDrop(taskId: string, newStatus: string, segmentId?: string) {
  try {
    // Get the task
    const task = await db.tasks.get(taskId)
    if (!task) throw new Error("Task not found")

    // Get current segment if not provided
    if (!segmentId) {
      const segments = await db.segments.toArray()
      const now = new Date()
      const currentTimeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

      let currentSegment = segments[0]
      for (let i = segments.length - 1; i >= 0; i--) {
        if (segments[i].startTime <= currentTimeString) {
          currentSegment = segments[i]
          break
        }
      }

      segmentId = currentSegment.id
    }

    // Create task entry
    return await createTaskEntry(taskId, "completed" as any, 1, {
      segmentId,
      sourceTrigger: "drag-drop",
    })
  } catch (error) {
    console.error("Error creating task entry from drag drop:", error)
    throw error
  }
}
