"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function TaskCreationExample() {
  const [taskName, setTaskName] = useState("")
  const [taskType, setTaskType] = useState("standard")
  const [isCreated, setIsCreated] = useState(false)
  const [createdTask, setCreatedTask] = useState(null)

  const handleCreateTask = () => {
    if (!taskName.trim()) return

    const newTask = {
      id: Date.now().toString(),
      name: taskName,
      type: taskType,
      status: "todo",
      createdAt: new Date().toISOString(),
    }

    setCreatedTask(newTask)
    setIsCreated(true)
    setTaskName("")
  }

  const handleReset = () => {
    setIsCreated(false)
    setCreatedTask(null)
    setTaskName("")
    setTaskType("standard")
  }

  return (
    <div className="space-y-3">
      {!isCreated ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="example-task-name">Task Name</Label>
            <Input
              id="example-task-name"
              placeholder="Enter task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Task Type</Label>
            <RadioGroup value={taskType} onValueChange={setTaskType} className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="standard" id="example-standard" />
                <Label htmlFor="example-standard" className="text-sm">
                  Standard
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="tally" id="example-tally" />
                <Label htmlFor="example-tally" className="text-sm">
                  Tally
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="subtasks" id="example-subtasks" />
                <Label htmlFor="example-subtasks" className="text-sm">
                  Subtasks
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleCreateTask} disabled={!taskName.trim()} className="w-full">
            Create Task
          </Button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <p className="text-sm font-medium">Task Created Successfully!</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="font-medium">Name:</span> {createdTask.name}
              </p>
              <p>
                <span className="font-medium">Type:</span> {createdTask.type}
              </p>
              <p>
                <span className="font-medium">Status:</span> {createdTask.status}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
            Create Another Task
          </Button>
        </div>
      )}
    </div>
  )
}
