"use client"

import Dexie from "dexie"
import { addSegmentExampleTasks } from "@/lib/add-segment-example-tasks"
import { CURRENT_SCHEMA_VERSION } from "@/lib/schema-version"
// Import the migration function with the correct name
import { migrateToBackgroundSettings } from "./db-migration-background"
import { migrateToVersion16 } from "./db-migration-v16"
import { migrateToVersion17 } from "./db-migration-v17"

// Define the database schema
export interface Segment {
  id?: string
  name: string
  startTime: string
  endTime: string
  color: string
}

export interface CheckIn {
  id: string
  date: string
  time: string
  segmentId: string
  segmentName: string
  productivity: number
  energy: number
  focus: number
  happiness: number
  stress: number
  notes?: string
  isVoiceCheckIn?: boolean
  recordingUrl?: string
  transcription?: string
  voiceNotes?: string
  emotionalAnalysis?: {
    primaryEmotion: string
    primaryScore: number
    secondaryEmotion: string | null
    secondaryScore: number
    emotions: Record<string, number>
    sentiment: number
    confidence: number
    description: string
  }
  emotionalAnalysisEnabled?: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  description?: string
  isDefault?: boolean
  createdAt: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  isRecurring: boolean
  icon?: string
  color?: string
  createdAt: string
  updatedAt?: string
}

export interface TaskCollection {
  id: string
  taskId: string
  collectionId: string
  createdAt: string
}

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  type?: "standard" | "tally" | "subtasks"
  isRecurring: boolean
  preferredSegment?: string
  segmentStartTime?: string
  categoryId?: string
  subtasks?: SubtaskTemplate[]
  createdAt: string
  updatedAt?: string
  usageCount: number
  icon?: string
  color?: string
  tags?: string[]
}

export interface SubtaskTemplate {
  id: string
  name: string
  description?: string
  order: number
}

// Updated Task interface to represent a task definition rather than an instance
export interface Task {
  id: string
  name: string
  description?: string
  type: "standard" | "tally" | "subtasks"
  isRecurring: boolean
  preferredSegment?: string
  segmentStartTime?: string
  categoryId?: string
  createdAt: string
  updatedAt?: string
  icon?: string
  color?: string
  priority?: "low" | "medium" | "high"
  hasSubtasks?: boolean
  subtaskCount?: number
  isArchived?: boolean
  lastUsed?: string
  usageCount?: number
}

// New interface for task entries (actual usage/completion data)
export interface TaskEntry {
  id: string
  taskId: string
  date: string
  time: string
  segmentId?: string
  segmentName?: string
  status: "completed" | "partial" | "skipped"
  completionValue: number // 0-1 for partial completion
  notes?: string
  metrics?: {
    productivity?: number
    energy?: number
    focus?: number
    happiness?: number
    stress?: number
    [key: string]: number | undefined
  }
  duration?: number // in seconds
  tallyCount?: number // for tally tasks
  createdAt: string
}

// Updated Subtask interface to be linked to a task
export interface Subtask {
  id: string
  taskId: string
  name: string
  description?: string
  order: number
}

// New interface for subtask entries (completion data for subtasks)
export interface SubtaskEntry {
  id: string
  taskEntryId: string
  subtaskId: string
  isCompleted: boolean
  completedAt?: string
  notes?: string
}

export interface TimerSession {
  id: string
  taskId: string
  taskEntryId?: string // Link to task entry if available
  taskName: string
  date: string
  startTime: string
  endTime?: string
  duration: number
  completionPercentage: number
  completionValue: number
  mood: number
  notes?: string
  subtaskId?: string
}

export interface Metric {
  id: string
  name: string
  label: string
  description?: string
  min: number
  max: number
  defaultValue: number
  step: number
  isActive: boolean
  color?: string
}

export interface Setting {
  key: string
  value: any
}

export interface SuggestedPrompt {
  id?: number
  text: string
  category: string
  isCompleted: boolean
  dateAdded: string
}

export interface Sound {
  id: string
  name: string
  type: string
  url: string
  dateAdded: string
}

