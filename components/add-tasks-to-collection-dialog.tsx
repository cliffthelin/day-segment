"use client"

import { useState, useEffect } from "react"
import { Check, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useCollectionTasks } from "@/hooks/use-collections"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import type { Task } from "@/types"

interface AddTasksToCollectionDialogProps {
  isOpen: boolean
  onClose: () => void
  collectionId: string
  collectionName: string
}

export function AddTasksToCollectionDialog({
  isOpen,
  onClose,
  collectionId,
  collectionName,
}: AddTasksToCollectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { addTaskToCollection } = useCollectionTasks(collectionId)
  const { toast } = useToast()

  // Get all tasks
  const allTasks = useLiveQuery(() => db.tasks.toArray()) || []

  // Get all categories for displaying category names
  const categories = useLiveQuery(() => db.categories.toArray()) || []

  // Get tasks already in the collection
  const tasksInCollection =
    useLiveQuery(() =>
      db.taskCollections
        .where("collectionId")
        .equals(collectionId)
        .toArray()
        .then((taskCollections) => taskCollections.map((tc) => tc.taskId)),
    ) || []

  // Filter available tasks (not already in the collection)
  useEffect(() => {
    if (allTasks.length > 0 && tasksInCollection) {
      const filtered = allTasks.filter((task) => !tasksInCollection.includes(task.id))

      // Apply search filter if there's a query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchFiltered = filtered.filter(
          (task) =>
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query)),
        )
        setAvailableTasks(searchFiltered)
      } else {
        setAvailableTasks(filtered)
      }
    }
  }, [allTasks, tasksInCollection, searchQuery])

  // Reset selected tasks when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTasks([])
      setSearchQuery("")
    }
  }, [isOpen])

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId)
      } else {
        return [...prev, taskId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedTasks.length === availableTasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(availableTasks.map((task) => task.id))
    }
  }

  const handleAddTasks = async () => {
    if (selectedTasks.length === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select at least one task to add to the collection.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Add each selected task to the collection
      for (const taskId of selectedTasks) {
        await addTaskToCollection(taskId)
      }

      toast({
        title: "Tasks added",
        description: `${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"} added to "${collectionName}"`,
      })
      onClose()
    } catch (error) {
      console.error("Error adding tasks to collection:", error)
      toast({
        title: "Error",
        description: "There was an error adding tasks to the collection",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get category name by ID
  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return ""
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : ""
  }

  // Get category color by ID
  const getCategoryColor = (categoryId?: string): string => {
    if (!categoryId) return ""
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.color : ""
  }

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "todo":
        return "bg-slate-500"
      case "started":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      default:
        return "bg-slate-500"
    }
  }

  // Get priority badge color
  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-slate-500"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Tasks to Collection</DialogTitle>
          <DialogDescription>Select tasks to add to the "{collectionName}" collection.</DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">
            {availableTasks.length} task{availableTasks.length !== 1 ? "s" : ""} available
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedTasks.length > 0 && selectedTasks.length === availableTasks.length}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all">Select All</Label>
          </div>
        </div>

        <ScrollArea className="flex-1 border rounded-md">
          {availableTasks.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "No tasks match your search" : "No tasks available to add"}
            </div>
          ) : (
            <div className="p-4">
              {availableTasks.map((task) => (
                <div key={task.id} className="mb-4 last:mb-0">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => handleSelectTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={`task-${task.id}`} className="font-medium cursor-pointer hover:text-primary">
                        {task.name}
                      </Label>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${getStatusColor(task.status)}`}></span>
                          {task.status === "todo" ? "To Do" : task.status === "started" ? "In Progress" : "Completed"}
                        </Badge>

                        {task.priority && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`}></span>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        )}

                        {task.categoryId && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: getCategoryColor(task.categoryId) }}
                            ></span>
                            {getCategoryName(task.categoryId)}
                          </Badge>
                        )}

                        {task.type && task.type !== "standard" && (
                          <Badge variant="secondary">{task.type === "tally" ? "Tally" : "Subtasks"}</Badge>
                        )}

                        {task.dueDate && (
                          <Badge variant="secondary">Due: {new Date(task.dueDate).toLocaleDateString()}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm">
              {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} selected
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddTasks} disabled={selectedTasks.length === 0 || isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Add to Collection
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
