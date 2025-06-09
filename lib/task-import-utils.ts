/**
 * Utility functions for importing tasks into the app
 */

import { db, type Task, type Subtask } from "./db"
import { v4 as uuidv4 } from "uuid"

/**
 * Import formats supported by the app
 */
export type ImportFormat = "csv" | "json"

/**
 * Options for importing tasks
 */
export interface TaskImportOptions {
  format: ImportFormat
  handleDuplicates: "skip" | "replace" | "keepBoth"
  importSubtasks: boolean
}

/**
 * Default import options
 */
export const defaultTaskImportOptions: TaskImportOptions = {
  format: "json",
  handleDuplicates: "skip",
  importSubtasks: true,
}

/**
 * Result of the import operation
 */
export interface ImportResult {
  success: boolean
  tasksImported: number
  subtasksImported: number
  skipped: number
  errors: string[]
  errorDetails?: any
}

/**
 * Import tasks from a file
 */
export async function importTasksFromFile(file: File, options: Partial<TaskImportOptions> = {}): Promise<ImportResult> {
  try {
    // Merge with default options
    const importOptions = { ...defaultTaskImportOptions, ...options }

    // Determine format from file extension if not specified
    if (!importOptions.format) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      if (fileExtension === "json") {
        importOptions.format = "json"
      } else if (fileExtension === "csv") {
        importOptions.format = "csv"
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`)
      }
    }

    // Read file content
    const fileContent = await readFileContent(file)

    // Parse content based on format
    let tasks: any[] = []
    if (importOptions.format === "json") {
      tasks = parseJsonTasks(fileContent)
    } else if (importOptions.format === "csv") {
      tasks = parseCsvTasks(fileContent)
    } else {
      throw new Error(`Unsupported import format: ${importOptions.format}`)
    }

    if (!tasks || tasks.length === 0) {
      throw new Error("No valid tasks found in the imported file")
    }

    // Import tasks into the database
    return await importTasks(tasks, importOptions)
  } catch (error) {
    console.error("Error importing tasks:", error)
    return {
      success: false,
      tasksImported: 0,
      subtasksImported: 0,
      skipped: 0,
      errors: [(error as Error).message],
      errorDetails: error,
    }
  }
}

/**
 * Import tasks from a string (used for pasting)
 */
export async function importTasksFromString(
  content: string,
  format: ImportFormat,
  options: Partial<TaskImportOptions> = {},
): Promise<ImportResult> {
  try {
    // Merge with default options
    const importOptions = { ...defaultTaskImportOptions, ...options, format }

    // Parse content based on format
    let tasks: any[] = []
    if (format === "json") {
      tasks = parseJsonTasks(content)
    } else if (format === "csv") {
      tasks = parseCsvTasks(content)
    } else {
      throw new Error(`Unsupported import format: ${format}`)
    }

    if (!tasks || tasks.length === 0) {
      throw new Error("No valid tasks found in the imported content")
    }

    // Import tasks into the database
    return await importTasks(tasks, importOptions)
  } catch (error) {
    console.error("Error importing tasks:", error)
    return {
      success: false,
      tasksImported: 0,
      subtasksImported: 0,
      skipped: 0,
      errors: [(error as Error).message],
      errorDetails: error,
    }
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

/**
 * Parse JSON tasks
 */
function parseJsonTasks(content: string): any[] {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed
    } else if (typeof parsed === "object" && parsed !== null) {
      // Handle case where JSON might be a single task object
      return [parsed]
    }
    throw new Error("Invalid JSON format: expected an array of tasks or a single task object")
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`)
  }
}

/**
 * Parse CSV tasks
 */
