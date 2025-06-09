/**
 * Utility functions for importing task templates
 */
import { db, type TaskTemplate, type SubtaskTemplate } from "./db"
import { v4 as uuidv4 } from "uuid"

/**
 * Result of the import operation
 */
export interface TemplateImportResult {
  success: boolean
  templatesImported: number
  skipped: number
  errors: string[]
  errorDetails?: any
}

/**
 * Import templates from a file
 */
export async function importTemplatesFromFile(file: File): Promise<TemplateImportResult> {
  try {
    // Read file content
    const fileContent = await readFileContent(file)

    // Parse JSON content
    const templates = parseJsonTemplates(fileContent)

    if (!templates || templates.length === 0) {
      throw new Error("No valid templates found in the imported file")
    }

    // Import templates into the database
    return await importTemplates(templates)
  } catch (error) {
    console.error("Error importing templates:", error)
    return {
      success: false,
      templatesImported: 0,
      skipped: 0,
      errors: [(error as Error).message],
      errorDetails: error,
    }
  }
}

/**
 * Import templates from a string (used for pasting)
 */
export async function importTemplatesFromString(content: string): Promise<TemplateImportResult> {
  try {
    // Parse JSON content
    const templates = parseJsonTemplates(content)

    if (!templates || templates.length === 0) {
      throw new Error("No valid templates found in the imported content")
    }

    // Import templates into the database
    return await importTemplates(templates)
  } catch (error) {
    console.error("Error importing templates:", error)
    return {
      success: false,
      templatesImported: 0,
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
 * Parse JSON templates
 */
function parseJsonTemplates(content: string): any[] {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed
    } else if (typeof parsed === "object" && parsed !== null) {
      // Handle case where JSON might be a single template object
      return [parsed]
    }
    throw new Error("Invalid JSON format: expected an array of templates or a single template object")
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`)
  }
}

/**
 * Import templates into the database
 */
async function importTemplates(templateData: any[]): Promise<TemplateImportResult> {
  const result: TemplateImportResult = {
    success: true,
    templatesImported: 0,
    skipped: 0,
    errors: [],
  }

  await db.transaction("rw", db.taskTemplates, async () => {
    for (const data of templateData) {
      try {
        // Check for required fields
        if (!data.name) {
          result.errors.push(`Template missing required name field: ${JSON.stringify(data)}`)
          continue
        }

        // Check for duplicates by name
        const existingTemplate = await db.taskTemplates.where("name").equals(data.name).first()
        if (existingTemplate) {
          result.skipped++
          continue
        }

        // Prepare subtasks if present
        let subtasks: SubtaskTemplate[] | undefined = undefined
        if (data.subtasks && Array.isArray(data.subtasks)) {
          subtasks = data.subtasks.map((subtask: any, index: number) => ({
            id: `subtask-${uuidv4()}`,
            name: subtask.name || `Subtask ${index + 1}`,
            description: subtask.description || "",
            order: subtask.order || index,
          }))
        }

        // Prepare template for insertion
        const template: TaskTemplate = {
          id: `template-${uuidv4()}`,
          name: data.name,
          description: data.description || "",
          type: validateTemplateType(data.type),
          isRecurring: data.isRecurring !== undefined ? Boolean(data.isRecurring) : true,
          preferredSegment: data.preferredSegment || undefined,
          segmentStartTime: data.segmentStartTime || undefined,
          categoryId: data.categoryId || undefined,
          subtasks: subtasks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0,
          icon: data.icon || undefined,
          color: data.color || undefined,
          tags: Array.isArray(data.tags) ? data.tags : undefined,
        }

        // Add template to database
        await db.taskTemplates.add(template)
        result.templatesImported++
      } catch (error) {
        console.error(`Error importing template "${data.name}":`, error)
        result.errors.push(`Failed to import template "${data.name}": ${(error as Error).message}`)
      }
    }
  })

  return result
}

/**
 * Validate and normalize template type
 */
function validateTemplateType(type?: string): "standard" | "tally" | "subtasks" {
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
 * Get template for template import
 */
export function getTemplateImportExample(): string {
  const example = [
    {
      name: "Morning Routine",
      description: "Complete morning routine tasks",
      type: "subtasks",
      isRecurring: true,
      preferredSegment: "Morning",
      subtasks: [
        { name: "Make bed", description: "Straighten sheets and pillows", order: 0 },
        { name: "Brush teeth", description: "", order: 1 },
        { name: "Shower", description: "", order: 2 },
        { name: "Breakfast", description: "Prepare and eat breakfast", order: 3 },
      ],
      tags: ["routine", "morning", "daily"],
    },
    {
      name: "Water Plants",
      description: "Water all house plants",
      type: "standard",
      isRecurring: true,
      preferredSegment: "Evening",
      tags: ["home", "plants", "weekly"],
    },
  ]
  return JSON.stringify(example, null, 2)
}
