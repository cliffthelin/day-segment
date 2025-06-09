"use client"

import { useState, useCallback } from "react"
import { db, type Task } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { TaskDialog } from "@/components/task-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Library, Import, ImportIcon as Export, FileText, ListTodo, Settings } from "lucide-react"
import { SimpleTaskCreator } from "@/components/simple-task-creator"
import { PrebuiltTaskLibrary } from "@/components/prebuilt-task-library"
import { TaskExportDialog } from "@/components/task-export-dialog"
import { TaskImportDialog } from "@/components/task-import-dialog"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionTaskList } from "@/components/collection-task-list"

export default function TasksPage() {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState("my-tasks")
  const router = useRouter()
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isSimpleCreatorOpen, setIsSimpleCreatorOpen] = useState(false)

  // Fetch data with useLiveQuery
  const tasks = useLiveQuery(() => db.tasks.toArray()) || []
  const segments = useLiveQuery(() => db.segments.toArray()) || []
  const collections = useLiveQuery(() => db.collections.toArray()) || []

  const handleOpenTaskDialog = useCallback((task?: Task) => {
    if (task) {
      setSelectedTask(task)
    } else {
      setSelectedTask(null)
    }
    setIsTaskDialogOpen(true)
  }, [])

  const handleCloseTaskDialog = useCallback(() => {
    setIsTaskDialogOpen(false)
    setSelectedTask(null)
  }, [])

  // Task operations
  const handleEditTask = useCallback(async (updatedTask: any) => {
    try {
      await db.tasks.update(updatedTask.id, updatedTask)
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }, [])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await db.tasks.delete(taskId)
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }, [])

  const handleArchiveTask = useCallback(async (taskId: string) => {
    try {
      await db.tasks.update(taskId, { isArchived: true })
    } catch (error) {
      console.error("Error archiving task:", error)
    }
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button size="sm" onClick={() => handleOpenTaskDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="my-tasks" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="my-tasks" className="flex items-center gap-1">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">My Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-1">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Task Library</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Tools</span>
          </TabsTrigger>
        </TabsList>

        {/* My Tasks Tab */}
        <TabsContent value="my-tasks" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>My Tasks</CardTitle>
                  <CardDescription>Manage and organize your tasks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CollectionTaskList
                tasks={tasks}
                segments={segments}
                collections={collections}
                onTaskClick={handleOpenTaskDialog}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onArchiveTask={handleArchiveTask}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Library Tab */}
        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Library</CardTitle>
              <CardDescription>Browse and add pre-built tasks to your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <PrebuiltTaskLibrary open={activeTab === "library"} onOpenChange={() => {}} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Task Templates</CardTitle>
                  <CardDescription>Manage your task templates</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/templates")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Templates
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Templates help you quickly create tasks with predefined settings and subtasks. Visit the templates page
                to create and manage your templates.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => router.push("/templates")}>Go to Templates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Management Tools</CardTitle>
              <CardDescription>Import, export, and manage your tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Import Tasks</CardTitle>
                    <CardDescription>Import tasks from a file</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Import tasks from JSON, CSV, or other task tracking apps.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => setIsImportDialogOpen(true)}>
                      <Import className="mr-2 h-4 w-4" />
                      Import Tasks
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Export Tasks</CardTitle>
                    <CardDescription>Export your tasks to a file</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export your tasks to JSON or CSV format for backup or sharing.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => setIsExportDialogOpen(true)}>
                      <Export className="mr-2 h-4 w-4" />
                      Export Tasks
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Collections</CardTitle>
                  <CardDescription>Organize tasks into collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Collections help you organize related tasks together. Create and manage your collections.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/collections")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Collections
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={selectedTask}
        onClose={handleCloseTaskDialog}
      />

      <TaskImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />

      <TaskExportDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} />

      <SimpleTaskCreator open={isSimpleCreatorOpen} onOpenChange={setIsSimpleCreatorOpen} />
    </div>
  )
}
