"use client"

import { useState, useEffect, useCallback } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { v4 as uuidv4 } from "uuid"
import { db, type TaskTemplate, type SubtaskTemplate, type Task, type Subtask } from "@/lib/db"
import { toast } from "@/components/ui/use-toast"

export function useTaskTemplates() {
  const templates = useLiveQuery(() => db.taskTemplates.toArray())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (templates !== undefined) {
      setIsLoading(false)
    }
  }, [templates])

  // Create a new template
  const createTemplate = useCallback(async (templateData: Omit<TaskTemplate, "id" | "createdAt" | "usageCount">) => {
    try {
      const id = `template-${uuidv4()}`
      const now = new Date().toISOString()

      const newTemplate: TaskTemplate = {
        ...templateData,
        id,
        createdAt: now,
        usageCount: 0,
      }

      await db.taskTemplates.add(newTemplate)

      toast({
        title: "Template created",
        description: `Template "${templateData.name}" has been created successfully.`,
      })

      return { success: true, id }
    } catch (error) {
      console.error("Error creating template:", error)

      toast({
        title: "Error creating template",
        description: "There was a problem creating your template. Please try again.",
        variant: "destructive",
      })

      return { success: false, error }
    }
  }, [])

  // Create a template from an existing task
  const createTemplateFromTask = useCallback(
    async (taskId: string, templateName: string, templateDescription?: string) => {
      try {
        const task = await db.tasks.get(taskId)
        if (!task) {
          throw new Error("Task not found")
        }

        const id = `template-${uuidv4()}`
        const now = new Date().toISOString()

        // Create template object from task
        const newTemplate: TaskTemplate = {
          id,
          name: templateName || task.name,
          description: templateDescription || task.description,
          type: task.type || "standard",
          isRecurring: task.isRecurring,
          preferredSegment: task.preferredSegment,
          segmentStartTime: task.segmentStartTime,
          categoryId: task.categoryId,
          createdAt: now,
          usageCount: 0,
        }

        // If task has subtasks, get them and add to template
        if (task.hasSubtasks) {
          const subtasks = await db.subtasks.where("taskId").equals(taskId).toArray()

          if (subtasks.length > 0) {
            newTemplate.subtasks = subtasks.map(
              (subtask): SubtaskTemplate => ({
                id: `template-subtask-${uuidv4()}`,
                name: subtask.name,
                description: subtask.description,
                order: subtask.order,
              }),
            )
          }
        }

        await db.taskTemplates.add(newTemplate)

        toast({
          title: "Template created",
          description: `Template "${newTemplate.name}" has been created from task.`,
        })

        return { success: true, id }
      } catch (error) {
        console.error("Error creating template from task:", error)

        toast({
          title: "Error creating template",
          description: "There was a problem creating your template. Please try again.",
          variant: "destructive",
        })

        return { success: false, error }
      }
    },
    [],
  )

  // Update an existing template
  const updateTemplate = useCallback(async (id: string, updates: Partial<TaskTemplate>) => {
    try {
      await db.taskTemplates.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Template updated",
        description: "Your template has been updated successfully.",
      })

      return { success: true }
    } catch (error) {
      console.error("Error updating template:", error)

      toast({
        title: "Error updating template",
        description: "There was a problem updating your template. Please try again.",
        variant: "destructive",
      })

      return { success: false, error }
    }
  }, [])

  // Delete a template
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await db.taskTemplates.delete(id)

      toast({
        title: "Template deleted",
        description: "Your template has been deleted successfully.",
      })

      return { success: true }
    } catch (error) {
      console.error("Error deleting template:", error)

      toast({
        title: "Error deleting template",
        description: "There was a problem deleting your template. Please try again.",
        variant: "destructive",
      })

      return { success: false, error }
    }
  }, [])

  // Create a task from a template
  const createTaskFromTemplate = useCallback(async (templateId: string, customizations?: Partial<Task>) => {
    try {
      const template = await db.taskTemplates.get(templateId)
      if (!template) {
        throw new Error("Template not found")
      }

      const taskId = `task-${uuidv4()}`
      const now = new Date().toISOString()

      // Create task from template
      const newTask: Task = {
        id: taskId,
        name: template.name,
        description: template.description,
        status: "todo",
        priority: "medium",
        createdAt: now,
        type: template.type || "standard",
        isRecurring: template.isRecurring,
        preferredSegment: template.preferredSegment,
        segmentStartTime: template.segmentStartTime,
        categoryId: template.categoryId,
        templateId: templateId,
        ...customizations,
      }

      // If template has subtasks, create them for the task
      if (template.subtasks && template.subtasks.length > 0) {
        newTask.hasSubtasks = true
        newTask.subtaskCount = template.subtasks.length
        newTask.completedSubtaskCount = 0

        // Add the task first
        await db.tasks.add(newTask)

        // Then add all subtasks
        const subtasks: Subtask[] = template.subtasks.map(
          (subtaskTemplate): Subtask => ({
            id: `subtask-${uuidv4()}`,
            taskId: taskId,
            name: subtaskTemplate.name,
            description: subtaskTemplate.description,
            isCompleted: false,
            createdAt: now,
            order: subtaskTemplate.order,
          }),
        )

        await db.subtasks.bulkAdd(subtasks)
      } else {
        // No subtasks, just add the task
        await db.tasks.add(newTask)
      }

      // Increment the usage count for the template
      await db.taskTemplates.update(templateId, {
        usageCount: (template.usageCount || 0) + 1,
      })

      toast({
        title: "Task created",
        description: `Task "${newTask.name}" has been created from template.`,
      })

      return { success: true, taskId }
    } catch (error) {
      console.error("Error creating task from template:", error)

      toast({
        title: "Error creating task",
        description: "There was a problem creating your task. Please try again.",
        variant: "destructive",
      })

      return { success: false, error }
    }
  }, [])

  return {
    templates: templates || [],
    isLoading,
    createTemplate,
    createTemplateFromTask,
    updateTemplate,
    deleteTemplate,
    createTaskFromTemplate,
  }
}
