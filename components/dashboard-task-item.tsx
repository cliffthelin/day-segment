"use client"

import { useState } from "react"
import { CheckCircle, Circle, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { db } from "@/lib/db"
import { createTaskEntryFromDragDrop } from "@/lib/task-entry-utils"
import { toast } from "@/components/ui/use-toast"

interface DashboardTaskItemProps {
  task: any
  segmentId: string
  onUpdate: () => void
}

export function DashboardTaskItem({ task, segmentId, onUpdate }: DashboardTaskItemProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    try {
      setIsLoading(true)

      // Update task status
      await db.tasks.update(task.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      })

      // Create task entry
      await createTaskEntryFromDragDrop(task.id, "completed", segmentId)

      // Update task usage statistics
      await db.tasks.update(task.id, {
        lastUsed: new Date().toISOString(),
        usageCount: (task.usageCount || 0) + 1,
      })

      toast({
        title: "Task completed",
        description: "Task marked as completed",
      })

      // Refresh tasks
      onUpdate()
    } catch (error) {
      console.error("Error completing task:", error)
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFromSegment = async () => {
    try {
      setIsLoading(true)

      // Update task to remove segment assignment
      await db.tasks.update(task.id, {
        preferredSegment: null,
      })

      toast({
        title: "Task updated",
        description: "Task removed from segment",
      })

      // Refresh tasks
      onUpdate()
    } catch (error) {
      console.error("Error removing task from segment:", error)
      toast({
        title: "Error",
        description: "Failed to remove task from segment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded-md border bg-card",
        "hover:border-primary/50 hover:bg-accent/50 transition-colors",
        task.isCustom && "ring-1 ring-blue-500/20",
      )}
      data-task-id={task.id}
      data-is-custom={task.isCustom ? "true" : "false"}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 rounded-full p-0"
          onClick={handleComplete}
          disabled={isLoading}
        >
          {task.status === "completed" ? (
            <CheckCircle className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">Complete task</span>
        </Button>
        <span className="text-sm">
          {task.name}
          {task.isCustom && (
            <Badge variant="outline" className="ml-1 text-xs py-0 h-4 bg-blue-50 dark:bg-blue-900/20">
              custom
            </Badge>
          )}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLoading}>
            <MoreHorizontal className="h-3 w-3" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleComplete} disabled={isLoading}>
            Mark as completed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRemoveFromSegment} disabled={isLoading}>
            Remove from segment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
