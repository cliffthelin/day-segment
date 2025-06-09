/**
 * Utility functions for exporting tasks from the app
 */

import { db, type Task, type Subtask } from "./db"
import { format } from "date-fns"

/**
 * Export formats supported by the app
 */
export type ExportFormat = "csv" | "json" | "markdown" | "txt"

/**
 * Options for exporting tasks
 */
export interface TaskExportOptions {
  format: ExportFormat
  includeDescription: boolean
  includeMetadata: boolean
  includeSubtasks: boolean
  filterByStatus?: "all" | "completed" | "inProgress" | "todo"
  dateRange?: {
    start: Date
    end: Date
  }
}

/**
 * Default export options
 */
export const defaultTaskExportOptions: TaskExportOptions = {
  format: "csv",
  includeDescription: true,
  includeMetadata: true,
  includeSubtasks: true,
  filterByStatus: "all",
}

/**
 * Export all tasks based on provided options
 */
export async function exportTasks(options: Partial<TaskExportOptions> = {}) {
  try {
    // Merge with default options
    const exportOptions = { ...defaultTaskExportOptions, ...options }

    // Get tasks from the database with filtering
    let tasksCollection = db.tasks

    // Apply status filter if provided
    if (exportOptions.filterByStatus && exportOptions.filterByStatus !== "all") {
      if (exportOptions.filterByStatus === "completed") {
        tasksCollection = tasksCollection.where("status").equals("completed")
      } else if (exportOptions.filterByStatus === "inProgress") {
        tasksCollection = tasksCollection.where("status").equals("started")
      } else if (exportOptions.filterByStatus === "todo") {
        tasksCollection = tasksCollection.where("status").equals("todo")
      }
    }

    // Get all tasks
    const tasks = await tasksCollection.toArray()

    if (tasks.length === 0) {
      throw new Error("No tasks found matching the criteria")
    }

    // Get subtasks if needed
    let subtasks: Subtask[] = []
    if (exportOptions.includeSubtasks) {
      // Get all task IDs that have subtasks
      const taskIdsWithSubtasks = tasks.filter((task) => task.hasSubtasks).map((task) => task.id)

      if (taskIdsWithSubtasks.length > 0) {
        subtasks = await db.subtasks.where("taskId").anyOf(taskIdsWithSubtasks).toArray()
      }
    }

    // Generate content based on format
    let content: string | Blob
    let mimeType: string
    let fileExtension: string

    if (exportOptions.format === "json") {
      content = generateJsonExport(tasks, subtasks, exportOptions)
      mimeType = "application/json"
      fileExtension = "json"
    } else if (exportOptions.format === "csv") {
      content = generateCsvExport(tasks, subtasks, exportOptions)
      mimeType = "text/csv"
      fileExtension = "csv"
    } else if (exportOptions.format === "markdown") {
      content = generateMarkdownExport(tasks, subtasks, exportOptions)
      mimeType = "text/markdown"
      fileExtension = "md"
    } else {
      // Default to text format
      content = generateTextExport(tasks, subtasks, exportOptions)
      mimeType = "text/plain"
      fileExtension = "txt"
    }

    // Generate filename
    const currentDate = format(new Date(), "yyyy-MM-dd")
    const filename = `tasks_export_${currentDate}.${fileExtension}`

    // Trigger download
    downloadFile(content, filename, mimeType)

    return { success: true, filename, count: tasks.length }
  } catch (error) {
    console.error("Error exporting tasks:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Generate JSON export for tasks
 */
function generateJsonExport(tasks: Task[], subtasks: Subtask[], options: TaskExportOptions): string {
  const formattedTasks = tasks.map((task) => {
    const taskData: Record<string, any> = {
      id: task.id,
      name: task.name,
      status: task.status,
    }

    if (options.includeDescription && task.description) {
      taskData.description = task.description
    }

    if (options.includeMetadata) {
      taskData.priority = task.priority || "medium"
      taskData.createdAt = task.createdAt
      taskData.startedAt = task.startedAt
      taskData.completedAt = task.completedAt
      taskData.dueDate = task.dueDate
      taskData.type = task.type || "standard"
      taskData.isRecurring = task.isRecurring
      taskData.preferredSegment = task.preferredSegment
    }

    if (options.includeSubtasks && task.hasSubtasks) {
      taskData.subtasks = subtasks
        .filter((subtask) => subtask.taskId === task.id)
        .map((subtask) => ({
          id: subtask.id,
          name: subtask.name,
          isCompleted: subtask.isCompleted,
          ...(options.includeDescription && subtask.description ? { description: subtask.description } : {}),
          ...(options.includeMetadata
            ? {
                createdAt: subtask.createdAt,
                completedAt: subtask.completedAt,
                order: subtask.order,
              }
            : {}),
        }))
    }

    return taskData
  })

  return JSON.stringify(formattedTasks, null, 2)
}

/**
 * Generate CSV export for tasks
 */
function generateCsvExport(tasks: Task[], subtasks: Subtask[], options: TaskExportOptions): string {
  // Define headers based on options
  const headers = ["Name", "Status"]

  if (options.includeDescription) {
    headers.push("Description")
  }

  if (options.includeMetadata) {
    headers.push(
      "Priority",
      "Created At",
      "Started At",
      "Completed At",
      "Due Date",
      "Type",
      "Recurring",
      "Preferred Segment",
    )
  }

  let content = headers.join(",") + "\n"

  // Add task rows
  tasks.forEach((task) => {
    const row = [escapeCsvValue(task.name), escapeCsvValue(task.status)]

    if (options.includeDescription) {
      row.push(escapeCsvValue(task.description || ""))
    }

    if (options.includeMetadata) {
      row.push(
        escapeCsvValue(task.priority || "medium"),
        escapeCsvValue(task.createdAt ? format(new Date(task.createdAt), "yyyy-MM-dd HH:mm:ss") : ""),
        escapeCsvValue(task.startedAt ? format(new Date(task.startedAt), "yyyy-MM-dd HH:mm:ss") : ""),
        escapeCsvValue(task.completedAt ? format(new Date(task.completedAt), "yyyy-MM-dd HH:mm:ss") : ""),
        escapeCsvValue(task.dueDate || ""),
        escapeCsvValue(task.type || "standard"),
        escapeCsvValue(task.isRecurring ? "Yes" : "No"),
        escapeCsvValue(task.preferredSegment || ""),
      )
    }

    content += row.join(",") + "\n"

    // Add subtasks if needed
    if (options.includeSubtasks && task.hasSubtasks) {
      const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id)

      taskSubtasks.forEach((subtask) => {
        const subtaskRow = [
          escapeCsvValue(`  - ${subtask.name}`), // Indent subtask names
          escapeCsvValue(subtask.isCompleted ? "completed" : "todo"),
        ]

        if (options.includeDescription) {
          subtaskRow.push(escapeCsvValue(subtask.description || ""))
        }

        if (options.includeMetadata) {
          subtaskRow.push(
            escapeCsvValue(""), // No priority for subtasks
            escapeCsvValue(subtask.createdAt ? format(new Date(subtask.createdAt), "yyyy-MM-dd HH:mm:ss") : ""),
            escapeCsvValue(""), // No started date for subtasks
            escapeCsvValue(subtask.completedAt ? format(new Date(subtask.completedAt), "yyyy-MM-dd HH:mm:ss") : ""),
            escapeCsvValue(""), // No due date for subtasks
            escapeCsvValue("subtask"),
            escapeCsvValue("No"), // Subtasks aren't recurring
            escapeCsvValue(""), // No preferred segment for subtasks
          )
        }

        content += subtaskRow.join(",") + "\n"
      })
    }
  })

  return content
}

/**
 * Generate Markdown export for tasks
 */
function generateMarkdownExport(tasks: Task[], subtasks: Subtask[], options: TaskExportOptions): string {
  let content = "# Tasks Export\n\n"
  content += `Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n\n`

  tasks.forEach((task, index) => {
    // Task status indicator
    const statusEmoji = task.status === "completed" ? "✅" : task.status === "started" ? "🔄" : "⏳"

    content += `## ${index + 1}. ${statusEmoji} ${task.name}\n\n`

    if (options.includeDescription && task.description) {
      content += `${task.description}\n\n`
    }

    if (options.includeMetadata) {
      content += "**Details:**\n\n"
      content += `- **Status:** ${task.status}\n`
      content += `- **Priority:** ${task.priority || "medium"}\n`

      if (task.createdAt) {
        content += `- **Created:** ${format(new Date(task.createdAt), "MMMM d, yyyy")}\n`
      }

      if (task.startedAt) {
        content += `- **Started:** ${format(new Date(task.startedAt), "MMMM d, yyyy")}\n`
      }

      if (task.completedAt) {
        content += `- **Completed:** ${format(new Date(task.completedAt), "MMMM d, yyyy")}\n`
      }

      if (task.dueDate) {
        content += `- **Due Date:** ${task.dueDate}\n`
      }

      content += `- **Type:** ${task.type || "standard"}\n`
      content += `- **Recurring:** ${task.isRecurring ? "Yes" : "No"}\n`

      if (task.preferredSegment) {
        content += `- **Preferred Segment:** ${task.preferredSegment}\n`
      }

      content += "\n"
    }

    if (options.includeSubtasks && task.hasSubtasks) {
      const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id)

      if (taskSubtasks.length > 0) {
        content += "**Subtasks:**\n\n"

        taskSubtasks.forEach((subtask) => {
          const subtaskStatus = subtask.isCompleted ? "✅" : "⏳"
          content += `- ${subtaskStatus} ${subtask.name}`

          if (options.includeDescription && subtask.description) {
            content += `: ${subtask.description}`
          }

          if (options.includeMetadata && subtask.completedAt) {
            content += ` (Completed: ${format(new Date(subtask.completedAt), "MMMM d, yyyy")})`
          }

          content += "\n"
        })

        content += "\n"
      }
    }

    if (index < tasks.length - 1) {
      content += "---\n\n"
    }
  })

  return content
}

/**
 * Generate text export for tasks
 */
function generateTextExport(tasks: Task[], subtasks: Subtask[], options: TaskExportOptions): string {
  let content = "TASKS EXPORT\n"
  content += "=============\n\n"
  content += `Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n\n`

  tasks.forEach((task, index) => {
    content += `${index + 1}. ${task.name}\n`
    content += `   Status: ${task.status}\n`

    if (options.includeDescription && task.description) {
      content += `   Description: ${task.description}\n`
    }

    if (options.includeMetadata) {
      content += `   Priority: ${task.priority || "medium"}\n`

      if (task.createdAt) {
        content += `   Created: ${format(new Date(task.createdAt), "MMMM d, yyyy")}\n`
      }

      if (task.startedAt) {
        content += `   Started: ${format(new Date(task.startedAt), "MMMM d, yyyy")}\n`
      }

      if (task.completedAt) {
        content += `   Completed: ${format(new Date(task.completedAt), "MMMM d, yyyy")}\n`
      }

      if (task.dueDate) {
        content += `   Due Date: ${task.dueDate}\n`
      }

      content += `   Type: ${task.type || "standard"}\n`
      content += `   Recurring: ${task.isRecurring ? "Yes" : "No"}\n`

      if (task.preferredSegment) {
        content += `   Preferred Segment: ${task.preferredSegment}\n`
      }
    }

    if (options.includeSubtasks && task.hasSubtasks) {
      const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id)

      if (taskSubtasks.length > 0) {
        content += "\n   Subtasks:\n"

        taskSubtasks.forEach((subtask) => {
          content += `   - ${subtask.name} (${subtask.isCompleted ? "Completed" : "Todo"})`

          if (options.includeDescription && subtask.description) {
            content += `\n     Description: ${subtask.description}`
          }

          if (options.includeMetadata && subtask.completedAt) {
            content += `\n     Completed: ${format(new Date(subtask.completedAt), "MMMM d, yyyy")}`
          }

          content += "\n"
        })
      }
    }

    content += "\n"

    if (index < tasks.length - 1) {
      content += "-------------\n\n"
    }
  })

  return content
}

/**
 * Escape a value for CSV format
 */
function escapeCsvValue(value: string | boolean | number): string {
  if (value === null || value === undefined) return ""

  const stringValue = String(value)

  // If the value contains commas, quotes, or newlines, wrap it in quotes
  if (/[",\n\r]/.test(stringValue)) {
    // Replace any quotes with double quotes
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

/**
 * Trigger a file download
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  // Create a blob with the content if it's a string
  const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

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
}