function parseCsvTasks(content: string): any[] {
  try {
    // Split content into lines
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "")
    if (lines.length < 2) {
      throw new Error("CSV must contain at least a header row and one data row")
    }

    // Parse header row
    const headers = parseCSVLine(lines[0])

    // Map required fields to their indices
    const nameIndex = headers.findIndex((h) => h.toLowerCase() === "name")
    const statusIndex = headers.findIndex((h) => h.toLowerCase() === "status")

    if (nameIndex === -1) {
      throw new Error("CSV must contain a 'Name' column")
    }

    // Parse data rows
    const tasks: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line === "") continue

      const values = parseCSVLine(line)

      // Skip rows that don't have enough values
      if (values.length <= nameIndex) continue

      const task: any = {
        name: values[nameIndex],
        status: statusIndex !== -1 ? values[statusIndex] : "todo",
      }

      // Map other fields if they exist
      headers.forEach((header, index) => {
        if (index !== nameIndex && index !== statusIndex && values[index]) {
          const key = header.toLowerCase()
          switch (key) {
            case "description":
              task.description = values[index]
              break
            case "priority":
              task.priority = values[index]
              break
            case "due date":
            case "duedate":
              task.dueDate = values[index]
              break
            case "type":
              task.type = values[index]
              break
            case "recurring":
              task.isRecurring = values[index].toLowerCase() === "yes" || values[index].toLowerCase() === "true"
              break
            case "preferred segment":
            case "preferredsegment":
              task.preferredSegment = values[index]
              break
            // Add other fields as needed
          }
        }
      })

      // Check if this is a subtask (indented name)
      if (task.name.startsWith("  -") || task.name.startsWith("\t-")) {
        task.isSubtask = true
        task.name = task.name.replace(/^\s*-\s*/, "").trim()
      }

      tasks.push(task)
    }

    return tasks
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${(error as Error).message}`)
  }
}

/**
 * Parse a CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      // Check if this is an escaped quote (double quote)
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current)

  return result
}

/**
 * Import tasks into the database
 */
async function importTasks(tasks: any[], options: TaskImportOptions): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    tasksImported: 0,
    subtasksImported: 0,
    skipped: 0,
    errors: [],
  }

  // Group subtasks with their parent tasks
  const { mainTasks, subtasks } = organizeTasksAndSubtasks(tasks)

  // Process main tasks
  await db.transaction("rw", db.tasks, db.subtasks, async () => {
    // Import main tasks
    for (const taskData of mainTasks) {
      try {
        // Check for duplicates by name
        const existingTask = await db.tasks.where("name").equals(taskData.name).first()

        if (existingTask) {
          // Handle duplicate based on options
          if (options.handleDuplicates === "skip") {
            result.skipped++
            continue
          } else if (options.handleDuplicates === "replace") {
            // Delete existing task and its subtasks
            await db.subtasks.where("taskId").equals(existingTask.id).delete()
            await db.tasks.delete(existingTask.id)
          } else if (options.handleDuplicates === "keepBoth") {
            // Modify name to avoid conflict
            taskData.name = `${taskData.name} (Imported ${new Date().toLocaleString()})`
          }
        }

        // Prepare task for insertion
        const task: Task = {
          id: taskData.id || `task-${uuidv4()}`,
          name: taskData.name,
          description: taskData.description || "",
          status: validateStatus(taskData.status),
          priority: validatePriority(taskData.priority),
          dueDate: taskData.dueDate || undefined,
          createdAt: taskData.createdAt || new Date().toISOString(),
          startedAt: taskData.startedAt || undefined,
          completedAt: taskData.completedAt || undefined,
          type: validateTaskType(taskData.type),
          isRecurring: Boolean(taskData.isRecurring),
          preferredSegment: taskData.preferredSegment || undefined,
          segmentStartTime: taskData.segmentStartTime || undefined,
          hasSubtasks: false,
          subtaskCount: 0,
          completedSubtaskCount: 0,
        }

        // Add task to database
        await db.tasks.add(task)
        result.tasksImported++

        // Process subtasks for this task if enabled
        if (options.importSubtasks && subtasks[task.name]) {
          const taskSubtasks = subtasks[task.name]
          let subtaskCount = 0
          let completedSubtaskCount = 0

          for (let i = 0; i < taskSubtasks.length; i++) {
            const subtaskData = taskSubtasks[i]

            // Prepare subtask for insertion
            const subtask: Subtask = {
              id: `subtask-${uuidv4()}`,
              taskId: task.id,
              name: subtaskData.name,
              description: subtaskData.description || "",
              isCompleted: subtaskData.isCompleted || false,
              completedAt: subtaskData.completedAt || undefined,
              createdAt: subtaskData.createdAt || new Date().toISOString(),
              order: i,
            }

            // Add subtask to database
            await db.subtasks.add(subtask)
            result.subtasksImported++
            subtaskCount++

            if (subtask.isCompleted) {
              completedSubtaskCount++
            }
          }

          // Update task with subtask counts
          if (subtaskCount > 0) {
            await db.tasks.update(task.id, {
              hasSubtasks: true,
              subtaskCount,
              completedSubtaskCount,
            })
          }
        }
      } catch (error) {
        console.error(`Error importing task "${taskData.name}":`, error)
        result.errors.push(`Failed to import task "${taskData.name}": ${(error as Error).message}`)
      }
    }
  })

  return result
}

/**
 * Organize tasks and subtasks from the imported data
 */
function organizeTasksAndSubtasks(tasks: any[]): { mainTasks: any[]; subtasks: Record<string, any[]> } {
  const mainTasks: any[] = []
  const subtasks: Record<string, any[]> = {}
  let currentMainTask: any = null

  for (const task of tasks) {
    if (task.isSubtask) {
      // This is a subtask
      if (currentMainTask) {
        if (!subtasks[currentMainTask.name]) {
          subtasks[currentMainTask.name] = []
        }
        subtasks[currentMainTask.name].push(task)
      } else {
        // Orphaned subtask, treat as main task
        task.isSubtask = false
        mainTasks.push(task)
      }
    } else {
      // This is a main task
      currentMainTask = task
      mainTasks.push(task)
    }
  }

  return { mainTasks, subtasks }
}

/**
 * Validate and normalize task status
 */
function validateStatus(status?: string): "todo" | "started" | "completed" {
  if (!status) return "todo"

  const normalized = status.toLowerCase().trim()

  if (normalized === "completed" || normalized === "done" || normalized === "finished") {
    return "completed"
  } else if (
    normalized === "started" ||
    normalized === "in progress" ||
    normalized === "inprogress" ||
    normalized === "in-progress"
  ) {
    return "started"
  } else {
    return "todo"
  }
}

/**
 * Validate and normalize task priority
 */
function validatePriority(priority?: string): "low" | "medium" | "high" {
  if (!priority) return "medium"

  const normalized = priority.toLowerCase().trim()

  if (normalized === "low") {
    return "low"
  } else if (normalized === "high") {
    return "high"
  } else {
    return "medium"
  }
}

/**
 * Validate and normalize task type
 */
function validateTaskType(type?: string): "standard" | "tally" | "subtasks" {
  if (!type) return "standard"

  const normalized = type.toLowerCase().trim()

  if (normalized === "tally" || normalized === "counter") {
    return "tally"
  } else if (normalized === "subtasks" || normalized === "subtask" || normalized === "checklist") {
    return "subtasks"
  } else {
    return "standard"
  }
}

/**
 * Get template for task import
 */
export function getImportTemplate(format: ImportFormat): string {
  if (format === "json") {
    const template = [
      {
        name: "Example Task 1",
        description: "This is an example task",
        status: "todo",
        priority: "medium",
        dueDate: "2023-12-31",
        type: "standard",
        isRecurring: false,
        preferredSegment: "Morning",
      },
      {
        name: "Example Task 2",
        description: "This is another example task",
        status: "started",
        priority: "high",
        type: "subtasks",
        isRecurring: true,
      },
    ]
    return JSON.stringify(template, null, 2)
  } else if (format === "csv") {
    return `Name,Status,Description,Priority,Due Date,Type,Recurring,Preferred Segment
Example Task 1,todo,This is an example task,medium,2023-12-31,standard,No,Morning
Example Task 2,started,This is another example task,high,,subtasks,Yes,
  - First subtask,todo,A subtask description,,,,,
  - Second subtask,completed,,,,,,`
  }

  return ""
}
