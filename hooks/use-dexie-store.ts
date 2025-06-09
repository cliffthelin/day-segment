"use client"

import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { useState, useCallback, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Task, TaskStatus, Category } from "@/types"

// Add a state to track database initialization
const useDbInitialization = () => {
  const [isDbInitialized, setIsDbInitialized] = useState(false)

  // Initialize database when component mounts
  useEffect(() => {
    const initDb = async () => {
      try {
        // Check if database is already open
        if (db.isOpen()) {
          setIsDbInitialized(true)
          return
        }

        // If not open, try to open it
        await db.open()
        setIsDbInitialized(true)
      } catch (err) {
        console.error("Error initializing database:", err)
      }
    }

    // Set up event listener for database ready
    const onReady = () => {
      setIsDbInitialized(true)
    }

    // Add event listener
    db.on("ready", onReady)

    // Try to initialize
    initDb()

    // Clean up event listener
    return () => {
      db.on("ready").unsubscribe(onReady)
    }
  }, [])

  return isDbInitialized
}

// Generic hook for fetching all items from a table
export function useCollection<T>(table: string) {
  const isDbInitialized = useDbInitialization()
  return useLiveQuery(async () => {
    try {
      // Check if database is initialized and table exists
      if (!db || !(table in db)) {
        console.warn(`Table ${table} does not exist in database`)
        return []
      }
      return await (db as any)[table].toArray()
    } catch (err) {
      console.error(`Error fetching collection from ${table}:`, err)
      return []
    }
  }, [table, isDbInitialized])
}

// Hook for fetching a single item by ID
export function useItem<T>(table: string, id: string) {
  const isDbInitialized = useDbInitialization()
  return useLiveQuery(async () => {
    try {
      // Check if database is initialized and table exists
      if (!db || !(table in db)) {
        console.warn(`Table ${table} does not exist in database`)
        return null
      }
      return await (db as any)[table].get(id)
    } catch (err) {
      console.error(`Error fetching item from ${table}:`, err)
      return null
    }
  }, [table, id, isDbInitialized])
}

// Hook for settings with optimistic updates
export function useSetting(key: string, defaultValue: any) {
  const isDbInitialized = useDbInitialization()
  const setting = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.settings) {
        console.warn("Settings table does not exist in database")
        return { value: defaultValue }
      }
      return await db.settings.get(key)
    } catch (err) {
      console.error(`Error fetching setting ${key}:`, err)
      return { value: defaultValue }
    }
  }, [key, isDbInitialized])

  const [optimisticValue, setOptimisticValue] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update optimistic value when the actual value changes
  useEffect(() => {
    if (setting?.value !== undefined) {
      setOptimisticValue(setting.value)
    }
  }, [setting?.value])

  const updateSetting = useCallback(
    async (newValue: any) => {
      try {
        // Only update if the value is different
        if (newValue === optimisticValue) return

        // Update optimistic value immediately
        setOptimisticValue(newValue)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.settings) {
          throw new Error("Settings table does not exist in database")
        }

        // Update the database
        await db.settings.put({ key, value: newValue })
      } catch (err) {
        console.error("Error updating setting:", err)
        setError(err)

        // Revert to the previous value on error
        if (setting?.value !== undefined) {
          setOptimisticValue(setting.value)
        } else {
          setOptimisticValue(defaultValue)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [key, optimisticValue, setting?.value, defaultValue],
  )

  return [optimisticValue, updateSetting, isLoading, error]
}

// Hook to get all settings
export function useSettings() {
  const isDbInitialized = useDbInitialization()
  const settings = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.settings) {
        console.warn("Settings table does not exist in database")
        return []
      }
      return await db.settings.toArray()
    } catch (err) {
      console.error("Error fetching settings:", err)
      return []
    }
  }, [isDbInitialized])
  return [settings || []]
}

