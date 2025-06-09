"use client"

import { useState } from "react"
import { Draggable } from "@hello-pangea/dnd"
import { CheckCircle, Grip } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CustomTaskDraggableProps {
  task: any
  index: number
  onTaskClick?: (task: any) => void
}

export function CustomTaskDraggable({ task, index, onTaskClick }: CustomTaskDraggableProps) {
  const [isDragging, setIsDragging] = useState(false)

  // Log task details for debugging
  const handleDragStart = () => {
    console.log("Starting drag for task:", {
      id: task.id,
      name: task.name,
      isCustom: task.isCustom,
      type: task.type,
    })
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "flex items-center gap-2 p-2 rounded-md border bg-card group transition-colors",
            "hover:border-primary/50 hover:bg-accent/50",
            snapshot.isDragging && "shadow-md border-primary z-50",
            task.isCustom && "ring-2 ring-blue-500/20",
            isDragging && "opacity-90 scale-105",
          )}
          data-task-id={task.id}
          data-task-type={task.type || "standard"}
          data-is-custom={task.isCustom ? "true" : "false"}
          onClick={() => onTaskClick && onTaskClick(task)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted">
            <Grip className="h-3 w-3 text-muted-foreground" />
          </div>

          <CheckCircle className="h-4 w-4 text-muted-foreground" />

          <span className="text-sm flex items-center flex-1">
            {task.name}
            {task.isCustom && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="ml-1 text-xs py-0 h-4 bg-blue-50 dark:bg-blue-900/20">
                      custom
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Custom task - drag to assign to a segment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>

          <span className="ml-1 text-xs text-muted-foreground hidden group-hover:inline">(drag to assign)</span>
        </div>
      )}
    </Draggable>
  )
}