// Define the database
class AppDatabase extends Dexie {
  segments: Dexie.Table<Segment, string>
  checkIns: Dexie.Table<CheckIn, string>
  tasks: Dexie.Table<Task, string>
  taskEntries: Dexie.Table<TaskEntry, string> // New table for task entries
  subtasks: Dexie.Table<Subtask, string>
  subtaskEntries: Dexie.Table<SubtaskEntry, string> // New table for subtask entries
  timerSessions: Dexie.Table<TimerSession, string>
  metrics: Dexie.Table<Metric, string>
  settings: Dexie.Table<Setting, string>
  suggestedPrompts: Dexie.Table<SuggestedPrompt, number>
  sounds: Dexie.Table<Sound, string>
  categories: Dexie.Table<Category, string>
  taskTemplates: Dexie.Table<TaskTemplate, string>
  collections: Dexie.Table<Collection, string>
  taskCollections: Dexie.Table<TaskCollection, string>

  constructor() {
    super("daySegmentTracker")

    // Use a single version call with the current schema version
    this.version(CURRENT_SCHEMA_VERSION)
      .stores({
        segments: "++id, name, startTime, endTime",
        checkIns: "++id, date, segmentId",
        tasks: "++id, name, type, categoryId, isRecurring, isArchived",
        taskEntries: "++id, taskId, date, segmentId, status, [taskId+date], [date+segmentId]",
        subtasks: "++id, taskId, name, order",
        subtaskEntries: "++id, taskEntryId, subtaskId, isCompleted, [taskEntryId+subtaskId]",
        timerSessions: "++id, taskId, taskEntryId, date",
        metrics: "++id, name",
        settings: "key",
        suggestedPrompts: "++id, text, category, dateAdded, isCompleted",
        sounds: "id, name, type, dateAdded",
        categories: "++id, name, color, isDefault",
        taskTemplates: "++id, name, type, createdAt, usageCount, categoryId",
        collections: "++id, name, isRecurring, createdAt",
        taskCollections: "++id, taskId, collectionId, [taskId+collectionId]",
      })

      // Define upgrade function to migrate data from old structure to new
      .upgrade((tx) => {
        return tx
          .table("tasks")
          .toArray()
          .then((oldTasks) => {
            console.log(`Migrating ${oldTasks.length} tasks to new structure...`)

            // Arrays to store new task definitions and entries
            const newTasks = []
            const taskEntries = []
            const subtaskEntries = []

            // Process each old task
            oldTasks.forEach((oldTask) => {
              // Create a new task definition
              const newTask = {
                id: oldTask.id,
                name: oldTask.name,
                description: oldTask.description,
                type: oldTask.type || "standard",
                isRecurring: oldTask.isRecurring !== false, // Default to true if not specified
                preferredSegment: oldTask.preferredSegment,
                segmentStartTime: oldTask.segmentStartTime,
                categoryId: oldTask.categoryId,
                createdAt: oldTask.createdAt,
                updatedAt: new Date().toISOString(),
                priority: oldTask.priority,
                hasSubtasks: oldTask.hasSubtasks,
                subtaskCount: oldTask.subtaskCount || 0,
                isArchived: false,
                usageCount: 0,
              }

              newTasks.push(newTask)

              // If the task was completed, create an entry for it
              if (oldTask.status === "completed" && oldTask.completedAt) {
                const taskEntry = {
                  id: `entry-${oldTask.id}-${Date.now()}`,
                  taskId: oldTask.id,
                  date: oldTask.completedAt.split("T")[0],
                  time: oldTask.completedAt,
                  segmentId: oldTask.preferredSegment,
                  status: "completed",
                  completionValue: 1,
                  createdAt: oldTask.completedAt,
                }

                taskEntries.push(taskEntry)

                // Increment usage count for this task
                newTask.usageCount = (newTask.usageCount || 0) + 1
                newTask.lastUsed = oldTask.completedAt
              }
            })

            // Clear old tasks table and add new task definitions
            return tx
              .table("tasks")
              .clear()
              .then(() => tx.table("tasks").bulkAdd(newTasks))
              .then(() => {
                // Add task entries if there are any
                if (taskEntries.length > 0) {
                  return tx.table("taskEntries").bulkAdd(taskEntries)
                }
              })
              .then(() => {
                console.log("Migration completed successfully")
              })
          })
      })

    // Define table properties
    this.segments = this.table("segments")
    this.checkIns = this.table("checkIns")
    this.tasks = this.table("tasks")
    this.taskEntries = this.table("taskEntries")
    this.subtasks = this.table("subtasks")
    this.subtaskEntries = this.table("subtaskEntries")
    this.timerSessions = this.table("timerSessions")
    this.metrics = this.table("metrics")
    this.settings = this.table("settings")
    this.suggestedPrompts = this.table("suggestedPrompts")
    this.sounds = this.table("sounds")
    this.categories = this.table("categories")
    this.taskTemplates = this.table("taskTemplates")
    this.collections = this.table("collections")
    this.taskCollections = this.table("taskCollections")
  }

