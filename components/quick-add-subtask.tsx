"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

interface QuickAddSubtaskProps {
  taskId: string
  onSubtaskAdded?: (subtask: any) => void
}

export function QuickAddSubtask({ taskId, onSubtaskAdded }: QuickAddSubtaskProps) {
  const [subtaskName, setSubtaskName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleAddSubtask = async () => {
    if (!subtaskName.trim()) return

    try {
      // Get current subtasks count for order
      const existingSubtasks = await db.subtasks.where("taskId").equals(taskId).toArray()
      const order = existingSubtasks.length

      // Create new subtask
      const newSubtask = {
        taskId,
        name: subtaskName.trim(),
        isCompleted: false,
        createdAt: new Date().toISOString(),
        order,
      }

      // Add to database
      const id = await db.subtasks.add(newSubtask)

      // Update task's subtask counts
      const task = await db.tasks.get(taskId)
      if (task) {
        await db.tasks.update(taskId, {
          subtaskCount: (task.subtaskCount || 0) + 1,
        })
      }

      // Clear input
      setSubtaskName("")

      // Focus back on input for continuous adding
      if (inputRef.current) {
        inputRef.current.focus()
      }

      // Notify parent component
      if (onSubtaskAdded) {
        onSubtaskAdded({ ...newSubtask, id })
      }
    } catch (error) {
      console.error("Error adding subtask:", error)
      toast({
        title: "Error",
        description: "Failed to add subtask",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <Input
        ref={inputRef}
        value={subtaskName}
        onChange={(e) => setSubtaskName(e.target.value)}
        placeholder="Add a new subtask..."
        className="flex-grow"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            handleAddSubtask()
          }
        }}
      />
      <Button onClick={handleAddSubtask} disabled={!subtaskName.trim()} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </div>
  )
}
