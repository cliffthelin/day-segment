"use client"

import { useState } from "react"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, Clock, Timer, Bell, CheckCircle, ListChecks } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TaskType } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SimpleTaskCreatorProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface SubtaskData {
  name: string
  order: number
  type?: TaskType
  timerDuration?: number
  alarmTime?: string
}

export function SimpleTaskCreator({ open, onOpenChange }: SimpleTaskCreatorProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [taskName, setTaskName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [taskType, setTaskType] = useState<TaskType>("standard")
  const [subtasks, setSubtasks] = useState<SubtaskData[]>([{ name: "", order: 0 }])
  const [timerDuration, setTimerDuration] = useState(25) // Default 25 minutes
  const [alarmTime, setAlarmTime] = useState("")
  const [activeTab, setActiveTab] = useState("taskDetails")

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    if (onOpenChange) {
      onOpenChange(newOpen)
    }

    // Reset form when closing
    if (!newOpen) {
      setTaskName("")
      setTaskType("standard")
      setSubtasks([{ name: "", order: 0 }])
      setTimerDuration(25)
      setAlarmTime("")
      setActiveTab("taskDetails")
    }
  }

  const addSubtask = () => {
    setSubtasks([...subtasks, { name: "", order: subtasks.length }])
  }

  const removeSubtask = (index: number) => {
    const newSubtasks = [...subtasks]
    newSubtasks.splice(index, 1)
    // Update order values
    newSubtasks.forEach((subtask, idx) => {
      subtask.order = idx
    })
    setSubtasks(newSubtasks)
  }

  const updateSubtaskName = (index: number, name: string) => {
    const newSubtasks = [...subtasks]
    newSubtasks[index].name = name
    setSubtasks(newSubtasks)
  }

  const updateSubtaskType = (index: number, type: TaskType) => {
    const newSubtasks = [...subtasks]
    newSubtasks[index].type = type
    setSubtasks(newSubtasks)
  }

  const updateSubtaskTimerDuration = (index: number, duration: number) => {
    const newSubtasks = [...subtasks]
    newSubtasks[index].timerDuration = duration
    setSubtasks(newSubtasks)
  }

  const updateSubtaskAlarmTime = (index: number, time: string) => {
    const newSubtasks = [...subtasks]
    newSubtasks[index].alarmTime = time
    setSubtasks(newSubtasks)
  }

  const createTask = async () => {
    if (!taskName.trim()) return

    setIsLoading(true)
    try {
      const now = new Date().toISOString()
      const taskId = Date.now().toString()

      // Create the main task
      await db.tasks.add({
        id: taskId,
        name: taskName.trim(),
        status: "todo",
        createdAt: now,
        isRecurring: true,
        type: taskType,
        hasSubtasks: taskType === "subtasks",
        subtaskCount: taskType === "subtasks" ? subtasks.filter((s) => s.name.trim()).length : 0,
        completedSubtaskCount: 0,
        timerDuration: taskType === "timer" ? timerDuration : undefined,
        alarmTime: taskType === "alarm" ? alarmTime : undefined,
      })

      // Add subtasks if task type is "subtasks"
      if (taskType === "subtasks") {
        const validSubtasks = subtasks
          .filter((subtask) => subtask.name.trim())
          .map((subtask, index) => ({
            id: `${taskId}-subtask-${index}-${Date.now()}`,
            taskId: taskId,
            name: subtask.name.trim(),
            order: index,
            isCompleted: false,
            createdAt: now,
            type: subtask.type,
            timerDuration: subtask.type === "timer" ? subtask.timerDuration : undefined,
            alarmTime: subtask.type === "alarm" ? subtask.alarmTime : undefined,
          }))

        if (validSubtasks.length > 0) {
          await db.subtasks.bulkAdd(validSubtasks)
        }
      }

      setTaskName("")
      setSubtasks([{ name: "", order: 0 }])
      setTimerDuration(25)
      setAlarmTime("")
      // Keep the selected task type for convenience
      handleOpenChange(false)
    } catch (error) {
      console.error("Error creating task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const controlledOpen = open !== undefined ? open : isOpen

  const getTaskTypeIcon = (type: TaskType) => {
    switch (type) {
      case "standard":
        return <CheckCircle className="h-4 w-4" />
      case "tally":
        return <ListChecks className="h-4 w-4" />
      case "subtasks":
        return <ListChecks className="h-4 w-4" />
      case "stopwatch":
        return <Clock className="h-4 w-4" />
      case "timer":
        return <Timer className="h-4 w-4" />
      case "alarm":
        return <Bell className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={controlledOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Quickly add a new task to your list</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="taskDetails">Task Details</TabsTrigger>
            {taskType === "subtasks" && <TabsTrigger value="subtasks">Subtasks</TabsTrigger>}
          </TabsList>

          <TabsContent value="taskDetails" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">Task Name</Label>
              <Input
                id="taskName"
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Task Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={taskType === "standard" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 gap-2"
                  onClick={() => setTaskType("standard")}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Standard</span>
                </Button>
                <Button
                  type="button"
                  variant={taskType === "tally" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 gap-2"
                  onClick={() => setTaskType("tally")}
                >
                  <ListChecks className="h-5 w-5" />
                  <span>Tally</span>
                </Button>
                <Button
                  type="button"
                  variant={taskType === "subtasks" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 gap-2"
                  onClick={() => setTaskType("subtasks")}
                >
                  <ListChecks className="h-5 w-5" />
                  <span>Subtasks</span>
                </Button>
                <Button
                  type="button"
                  variant={taskType === "stopwatch" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 gap-2"
                  onClick={() => setTaskType("stopwatch")}
                >
                  <Clock className="h-5 w-5" />
                  <span>Stopwatch</span>
                </Button>
                <Button
                  type="button"
                  variant={taskType === "timer" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 gap-2"
                  onClick={() => setTaskType("timer")}
                >
                  <Timer className="h-5 w-5" />
                  <span>Timer</span>
                </Button>
                <Button
                  type="button"
                  variant={taskType === "alarm" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-20 gap-2"
                  onClick={() => setTaskType("alarm")}
                >
                  <Bell className="h-5 w-5" />
                  <span>Alarm</span>
                </Button>
              </div>
            </div>

            {taskType === "timer" && (
              <div className="space-y-2">
                <Label htmlFor="timerDuration">Timer Duration (minutes)</Label>
                <Input
                  id="timerDuration"
                  type="number"
                  min="1"
                  max="180"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Number.parseInt(e.target.value) || 25)}
                />
              </div>
            )}

            {taskType === "alarm" && (
              <div className="space-y-2">
                <Label htmlFor="alarmTime">Alarm Time</Label>
                <Input id="alarmTime" type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} />
              </div>
            )}

            {taskType === "subtasks" && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Go to the Subtasks tab to add and configure subtasks.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subtasks" className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Subtasks</Label>
                <Button variant="outline" size="sm" onClick={addSubtask} type="button">
                  <Plus className="h-4 w-4 mr-2" /> Add Subtask
                </Button>
              </div>

              {subtasks.map((subtask, index) => (
                <div key={index} className="space-y-2 border p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <Input
                      value={subtask.name}
                      onChange={(e) => updateSubtaskName(index, e.target.value)}
                      placeholder={`Subtask ${index + 1}`}
                      className="flex-grow"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubtask(index)}
                      disabled={subtasks.length === 1}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`subtask-type-${index}`} className="text-xs">
                        Type
                      </Label>
                      <Select
                        value={subtask.type || "standard"}
                        onValueChange={(value) => updateSubtaskType(index, value as TaskType)}
                      >
                        <SelectTrigger id={`subtask-type-${index}`} className="h-8">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="tally">Tally</SelectItem>
                          <SelectItem value="stopwatch">Stopwatch</SelectItem>
                          <SelectItem value="timer">Timer</SelectItem>
                          <SelectItem value="alarm">Alarm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {subtask.type === "timer" && (
                      <div>
                        <Label htmlFor={`subtask-timer-${index}`} className="text-xs">
                          Duration (min)
                        </Label>
                        <Input
                          id={`subtask-timer-${index}`}
                          type="number"
                          min="1"
                          max="180"
                          className="h-8"
                          value={subtask.timerDuration || 25}
                          onChange={(e) => updateSubtaskTimerDuration(index, Number.parseInt(e.target.value) || 25)}
                        />
                      </div>
                    )}

                    {subtask.type === "alarm" && (
                      <div>
                        <Label htmlFor={`subtask-alarm-${index}`} className="text-xs">
                          Alarm Time
                        </Label>
                        <Input
                          id={`subtask-alarm-${index}`}
                          type="time"
                          className="h-8"
                          value={subtask.alarmTime || ""}
                          onChange={(e) => updateSubtaskAlarmTime(index, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4">
          <Button onClick={createTask} disabled={isLoading || !taskName.trim()} className="w-full">
            {isLoading ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