  async initializeDefaultData() {
    try {
      console.log("Initializing default data...")

      // Check if segments already exist
      const segmentCount = await this.segments.count()
      if (segmentCount === 0) {
        console.log("Adding default segments")

        // Default segments
        const defaultSegments: Segment[] = [
          {
            name: "Morning",
            startTime: "06:00",
            endTime: "09:00",
            color: "#f59e0b",
          },
          {
            name: "Work",
            startTime: "09:00",
            endTime: "12:00",
            color: "#3b82f6",
          },
          {
            name: "Lunch",
            startTime: "12:00",
            endTime: "13:00",
            color: "#10b981",
          },
          {
            name: "Afternoon",
            startTime: "13:00",
            endTime: "17:00",
            color: "#8b5cf6",
          },
          {
            name: "Evening",
            startTime: "17:00",
            endTime: "22:00",
            color: "#ec4899",
          },
          {
            name: "Night",
            startTime: "22:00",
            endTime: "06:00",
            color: "#1e293b",
          },
        ]

        try {
          // Add default segments
          await this.segments.bulkAdd(defaultSegments)
          console.log("Default segments added successfully")
        } catch (error) {
          console.error("Error adding default segments:", error)
        }
      } else {
        console.log(`Found ${segmentCount} existing segments, skipping default segment creation`)
      }

      // Check if metrics already exist
      const metricCount = await this.metrics.count()
      if (metricCount === 0) {
        console.log("Adding default metrics")

        // Default metrics
        const defaultMetrics: Metric[] = [
          {
            name: "productivity",
            label: "Productivity",
            description: "How productive do you feel?",
            min: 1,
            max: 10,
            defaultValue: 5,
            step: 1,
            isActive: true,
            color: "#3b82f6",
          },
          {
            name: "energy",
            label: "Energy",
            description: "How energetic do you feel?",
            min: 1,
            max: 10,
            defaultValue: 5,
            step: 1,
            isActive: true,
            color: "#f59e0b",
          },
          {
            name: "focus",
            label: "Focus",
            description: "How focused do you feel?",
            min: 1,
            max: 10,
            defaultValue: 5,
            step: 1,
            isActive: true,
            color: "#10b981",
          },
          {
            name: "happiness",
            label: "Happiness",
            description: "How happy do you feel?",
            min: 1,
            max: 10,
            defaultValue: 5,
            step: 1,
            isActive: true,
            color: "#8b5cf6",
          },
          {
            name: "stress",
            label: "Stress",
            description: "How stressed do you feel?",
            min: 1,
            max: 10,
            defaultValue: 5,
            step: 1,
            isActive: true,
            color: "#ef4444",
          },
        ]

        try {
          // Add default metrics
          await this.metrics.bulkAdd(defaultMetrics)
          console.log("Default metrics added successfully")
        } catch (error) {
          console.error("Error adding default metrics:", error)
        }
      } else {
        // Ensure the first 5 metrics are enabled
        console.log("Ensuring first 5 metrics are enabled")
        try {
          const metrics = await this.metrics.toArray()

          // The core metrics we want to ensure are enabled
          const coreMetricNames = ["productivity", "energy", "focus", "happiness", "stress"]

          // Check each metric and update if needed
          for (const metric of metrics) {
            if (coreMetricNames.includes(metric.name) && !metric.isActive) {
              console.log(`Enabling core metric: ${metric.name}`)
              await this.metrics.update(metric.id!, { isActive: true })
            }
          }
        } catch (error) {
          console.error("Error ensuring core metrics are enabled:", error)
        }
      }

      // Initialize default settings if they don't exist
      try {
        const settingsCount = await this.settings.count()
        if (settingsCount === 0) {
          console.log("Adding default settings")

          // Default settings
          const defaultSettings = [
            { key: "theme", value: "system" },
            { key: "timeFormat", value: "12h" },
            { key: "notificationsEnabled", value: true },
            { key: "soundEnabled", value: true },
            { key: "soundVolume", value: 0.5 },
            { key: "soundName", value: "default" },
            { key: "welcomeModalShown", value: false },
            { key: "timerSound", value: "default" },
            { key: "notificationSound", value: "default" },
            { key: "timerVolume", value: 0.7 },
            { key: "notificationVolume", value: 0.7 },
            { key: "emotionalAnalysisEnabled", value: true }, // Default to enabled
            { key: "emotionalAnalysisAutoApply", value: false }, // Default to ask each time
            { key: "backgroundImage", value: "" }, // Default to no background image
            { key: "formOpacity", value: 1 }, // Default to fully opaque forms
            { key: "hapticFeedback", value: true }, // Default to enabled
            { key: "settingsExportHistory", value: [] }, // Empty history
            { key: "lastSettingsImport", value: null }, // No imports yet
          ]

          // Add default settings
          await this.settings.bulkAdd(defaultSettings)
          console.log("Default settings added successfully")
        } else {
          // Check if specific settings exist, add if not
          await this.ensureSettingExists("emotionalAnalysisEnabled", true)
          await this.ensureSettingExists("emotionalAnalysisAutoApply", false)
          await this.ensureSettingExists("hapticFeedback", true)
          await this.ensureSettingExists("settingsExportHistory", [])
          await this.ensureSettingExists("lastSettingsImport", null)
        }
      } catch (error) {
        console.error("Error initializing settings:", error)
      }

      // Initialize default categories if they don't exist
      await this.initializeDefaultCategories()

      // Initialize default task templates if they don't exist
      await this.initializeDefaultTaskTemplates()

      // Initialize default collections if they don't exist
      await this.initializeDefaultCollections()

      // Add default example task if it doesn't exist
      await this.addDefaultExampleTask()

      console.log("Default data initialization complete")

      // After migration, record that we've completed the task restructuring
      try {
        const taskRestructuringCompleted = await this.settings.get("taskRestructuringCompleted")
        if (!taskRestructuringCompleted) {
          await this.settings.put({ key: "taskRestructuringCompleted", value: true })
          console.log("Task restructuring migration completed and recorded")
        }
      } catch (error) {
        console.error("Error recording task restructuring completion:", error)
      }
    } catch (error) {
      console.error("Error in initializeDefaultData:", error)
      throw error // Re-throw to ensure the caller knows there was an error
    }
  }

