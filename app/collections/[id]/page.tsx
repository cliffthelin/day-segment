"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Folder,
  Calendar,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  Clock,
  ListPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useCollections, useCollectionTasks } from "@/hooks/use-collections"
import { TaskDialog } from "@/components/task-dialog"
import { TaskCard } from "@/components/task-card"
import { CollectionFormDialog } from "@/components/collection-form-dialog"
import { AddTasksToCollectionDialog } from "@/components/add-tasks-to-collection-dialog"
import { CollectionFilter } from "@/components/collection-filter"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import type { Task } from "@/types"

export default function CollectionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { getCollectionById, updateCollection, deleteCollection } = useCollections()
  const { tasks, isLoading: isTasksLoading, addTaskToCollection, removeTaskFromCollection } = useCollectionTasks(id)
  const [collection, setCollection] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isEditCollectionDialogOpen, setIsEditCollectionDialogOpen] = useState(false)
  const [isAddTasksDialogOpen, setIsAddTasksDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [displayedTasks, setDisplayedTasks] = useState<Task[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Get all segments for task cards
  const segments = useLiveQuery(() => db.segments.toArray()) || []

  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const collectionData = await getCollectionById(id)
        if (collectionData) {
          setCollection(collectionData)
        } else {
          toast({
            title: "Collection not found",
            description: "The requested collection could not be found",
            variant: "destructive",
          })
          router.push("/collections")
        }
      } catch (error) {
        console.error("Error fetching collection:", error)
        toast({
          title: "Error",
          description: "There was an error loading the collection",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollection()
  }, [id, getCollectionById, router, toast])

  // Filter tasks based on active tab
  useEffect(() => {
    if (!tasks) return

    if (activeTab === "all") {
      setFilteredTasks(tasks)
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === activeTab))
    }
  }, [tasks, activeTab])

  // Initialize displayed tasks when filtered tasks change
  useEffect(() => {
    if (filteredTasks.length > 0) {
      setDisplayedTasks(filteredTasks)
    } else {
      setDisplayedTasks([])
    }
  }, [filteredTasks])

  const handleDeleteCollection = async () => {
    try {
      const result = await deleteCollection(id)

      if (result.success) {
        toast({
          title: "Collection deleted",
          description: "Your collection has been deleted successfully",
        })
        router.push("/collections")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete collection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting collection:", error)
      toast({
        title: "Error",
        description: "There was an error deleting your collection",
        variant: "destructive",
      })
    }
  }

  const handleTaskCreated = async (taskId: number) => {
    try {
      // Add the newly created task to this collection
      await addTaskToCollection(taskId.toString())

      toast({
        title: "Task added",
        description: "Task has been added to the collection",
      })
    } catch (error) {
      console.error("Error adding task to collection:", error)
      toast({
        title: "Error",
        description: "There was an error adding the task to the collection",
        variant: "destructive",
      })
    }
  }

  const handleTaskUpdated = (task: Task) => {
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully",
    })
  }

  const handleRemoveTask = async (taskId: string) => {
    try {
      const result = await removeTaskFromCollection(taskId)

      if (result.success) {
        toast({
          title: "Task removed",
          description: "Task has been removed from the collection",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove task from collection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing task from collection:", error)
      toast({
        title: "Error",
        description: "There was an error removing the task from the collection",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      // First remove from collection
      await removeTaskFromCollection(taskId)

      // Then delete the task
      await db.tasks.delete(taskId)

      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "There was an error deleting your task",
        variant: "destructive",
      })
    }
  }

  const handleMoveTask = async (taskId: string, newStatus: "todo" | "started" | "completed") => {
    try {
      const task = await db.tasks.get(taskId)
      if (!task) return

      const updates: any = { status: newStatus }

      // If moving to started, set startedAt
      if (newStatus === "started" && !task.startedAt) {
        updates.startedAt = new Date().toISOString()
      }

      // If moving to completed, set completedAt
      if (newStatus === "completed" && !task.completedAt) {
        updates.completedAt = new Date().toISOString()
      }

      await db.tasks.update(taskId, updates)

      toast({
        title: "Task updated",
        description: `Task moved to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error moving task:", error)
      toast({
        title: "Error",
        description: "There was an error updating your task",
        variant: "destructive",
      })
    }
  }

  const handleCollectionUpdated = async () => {
    try {
      const updatedCollection = await getCollectionById(id)
      if (updatedCollection) {
        setCollection(updatedCollection)
      }
    } catch (error) {
      console.error("Error refreshing collection:", error)
    }
  }

  // Memoize the filter change handler to prevent recreating on every render
  const handleFilteredTasksChange = useCallback((tasks: Task[]) => {
    setDisplayedTasks(tasks)
  }, [])

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "folder":
        return <Folder className="h-5 w-5" />
      case "calendar":
        return <Calendar className="h-5 w-5" />
      case "star":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-star"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      case "heart":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-heart"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        )
      case "home":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-home"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        )
      case "briefcase":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-briefcase"
          >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        )
      case "book":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-book"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        )
      case "settings":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-settings"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )
      default:
        return <Folder className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-6 w-64 mb-4" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Collection not found</h1>
        <p>The requested collection could not be found.</p>
        <Button className="mt-4" onClick={() => router.push("/collections")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/collections")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md" style={{ backgroundColor: collection.color || "#3b82f6", color: "white" }}>
              {getIconComponent(collection.icon || "folder")}
            </div>
            <h1 className="text-3xl font-bold">{collection.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsTaskDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
          <Button variant="outline" onClick={() => setIsAddTasksDialogOpen(true)}>
            <ListPlus className="mr-2 h-4 w-4" />
            Add Existing Tasks
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditCollectionDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {collection.description && <p className="text-muted-foreground mb-4">{collection.description}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline" className="flex items-center gap-1">
          {collection.isRecurring ? (
            <>
              <RefreshCw className="h-3 w-3" /> Recurring
            </>
          ) : (
            <>
              <Calendar className="h-3 w-3" /> One-time
            </>
          )}
        </Badge>
        <Badge variant="outline">{filteredTasks.length} tasks</Badge>
      </div>

      <div className="mb-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="todo">To Do</TabsTrigger>
              <TabsTrigger value="started">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </div>

          {/* Add the filter component */}
          <div className="mb-6">
            {filteredTasks.length > 0 && (
              <CollectionFilter
                tasks={filteredTasks}
                onFilteredTasksChange={handleFilteredTasksChange}
                initialSort="name-asc"
              />
            )}
          </div>

          <TabsContent value="all" className="mt-4">
            {isTasksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : displayedTasks.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                    <CheckCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No tasks in this collection</h3>
                    <p className="text-sm text-muted-foreground">Add your first task to get started</p>
                  </div>
                  <Button onClick={() => setIsTaskDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    segments={segments}
                    onEdit={handleTaskUpdated}
                    onDelete={handleDeleteTask}
                    onMove={handleMoveTask}
                    onTasksChanged={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="todo" className="mt-4">
            {isTasksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : displayedTasks.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                    <CheckCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No todo tasks</h3>
                    <p className="text-sm text-muted-foreground">
                      All caught up! Add more tasks or check another status.
                    </p>
                  </div>
                  <Button onClick={() => setIsTaskDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    segments={segments}
                    onEdit={handleTaskUpdated}
                    onDelete={handleDeleteTask}
                    onMove={handleMoveTask}
                    onTasksChanged={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="started" className="mt-4">
            {isTasksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : displayedTasks.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No tasks in progress</h3>
                    <p className="text-sm text-muted-foreground">Start working on a task to see it here.</p>
                  </div>
                  <Button onClick={() => setActiveTab("todo")}>View Todo Tasks</Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    segments={segments}
                    onEdit={handleTaskUpdated}
                    onDelete={handleDeleteTask}
                    onMove={handleMoveTask}
                    onTasksChanged={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {isTasksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : displayedTasks.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                    <CheckCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No completed tasks</h3>
                    <p className="text-sm text-muted-foreground">Complete tasks to see them here.</p>
                  </div>
                  <Button onClick={() => setActiveTab("todo")}>View Todo Tasks</Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    segments={segments}
                    onEdit={handleTaskUpdated}
                    onDelete={handleDeleteTask}
                    onMove={handleMoveTask}
                    onTasksChanged={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Edit Collection Dialog */}
      <CollectionFormDialog
        isOpen={isEditCollectionDialogOpen}
        onClose={() => setIsEditCollectionDialogOpen(false)}
        collection={collection}
        onSuccess={handleCollectionUpdated}
      />

      {/* Add Tasks to Collection Dialog */}
      <AddTasksToCollectionDialog
        isOpen={isAddTasksDialogOpen}
        onClose={() => setIsAddTasksDialogOpen(false)}
        collectionId={id}
        collectionName={collection.name}
      />

      {/* Delete Collection Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this collection? This action cannot be undone. Tasks in this collection
              will not be deleted, but they will be removed from this collection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCollection}>
              Delete Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
