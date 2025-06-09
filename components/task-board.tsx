"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CheckSquare, Clock, Plus, ArrowRight, CheckCircle2 } from "lucide-react"
import { useTaskBoard } from "@/hooks/use-dexie-store"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

export function TaskBoard() {
  const { toast } = useToast()
  const [todoTasks, startedTasks, completedTasks, moveTask, addTallyIncrement, isLoading] = useTaskBoard()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (todoTasks && startedTasks && completedTasks && !initialized) {
      setInitialized(true)
    }
  }, [todoTasks, startedTasks, completedTasks, initialized])

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result

    // If dropped outside a droppable area
    if (!destination) return

    // If dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Get the new status based on the destination
    const newStatus = destination.droppableId

    // Move the task
    moveTask(draggableId, newStatus)
      .then(() => {
        toast({
          title: "Task moved",
          description: `Task moved to ${newStatus === "completed" ? "completed" : newStatus === "started" ? "in progress" : "todo"}`,
        })
      })
      .catch((error) => {
        toast({
          title: "Error moving task",
          description: error.message,
          variant: "destructive",
        })
      })
  }

  const handleTallyIncrement = (taskId) => {
    addTallyIncrement(taskId)
      .then(() => {
        toast({
          title: "Tally added",
          description: "A new tally has been recorded for this task",
        })
      })
      .catch((error) => {
        toast({
          title: "Error adding tally",
          description: error.message,
          variant: "destructive",
        })
      })
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (!initialized) {
    return <div>Loading task board...</div>
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* To Do Column */}
        <div>
          <Card>
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5" />
                To Do
                <span className="ml-2 text-sm text-muted-foreground">({todoTasks.length})</span>
              </CardTitle>
              <CardDescription>Tasks not yet started</CardDescription>
            </CardHeader>
            <Droppable droppableId="todo">
              {(provided) => (
                <CardContent className="p-2 min-h-[300px]" {...provided.droppableProps} ref={provided.innerRef}>
                  {todoTasks.length > 0 ? (
                    <div className="space-y-2">
                      {todoTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-card border rounded-md p-3 shadow-sm active:bg-primary/10"
                              data-task-id={task.id}
                              data-status="todo"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{task.name}</h3>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                  )}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => moveTask(task.id, "started")}>
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {task.type === "checkbox" ? "One-time task" : "Tally task"}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No tasks to do</div>
                  )}
                  {provided.placeholder}
                </CardContent>
              )}
            </Droppable>
          </Card>
        </div>

        {/* Started Column */}
        <div>
          <Card>
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Started
                <span className="ml-2 text-sm text-muted-foreground">({startedTasks.length})</span>
              </CardTitle>
              <CardDescription>Tasks in progress</CardDescription>
            </CardHeader>
            <Droppable droppableId="started">
              {(provided) => (
                <CardContent className="p-2 min-h-[300px]" {...provided.droppableProps} ref={provided.innerRef}>
                  {startedTasks.length > 0 ? (
                    <div className="space-y-2">
                      {startedTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-card border rounded-md p-3 shadow-sm active:bg-primary/10"
                              data-task-id={task.id}
                              data-status="started"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{task.name}</h3>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                  )}
                                </div>
                                <div className="flex">
                                  {task.type === "tally" && (
                                    <Button variant="ghost" size="sm" onClick={() => handleTallyIncrement(task.id)}>
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => moveTask(task.id, "completed")}>
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-2 text-xs">
                                <div className="text-muted-foreground">Started: {formatDate(task.startedAt)}</div>
                                {task.type === "tally" && (
                                  <div className="text-muted-foreground">
                                    Tallies: {task.tallyTimestamps?.length || 0}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No tasks in progress
                    </div>
                  )}
                  {provided.placeholder}
                </CardContent>
              )}
            </Droppable>
          </Card>
        </div>

        {/* Completed Column */}
        <div>
          <Card>
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Completed
                <span className="ml-2 text-sm text-muted-foreground">({completedTasks.length})</span>
              </CardTitle>
              <CardDescription>Finished tasks</CardDescription>
            </CardHeader>
            <Droppable droppableId="completed">
              {(provided) => (
                <CardContent className="p-2 min-h-[300px]" {...provided.droppableProps} ref={provided.innerRef}>
                  {completedTasks.length > 0 ? (
                    <div className="space-y-2">
                      {completedTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-card border rounded-md p-3 shadow-sm active:bg-primary/10"
                              data-task-id={task.id}
                              data-status="completed"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{task.name}</h3>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-xs">
                                <div className="text-muted-foreground">Completed: {formatDate(task.completedAt)}</div>
                                {task.type === "tally" && (
                                  <div className="text-muted-foreground">
                                    Total tallies: {task.tallyTimestamps?.length || 0}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No completed tasks
                    </div>
                  )}
                  {provided.placeholder}
                </CardContent>
              )}
            </Droppable>
          </Card>
        </div>
      </div>
    </DragDropContext>
  )
}
