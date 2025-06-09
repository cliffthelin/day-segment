"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task, TaskType } from "@/types"
import { db } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { CategorySelector } from "./category-selector"
import { CreateTemplateFromTask } from "./create-template-from-task"
import { TemplateSelector } from "./template-selector"
import { useTaskTemplates } from "@/hooks/use-task-templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubtaskList } from "./subtask-list"
import { TaskCollectionsSelector } from "./task-collections-selector"
import { Plus, Trash2, Clock, Timer, Bell, CheckCircle, ListChecks } from "lucide-react"

interface SubtaskData {
  name: string
  order: number
  type?: TaskType
  timerDuration?: number
  alarmTime?: string
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
  onClose,
  isEditing = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: any
  onSave?: (task: any) => void
  onClose?: () => void
  isEditing?: boolean
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<string>("medium")
  const [dueDate, setDueDate] = useState<string>("")
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<string>("manual")
  const [subtabActiveTab, setSubtabActiveTab] = useState<string>("details")
  const { createTaskFromTemplate } = useTaskTemplates()
  const { toast } = useToast()
  const [taskType, setTaskType] = useState<TaskType>("standard")
  const [subtasks, setSubtasks] = useState<SubtaskData[]>([{ name: "", order: 0 }])
  const [timerDuration, setTimerDuration] = useState(25) // Default 25 minutes
  const [alarmTime, setAlarmTime] = useState("")

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

  useEffect(() => {
    if (task) {
      setTitle(task.title || task.name || "")
      setDescription(task.description || "")
      setPriority(task.priority || "medium")
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
      setSelectedCategories(task.categoryIds || [])
      setTaskType(task.type || "standard")
      setTimerDuration(task.timerDuration || 25)
      setAlarmTime(task.alarmTime || "")
      setSubtabActiveTab("details")
    } else {
      setTitle("")
      setDescription("")
      setPriority("medium")
      setDueDate("")
      setSelectedCategories([])
      setTaskType("standard")
      setSubtasks([{ name: "", order: 0 }])
      setTimerDuration(25)
      setAlarmTime("")
      setSubtabActiveTab("details")
    }
  }, [task, open])

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a task title",
        variant: "destructive",
      })
      return
    }

    try {
      const now = Date.now()

      if (task) {
        // Update existing task
        const updatedTask: Task = {
          ...task,
          title: title,
          name: title, // Ensure name is updated too
          description,
          priority: priority as "low" | "medium" | "high",
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
          categoryIds: selectedCategories,
          updatedAt: now,
          type: taskType,
          hasSubtasks: taskType === "subtasks",
          timerDuration: taskType === "timer" ? timerDuration : undefined,
          alarmTime: taskType === "alarm" ? alarmTime : undefined,
        }

        await db.tasks.update(task.id!, updatedTask)

        if (onSave) {
          onSave(updatedTask)
        }

        toast({
          title: "Task updated",
          description: "Your task has been updated successfully",
        })
      } else {
        // Create new task
        const id = `task-${now}`
        const newTask: Omit<Task, "id"> = {
          name: title.trim(),
          description,
          status: "todo",
          priority: priority as "low" | "medium" | "high",
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
          categoryIds: selectedCategories,
          createdAt: new Date().toISOString(),
          type: taskType,
          isRecurring: true,
          hasSubtasks: taskType === "subtasks",
          subtaskCount: taskType === "subtasks" ? subtasks.filter((s) => s.name.trim()).length : 0,
          completedSubtaskCount: 0,
          timerDuration: taskType === "timer" ? timerDuration : undefined,
          alarmTime: taskType === "alarm" ? alarmTime : undefined,
        }

        const taskId = await db.tasks.add(newTask)

        // Add subtasks if task type is "subtasks"
        if (taskType === "subtasks") {
          const validSubtasks = subtasks
            .filter((subtask) => subtask.name.trim())
            .map((subtask, index) => ({
              id: `${taskId}-subtask-${index}-${now}`,
              taskId: taskId,
              name: subtask.name.trim(),
              order: index,
              isCompleted: false,
              createdAt: new Date().toISOString(),
              type: subtask.type,
              timerDuration: subtask.type === "timer" ? subtask.timerDuration : undefined,
              alarmTime: subtask.type === "alarm" ? subtask.alarmTime : undefined,
            }))

          if (validSubtasks.length > 0) {
            await db.subtasks.bulkAdd(validSubtasks)
          }
        }

        if (onSave) {
          onSave(newTask)
        }

        toast({
          title: "Task created",
          description: "Your task has been created successfully",
        })
      }

      if (onClose) onClose()
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: "There was an error saving your task",
        variant: "destructive",
      })
    }
  }

  const handleSelectTemplate = async (templateId: number) => {
    try {
      const taskId = await createTaskFromTemplate(templateId)

      if (onSave) {
        onSave(taskId)
      }

      toast({
        title: "Task created",
        description: "Your task has been created from the template",
      })

      if (onClose) onClose()
    } catch (error) {
      console.error("Error creating task from template:", error)
      toast({
        title: "Error",
        description: "There was an error creating your task from the template",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update your task details below." : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>

        {!task && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Create Manually</TabsTrigger>
              <TabsTrigger value="template">Use Template</TabsTrigger>
            </TabsList>
            <TabsContent value="template" className="py-4">
              <div className="text-center">
                <p className="mb-4 text-muted-foreground">Select a template to quickly create a task</p>
                <TemplateSelector onSelectTemplate={handleSelectTemplate} />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {(activeTab === "manual" || task) && (
          <>
            <Tabs value={subtabActiveTab} onValueChange={setSubtabActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Task Details</TabsTrigger>
                {(taskType === "subtasks" && !task) || (task?.type === "subtasks" && task?.id) ? (
                  <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
                ) : null}
              </TabsList>

              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date (Optional)</Label>
                    <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-2">
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
                  <div className="grid gap-2">
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
                  <div className="grid gap-2">
                    <Label htmlFor="alarmTime">Alarm Time</Label>
                    <Input
                      id="alarmTime"
                      type="time"
                      value={alarmTime}
                      onChange={(e) => setAlarmTime(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Categories (Optional)</Label>
                  <CategorySelector selectedCategories={selectedCategories} onChange={setSelectedCategories} />
                </div>

                {task && task.id && (
                  <div className="grid gap-2">
                    <Label>Collections</Label>
                    <TaskCollectionsSelector taskId={task.id} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="subtasks" className="space-y-4 py-4">
                {!task && (
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
                                onChange={(e) =>
                                  updateSubtaskTimerDuration(index, Number.parseInt(e.target.value) || 25)
                                }
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
                )}

                {task && task.id && (
                  <div className="grid gap-2">
                    <Label>Subtasks</Label>
                    <SubtaskList parentId={task.id} allowTypeSelection={true} />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between">
              <div>
                {task && (
                  <CreateTemplateFromTask
                    task={task}
                    trigger={
                      <Button variant="outline" type="button">
                        Save as Template
                      </Button>
                    }
                  />
                )}
              </div>
              <div>
                <Button variant="outline" onClick={onClose} className="mr-2">
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit}>
                  {task ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