  // Helper method to ensure a setting exists
  async ensureSettingExists(key: string, defaultValue: any) {
    try {
      const setting = await this.settings.get(key)
      if (!setting) {
        console.log(`Adding missing setting: ${key}`)
        await this.settings.put({ key, value: defaultValue })
      }
    } catch (error) {
      console.error(`Error ensuring setting ${key} exists:`, error)
    }
  }

  // New method to initialize default collections
  async initializeDefaultCollections() {
    try {
      console.log("Checking for existing collections...")

      // First, check if we have a flag indicating collections have been initialized
      const collectionsInitialized = await this.settings.get("defaultCollectionsInitialized")
      if (collectionsInitialized && collectionsInitialized.value === true) {
        console.log("Default collections have already been initialized, skipping")
        return
      }

      // Get all existing collections
      const existingCollections = await this.collections.toArray()
      console.log(`Found ${existingCollections.length} existing collections`)

      // Create a map of existing collections by name for easy lookup
      const existingCollectionsByName = {}
      for (const collection of existingCollections) {
        existingCollectionsByName[collection.name.toLowerCase()] = collection
      }

      // Define default collections without hardcoded IDs
      const now = new Date().toISOString()
      const defaultCollections = [
        {
          name: "Daily Routine",
          description: "Tasks that need to be done every day",
          isRecurring: true,
          icon: "calendar",
          color: "#3b82f6", // Blue
        },
        {
          name: "Work Projects",
          description: "Current work projects and tasks",
          isRecurring: true,
          icon: "briefcase",
          color: "#8b5cf6", // Purple
        },
        {
          name: "Health & Fitness",
          description: "Exercise, nutrition, and wellness tasks",
          isRecurring: true,
          icon: "heart",
          color: "#10b981", // Green
        },
      ]

      // For each default collection, check if it exists by name and add if not
      for (const collection of defaultCollections) {
        try {
          // Use lowercase for case-insensitive comparison
          if (existingCollectionsByName[collection.name.toLowerCase()]) {
            console.log(`Collection "${collection.name}" already exists, skipping`)
            continue
          }

          // Generate a truly unique ID for the new collection with timestamp and random string
          const randomStr = Math.random().toString(36).substring(2, 10)
          const uniqueId = `collection-${Date.now()}-${randomStr}`

          // Add the collection with the new ID and current timestamp
          await this.collections.add({
            ...collection,
            id: uniqueId,
            createdAt: now,
          })

          console.log(`Added collection: ${collection.name} with ID ${uniqueId}`)
        } catch (error) {
          console.error(`Error adding collection ${collection.name}:`, error)
          // Continue with the next collection instead of failing completely
        }
      }

      // Mark collections as initialized
      await this.settings.put({ key: "defaultCollectionsInitialized", value: true })
      console.log("Marked default collections as initialized")

      console.log("Finished adding default collections")
    } catch (error) {
      console.error("Error in initializeDefaultCollections:", error)
    }
  }

