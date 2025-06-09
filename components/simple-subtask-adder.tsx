"use client"

import { useState } from "react"
import { db } from "@/lib/db"
import type { Task } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface SimpleSubtaskAdderProps {
  task: Task
  onSubtaskAdded?: () => void
}

export function SimpleSubtaskAdder({ task, onSubtaskAdded }: SimpleSubtaskAdderProps) {
  const [subtaskName, setSubtaskName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const addSubtask = async () => {
    if (!subtaskName.trim()) return

    setIsLoading(true)
    try {
      const now = new Date().toISOString()
      const subtaskId = Date.now().toString()

      // Add the subtask
      await db.subtasks.add({
        id: subtaskId,
        taskId: task.id,
        name: subtaskName.trim(),
        completed: false,
        createdAt: now,
        order: (task.subtaskCount || 0) + 1,
      })

      // Update the task's subtask count
      await db.tasks.update(task.id, {
        hasSubtasks: true,
        subtaskCount: (task.subtaskCount || 0) + 1,
      })

      setSubtaskName("")
      if (onSubtaskAdded) onSubtaskAdded()
    } catch (error) {
      console.error("Error adding subtask:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && subtaskName.trim()) {
      addSubtask()
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Add a subtask to "{task.name}"</p>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={subtaskName}
                onChange={(e) => setSubtaskName(e.target.value)}
                placeholder="Enter subtask name"
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={addSubtask} disabled={isLoading || !subtaskName.trim()}>
                {isLoading ? "Adding..." : "Add Subtask"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Press Enter to quickly add multiple subtasks</p>
        </div>
      </CardContent>
    </Card>
  )
}
