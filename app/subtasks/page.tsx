"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ListChecks, Plus, Filter, ArrowUpDown, HelpCircle, Edit } from "lucide-react"
import { db, type Task } from "@/lib/db"
import { SubtaskList } from "@/components/subtask-list"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskDialog } from "@/components/task-dialog"
import { TaskHelpTooltip } from "@/components/task-help-tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SubtasksPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [sortBy, setSortBy] = useState<"name" | "progress" | "created" | "updated">("created")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showHelp, setShowHelp] = useState(true)

  // Load tasks with subtasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true)
        const allTasks = await db.tasks.where("hasSubtasks").equals(true).toArray()

        setTasks(allTasks)
      } catch (error) {
        console.error("Error loading tasks with subtasks:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks with subtasks",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTasks()
  }, [toast])

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true
    if (filter === "active") return task.status !== "completed"
    if (filter === "completed") return task.status === "completed"
    return true
  })

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "progress":
        const progressA = a.subtaskCount > 0 ? a.completedSubtaskCount / a.subtaskCount : 0
        const progressB = b.subtaskCount > 0 ? b.completedSubtaskCount / b.subtaskCount : 0
        comparison = progressA - progressB
        break
      case "created":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case "updated":
        // Use completedAt or startedAt as "updated" time
        const updatedAtA = a.completedAt || a.startedAt || a.createdAt
        const updatedAtB = b.completedAt || b.startedAt || b.createdAt
        comparison = new Date(updatedAtA).getTime() - new Date(updatedAtB).getTime()
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  const handleAddTask = () => {
    setEditingTask(null)
    setTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  const handleSaveTask = async (task: Task) => {
    try {
      if (editingTask) {
        // Update existing task
        await db.tasks.update(task.id, task)
        setTasks(tasks.map((t) => (t.id === task.id ? task : t)))

        toast({
          title: "Task updated",
          description: `"${task.name}" has been updated.`,
        })
      } else {
        // Add new task
        const id = await db.tasks.add(task)
        const newTask = { ...task, id: id as string }
        setTasks([...tasks, newTask])

        toast({
          title: "Task added",
          description: `"${task.name}" has been added to your tasks.`,
        })
      }
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: "Failed to save task",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Delete all subtasks first
      await db.subtasks.where("taskId").equals(taskId).delete()

      // Then delete the task
      await db.tasks.delete(taskId)

      setTasks(tasks.filter((task) => task.id !== taskId))

      toast({
        title: "Task deleted",
        description: "The task and all its subtasks have been deleted.",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  // Add keyboard shortcuts for common actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N to add a new task
      if (e.altKey && e.key === "n") {
        e.preventDefault()
        handleAddTask()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Subtasks</h1>
          <p className="text-muted-foreground">Loading subtasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Subtasks</h1>
            <p className="text-muted-foreground">Manage tasks with subtasks and track your progress.</p>
          </div>
          <TaskHelpTooltip />
        </div>

        {showHelp && (
          <Alert className="bg-blue-50 border-blue-200">
            <HelpCircle className="h-4 w-4" />
            <AlertTitle>How to edit tasks</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>There are multiple ways to edit your tasks:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Click the pencil icon next to a task name for quick editing</li>
                <li>Click the "Edit" button on a task card to open the full editor</li>
                <li>Use the three dots menu for more options</li>
              </ul>
              <Button variant="outline" size="sm" className="self-end mt-2" onClick={() => setShowHelp(false)}>
                Got it
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Select value={filter} onValueChange={(value: "all" | "active" | "completed") => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="active">Active Tasks</SelectItem>
                <SelectItem value="completed">Completed Tasks</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  {sortDirection === "asc" ? " (A-Z)" : " (Z-A)"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("progress")}>
                  Progress {sortBy === "progress" && (sortDirection === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created")}>
                  Created Date {sortBy === "created" && (sortDirection === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("updated")}>
                  Last Updated {sortBy === "updated" && (sortDirection === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleSortDirection}>
                  {sortDirection === "asc" ? "Sort Descending" : "Sort Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button onClick={handleAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task with Subtasks
          </Button>
        </div>

        {sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks with subtasks</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create a task with subtasks to break down complex work into manageable steps.
              </p>
              <Button onClick={handleAddTask}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task with Subtasks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedTasks.map((task) => {
              const progress =
                task.subtaskCount > 0 ? Math.round((task.completedSubtaskCount / task.subtaskCount) * 100) : 0

              return (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{task.name}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <CardDescription>{task.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">
                          {task.completedSubtaskCount} of {task.subtaskCount} completed
                        </span>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="border rounded-md p-3">
                      <h4 className="text-sm font-medium mb-2">Subtasks</h4>
                      <SubtaskList taskId={task.id} />
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => handleDeleteTask(task.id)}>
                        Delete
                      </Button>

                      {task.status === "completed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await db.tasks.update(task.id, {
                              status: "todo",
                              completedAt: null,
                            })
                            setTasks(
                              tasks.map((t) => (t.id === task.id ? { ...t, status: "todo", completedAt: null } : t)),
                            )
                          }}
                        >
                          Reopen Task
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const now = new Date().toISOString()
                            await db.tasks.update(task.id, {
                              status: "completed",
                              completedAt: now,
                            })
                            setTasks(
                              tasks.map((t) =>
                                t.id === task.id ? { ...t, status: "completed", completedAt: now } : t,
                              ),
                            )
                          }}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} task={editingTask} onSave={handleSaveTask} />
    </div>
  )
}