  // New method to initialize default categories
  async initializeDefaultCategories() {
    try {
      console.log("Checking for existing categories...")

      // First, check if we have a flag indicating categories have been initialized
      const categoriesInitialized = await this.settings.get("defaultCategoriesInitialized")
      if (categoriesInitialized && categoriesInitialized.value === true) {
        console.log("Default categories have already been initialized, skipping")
        return
      }

      // Get all existing categories
      const existingCategories = await this.categories.toArray()
      console.log(`Found ${existingCategories.length} existing categories`)

      // Create a map of existing categories by name for easy lookup
      const existingCategoriesByName = {}
      for (const category of existingCategories) {
        existingCategoriesByName[category.name.toLowerCase()] = category
      }

      // Define default categories without hardcoded IDs
      const defaultCategories = [
        {
          name: "Work",
          color: "#3b82f6", // Blue
          icon: "briefcase",
          description: "Work-related tasks and projects",
          isDefault: true,
        },
        {
          name: "Personal",
          color: "#8b5cf6", // Purple
          icon: "user",
          description: "Personal tasks and goals",
          isDefault: true,
        },
        {
          name: "Health & Wellness",
          color: "#10b981", // Green
          icon: "heart",
          description: "Health, fitness, and wellness activities",
          isDefault: true,
        },
        {
          name: "Home",
          color: "#f59e0b", // Amber
          icon: "home",
          description: "Household chores and maintenance",
          isDefault: true,
        },
        {
          name: "Learning",
          color: "#ec4899", // Pink
          icon: "book",
          description: "Education and skill development",
          isDefault: true,
        },
      ]

      // For each default category, check if it exists by name and add if not
      for (const category of defaultCategories) {
        try {
          // Use lowercase for case-insensitive comparison
          if (existingCategoriesByName[category.name.toLowerCase()]) {
            console.log(`Category "${category.name}" already exists, skipping`)
            continue
          }

          // Generate a truly unique ID for the new category with timestamp and random string
          const randomStr = Math.random().toString(36).substring(2, 10)
          const uniqueId = `category-${category.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${randomStr}`

          // Add the category with the new ID and current timestamp
          await this.categories.add({
            ...category,
            id: uniqueId,
            createdAt: new Date().toISOString(),
          })

          console.log(`Added category: ${category.name} with ID ${uniqueId}`)
        } catch (error) {
          console.error(`Error adding category ${category.name}:`, error)
          // Continue with the next category instead of failing completely
        }
      }

      // Mark categories as initialized
      await this.settings.put({ key: "defaultCategoriesInitialized", value: true })
      console.log("Marked default categories as initialized")

      console.log("Finished adding default categories")
    } catch (error) {
      console.error("Error in initializeDefaultCategories:", error)
    }
  }

