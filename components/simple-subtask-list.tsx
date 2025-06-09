"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface SimpleSubtaskListProps {
  taskId: string
}

export function SimpleSubtaskList({ taskId }: SimpleSubtaskListProps) {
  const subtasks = useLiveQuery(() => db.subtasks.where("taskId").equals(taskId).sortBy("order"))
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [subtaskName, setSubtaskName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Update the task's completed subtask count whenever subtasks change
    const updateCompletedCount = async () => {
      if (!subtasks) return

      const completedCount = subtasks.filter((subtask) => subtask.completed).length
      await db.tasks.update(taskId, {
        completedSubtaskCount: completedCount,
      })
    }

    updateCompletedCount()
  }, [subtasks, taskId])

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await db.subtasks.update(subtaskId, { completed })
    } catch (error) {
      console.error("Error toggling subtask:", error)
    }
  }

  const startEditing = (subtaskId: string, name: string) => {
    setEditingSubtaskId(subtaskId)
    setSubtaskName(name)
  }

  const saveSubtask = async () => {
    if (!editingSubtaskId || !subtaskName.trim()) return

    setIsLoading(true)
    try {
      await db.subtasks.update(editingSubtaskId, { name: subtaskName.trim() })
      setEditingSubtaskId(null)
    } catch (error) {
      console.error("Error updating subtask:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelEditing = () => {
    setEditingSubtaskId(null)
  }

  const deleteSubtask = async (subtaskId: string) => {
    try {
      await db.subtasks.delete(subtaskId)

      // Update the task's subtask count
      const remainingSubtasks = await db.subtasks.where("taskId").equals(taskId).count()
      await db.tasks.update(taskId, {
        subtaskCount: remainingSubtasks,
        hasSubtasks: remainingSubtasks > 0,
      })
    } catch (error) {
      console.error("Error deleting subtask:", error)
    }
  }

  if (!subtasks || subtasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-6">
          <p className="text-muted-foreground">No subtasks found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={`p-3 border rounded-lg ${
                editingSubtaskId === subtask.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
              }`}
            >
              {editingSubtaskId === subtask.id ? (
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={subtaskName}
                    onChange={(e) => setSubtaskName(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <Button onClick={saveSubtask} disabled={isLoading} variant="default" size="sm">
                      {isLoading ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={cancelEditing} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={(checked) => toggleSubtask(subtask.id, !!checked)}
                      id={`subtask-${subtask.id}`}
                    />
                    <label
                      htmlFor={`subtask-${subtask.id}`}
                      className={`${subtask.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {subtask.name}
                    </label>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditing(subtask.id, subtask.name)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSubtask(subtask.id)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
