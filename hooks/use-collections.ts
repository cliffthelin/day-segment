"use client"

import { useState, useCallback, useEffect } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db"
import type { Collection, Task } from "@/types"

export function useCollections() {
  const collections = useLiveQuery(() => db.collections.toArray())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (collections !== undefined) {
      setIsLoading(false)
    }
  }, [collections])

  const addCollection = useCallback(async (collectionData: Omit<Collection, "id" | "createdAt">) => {
    try {
      const id = `collection-${uuidv4()}`
      const newCollection: Collection = {
        ...collectionData,
        id,
        createdAt: new Date().toISOString(),
      }
      await db.collections.add(newCollection)
      return { success: true, id }
    } catch (err) {
      const errorMessage = `Failed to add collection: ${(err as Error).message}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  const updateCollection = useCallback(async (id: string, collectionData: Partial<Collection>) => {
    try {
      const updatedData = {
        ...collectionData,
        updatedAt: new Date().toISOString(),
      }
      await db.collections.update(id, updatedData)
      return { success: true }
    } catch (err) {
      const errorMessage = `Failed to update collection: ${(err as Error).message}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  const deleteCollection = useCallback(async (id: string) => {
    try {
      // First, delete all task-collection relationships for this collection
      await db.taskCollections.where("collectionId").equals(id).delete()

      // Then delete the collection
      await db.collections.delete(id)
      return { success: true }
    } catch (err) {
      const errorMessage = `Failed to delete collection: ${(err as Error).message}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  const getCollectionById = useCallback(async (id: string) => {
    try {
      return await db.collections.get(id)
    } catch (err) {
      const errorMessage = `Failed to get collection: ${(err as Error).message}`
      setError(errorMessage)
      return null
    }
  }, [])

  const getTaskCountByCollection = useCallback(async (collectionId: string) => {
    try {
      return await db.taskCollections.where("collectionId").equals(collectionId).count()
    } catch (err) {
      const errorMessage = `Failed to get task count: ${(err as Error).message}`
      setError(errorMessage)
      return 0
    }
  }, [])

  return {
    collections: collections || [],
    isLoading,
    error,
    addCollection,
    updateCollection,
    deleteCollection,
    getCollectionById,
    getTaskCountByCollection,
  }
}

export function useCollectionTasks(collectionId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use Dexie's useLiveQuery to get real-time updates
  const taskCollections = useLiveQuery(
    () => db.taskCollections.where("collectionId").equals(collectionId).toArray(),
    [collectionId],
  )

  // Fetch tasks whenever taskCollections changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!taskCollections) return

      try {
        setIsLoading(true)

        if (taskCollections.length === 0) {
          setTasks([])
          return
        }

        const taskIds = taskCollections.map((tc) => tc.taskId)
        const tasksData = await db.tasks.where("id").anyOf(taskIds).toArray()

        // Sort tasks by status (todo, started, completed) and then by name
        tasksData.sort((a, b) => {
          const statusOrder = { todo: 0, started: 1, completed: 2 }
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status]
          }
          return a.name.localeCompare(b.name)
        })

        setTasks(tasksData)
      } catch (err) {
        const errorMessage = `Failed to fetch tasks: ${(err as Error).message}`
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [taskCollections])

  const addTaskToCollection = useCallback(
    async (taskId: string) => {
      try {
        // Check if the task is already in the collection
        const existing = await db.taskCollections.where({ taskId, collectionId }).first()

        if (existing) {
          return { success: true, message: "Task already in collection" }
        }

        // Add the task to the collection
        await db.taskCollections.add({
          id: `task-collection-${uuidv4()}`,
          taskId,
          collectionId,
          createdAt: new Date().toISOString(),
        })

        return { success: true }
      } catch (err) {
        const errorMessage = `Failed to add task to collection: ${(err as Error).message}`
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [collectionId],
  )

  const removeTaskFromCollection = useCallback(
    async (taskId: string) => {
      try {
        // Find the task-collection relationship
        const relationship = await db.taskCollections.where({ taskId, collectionId }).first()

        if (!relationship) {
          return { success: false, error: "Task not found in collection" }
        }

        // Delete the relationship
        await db.taskCollections.delete(relationship.id)

        return { success: true }
      } catch (err) {
        const errorMessage = `Failed to remove task from collection: ${(err as Error).message}`
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [collectionId],
  )

  const getTaskCollections = useCallback(async (taskId: string) => {
    try {
      // Get all collections this task belongs to
      const taskCollections = await db.taskCollections.where("taskId").equals(taskId).toArray()

      if (taskCollections.length === 0) {
        return []
      }

      const collectionIds = taskCollections.map((tc) => tc.collectionId)
      return await db.collections.where("id").anyOf(collectionIds).toArray()
    } catch (err) {
      const errorMessage = `Failed to get task collections: ${(err as Error).message}`
      setError(errorMessage)
      return []
    }
  }, [])

  return {
    tasks,
    isLoading,
    error,
    addTaskToCollection,
    removeTaskFromCollection,
    getTaskCollections,
  }
}