  // New method to initialize default task templates
  async initializeDefaultTaskTemplates() {
    try {
      console.log("Checking for existing task templates...")

      // First, check if we have a flag indicating templates have been initialized
      const templatesInitialized = await this.settings.get("defaultTemplatesInitialized")
      if (templatesInitialized && templatesInitialized.value === true) {
        console.log("Default templates have already been initialized, skipping")
        return
      }

      // Get all existing templates
      const existingTemplates = await this.taskTemplates.toArray()
      console.log(`Found ${existingTemplates.length} existing templates`)

      // If we already have templates, mark as initialized and skip
      if (existingTemplates.length > 0) {
        await this.settings.put({ key: "defaultTemplatesInitialized", value: true })
        console.log("Found existing templates, marking as initialized and skipping")
        return
      }

      console.log("No existing templates found, adding defaults")

      const now = new Date().toISOString()

      // Get category IDs - use a safer approach
      let workCategoryId, personalCategoryId, healthCategoryId, homeCategoryId

      try {
        // Find categories by name instead of ID to be more flexible
        const workCategory = await this.categories.where("name").equals("Work").first()
        workCategoryId = workCategory?.id

        const personalCategory = await this.categories.where("name").equals("Personal").first()
        personalCategoryId = personalCategory?.id

        const healthCategory = await this.categories.where("name").equals("Health & Wellness").first()
        healthCategoryId = healthCategory?.id

        const homeCategory = await this.categories.where("name").equals("Home").first()
        homeCategoryId = homeCategory?.id

        console.log("Found category IDs:", {
          workCategoryId,
          personalCategoryId,
          healthCategoryId,
          homeCategoryId,
        })
      } catch (error) {
        console.error("Error fetching categories:", error)
        // Continue with undefined category IDs rather than failing completely
      }

      const defaultTemplates: TaskTemplate[] = [
        {
          id: "template-daily-review",
          name: "Daily Review",
          description: "Review your day and plan for tomorrow",
          type: "subtasks",
          isRecurring: true,
          preferredSegment: undefined,
          categoryId: workCategoryId,
          subtasks: [
            {
              id: "subtask-1",
              name: "Review completed tasks",
              description: "Check what you've accomplished today",
              order: 0,
            },
            {
              id: "subtask-2",
              name: "Update task priorities",
              description: "Adjust priorities for remaining tasks",
              order: 1,
            },
            { id: "subtask-3", name: "Plan tomorrow", description: "Set goals and priorities for tomorrow", order: 2 },
            { id: "subtask-4", name: "Journal reflections", description: "Write down thoughts and insights", order: 3 },
          ],
          createdAt: now,
          usageCount: 0,
          icon: "clipboard-list",
          color: "#3b82f6",
          tags: ["productivity", "planning", "reflection"],
        },
        {
          id: "template-workout",
          name: "Workout Session",
          description: "Complete a full workout routine",
          type: "subtasks",
          isRecurring: true,
          preferredSegment: undefined,
          categoryId: healthCategoryId,
          subtasks: [
            {
              id: "subtask-1",
              name: "Warm up (5-10 min)",
              description: "Light cardio and dynamic stretching",
              order: 0,
            },
            {
              id: "subtask-2",
              name: "Main workout (30-45 min)",
              description: "Strength or cardio exercises",
              order: 1,
            },
            { id: "subtask-3", name: "Cool down (5-10 min)", description: "Light stretching", order: 2 },
            { id: "subtask-4", name: "Log workout details", description: "Record exercises, sets, and reps", order: 3 },
          ],
          createdAt: now,
          usageCount: 0,
          icon: "dumbbell",
          color: "#10b981",
          tags: ["health", "fitness", "exercise"],
        },
        {
          id: "template-water-intake",
          name: "Water Intake Tracking",
          description: "Track your daily water consumption",
          type: "tally",
          isRecurring: true,
          preferredSegment: undefined,
          categoryId: healthCategoryId,
          createdAt: now,
          usageCount: 0,
          icon: "droplet",
          color: "#0ea5e9",
          tags: ["health", "hydration", "daily"],
        },
        {
          id: "template-house-cleaning",
          name: "House Cleaning",
          description: "Complete house cleaning tasks",
          type: "subtasks",
          isRecurring: false,
          preferredSegment: undefined,
          categoryId: homeCategoryId,
          subtasks: [
            { id: "subtask-1", name: "Vacuum all rooms", description: "", order: 0 },
            { id: "subtask-2", name: "Dust surfaces", description: "", order: 1 },
            { id: "subtask-3", name: "Clean bathrooms", description: "", order: 2 },
            { id: "subtask-4", name: "Mop floors", description: "", order: 3 },
            { id: "subtask-5", name: "Take out trash", description: "", order: 4 },
          ],
          createdAt: now,
          usageCount: 0,
          icon: "home",
          color: "#f59e0b",
          tags: ["home", "cleaning", "chores"],
        },
        {
          id: "template-meditation",
          name: "Meditation Session",
          description: "Take time to meditate and center yourself",
          type: "standard",
          isRecurring: true,
          preferredSegment: undefined,
          categoryId: personalCategoryId,
          createdAt: now,
          usageCount: 0,
          icon: "brain",
          color: "#8b5cf6",
          tags: ["mindfulness", "wellness", "mental health"],
        },
      ]

      // Add default templates one by one with error handling
      for (const template of defaultTemplates) {
        try {
          // Check if a template with this name already exists
          const existingTemplate = await this.taskTemplates.where("name").equals(template.name).first()

          if (existingTemplate) {
            console.log(`Template "${template.name}" already exists, skipping`)
            continue
          }

          // Generate a truly unique ID for each template using timestamp and random string
          const randomStr = Math.random().toString(36).substring(2, 10)
          const uniqueId = `template-${template.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${randomStr}`

          // Create a new template object with the unique ID
          const templateToAdd = {
            ...template,
            id: uniqueId,
            // Ensure createdAt is always set to current time
            createdAt: new Date().toISOString(),
          }

          // Add the template with the new ID
          await this.taskTemplates.add(templateToAdd)
          console.log(`Added template: ${template.name} with ID ${uniqueId}`)
        } catch (error) {
          console.error(`Error adding template ${template.name}:`, error)
          // Continue with the next template instead of failing completely
        }
      }

      // Mark templates as initialized
      await this.settings.put({ key: "defaultTemplatesInitialized", value: true })
      console.log("Marked default templates as initialized")

      console.log("Finished adding default templates")
    } catch (error) {
      console.error("Error in initializeDefaultTaskTemplates:", error)
    }
  }

