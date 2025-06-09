"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, ListChecks } from "lucide-react"
import { TaskDialog } from "./task-dialog"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/db"

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleAddTask = () => {
    setIsOpen(false)
    setTaskDialogOpen(true)
  }

  const handleSaveTask = async (task) => {
    try {
      const id = await db.tasks.add(task)

      toast({
        title: "Task added",
        description: `"${task.name}" has been added to your tasks.`,
      })
    } catch (error) {
      console.error("Error adding task:", error)
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end space-y-2">
        {isOpen && (
          <div className="flex flex-col items-end space-y-2 mb-2">
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
              onClick={handleAddTask}
            >
              <ListChecks className="h-6 w-6" />
            </Button>
          </div>
        )}

        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>

      <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} task={null} onSave={handleSaveTask} />
    </>
  )
}