// Hook for segments with optimistic updates
export function useSegments() {
  const isDbInitialized = useDbInitialization()
  const segments = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.segments) {
        console.warn("Segments table does not exist in database")
        return []
      }
      return await db.segments.orderBy("startTime").toArray()
    } catch (err) {
      console.error("Error fetching segments:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticSegments, setOptimisticSegments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Update optimistic segments when the actual segments change
  useEffect(() => {
    if (segments) {
      setOptimisticSegments(segments)
      setIsLoading(false)
    }
  }, [segments])

  // Initialize default segments if none exist
  useEffect(() => {
    const initializeDefaultSegments = async () => {
      try {
        // Only initialize if segments is empty array (not null/undefined)
        if (segments && segments.length === 0) {
          console.log("Initializing default segments")
          await db.initializeDefaultData()
        }
      } catch (err) {
        console.error("Error initializing default segments:", err)
      }
    }

    if (segments !== undefined) {
      initializeDefaultSegments()
    }
  }, [segments])

  const setSegments = useCallback(
    async (newSegments: any[]) => {
      try {
        // Only update if the segments are different
        if (JSON.stringify(newSegments) === JSON.stringify(optimisticSegments)) return

        // Update optimistic segments immediately
        setOptimisticSegments(newSegments)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.segments) {
          throw new Error("Segments table does not exist in database")
        }

        // Update the database
        await db.transaction("rw", db.segments, async () => {
          await db.segments.clear()
          await db.segments.bulkAdd(newSegments)
        })
      } catch (err) {
        console.error("Error updating segments:", err)
        setError(err)

        // Revert to the previous segments on error
        if (segments) {
          setOptimisticSegments(segments)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticSegments, segments],
  )

  return [optimisticSegments, setSegments, isLoading, error]
}

// Hook for metrics with optimistic updates
export function useMetrics() {
  const isDbInitialized = useDbInitialization()
  const metrics = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.metrics) {
        console.warn("Metrics table does not exist in database")
        return []
      }
      return await db.metrics.toArray()
    } catch (err) {
      console.error("Error fetching metrics:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticMetrics, setOptimisticMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update optimistic metrics when the actual metrics change
  useEffect(() => {
    if (metrics) {
      setOptimisticMetrics(metrics)
    }
  }, [metrics])

  const setMetrics = useCallback(
    async (newMetrics: any[]) => {
      try {
        // Only update if the metrics are different
        if (JSON.stringify(newMetrics) === JSON.stringify(optimisticMetrics)) return

        // Update optimistic metrics immediately
        setOptimisticMetrics(newMetrics)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.metrics) {
          throw new Error("Metrics table does not exist in database")
        }

        // Update the database
        await db.transaction("rw", db.metrics, async () => {
          await db.metrics.clear()
          await db.metrics.bulkAdd(newMetrics)
        })
      } catch (err) {
        console.error("Error updating metrics:", err)
        setError(err)

        // Revert to the previous metrics on error
        if (metrics) {
          setOptimisticMetrics(metrics)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticMetrics, metrics],
  )

  return [optimisticMetrics, setMetrics, isLoading, error]
}

// Hook for check-in metrics with optimistic updates
export function useCheckInMetrics() {
  const isDbInitialized = useDbInitialization()
  const metrics = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.metrics) {
        console.warn("Metrics table does not exist in database")
        return []
      }
      return await db.metrics.toArray()
    } catch (err) {
      console.error("Error fetching metrics:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticMetrics, setOptimisticMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update optimistic metrics when the actual metrics change
  useEffect(() => {
    if (metrics) {
      setOptimisticMetrics(metrics)
      setIsLoading(false)
    }
  }, [metrics])

  const setMetrics = useCallback(
    async (newMetrics: any[]) => {
      try {
        // Only update if the metrics are different
        if (JSON.stringify(newMetrics) === JSON.stringify(optimisticMetrics)) return

        // Update optimistic metrics immediately
        setOptimisticMetrics(newMetrics)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.metrics) {
          throw new Error("Metrics table does not exist in database")
        }

        // Update the database
        await db.transaction("rw", db.metrics, async () => {
          await db.metrics.clear()
          await db.metrics.bulkAdd(newMetrics)
        })
      } catch (err) {
        console.error("Error updating metrics:", err)
        setError(err)

        // Revert to the previous metrics on error
        if (metrics) {
          setOptimisticMetrics(metrics)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticMetrics, metrics],
  )

  return [optimisticMetrics, setMetrics, isLoading, error]
}

// Hook for tasks with optimistic updates
export function useTasks() {
  const isDbInitialized = useDbInitialization()
  const tasks = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.tasks) {
        console.warn("Tasks table does not exist in database")
        return []
      }
      return await db.tasks.toArray()
    } catch (err) {
      console.error("Error fetching tasks:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticTasks, setOptimisticTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update optimistic tasks when the actual tasks change
  useEffect(() => {
    if (tasks) {
      setOptimisticTasks(tasks)
    }
  }, [tasks])

  const setTasks = useCallback(
    async (newTasks: any[]) => {
      try {
        // Only update if the tasks are different
        if (JSON.stringify(newTasks) === JSON.stringify(optimisticTasks)) return

        // Update optimistic tasks immediately
        setOptimisticTasks(newTasks)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.tasks) {
          throw new Error("Tasks table does not exist in database")
        }

        // Update the database
        await db.transaction("rw", db.tasks, async () => {
          await db.tasks.clear()
          await db.tasks.bulkAdd(newTasks)
        })
      } catch (err) {
        console.error("Error updating tasks:", err)
        setError(err)

        // Revert to the previous tasks on error
        if (tasks) {
          setOptimisticTasks(tasks)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticTasks, tasks],
  )

  return [optimisticTasks, setTasks, isLoading, error]
}

// Hook for check-ins with optimistic updates
export function useCheckIns() {
  const isDbInitialized = useDbInitialization()
  const checkIns = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.checkIns) {
        console.warn("CheckIns table does not exist in database")
        return []
      }
      return await db.checkIns.toArray()
    } catch (err) {
      console.error("Error fetching check-ins:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticCheckIns, setOptimisticCheckIns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update optimistic check-ins when the actual check-ins change
  useEffect(() => {
    if (checkIns) {
      setOptimisticCheckIns(checkIns)
    }
  }, [checkIns])

  const setCheckIns = useCallback(
    async (newCheckIns: any[]) => {
      try {
        // Only update if the check-ins are different
        if (JSON.stringify(newCheckIns) === JSON.stringify(optimisticCheckIns)) return

        // Update optimistic check-ins immediately
        setOptimisticCheckIns(newCheckIns)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.checkIns) {
          throw new Error("CheckIns table does not exist in database")
        }

        // Update the database
        await db.transaction("rw", db.checkIns, async () => {
          await db.checkIns.clear()
          await db.checkIns.bulkAdd(newCheckIns)
        })
      } catch (err) {
        console.error("Error updating check-ins:", err)
        setError(err)

        // Revert to the previous check-ins on error
        if (checkIns) {
          setOptimisticCheckIns(checkIns)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticCheckIns, checkIns],
  )

  // Add a single check-in with optimistic update
  const addCheckIn = useCallback(
    async (newCheckIn: any) => {
      try {
        // Update optimistic check-ins immediately
        const updatedCheckIns = [...optimisticCheckIns, newCheckIn]
        setOptimisticCheckIns(updatedCheckIns)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.checkIns) {
          throw new Error("CheckIns table does not exist in database")
        }

        // Update the database
        await db.checkIns.add(newCheckIn)
      } catch (err) {
        console.error("Error adding check-in:", err)
        setError(err)

        // Revert to the previous check-ins on error
        if (checkIns) {
          setOptimisticCheckIns(checkIns)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticCheckIns, checkIns],
  )

  // Update a check-in with optimistic update
  const updateCheckIn = useCallback(
    async (checkInId: string, updates: any) => {
      try {
        // Find the check-in to update
        const checkInIndex = optimisticCheckIns.findIndex((c) => c.id === checkInId)
        if (checkInIndex === -1) {
          throw new Error(`Check-in with ID ${checkInId} not found`)
        }

        // Create updated check-in
        const updatedCheckIn = { ...optimisticCheckIns[checkInIndex], ...updates }

        // Update optimistic check-ins immediately
        const updatedCheckIns = [...optimisticCheckIns]
        updatedCheckIns[checkInIndex] = updatedCheckIn
        setOptimisticCheckIns(updatedCheckIns)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.checkIns) {
          throw new Error("CheckIns table does not exist in database")
        }

        // Update the database
        await db.checkIns.update(checkInId, updates)
      } catch (err) {
        console.error("Error updating check-in:", err)
        setError(err)

        // Revert to the previous check-ins on error
        if (checkIns) {
          setOptimisticCheckIns(checkIns)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticCheckIns, checkIns],
  )

  return [optimisticCheckIns, setCheckIns, addCheckIn, updateCheckIn, isLoading, error]
}

// Hook for task completions with optimistic updates
export function useTaskCompletions() {
  const isDbInitialized = useDbInitialization()
  const taskCompletions = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.taskCompletions) {
        console.warn("TaskCompletions table does not exist in database")
        return []
      }
      return await db.taskCompletions.toArray()
    } catch (err) {
      console.error("Error fetching task completions:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticTaskCompletions, setOptimisticTaskCompletions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update optimistic task completions when the actual task completions change
  useEffect(() => {
    if (taskCompletions) {
      setOptimisticTaskCompletions(taskCompletions)
    }
  }, [taskCompletions])

  const setTaskCompletions = useCallback(
    async (newTaskCompletions: any[]) => {
      try {
        // Only update if the task completions are different
        if (JSON.stringify(newTaskCompletions) === JSON.stringify(optimisticTaskCompletions)) return

        // Update optimistic task completions immediately
        setOptimisticTaskCompletions(newTaskCompletions)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.taskCompletions) {
          throw new Error("TaskCompletions table does not exist in database")
        }

        // Update the database
        await db.transaction("rw", db.taskCompletions, async () => {
          await db.taskCompletions.clear()
          await db.taskCompletions.bulkAdd(newTaskCompletions)
        })
      } catch (err) {
        console.error("Error updating task completions:", err)
        setError(err)

        // Revert to the previous task completions on error
        if (taskCompletions) {
          setOptimisticTaskCompletions(taskCompletions)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticTaskCompletions, taskCompletions],
  )

  // Add a single task completion with optimistic update
  const addTaskCompletion = useCallback(
    async (newTaskCompletion: any) => {
      try {
        // Ensure completionValue is set
        if (newTaskCompletion.completionValue === undefined) {
          newTaskCompletion.completionValue = 1.0 // Default to fully complete
        }

        // Update optimistic task completions immediately
        const updatedTaskCompletions = [...optimisticTaskCompletions, newTaskCompletion]
        setOptimisticTaskCompletions(updatedTaskCompletions)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.taskCompletions) {
          throw new Error("TaskCompletions table does not exist in database")
        }

        // Update the database
        await db.taskCompletions.add(newTaskCompletion)
      } catch (err) {
        console.error("Error adding task completion:", err)
        setError(err)

        // Revert to the previous task completions on error
        if (taskCompletions) {
          setOptimisticTaskCompletions(taskCompletions)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticTaskCompletions, taskCompletions],
  )

  // Update a task completion with optimistic update
  const updateTaskCompletion = useCallback(
    async (completionId: string, updates: any) => {
      try {
        // Find the task completion to update
        const completionIndex = optimisticTaskCompletions.findIndex((c) => c.id === completionId)
        if (completionIndex === -1) {
          throw new Error(`Task completion with ID ${completionId} not found`)
        }

        // Create updated completion
        const updatedCompletion = { ...optimisticTaskCompletions[completionIndex], ...updates }

        // Update optimistic task completions immediately
        const updatedCompletions = [...optimisticTaskCompletions]
        updatedCompletions[completionIndex] = updatedCompletion
        setOptimisticTaskCompletions(updatedCompletions)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.taskCompletions) {
          throw new Error("TaskCompletions table does not exist in database")
        }

        // Update the database
        await db.taskCompletions.update(completionId, updates)
      } catch (err) {
        console.error("Error updating task completion:", err)
        setError(err)

        // Revert to the previous task completions on error
        if (taskCompletions) {
          setOptimisticTaskCompletions(taskCompletions)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticTaskCompletions, taskCompletions],
  )

  // Toggle a task completion with optimistic update
  const toggleTaskCompletion = useCallback(
    async (taskId: string, date: string, completionValue = 1.0) => {
      try {
        // Find existing completion
        const existingCompletion = optimisticTaskCompletions.find(
          (completion) => completion.taskId === taskId && completion.date === date,
        )

        let updatedTaskCompletions

        if (existingCompletion) {
          // If already fully complete, remove it
          if (existingCompletion.completionValue >= 0.99) {
            updatedTaskCompletions = optimisticTaskCompletions.filter(
              (completion) => completion.id !== existingCompletion.id,
            )

            // Update optimistic task completions immediately
            setOptimisticTaskCompletions(updatedTaskCompletions)
            setIsLoading(true)
            setError(null)

            // Check if database is initialized
            if (!db || !db.taskCompletions) {
              throw new Error("TaskCompletions table does not exist in database")
            }

            // Update the database
            await db.taskCompletions.delete(existingCompletion.id)
          } else {
            // Otherwise update the completion value
            const newCompletionValue = Math.min(existingCompletion.completionValue + completionValue, 1.0)

            // Update optimistic task completions immediately
            const updatedCompletion = { ...existingCompletion, completionValue: newCompletionValue }
            updatedTaskCompletions = optimisticTaskCompletions.map((completion) =>
              completion.id === existingCompletion.id ? updatedCompletion : completion,
            )
            setOptimisticTaskCompletions(updatedTaskCompletions)
            setIsLoading(true)
            setError(null)

            // Check if database is initialized
            if (!db || !db.taskCompletions) {
              throw new Error("TaskCompletions table does not exist in database")
            }

            // Update the database
            await db.taskCompletions.update(existingCompletion.id, { completionValue: newCompletionValue })
          }
        } else {
          // Create a new completion
          const now = new Date()
          const currentTime = now.toISOString()

          // Check if database is initialized
          if (!db || !db.segments) {
            throw new Error("Segments table does not exist in database")
          }

          // Get current segment
          const currentHour = new Date().getHours()
          const currentMinute = new Date().getMinutes()
          const currentTimeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

          // Find current segment (simplified version)
          const segments = await db.segments.toArray()
          let currentSegment = segments[0]

          for (let i = segments.length - 1; i >= 0; i--) {
            if (segments[i].startTime <= currentTimeString) {
              currentSegment = segments[i]
              break
            }
          }

          const newCompletion = {
            id: Date.now().toString(),
            taskId,
            date,
            time: currentTime,
            segmentId: currentSegment.id,
            segmentName: currentSegment.name,
            completionValue: completionValue,
          }

          // Update optimistic task completions immediately
          updatedTaskCompletions = [...optimisticTaskCompletions, newCompletion]
          setOptimisticTaskCompletions(updatedTaskCompletions)
          setIsLoading(true)
          setError(null)

          // Check if database is initialized
          if (!db || !db.taskCompletions) {
            throw new Error("TaskCompletions table does not exist in database")
          }

          // Update the database
          await db.taskCompletions.add(newCompletion)
        }
      } catch (err) {
        console.error("Error toggling task completion:", err)
        setError(err)

        // Revert to the previous task completions on error
        if (taskCompletions) {
          setOptimisticTaskCompletions(taskCompletions)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticTaskCompletions, taskCompletions],
  )

  // Get the latest task completion for a specific task
  const getLatestTaskCompletion = useCallback(async (taskId: string) => {
    try {
      // Check if database is initialized
      if (!db || !db.taskCompletions) {
        console.warn("TaskCompletions table does not exist in database")
        return null
      }

      // Get all completions for this task
      const completions = await db.taskCompletions.where("taskId").equals(taskId).toArray()

      // Sort by date and time (most recent first)
      completions.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        return new Date(b.time).getTime() - new Date(a.time).getTime()
      })

      // Return the most recent completion
      return completions.length > 0 ? completions[0] : null
    } catch (err) {
      console.error("Error getting latest task completion:", err)
      return null
    }
  }, [])

  return [
    optimisticTaskCompletions,
    setTaskCompletions,
    addTaskCompletion,
    updateTaskCompletion,
    toggleTaskCompletion,
    getLatestTaskCompletion,
    isLoading,
    error,
  ]
}

// Hook for timer sessions with optimistic updates
export function useTimerSessions() {
  const isDbInitialized = useDbInitialization()
  const timerSessions = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.timerSessions) {
        console.warn("TimerSessions table does not exist in database")
        return []
      }
      return await db.timerSessions.toArray()
    } catch (err) {
      console.error("Error fetching timer sessions:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticTimerSessions, setOptimisticTimerSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update optimistic timer sessions when the actual timer sessions change
  useEffect(() => {
    if (timerSessions) {
      setOptimisticTimerSessions(timerSessions)
    }
  }, [timerSessions])

  // Add a timer session with optimistic update
  const addTimerSession = useCallback(
    async (newTimerSession: any) => {
      try {
        // Ensure completionValue is set
        if (newTimerSession.completionValue === undefined) {
          newTimerSession.completionValue = newTimerSession.completionPercentage / 100
        }

        // Update optimistic timer sessions immediately
        const updatedTimerSessions = [...optimisticTimerSessions, newTimerSession]
        setOptimisticTimerSessions(updatedTimerSessions)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.timerSessions) {
          throw new Error("TimerSessions table does not exist in database")
        }

        // Update the database
        await db.timerSessions.add(newTimerSession)
      } catch (err) {
        console.error("Error adding timer session:", err)
        setError(err)

        // Revert to the previous timer sessions on error
        if (timerSessions) {
          setOptimisticTimerSessions(timerSessions)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticTimerSessions, timerSessions],
  )

  // Update a timer session with optimistic update
  const updateTimerSession = useCallback(
    async (sessionId: string, updates: any) => {
      try {
        // Find the timer session to update
        const sessionIndex = optimisticTimerSessions.findIndex((s) => s.id === sessionId)
        if (sessionIndex === -1) {
          throw new Error(`Timer session with ID ${sessionId} not found`)
        }

        // If completionPercentage is being updated, also update completionValue
        if (updates.completionPercentage !== undefined && updates.completionValue === undefined) {
          updates.completionValue = updates.completionPercentage / 100
        }

        // Create updated session
        const updatedSession = { ...optimisticTimerSessions[sessionIndex], ...updates }

        // Update optimistic timer sessions immediately
        const updatedSessions = [...optimisticTimerSessions]
        updatedSessions[sessionIndex] = updatedSession
        setOptimisticTimerSessions(updatedSessions)
        setIsLoading(true)
        setError(null)

        // Check if database is initialized
        if (!db || !db.timerSessions) {
          throw new Error("TimerSessions table does not exist in database")
        }

        // Update the database
        await db.timerSessions.update(sessionId, updates)
      } catch (err) {
        console.error("Error updating timer session:", err)
        setError(err)

        // Revert to the previous timer sessions on error
        if (timerSessions) {
          setOptimisticTimerSessions(timerSessions)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticTimerSessions, timerSessions],
  )

  // Get the latest incomplete timer session for a specific task
  const getLatestIncompleteSession = useCallback(async (taskId: string) => {
    try {
      // Check if database is initialized
      if (!db || !db.timerSessions) {
        console.warn("TimerSessions table does not exist in database")
        return null
      }

      // Get all sessions for this task
      const sessions = await db.timerSessions.where("taskId").equals(taskId).toArray()

      // Filter for incomplete sessions (less than 100% complete)
      const incompleteSessions = sessions.filter((session) => session.completionValue < 0.99)

      // Sort by date and time (most recent first)
      incompleteSessions.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      })

      // Return the most recent incomplete session
      return incompleteSessions.length > 0 ? incompleteSessions[0] : null
    } catch (err) {
      console.error("Error getting latest incomplete session:", err)
      return null
    }
  }, [])

  return [optimisticTimerSessions, addTimerSession, updateTimerSession, getLatestIncompleteSession, isLoading, error]
}

// Hook for today's check-ins
export function useTodayCheckIns() {
  const isDbInitialized = useDbInitialization()
  const today = new Date().toISOString().split("T")[0]
  const todayCheckIns = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.checkIns) {
        console.warn("CheckIns table does not exist in database")
        return []
      }
      return await db.checkIns.where("date").equals(today).toArray()
    } catch (err) {
      console.error("Error fetching today's check-ins:", err)
      return []
    }
  }, [isDbInitialized])
  return todayCheckIns || []
}

// Hook for today's task completions
export function useTodayTaskCompletions() {
  const isDbInitialized = useDbInitialization()
  const today = new Date().toISOString().split("T")[0]
  const todayCompletions = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.taskCompletions) {
        console.warn("TaskCompletions table does not exist in database")
        return []
      }
      return await db.taskCompletions.where("date").equals(today).toArray()
    } catch (err) {
      console.error("Error fetching today's task completions:", err)
      return []
    }
  }, [isDbInitialized])
  return todayCompletions || []
}

// Hook for today's timer sessions
export function useTodayTimerSessions() {
  const isDbInitialized = useDbInitialization()
  const today = new Date().toISOString().split("T")[0]
  const todaySessions = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.timerSessions) {
        console.warn("TimerSessions table does not exist in database")
        return []
      }
      return await db.timerSessions.where("date").equals(today).toArray()
    } catch (err) {
      console.error("Error fetching today's timer sessions:", err)
      return []
    }
  }, [isDbInitialized])
  return todaySessions || []
}