  // New method to add a default example task
  async addDefaultExampleTask() {
    try {
      // Check if the default example task already exists
      const exampleTaskExists = await this.tasks.where("name").equals("Getting Started: Task Examples").first()

      if (!exampleTaskExists) {
        console.log("Adding default example task")

        // Create the task with examples of different task types
        const exampleTask = {
          id: `example-task-${Date.now()}`,
          name: "Getting Started: Task Examples",
          description:
            "Welcome to Day Segment Tracker! Here are some ideas for tasks you might want to track:\n\n" +
            "## Standard Tasks\n" +
            "• Complete daily planning session\n" +
            "• Review weekly goals\n" +
            "• Clean workspace\n" +
            "• Prepare tomorrow's schedule\n" +
            "• Read for 30 minutes\n\n" +
            "## Tally Tasks (count multiple completions)\n" +
            "• Drink water (8 glasses per day)\n" +
            "• Take short breaks (every hour)\n" +
            "• Do quick stretches\n" +
            "• Practice deep breathing\n" +
            "• Check posture\n\n" +
            "## Tasks with Subtasks (break down complex tasks)\n" +
            "• Weekly review\n" +
            "  - Review completed tasks\n" +
            "  - Plan next week's priorities\n" +
            "  - Update project timelines\n" +
            "  - Reflect on productivity patterns\n\n" +
            "• Morning routine\n" +
            "  - Hydrate\n" +
            "  - Exercise\n" +
            "  - Meditate\n" +
            "  - Plan the day\n\n" +
            "Try creating your own tasks using the different task types!",
          status: "todo",
          priority: "medium",
          createdAt: new Date().toISOString(),
          type: "standard",
          isRecurring: false, // One-time task
          hasSubtasks: false,
          subtaskCount: 0,
          completedSubtaskCount: 0,
        }

        // Add the task to the database
        await this.tasks.add(exampleTask)
        console.log("Added default example task")

        // Create a subtask example task
        const subtaskExampleTask = {
          id: `example-subtask-task-${Date.now()}`,
          name: "Example: Task with Subtasks",
          description: "This is an example of a task with subtasks. Click 'View Subtasks' to see the subtasks.",
          status: "todo",
          priority: "medium",
          createdAt: new Date().toISOString(),
          type: "subtasks",
          isRecurring: false,
          hasSubtasks: true,
          subtaskCount: 3,
          completedSubtaskCount: 0,
        }

        // Add the subtask example task
        const subtaskTaskId = await this.tasks.add(subtaskExampleTask)
        console.log("Added subtask example task")

        // Add example subtasks
        const exampleSubtasks = [
          {
            id: `example-subtask-1-${Date.now()}`,
            taskId: subtaskTaskId,
            name: "First step: Plan your approach",
            description: "Break down the task into manageable steps",
            isCompleted: false,
            createdAt: new Date().toISOString(),
            order: 0,
          },
          {
            id: `example-subtask-2-${Date.now()}`,
            taskId: subtaskTaskId,
            name: "Second step: Execute the plan",
            description: "Work through each step methodically",
            isCompleted: false,
            createdAt: new Date().toISOString(),
            order: 1,
          },
          {
            id: `example-subtask-3-${Date.now()}`,
            taskId: subtaskTaskId,
            name: "Final step: Review and reflect",
            description: "Evaluate what worked well and what could be improved",
            isCompleted: false,
            createdAt: new Date().toISOString(),
            order: 2,
          },
        ]

        // Add the example subtasks
        await this.subtasks.bulkAdd(exampleSubtasks)
        console.log("Added example subtasks")
      }
    } catch (error) {
      console.error("Error adding default example task:", error)
    }
  }
}

