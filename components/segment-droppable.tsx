"use client"

import { useState } from "react"
import { Droppable } from "@hello-pangea/dnd"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DashboardTaskItem } from "@/components/dashboard-task-item"

interface SegmentDroppableProps {
  segment: any
  segmentCheckIn: any
  isCurrentSegment: boolean
  isPastSegment: boolean
  tasksForSegment: any[]
  timeFormat: string
  formatTimeString: (time: string, format: string) => string
  onCheckInClick: () => void
  onTaskUpdate: () => void
  isToday: boolean
}

export function SegmentDroppable({
  segment,
  segmentCheckIn,
  isCurrentSegment,
  isPastSegment,
  tasksForSegment,
  timeFormat,
  formatTimeString,
  onCheckInClick,
  onTaskUpdate,
  isToday,
}: SegmentDroppableProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  return (
    <Droppable droppableId={`segment-${segment.id}`}>
      {(provided, snapshot) => {
        // Update dragging over state for visual feedback
        if (snapshot.isDraggingOver !== isDraggingOver) {
          setIsDraggingOver(snapshot.isDraggingOver)
        }

        return (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "p-4 rounded-lg border transition-all",
              isCurrentSegment && "border-primary",
              !segmentCheckIn &&
                isPastSegment &&
                "animate-pulse-subtle bg-orange-100 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
              segmentCheckIn && "bg-muted/30",
              snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/50",
              isDraggingOver && "scale-[1.01]",
            )}
            style={{
              borderLeft: `8px solid ${segment.color || "#888"}`,
              backgroundColor: snapshot.isDraggingOver
                ? `${segment.color}30`
                : !segmentCheckIn && isPastSegment
                  ? undefined // Let the pulsing class handle background for missed check-ins
                  : `${segment.color}15`, // 15 = 8% opacity in hex
              transition: "all 0.2s ease",
            }}
            onDragEnter={() => {
              console.log(`Dragging over segment: ${segment.name} (${segment.id})`)
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{segment.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatTimeString(segment.startTime, timeFormat)} - {formatTimeString(segment.endTime, timeFormat)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isCurrentSegment && (
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    Current
                  </Badge>
                )}
                {segmentCheckIn && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                    Checked In
                  </Badge>
                )}
              </div>
            </div>

            {/* Tasks for this segment */}
            <div className="mt-3 mb-3">
              <h4 className="text-sm font-medium mb-2">Tasks</h4>
              <div
                className={cn(
                  "space-y-1 min-h-[40px] rounded-md",
                  snapshot.isDraggingOver && "bg-primary/5 p-2 border border-dashed border-primary/30",
                )}
              >
                {tasksForSegment.length === 0 && snapshot.isDraggingOver && (
                  <div className="text-center py-2 text-sm text-primary">Drop task here</div>
                )}
                {tasksForSegment.map((task) => (
                  <DashboardTaskItem key={task.id} task={task} segmentId={segment.id} onUpdate={onTaskUpdate} />
                ))}
                {provided.placeholder}
              </div>
            </div>

            {!segmentCheckIn && isToday ? (
              <Button variant="outline" size="sm" className="mt-2" onClick={onCheckInClick}>
                Check In
              </Button>
            ) : null}
          </div>
        )
      }}
    </Droppable>
  )
}
