"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Edit,
  Trash2,
  Plus,
  RepeatIcon,
  CalendarIcon,
  MoreHorizontal,
  Pencil,
  Tag,
  Archive,
} from "lucide-react"
import { TaskDialog } from "./task-dialog"
import { InlineTaskEditor } from "./inline-task-editor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createTaskEntry } from "@/lib/task-entry-utils"

export interface TaskCardProps {
  task: any
  segments: any[]
  onEdit: (task: any) => void
  onDelete: (taskId: string) => void
  onArchive?: (taskId: string) => void
  onTaskClick?: (task: any) => void
}

export function TaskCard({ task, segments, onEdit, onDelete, onArchive, onTaskClick }: TaskCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreatingEntry, setIsCreatingEntry] = useState(false)

  // Find preferred segment
  const preferredSegment = task.preferredSegment === "any" ? null : segments.find((s) => s.id === task.preferredSegment)

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Handle task completion
  const handleCompleteTask = async () => {
    try {
      setIsCreatingEntry(true)

      // Create a task entry
      await createTaskEntry(task.id, "completed", 1, {
        segmentId: task.preferredSegment,
      })

      // Update the UI
      onEdit({
        ...task,
        lastUsed: new Date().toISOString(),
        usageCount: (task.usageCount || 0) + 1,
      })
    } catch (error) {
      console.error("Error completing task:", error)
    } finally {
      setIsCreatingEntry(false)
    }
  }

  // Handle tally increment
  const handleTallyIncrement = async () => {
    try {
      setIsCreatingEntry(true)

      // Create a task entry for the tally
      await createTaskEntry(task.id, "completed", 1, {
        segmentId: task.preferredSegment,
        tallyCount: 1,
      })

      // Update the UI
      onEdit({
        ...task,
        lastUsed: new Date().toISOString(),
        usageCount: (task.usageCount || 0) + 1,
      })
    } catch (error) {
      console.error("Error incrementing tally:", error)
    } finally {
      setIsCreatingEntry(false)
    }
  }

  // Get status-specific actions
  const getStatusActions = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        {task.type === "tally" && (
          <Button variant="outline" onClick={handleTallyIncrement} disabled={isCreatingEntry}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tally
          </Button>
        )}
        <Button
          onClick={handleCompleteTask}
          className={task.type === "tally" ? "" : "col-span-2"}
          disabled={isCreatingEntry}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isCreatingEntry ? "Saving..." : "Complete"}
        </Button>
      </div>
    )
  }

  const handleSaveTask = (updatedTask) => {
    console.log("Saving updated task:", updatedTask)
    onEdit(updatedTask)
    setEditDialogOpen(false)
  }

  const handleArchiveTask = () => {
    setArchiveDialogOpen(false)
    if (onArchive) {
      onArchive(task.id)
    }
  }

  return (
    <>
      <Card className="cursor-pointer" onClick={() => onTaskClick && onTaskClick(task)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              {isEditing ? (
                <InlineTaskEditor
                  task={task}
                  onSave={(updatedTask) => {
                    onEdit(updatedTask)
                    setIsEditing(false)
                  }}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">
                    {task.name}
                    {task.isRecurring && <RepeatIcon className="h-4 w-4 text-muted-foreground ml-2 inline" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditing(true)
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit task name</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline">
                  {task.type === "standard" ? "Standard" : task.type === "tally" ? "Tally" : "Subtasks"}
                </Badge>
                {task.isRecurring ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <RepeatIcon className="h-3 w-3" /> Recurring
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> One-time
                  </Badge>
                )}
                {task.categoryId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Category
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit task details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onArchive && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setArchiveDialogOpen(true)
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" /> Archive Task
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteDialogOpen(true)
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}

          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preferred segment:</span>
              <span>{preferredSegment ? preferredSegment.name : "Any"}</span>
            </div>

            {task.lastUsed && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last used:</span>
                <span>{formatDate(task.lastUsed)}</span>
              </div>
            )}

            {task.type === "tally" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total usage count:</span>
                <span>{task.usageCount || 0}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter onClick={(e) => e.stopPropagation()}>{getStatusActions()}</CardFooter>
      </Card>

      <TaskDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
        }}
        task={task}
        onSave={handleSaveTask}
        isEditing={true}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task "{task.name}" and all its subtasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(task.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={archiveDialogOpen}
        onOpenChange={(open) => {
          setArchiveDialogOpen(open)
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move "{task.name}" to the archive. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveTask}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
