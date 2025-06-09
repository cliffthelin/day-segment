"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Pencil } from "lucide-react"

export function TaskEditingExample() {
  const [isEditing, setIsEditing] = useState(false)
  const [taskName, setTaskName] = useState("Complete project report")
  const [editedName, setEditedName] = useState(taskName)

  const handleStartEditing = () => {
    setIsEditing(true)
    setEditedName(taskName)
  }

  const handleSave = () => {
    if (editedName.trim()) {
      setTaskName(editedName)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <div className="space-y-3">
      <Card className="p-3 border">
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <span className="font-medium">{taskName}</span>
            <Button variant="ghost" size="sm" onClick={handleStartEditing} className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit task</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} autoFocus />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSave} disabled={!editedName.trim()}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">
        {!isEditing ? "Click the pencil icon to edit the task" : "Edit the task name and click Save"}
      </p>
    </div>
  )
}
