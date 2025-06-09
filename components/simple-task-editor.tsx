"use client"

import { useState } from "react"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskDialog } from "@/components/task-dialog"

interface SimpleTaskEditorProps {
  tasks: any[]
  onTaskUpdated: () => void
}

export function SimpleTaskEditor({ tasks, onTaskUpdated }: SimpleTaskEditorProps) {
  const [selectedTask, setSelectedTask] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  const handleSaveTask = async (updatedTask) => {
    setIsLoading(true)
    try {
      await db.tasks.update(updatedTask.id, updatedTask)
      onTaskUpdated()
    } catch (error) {
      console.error("Error updating task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Task to Edit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isDialogOpen && selectedTask ? (
            <div className="text-muted-foreground text-sm">Task editing is now available in the full task dialog.</div>
          ) : (
            <div className="text-muted-foreground text-sm">Click on a task from the list to edit it</div>
          )}

          <div className="space-y-2 mt-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedTask?.id === task.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                }`}
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{task.name}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {task.type || "standard"}
                  </span>
                </div>
                {task.description && !isDialogOpen && (
                  <div className="text-sm text-muted-foreground mt-2 line-clamp-1">
                    {task.description.substring(0, 60)}
                    {task.description.length > 60 ? "..." : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {selectedTask && (
        <TaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} task={selectedTask} onSave={handleSaveTask} />
      )}
    </Card>
  )
}
