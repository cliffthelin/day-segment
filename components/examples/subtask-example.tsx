"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function SubtaskExample() {
  const [subtasks, setSubtasks] = useState([
    { id: "1", name: "Research topic", completed: false },
    { id: "2", name: "Create outline", completed: false },
  ])
  const [newSubtaskName, setNewSubtaskName] = useState("")

  const addSubtask = () => {
    if (!newSubtaskName.trim()) return

    setSubtasks([...subtasks, { id: Date.now().toString(), name: newSubtaskName, completed: false }])
    setNewSubtaskName("")
  }

  const toggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((subtask) => (subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask)),
    )
  }

  const completedCount = subtasks.filter((s) => s.completed).length
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Write Research Paper</span>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{subtasks.length} completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2 mb-3">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center space-x-2">
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={() => toggleSubtask(subtask.id)}
                id={`example-subtask-${subtask.id}`}
              />
              <label
                htmlFor={`example-subtask-${subtask.id}`}
                className={`text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {subtask.name}
              </label>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <Input
            placeholder="Add a subtask"
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && addSubtask()}
          />
          <Button size="sm" onClick={addSubtask} disabled={!newSubtaskName.trim()}>
            Add
          </Button>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">Add new subtasks and check them off to see progress update</p>
    </div>
  )
}