// Hook for tasks with task board functionality
export function useTaskBoard() {
  const isDbInitialized = useDbInitialization()
  const tasks = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.tasks) {
        console.warn("Tasks table does not exist in database")
        return []
      }
      return await db.tasks.toArray()
    } catch (err) {
      console.error("Error fetching tasks:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticTasks, setOptimisticTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update optimistic tasks when the actual tasks change
  useEffect(() => {
    if (tasks) {
      setOptimisticTasks(tasks)
    }
  }, [tasks])

  // Move a task to a different status
  const moveTask = useCallback(
    async (taskId: string, newStatus: string) => {
      try {
        // Check if database is initialized
        if (!db || !db.tasks) {
          throw new Error("Tasks table does not exist in database")
        }

        const task = await db.tasks.get(taskId)
        if (!task) {
          throw new Error("Task not found")
        }

        const updates: Partial<Task> = { status: newStatus as TaskStatus }

        // If moving to started, set startedAt
        if (newStatus === "started" && !task.startedAt) {
          updates.startedAt = new Date().toISOString()
        }

        // If moving to completed, set completedAt
        if (newStatus === "completed" && !task.completedAt) {
          updates.completedAt = new Date().toISOString()
        }

        // If the newStatus is actually a segment ID (for drag and drop)
        if (newStatus.startsWith("segment-")) {
          const segmentId = newStatus.replace("segment-", "")
          updates.preferredSegment = segmentId
          // Don't change the status in this case
          delete updates.status
        }

        await db.tasks.update(taskId, updates)

        // If completing a task, create a task entry
        if (newStatus === "completed" && task.status !== "completed") {
          const today = new Date().toISOString().split("T")[0]
          const now = new Date().toISOString()

          // Get current segment
          const segments = await db.segments.toArray()
          const currentHour = new Date().getHours()
          const currentMinute = new Date().getMinutes()
          const currentTimeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

          let currentSegment = segments[0]
          for (let i = segments.length - 1; i >= 0; i--) {
            if (segments[i].startTime <= currentTimeString) {
              currentSegment = segments[i]
              break
            }
          }

          // Add task completion
          await db.taskCompletions.add({
            id: Date.now().toString(),
            taskId,
            date: today,
            time: now,
            segmentId: currentSegment.id,
            segmentName: currentSegment.name,
            completionValue: 1.0,
          })
        }

        // Optimize: Update our state immediately instead of waiting for refresh
        setOptimisticTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)))
      } catch (error) {
        console.error("Error moving task:", error)
        throw error
      }
    },
    [optimisticTasks, setOptimisticTasks],
  )

  // Add a tally increment to a task
  const addTallyIncrement = useCallback(
    async (taskId: string) => {
      try {
        // Check if database is initialized
        if (!db || !db.tasks || !db.taskCompletions) {
          throw new Error("Database tables do not exist")
        }

        // Find the task
        const taskIndex = optimisticTasks.findIndex((t) => t.id === taskId)
        if (taskIndex === -1) {
          throw new Error(`Task with ID ${taskId} not found`)
        }

        const task = optimisticTasks[taskIndex]
        if (task.type !== "tally") {
          throw new Error(`Task with ID ${taskId} is not a tally task`)
        }

        const now = new Date().toISOString()
        const tallyTimestamps = [...(task.tallyTimestamps || [])]
        tallyTimestamps.push(now)

        // Update optimistic tasks immediately
        const updatedTask = {
          ...task,
          tallyTimestamps,
          status: "started", // At least started if not already
          startedAt: task.startedAt || now,
        }

        const updatedTasks = [...optimisticTasks]
        updatedTasks[taskIndex] = updatedTask
        setOptimisticTasks(updatedTasks)

        setIsLoading(true)
        setError(null)

        // Update the database
        await db.tasks.update(taskId, {
          tallyTimestamps,
          status: "started",
          startedAt: task.startedAt || now,
        })

        // Add a task completion record for the tally
        const today = new Date().toISOString().split("T")[0]

        // Get current segment
        const currentHour = new Date().getHours()
        const currentMinute = new Date().getMinutes()
        const currentTimeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

        // Find current segment (simplified version)
        const segments = await db.segments.toArray()
        let currentSegment = segments[0]

        for (let i = segments.length - 1; i >= 0; i--) {
          if (segments[i].startTime <= currentTimeString) {
            currentSegment = segments[i]
            break
          }
        }

        // Add task completion
        await db.taskCompletions.add({
          id: Date.now().toString(),
          taskId,
          date: today,
          time: now,
          segmentId: currentSegment.id,
          segmentName: currentSegment.name,
          completionValue: 1.0,
        })
      } catch (err) {
        console.error("Error adding tally increment:", err)
        setError(err)

        // Revert to the previous tasks on error
        if (tasks) {
          setOptimisticTasks(tasks)
        }

        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [optimisticTasks, tasks],
  )

  return [
    optimisticTasks.filter((t) => t.status === "todo"),
    optimisticTasks.filter((t) => t.status === "started"),
    optimisticTasks.filter((t) => t.status === "completed"),
    moveTask,
    addTallyIncrement,
    isLoading,
    error,
  ]
}

// Hook for categories with optimistic updates
export function useCategories() {
  const isDbInitialized = useDbInitialization()
  const categories = useLiveQuery(async () => {
    try {
      // Check if database is initialized
      if (!db || !db.categories) {
        console.warn("Categories table does not exist in database")
        return []
      }
      return await db.categories.toArray()
    } catch (err) {
      console.error("Error fetching categories:", err)
      return []
    }
  }, [isDbInitialized])

  const [optimisticCategories, setOptimisticCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Update optimistic categories when the actual categories change
  useEffect(() => {
    if (categories) {
      setOptimisticCategories(categories)
      setIsLoading(false)
    }
  }, [categories])

  const addCategory = useCallback(async (categoryData: Omit<Category, "id" | "createdAt">) => {
    try {
      // Check if database is initialized
      if (!db || !db.categories) {
        throw new Error("Categories table does not exist in database")
      }

      const id = `category-${uuidv4()}`
      const newCategory: Category = {
        ...categoryData,
        id,
        createdAt: new Date().toISOString(),
      }
      await db.categories.add(newCategory)
      return { success: true, id }
    } catch (err) {
      setError(`Failed to add category: ${(err as Error).message}`)
      return { success: false, error: err }
    }
  }, [])

  const updateCategory = useCallback(async (id: string, categoryData: Partial<Category>) => {
    try {
      // Check if database is initialized
      if (!db || !db.categories) {
        throw new Error("Categories table does not exist in database")
      }

      await db.categories.update(id, categoryData)
      return { success: true }
    } catch (err) {
      setError(`Failed to update category: ${(err as Error).message}`)
      return { success: false, error: err }
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      // Check if database is initialized
      if (!db || !db.categories || !db.tasks) {
        throw new Error("Database tables do not exist")
      }

      // First, update all tasks that use this category to have no category
      await db.tasks.where("categoryId").equals(id).modify({ categoryId: undefined })

      // Then delete the category
      await db.categories.delete(id)
      return { success: true }
    } catch (err) {
      setError(`Failed to delete category: ${(err as Error).message}`)
      return { success: false, error: err }
    }
  }, [])

  const getCategoryById = useCallback(async (id: string) => {
    try {
      // Check if database is initialized
      if (!db || !db.categories) {
        console.warn("Categories table does not exist in database")
        return null
      }
      return await db.categories.get(id)
    } catch (err) {
      setError(`Failed to get category: ${(err as Error).message}`)
      return null
    }
  }, [])

  const getTaskCountByCategory = useCallback(async (categoryId: string) => {
    try {
      // Check if database is initialized
      if (!db || !db.tasks) {
        console.warn("Tasks table does not exist in database")
        return 0
      }
      return await db.tasks.where("categoryId").equals(categoryId).count()
    } catch (err) {
      setError(`Failed to get task count: ${(err as Error).message}`)
      return 0
    }
  }, [])

  return {
    categories: categories || [],
    isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getTaskCountByCategory,
  }
}
