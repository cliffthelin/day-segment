"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Clock, Timer, Bell, CheckCircle, ListChecks } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { TaskType } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface SubtaskListProps {
  parentId: string
  allowTypeSelection?: boolean
}

export function SubtaskList({ parentId, allowTypeSelection = false }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<any[]>([])
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()
  const [newSubtaskType, setNewSubtaskType] = useState<TaskType>("standard")
  const [newTimerDuration, setNewTimerDuration] = useState(25)
  const [newAlarmTime, setNewAlarmTime] = useState("")

  useEffect(() => {
    loadSubtasks()
  }, [parentId])

  const loadSubtasks = async () => {
    try {
      setIsLoading(true)
      const loadedSubtasks = await db.subtasks.where("taskId").equals(parentId).sortBy("order")
      setSubtasks(loadedSubtasks)
    } catch (error) {
      console.error("Error loading subtasks:", error)
      toast({
        title: "Error",
        description: "Failed to load subtasks",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSubtask = async () => {
    if (!newSubtaskName.trim()) return

    try {
      setIsAdding(true)
      const now = new Date().toISOString()
      const newSubtask = {
        id: `${parentId}-subtask-${Date.now()}`,
        taskId: parentId,
        name: newSubtaskName.trim(),
        isCompleted: false,
        createdAt: now,
        order: subtasks.length,
        type: newSubtaskType,
        timerDuration: newSubtaskType === "timer" ? newTimerDuration : undefined,
        alarmTime: newSubtaskType === "alarm" ? newAlarmTime : undefined,
      }

      await db.subtasks.add(newSubtask)

      // Update parent task subtask count
      const parentTask = await db.tasks.get(parentId)
      if (parentTask) {
        await db.tasks.update(parentId, {
          subtaskCount: (parentTask.subtaskCount || 0) + 1,
          hasSubtasks: true,
        })
      }

      setNewSubtaskName("")
      setNewSubtaskType("standard")
      setNewTimerDuration(25)
      setNewAlarmTime("")
      loadSubtasks()
    } catch (error) {
      console.error("Error adding subtask:", error)
      toast({
        title: "Error",
        description: "Failed to add subtask",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const toggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      const now = new Date().toISOString()
      await db.subtasks.update(subtaskId, {
        isCompleted,
        completedAt: isCompleted ? now : undefined,
      })

      // Update parent task completed subtask count
      const parentTask = await db.tasks.get(parentId)
      if (parentTask) {
        const completedCount = await db.subtasks
          .where("taskId")
          .equals(parentId)
          .and((subtask) => subtask.isCompleted)
          .count()

        await db.tasks.update(parentId, {
          completedSubtaskCount: completedCount,
        })
      }

      loadSubtasks()
    } catch (error) {
      console.error("Error toggling subtask:", error)
      toast({
        title: "Error",
        description: "Failed to update subtask",
        variant: "destructive",
      })
    }
  }

  const deleteSubtask = async (subtaskId: string) => {
    try {
      await db.subtasks.delete(subtaskId)

      // Update parent task subtask count
      const parentTask = await db.tasks.get(parentId)
      if (parentTask) {
        const remainingSubtasks = await db.subtasks.where("taskId").equals(parentId).count()
        const completedCount = await db.subtasks
          .where("taskId")
          .equals(parentId)
          .and((subtask) => subtask.isCompleted)
          .count()

        await db.tasks.update(parentId, {
          subtaskCount: remainingSubtasks,
          completedSubtaskCount: completedCount,
          hasSubtasks: remainingSubtasks > 0,
        })
      }

      loadSubtasks()
    } catch (error) {
      console.error("Error deleting subtask:", error)
      toast({
        title: "Error",
        description: "Failed to delete subtask",
        variant: "destructive",
      })
    }
  }

  const updateSubtaskType = async (subtaskId: string, type: TaskType) => {
    try {
      await db.subtasks.update(subtaskId, { type })
      loadSubtasks()
    } catch (error) {
      console.error("Error updating subtask type:", error)
      toast({
        title: "Error",
        description: "Failed to update subtask type",
        variant: "destructive",
      })
    }
  }

  const updateSubtaskTimerDuration = async (subtaskId: string, duration: number) => {
    try {
      await db.subtasks.update(subtaskId, { timerDuration: duration })
      loadSubtasks()
    } catch (error) {
      console.error("Error updating subtask timer duration:", error)
      toast({
        title: "Error",
        description: "Failed to update timer duration",
        variant: "destructive",
      })
    }
  }

  const updateSubtaskAlarmTime = async (subtaskId: string, time: string) => {
    try {
      await db.subtasks.update(subtaskId, { alarmTime: time })
      loadSubtasks()
    } catch (error) {
      console.error("Error updating subtask alarm time:", error)
      toast({
        title: "Error",
        description: "Failed to update alarm time",
        variant: "destructive",
      })
    }
  }

  const getTypeIcon = (type?: TaskType) => {
    switch (type) {
      case "standard":
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />
      case "tally":
        return <ListChecks className="h-4 w-4 text-muted-foreground" />
      case "stopwatch":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case "timer":
        return <Timer className="h-4 w-4 text-muted-foreground" />
      case "alarm":
        return <Bell className="h-4 w-4 text-muted-foreground" />
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="text-center py-4">Loading subtasks...</div>
      ) : subtasks.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No subtasks yet</div>
      ) : (
        subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-start gap-2 p-2 border rounded-md">
            <Checkbox
              checked={subtask.isCompleted}
              onCheckedChange={(checked) => toggleSubtask(subtask.id, checked === true)}
              className="mt-1"
            />
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                {getTypeIcon(subtask.type)}
                <span className={subtask.isCompleted ? "line-through text-muted-foreground" : ""}>{subtask.name}</span>
              </div>

              {subtask.type === "timer" && (
                <div className="text-xs text-muted-foreground mt-1">
                  Duration: {subtask.timerDuration || 25} minutes
                </div>
              )}

              {subtask.type === "alarm" && (
                <div className="text-xs text-muted-foreground mt-1">Alarm: {subtask.alarmTime || "Not set"}</div>
              )}
            </div>

            {allowTypeSelection && (
              <div className="flex items-center gap-2">
                <Select
                  value={subtask.type || "standard"}
                  onValueChange={(value) => updateSubtaskType(subtask.id, value as TaskType)}
                >
                  <SelectTrigger className="h-7 w-24">
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

                {subtask.type === "timer" && (
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    className="h-7 w-16"
                    value={subtask.timerDuration || 25}
                    onChange={(e) => updateSubtaskTimerDuration(subtask.id, Number.parseInt(e.target.value) || 25)}
                  />
                )}

                {subtask.type === "alarm" && (
                  <Input
                    type="time"
                    className="h-7 w-24"
                    value={subtask.alarmTime || ""}
                    onChange={(e) => updateSubtaskAlarmTime(subtask.id, e.target.value)}
                  />
                )}
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteSubtask(subtask.id)}
              className="h-7 w-7 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}

      <div className="pt-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              value={newSubtaskName}
              onChange={(e) => setNewSubtaskName(e.target.value)}
              placeholder="Add a new subtask"
              onKeyDown={(e) => e.key === "Enter" && addSubtask()}
            />
            <Button variant="outline" size="icon" onClick={addSubtask} disabled={isAdding || !newSubtaskName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {allowTypeSelection && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="new-subtask-type" className="text-xs">
                  Type
                </Label>
                <Select value={newSubtaskType} onValueChange={(value) => setNewSubtaskType(value as TaskType)}>
                  <SelectTrigger id="new-subtask-type">
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

              {newSubtaskType === "timer" && (
                <div>
                  <Label htmlFor="new-timer-duration" className="text-xs">
                    Duration (min)
                  </Label>
                  <Input
                    id="new-timer-duration"
                    type="number"
                    min="1"
                    max="180"
                    value={newTimerDuration}
                    onChange={(e) => setNewTimerDuration(Number.parseInt(e.target.value) || 25)}
                  />
                </div>
              )}

              {newSubtaskType === "alarm" && (
                <div>
                  <Label htmlFor="new-alarm-time" className="text-xs">
                    Alarm Time
                  </Label>
                  <Input
                    id="new-alarm-time"
                    type="time"
                    value={newAlarmTime}
                    onChange={(e) => setNewAlarmTime(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