// Create a singleton instance of the database
export const db = new AppDatabase()

// Only initialize in browser environment
if (typeof window !== "undefined") {
  // Add runtime version checks for development
  if (process.env.NODE_ENV === "development") {
    db.on("blocked", () => {
      console.error("Database blocked. Please close all other tabs running this application.")
      alert("Database is blocked. Please close all other tabs running this application.")
    })

    db.on("versionchange", () => {
      db.close()
      console.log("Database version changed. Please reload the page.")
      alert("Database version changed. Please reload the page.")
    })
  }

  // Initialize default data when the app starts
  db.initializeDefaultData().catch((error) => {
    console.error("Error initializing default data:", error)
  })

  // Add migrations and checks on database ready
  db.on("ready", async () => {
    // Check if we need to migrate tasks
    const migrationCompleted = await db.settings.get("taskRecurringMigrationCompleted")

    if (!migrationCompleted) {
      console.log("Migrating tasks to include isRecurring field...")

      try {
        // Get all existing tasks
        const tasks = await db.tasks.toArray()

        // Update each task to set isRecurring to true (default behavior)
        for (const task of tasks) {
          if (task.isRecurring === undefined) {
            await db.tasks.update(task.id, { isRecurring: true })
          }
        }

        // Mark migration as completed
        await db.settings.put({ key: "taskRecurringMigrationCompleted", value: true })
        console.log("Task migration completed successfully")
      } catch (error) {
        console.error("Error during task migration:", error)
      }
    }

    // Check if we need to ensure core metrics are enabled
    const metricsCheckCompleted = await db.settings.get("coreMetricsEnabledCheckCompleted")

    if (!metricsCheckCompleted) {
      console.log("Running core metrics enabled check...")

      try {
        // Get all metrics
        const metrics = await db.metrics.toArray()

        // The core metrics we want to ensure are enabled
        const coreMetricNames = ["productivity", "energy", "focus", "happiness", "stress"]

        // Check each metric and update if needed
        let updatesNeeded = false
        for (const metric of metrics) {
          if (coreMetricNames.includes(metric.name) && !metric.isActive) {
            console.log(`Enabling core metric: ${metric.name}`)
            await db.metrics.update(metric.id!, { isActive: true })
            updatesNeeded = true
          }
        }

        if (updatesNeeded) {
          console.log("Core metrics have been enabled")
        } else {
          console.log("All core metrics were already enabled")
        }

        // Mark check as completed
        await db.settings.put({ key: "coreMetricsEnabledCheckCompleted", value: true })
      } catch (error) {
        console.error("Error during core metrics check:", error)
      }
    }

    // Check if we need to migrate to background settings
    const backgroundSettingsMigrated = await db.settings.get("migratedToBackgroundSettings")
    if (!backgroundSettingsMigrated || !backgroundSettingsMigrated.value) {
      await migrateToBackgroundSettings()
    }

    // Check if we need to migrate to version 16
    const migratedToV16 = await db.settings.get("migratedToVersion16")
    if (!migratedToV16 || !migratedToV16.value) {
      await migrateToVersion16()
    }

    // Check if we need to migrate to version 17
    const migratedToV17 = await db.settings.get("migratedToVersion17")
    if (!migratedToV17 || !migratedToV17.value) {
      await migrateToVersion17()
    }

    // Ensure the default example task exists
    await db.addDefaultExampleTask()

    // Add example tasks for segments
    await addSegmentExampleTasks()
  })
}
