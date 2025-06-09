"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  CalendarIcon,
  Clock,
  Mic,
  Download,
  PlusCircle,
  Heart,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { CheckInForm } from "@/components/check-in-form"
import { WelcomeModal } from "@/components/welcome-modal"
import { TranscriptionActions } from "@/components/transcription-actions"
import { TranscriptionExport } from "@/components/transcription-export"
import { cn } from "@/lib/utils"
import { getCurrentSegment } from "@/lib/segment-utils"
import { useTimeFormat } from "@/hooks/use-time-format"
import { ContinueSessionDialog } from "@/components/continue-session-dialog"
import { useLiveQuery } from "dexie-react-hooks"
import { getEmotionEmoji, getEmotionColor } from "@/lib/emotion-analysis"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { db } from "@/lib/db"

export default function DashboardPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [currentSegment, setCurrentSegment] = useState<any>(null)
  const [showCheckInForm, setShowCheckInForm] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<any>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [segmentTasks, setSegmentTasks] = useState<Record<string, any[]>>({})
  const [averages, setAverages] = useState<any>(null)
  const { timeFormat } = useTimeFormat()
  const router = useRouter()
  const [helpExpanded, setHelpExpanded] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)
  const [lastDraggedTask, setLastDraggedTask] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Keep a reference to all tasks for lookup during drag operations
  const allTasksRef = useRef<any[]>([])

  // Use Dexie's useLiveQuery for reactive data
  const segments = useLiveQuery(() => db.segments.orderBy("startTime").toArray()) || []
  const isLoadingSegments = segments === undefined

  // Initialize default segments if none exist
  useEffect(() => {
    const initializeDefaultSegments = async () => {
      try {
        // Check if segments table is empty
        const count = await db.segments.count()
        if (count === 0) {
          console.log("Initializing default segments")
          await db.initializeDefaultData()
        }
      } catch (err) {
        console.error("Error initializing default segments:", err)
      }
    }

    initializeDefaultSegments()
  }, [])

  // Fetch check-ins and calculate averages
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch check-ins for the selected date
        const dateStr = format(date, "yyyy-MM-dd")
        const dayCheckIns = await db.checkIns.where("date").equals(dateStr).toArray()
        setCheckIns(dayCheckIns)

        // Calculate averages for the day
        if (dayCheckIns.length > 0) {
          const nonVoiceCheckIns = dayCheckIns.filter((c) => !c.isVoiceCheckIn)
          if (nonVoiceCheckIns.length > 0) {
            const avgEnergy = Math.round(
              nonVoiceCheckIns.reduce((sum, c) => sum + c.energy, 0) / nonVoiceCheckIns.length,
            )
            const avgMood = Math.round(nonVoiceCheckIns.reduce((sum, c) => sum + c.mood, 0) / nonVoiceCheckIns.length)
            const avgFocus = Math.round(nonVoiceCheckIns.reduce((sum, c) => sum + c.focus, 0) / nonVoiceCheckIns.length)
            const avgProductivity = Math.round(
              nonVoiceCheckIns.reduce((sum, c) => sum + c.productivity, 0) / nonVoiceCheckIns.length,
            )
            const avgStress = Math.round(
              nonVoiceCheckIns.reduce((sum, c) => sum + c.stress, 0) / nonVoiceCheckIns.length,
            )

            setAverages({
              energy: avgEnergy,
              mood: avgMood,
              focus: avgFocus,
              productivity: avgProductivity,
              stress: avgStress,
            })
          } else {
            setAverages(null)
          }
        } else {
          setAverages(null)
        }

        // Fetch tasks
        const allTasks = await db.tasks.toArray()

        // Store all tasks in ref for lookup during drag operations
        allTasksRef.current = allTasks

        // Log custom tasks for debugging
        const customTasks = allTasks.filter((task) => task.isCustom)
        if (customTasks.length > 0) {
          console.log("Found custom tasks:", customTasks)
        }

        const todoTasks = allTasks.filter((task) => task.status === "todo")
        setTasks(todoTasks)

        // Group tasks by preferred segment
        const tasksBySegment: Record<string, any[]> = {}

        // Include tasks that are in progress or completed today
        const relevantTasks = allTasks.filter((task) => {
          if (task.status === "todo") return true
          if (task.status === "started") return true
          if (task.status === "completed" && task.completedAt) {
            const completedDate = new Date(task.completedAt).toDateString()
            const selectedDate = date.toDateString()
            return completedDate === selectedDate
          }
          return false
        })

        // Group by segment
        relevantTasks.forEach((task) => {
          if (task.preferredSegment && task.preferredSegment !== "any") {
            if (!tasksBySegment[task.preferredSegment]) {
              tasksBySegment[task.preferredSegment] = []
            }
            tasksBySegment[task.preferredSegment].push(task)
          }
        })

        setSegmentTasks(tasksBySegment)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [date])

  // Update current segment when segments change
  useEffect(() => {
    if (segments && segments.length > 0) {
      const current = getCurrentSegment(segments, new Date())
      setCurrentSegment(current)
    }

    // Set up interval to check current segment
    const intervalId = setInterval(() => {
      if (segments && segments.length > 0) {
        const current = getCurrentSegment(segments, new Date())
        if (current && (!currentSegment || current.id !== currentSegment.id)) {
          setCurrentSegment(current)
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(intervalId)
  }, [segments, currentSegment])

  // Handle check-in submission
  const handleCheckInSubmit = async (checkInData: any) => {
    try {
      // Add the new check-in to the database
      await db.checkIns.add(checkInData)

      // Update the local state
      setCheckIns((prev) => [...prev, checkInData])

      // Hide the check-in form
      setShowCheckInForm(false)
      setSelectedSegment(null)
    } catch (error) {
      console.error("Error submitting check-in:", error)
    }
  }

  // Check if a segment already has a check-in for today
  const hasCheckIn = (segmentId: string) => {
    return checkIns.some((checkIn) => checkIn.segmentId === segmentId)
  }

  // Handle audio playback
  const handleAudioPlay = (checkInId: string, audioElement: HTMLAudioElement) => {
    // Stop any currently playing audio
    if (playingAudioId && playingAudioId !== checkInId) {
      const currentlyPlaying = document.querySelector(`audio[data-checkin-id="${playingAudioId}"]`) as HTMLAudioElement
      if (currentlyPlaying) {
        currentlyPlaying.pause()
      }
    }

    // Update the playing state
    setPlayingAudioId(checkInId)

    // Add ended event listener
    audioElement.onended = () => setPlayingAudioId(null)
  }

  // Format the selected date
  const formattedDate = format(date, "PPP")
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  // Count voice check-ins with transcriptions
  const transcriptionCount = checkIns.filter((checkIn) => checkIn.isVoiceCheckIn && checkIn.transcription).length

  const formatTimeString = (timeString: string, timeFormat: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes)

    if (timeFormat === "12h") {
      let formattedHours = date.getHours() % 12
      formattedHours = formattedHours === 0 ? 12 : formattedHours
      const ampm = date.getHours() >= 12 ? "PM" : "AM"
      return `${formattedHours}:${String(date.getMinutes()).padStart(2, "0")} ${ampm}`
    } else {
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    }
  }

  // Handle task updates
  const handleTaskUpdate = useCallback(() => {
    // Refresh tasks data
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const allTasks = await db.tasks.toArray()

        // Update the all tasks ref
        allTasksRef.current = allTasks

        const todoTasks = allTasks.filter((task) => task.status === "todo")
        setTasks(todoTasks)

        // Group tasks by preferred segment
        const tasksBySegment: Record<string, any[]> = {}

        // Include tasks that are in progress or completed today
        const relevantTasks = allTasks.filter((task) => {
          if (task.status === "todo") return true
          if (task.status === "started") return true
          if (task.status === "completed" && task.completedAt) {
            const completedDate = new Date(task.completedAt).toDateString()
            const selectedDate = date.toDateString()
            return completedDate === selectedDate
          }
          return false
        })

        // Group by segment
        relevantTasks.forEach((task) => {
          if (task.preferredSegment && task.preferredSegment !== "any") {
            if (!tasksBySegment[task.preferredSegment]) {
              tasksBySegment[task.preferredSegment] = []
            }
            tasksBySegment[task.preferredSegment].push(task)
          }
        })

        setSegmentTasks(tasksBySegment)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [date])

  const handleDragStart = (result) => {
    setIsDragging(true)
    setDragError(null)

    const { draggableId } = result
    console.log("Drag started:", draggableId)

    // Find the task being dragged
    const task =
      tasks.find((t) => t.id === draggableId) ||
      Object.values(segmentTasks)
        .flat()
        .find((t) => t.id === draggableId)

    if (task) {
      console.log("Dragging task:", task)
      setLastDraggedTask(task)
    } else {
      console.warn("Could not find task for draggableId:", draggableId)
    }
  }

  const handleDragEnd = async (result) => {
    setIsDragging(false)
    const { source, destination, draggableId } = result

    // Clear any previous errors
    setDragError(null)

    // Debug logging
    console.log("Drag operation:", {
      draggableId,
      source,
      destination,
    })

    // If dropped outside a droppable area
    if (!destination) {
      console.log("Dropped outside droppable area")
      return
    }

    // If dropped in the same place
    if (source.droppableId === destination.droppableId && source.index === source.index) {
      console.log("Dropped in same position")
      return
    }

    try {
      setIsLoading(true)

      // First try to find the task in our local state
      let task = tasks.find((t) => t.id === draggableId)

      // If not found in tasks, check segment tasks
      if (!task) {
        for (const segmentId in segmentTasks) {
          const segmentTaskList = segmentTasks[segmentId]
          task = segmentTaskList.find((t) => t.id === draggableId)
          if (task) break
        }
      }

      // If still not found, check allTasksRef
      if (!task && allTasksRef.current) {
        task = allTasksRef.current.find((t) => t.id === draggableId)
      }

      // Last resort: fetch directly from DB
      if (!task) {
        task = await db.tasks.get(draggableId)
      }

      if (!task) {
        console.error("Task not found:", draggableId)
        setDragError(`Task not found (ID: ${draggableId}). Please try again.`)
        setIsLoading(false)
        return
      }

      // Save the last dragged task for reference
      setLastDraggedTask(task)

      // If dragging from todo list to a segment
      if (source.droppableId === "todo-list" && destination.droppableId.startsWith("segment-")) {
        const segmentId = destination.droppableId.replace("segment-", "")

        // Get the segment name for better feedback
        const segment = segments.find((s) => s.id === segmentId)
        const segmentName = segment ? segment.name : "segment"

        console.log(`Assigning task ${task.id} to segment ${segmentId}`)

        // Update the task with the new segment
        await db.tasks.update(task.id, {
          preferredSegment: segmentId,
        })

        // Refresh tasks data
        handleTaskUpdate()

        toast({
          title: task.isCustom ? "Custom task assigned" : "Task assigned",
          description: `Task assigned to ${segmentName}`,
        })
      }
      // If dragging between segments
      else if (destination.droppableId.startsWith("segment-") && source.droppableId.startsWith("segment-")) {
        const targetSegmentId = destination.droppableId.replace("segment-", "")

        // Get the segment name for better feedback
        const segment = segments.find((s) => s.id === targetSegmentId)
        const segmentName = segment ? segment.name : "segment"

        console.log(`Moving task ${task.id} to segment ${targetSegmentId}`)

        // Update the task with the new segment
        await db.tasks.update(task.id, {
          preferredSegment: targetSegmentId,
        })

        // Refresh tasks data
        handleTaskUpdate()

        toast({
          title: "Task moved",
          description: `Task reassigned to ${segmentName}`,
        })
      }
      // Handle drag to complete task
      else if (destination.droppableId === "completed-tasks") {
        console.log(`Completing task ${task.id}`)

        const now = new Date().toISOString()

        // Update task status
        await db.tasks.update(task.id, {
          status: "completed",
          completedAt: now,
        })

        // Create a task entry
        const entry = {
          id: `entry-${task.id}-${Date.now()}`,
          taskId: task.id,
          date: now.split("T")[0],
          time: now,
          segmentId: task.preferredSegment || (currentSegment ? currentSegment.id : null),
          segmentName: currentSegment ? currentSegment.name : null,
          status: "completed",
          completionValue: 1,
          createdAt: now,
          sourceTrigger: "drag-drop",
        }

        await db.taskEntries.add(entry)

        // Update task usage statistics
        await db.tasks.update(task.id, {
          lastUsed: now,
          usageCount: (task.usageCount || 0) + 1,
        })

        handleTaskUpdate()

        toast({
          title: "Task completed",
          description: "Task marked as completed",
        })
      }
    } catch (error) {
      console.error("Error in drag and drop:", error)
      setDragError(`Error moving task: ${error.message}`)
      toast({
        title: "Error moving task",
        description: "There was a problem with the task operation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskClick = (task) => {
    console.log("Task clicked:", task)
    // You could show a task details modal here
  }

  const handleCompleteTask = async (taskId) => {
    try {
      setIsLoading(true)

      // Find the task
      const task = await db.tasks.get(taskId)
      if (!task) {
        throw new Error("Task not found")
      }

      const now = new Date().toISOString()

      // Update task status
      await db.tasks.update(taskId, {
        status: "completed",
        completedAt: now,
      })

      // Create a task entry
      const entry = {
        id: `entry-${taskId}-${Date.now()}`,
        taskId,
        date: now.split("T")[0],
        time: now,
        segmentId: task.preferredSegment || (currentSegment ? currentSegment.id : null),
        segmentName: currentSegment ? currentSegment.name : null,
        status: "completed",
        completionValue: 1,
        createdAt: now,
        sourceTrigger: "button-click",
      }

      await db.taskEntries.add(entry)

      // Update task usage statistics
      await db.tasks.update(taskId, {
        lastUsed: now,
        usageCount: (task.usageCount || 0) + 1,
      })

      handleTaskUpdate()

      toast({
        title: "Task completed",
        description: "Task marked as completed",
      })
    } catch (error) {
      console.error("Error completing task:", error)
      toast({
        title: "Error completing task",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-4">
      <WelcomeModal />
      <ContinueSessionDialog />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track your day and monitor your well-being.</p>
          <div className="mt-2 p-3 text-sm bg-muted/30 rounded-md border border-muted">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setHelpExpanded(!helpExpanded)}
            >
              <strong>How to use:</strong>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={helpExpanded ? "Collapse help section" : "Expand help section"}
              >
                {helpExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
            {helpExpanded && (
              <p className="mt-2">
                Your day is divided into time segments shown below. Click "Check In" on any segment to record your
                well-being metrics or voice notes. The current segment is highlighted, and missed check-ins are shown in
                orange. Use the calendar to view past days and the export button to download your voice transcriptions.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal w-full md:w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formattedDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
            </PopoverContent>
          </Popover>

          {transcriptionCount > 0 && (
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Export transcriptions">
                  <Download className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <TranscriptionExport onClose={() => setShowExportDialog(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {dragError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{dragError}</AlertDescription>
        </Alert>
      )}

      {lastDraggedTask && lastDraggedTask.isCustom && (
        <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertTitle className="flex items-center">
            <Badge className="mr-2 bg-blue-500">Custom Task</Badge>
            Last dragged: {lastDraggedTask.name}
          </AlertTitle>
          <AlertDescription>
            Custom tasks can be dragged between segments. If you're having trouble, try clicking the task first, then
            dragging.
          </AlertDescription>
        </Alert>
      )}

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Todo Tasks Card - Moved above Day Segments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Todo Tasks</CardTitle>
            <CardDescription>Drag tasks to assign them to day segments or click to complete</CardDescription>
          </CardHeader>
          <CardContent>
            <Droppable droppableId="todo-list" direction="horizontal">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex flex-wrap gap-2 p-2 rounded-md",
                    snapshot.isDraggingOver && "bg-primary/5 border border-dashed border-primary/30",
                  )}
                >
                  {tasks.length === 0 ? (
                    <div className="text-center py-4 w-full">
                      <p className="text-muted-foreground">No pending tasks.</p>
                      <Button className="mt-4" variant="outline" onClick={() => router.push("/tasks")}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Tasks
                      </Button>
                    </div>
                  ) : (
                    <>
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md border bg-card group cursor-grab active:cursor-grabbing",
                                "hover:border-primary/50 hover:bg-accent/50 transition-colors",
                                snapshot.isDragging && "shadow-md border-primary z-50",
                                task.isCustom && "ring-2 ring-blue-500/20",
                                snapshot.isDragging && "opacity-90 scale-105",
                              )}
                              data-task-id={task.id}
                              data-task-type={task.type || "standard"}
                              data-is-custom={task.isCustom ? "true" : "false"}
                              onClick={() => handleTaskClick(task)}
                            >
                              <span className="text-sm flex items-center">
                                {task.name}
                                {task.isCustom && (
                                  <Badge
                                    variant="outline"
                                    className="ml-1 text-xs py-0 h-4 bg-blue-50 dark:bg-blue-900/20"
                                  >
                                    custom
                                  </Badge>
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-1 p-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCompleteTask(task.id)
                                }}
                                title="Mark as completed"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </>
                  )}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Day Segments</CardTitle>
              <CardDescription>
                {isToday
                  ? "Your schedule for today. Click on a segment to check in."
                  : `Your schedule for ${formattedDate}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSegments ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading segments...</p>
                </div>
              ) : segments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No segments defined yet.</p>
                  <Button className="mt-4" onClick={() => router.push("/settings")}>
                    Configure Segments
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {segments.map((segment) => {
                    const segmentCheckIn = checkIns.find((checkIn) => checkIn.segmentId === segment.id)
                    const isCurrentSegment = currentSegment && currentSegment.id === segment.id && isToday
                    const isPastSegment =
                      isToday &&
                      new Date(`2000-01-01T${segment.endTime}:00`) <
                        new Date(`2000-01-01T${new Date().getHours()}:${new Date().getMinutes()}:00`)

                    // Get tasks for this segment
                    const tasksForSegment = segmentTasks[segment.id] || []

                    return (
                      <Droppable key={segment.id} droppableId={`segment-${segment.id}`}>
                        {(provided, snapshot) => (
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
                              snapshot.isDraggingOver && "scale-[1.01]",
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
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">{segment.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatTimeString(segment.startTime, timeFormat)} -{" "}
                                  {formatTimeString(segment.endTime, timeFormat)}
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
                                {tasksForSegment.length === 0 ? (
                                  snapshot.isDraggingOver ? (
                                    <div className="text-center py-2 text-sm text-primary">Drop task here</div>
                                  ) : (
                                    <div className="text-center py-2 text-sm text-muted-foreground">
                                      No tasks assigned
                                    </div>
                                  )
                                ) : (
                                  tasksForSegment.map((task, index) => (
                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={cn(
                                            "flex items-center justify-between p-2 rounded-md border bg-card",
                                            "hover:border-primary/50 hover:bg-accent/50 transition-colors",
                                            snapshot.isDragging && "shadow-md border-primary z-50",
                                            task.isCustom && "ring-1 ring-blue-500/20",
                                          )}
                                        >
                                          <span className="text-sm">
                                            {task.name}
                                            {task.isCustom && (
                                              <Badge
                                                variant="outline"
                                                className="ml-1 text-xs py-0 h-4 bg-blue-50 dark:bg-blue-900/20"
                                              >
                                                custom
                                              </Badge>
                                            )}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1 p-0 h-6 w-6"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleCompleteTask(task.id)
                                            }}
                                            title="Mark as completed"
                                          >
                                            <CheckCircle2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            </div>

                            {segmentCheckIn ? (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                                {segmentCheckIn.isVoiceCheckIn ? (
                                  <div className="col-span-2 md:col-span-5 flex flex-col gap-2 p-2 rounded-md bg-primary/5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Mic className="h-4 w-4 text-primary" />
                                        <div className="font-medium">Voice Check-in</div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {segmentCheckIn.voiceRecordingUrl && (
                                          <audio
                                            src={segmentCheckIn.voiceRecordingUrl}
                                            controls
                                            className="w-full max-w-[120px] h-8"
                                            data-checkin-id={segmentCheckIn.id}
                                            onPlay={(e) => handleAudioPlay(segmentCheckIn.id, e.currentTarget)}
                                          />
                                        )}
                                        <TranscriptionActions
                                          checkInId={segmentCheckIn.id}
                                          onDelete={() => {
                                            // Refresh check-ins after deletion
                                            const updatedCheckIns = checkIns.map((c) =>
                                              c.id === segmentCheckIn.id ? { ...c, transcription: "" } : c,
                                            )
                                            setCheckIns(updatedCheckIns)
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {segmentCheckIn.voiceNotes && (
                                      <p className="text-muted-foreground text-xs mt-1">{segmentCheckIn.voiceNotes}</p>
                                    )}

                                    {segmentCheckIn.transcription && (
                                      <div className="flex items-center justify-between mt-1">
                                        <p className="text-muted-foreground text-xs italic line-clamp-2">
                                          "{segmentCheckIn.transcription}"
                                        </p>
                                      </div>
                                    )}

                                    {/* Emotional Analysis Display */}
                                    {segmentCheckIn.emotionalAnalysis && segmentCheckIn.emotionalAnalysisEnabled && (
                                      <div
                                        className="flex items-center gap-2 mt-1 p-2 rounded-md text-xs"
                                        style={{
                                          backgroundColor: `${getEmotionColor(segmentCheckIn.emotionalAnalysis.primaryEmotion)}20`,
                                        }}
                                      >
                                        <Heart className="h-3 w-3 text-pink-500" />
                                        <span className="text-base mr-1">
                                          {getEmotionEmoji(segmentCheckIn.emotionalAnalysis.primaryEmotion)}
                                        </span>
                                        <span className="flex-1">
                                          {segmentCheckIn.emotionalAnalysis.primaryEmotion}
                                          {segmentCheckIn.emotionalAnalysis.secondaryEmotion &&
                                            ` with ${segmentCheckIn.emotionalAnalysis.secondaryEmotion}`}
                                          {segmentCheckIn.emotionalAnalysis.sentiment > 0.2
                                            ? " (positive)"
                                            : segmentCheckIn.emotionalAnalysis.sentiment < -0.2
                                              ? " (negative)"
                                              : ""}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <div className="p-2 rounded-md bg-primary/5">
                                      <div className="text-xs text-muted-foreground">Energy</div>
                                      <div className="font-medium">{segmentCheckIn.energy}/10</div>
                                    </div>
                                    <div className="p-2 rounded-md bg-primary/5">
                                      <div className="text-xs text-muted-foreground">Mood</div>
                                      <div className="font-medium">{segmentCheckIn.mood}/10</div>
                                    </div>
                                    <div className="p-2 rounded-md bg-primary/5">
                                      <div className="text-xs text-muted-foreground">Focus</div>
                                      <div className="font-medium">{segmentCheckIn.focus}/10</div>
                                    </div>
                                    <div className="p-2 rounded-md bg-primary/5">
                                      <div className="text-xs text-muted-foreground">Productivity</div>
                                      <div className="font-medium">{segmentCheckIn.productivity}/10</div>
                                    </div>
                                    <div className="p-2 rounded-md bg-primary/5">
                                      <div className="text-xs text-muted-foreground">Stress</div>
                                      <div className="font-medium">{segmentCheckIn.stress}/10</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : isToday ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  setSelectedSegment(segment)
                                  setShowCheckInForm(true)
                                }}
                              >
                                Check In
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </Droppable>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Tasks Drop Zone */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mark as Completed</CardTitle>
              <CardDescription>Drop tasks here to mark them as completed</CardDescription>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="completed-tasks">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-[80px] border-2 border-dashed rounded-md flex items-center justify-center p-4 transition-all",
                      snapshot.isDraggingOver ? "border-primary bg-primary/10 scale-105" : "border-muted-foreground/20",
                    )}
                  >
                    {snapshot.isDraggingOver ? (
                      <p className="text-primary font-medium">Drop to complete task</p>
                    ) : (
                      <p className="text-muted-foreground">Drag tasks here to mark them as completed</p>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Current Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>Your current segment and upcoming schedule</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSegments ? (
                  <p>Loading...</p>
                ) : segments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No segments defined yet.</p>
                    <Button className="mt-4" onClick={() => router.push("/settings")}>
                      Configure Segments
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground mb-1">Current Time</div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(), timeFormat === "12h" ? "h:mm a" : "HH:mm")}
                        </span>
                      </div>
                    </div>

                    {currentSegment ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Current Segment</div>
                          <div
                            className="p-3 rounded-md font-medium"
                            style={{ backgroundColor: currentSegment.color || "#888", color: "#fff" }}
                          >
                            {currentSegment.name}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Time Remaining</div>
                          <div className="font-medium">
                            {(() => {
                              const now = new Date()
                              const endTime = new Date()
                              const [hours, minutes] = currentSegment.endTime.split(":").map(Number)
                              endTime.setHours(hours, minutes, 0, 0)
                              const diffMs = endTime.getTime() - now.getTime()
                              if (diffMs <= 0) return "Ending soon"
                              const diffMins = Math.floor(diffMs / 60000)
                              const hrs = Math.floor(diffMins / 60)
                              const mins = diffMins % 60
                              return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutes`
                            })()}
                          </div>
                        </div>

                        {!hasCheckIn(currentSegment.id) && isToday && (
                          <Button
                            className="w-full mt-2"
                            onClick={() => {
                              setSelectedSegment(currentSegment)
                              setShowCheckInForm(true)
                            }}
                          >
                            Check In Now
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No active segment right now.</p>
                        <Button
                          className="mt-4"
                          onClick={() => {
                            if (segments.length > 0) {
                              setSelectedSegment(segments[0])
                              setShowCheckInForm(true)
                            }
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Get Started
                        </Button>
                      </div>
                    )}

                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Up Next</h4>
                      {(() => {
                        if (!segments || segments.length === 0)
                          return <p className="text-sm text-muted-foreground">No segments defined</p>

                        const now = new Date()
                        const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

                        // Find the next segment
                        const nextSegment = segments.find((segment) => {
                          return (
                            segment.startTime > currentTime && (!currentSegment || segment.id !== currentSegment.id)
                          )
                        })

                        if (!nextSegment) {
                          // If no next segment today, show the first segment for tomorrow
                          const firstSegment = segments.reduce((earliest, segment) => {
                            return !earliest || segment.startTime < earliest.startTime ? segment : earliest
                          }, null)

                          if (firstSegment) {
                            return (
                              <div
                                className="p-3 rounded-md text-sm"
                                style={{
                                  backgroundColor: firstSegment.color + "40",
                                  borderLeft: `3px solid ${firstSegment.color}`,
                                }}
                              >
                                <div className="font-medium">{firstSegment.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Tomorrow, {formatTimeString(firstSegment.startTime, timeFormat)}
                                </div>
                              </div>
                            )
                          }
                        } else {
                          return (
                            <div
                              className="p-3 rounded-md text-sm"
                              style={{
                                backgroundColor: nextSegment.color + "40",
                                borderLeft: `3px solid ${nextSegment.color}`,
                              }}
                            >
                              <div className="font-medium">{nextSegment.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Today, {formatTimeString(nextSegment.startTime, timeFormat)}
                              </div>
                            </div>
                          )
                        }

                        return <p className="text-sm text-muted-foreground">No upcoming segments</p>
                      })()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Daily Averages Card */}
            {averages && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Averages</CardTitle>
                  <CardDescription>Average metrics for {formattedDate}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="p-2 rounded-md bg-primary/5 text-center">
                      <div className="text-xs text-muted-foreground">Energy</div>
                      <div className="font-medium">{averages.energy}/10</div>
                    </div>
                    <div className="p-2 rounded-md bg-primary/5 text-center">
                      <div className="text-xs text-muted-foreground">Mood</div>
                      <div className="font-medium">{averages.mood}/10</div>
                    </div>
                    <div className="p-2 rounded-md bg-primary/5 text-center">
                      <div className="text-xs text-muted-foreground">Focus</div>
                      <div className="font-medium">{averages.focus}/10</div>
                    </div>
                    <div className="p-2 rounded-md bg-primary/5 text-center">
                      <div className="text-xs text-muted-foreground">Prod.</div>
                      <div className="font-medium">{averages.productivity}/10</div>
                    </div>
                    <div className="p-2 rounded-md bg-primary/5 text-center">
                      <div className="text-xs text-muted-foreground">Stress</div>
                      <div className="font-medium">{averages.stress}/10</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Check-in History</CardTitle>
                <CardDescription>Your check-ins for {formattedDate}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSegments ? (
                  <p>Loading check-ins...</p>
                ) : checkIns.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No check-ins recorded for this day.</p>
                    {isToday && currentSegment && (
                      <Button
                        className="mt-4"
                        onClick={() => {
                          setSelectedSegment(currentSegment)
                          setShowCheckInForm(true)
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Get Started
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {checkIns
                        .sort((a, b) => (a.time > b.time ? 1 : -1))
                        .map((checkIn) => {
                          const segment = segments?.find((s) => s.id === checkIn.segmentId)
                          return (
                            <div
                              key={checkIn.id}
                              className="p-3 rounded-md border text-sm"
                              style={{ borderLeft: `3px solid ${segment?.color || "#888"}` }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-medium">{checkIn.segmentName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimeString(checkIn.time, timeFormat)}
                                </div>
                              </div>
                              {checkIn.isVoiceCheckIn ? (
                                <div className="flex items-center justify-between gap-2 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Mic className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Voice Check-in</span>
                                    {checkIn.emotionalAnalysis && checkIn.emotionalAnalysisEnabled && (
                                      <span className="text-xs flex items-center gap-1">
                                        <Heart className="h-3 w-3 text-pink-500" />
                                        {getEmotionEmoji(checkIn.emotionalAnalysis.primaryEmotion)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {checkIn.voiceRecordingUrl && (
                                      <audio
                                        src={checkIn.voiceRecordingUrl}
                                        controls
                                        className="w-full max-w-[100px] h-6"
                                        data-checkin-id={checkIn.id}
                                        onPlay={(e) => handleAudioPlay(checkIn.id, e.currentTarget)}
                                      />
                                    )}
                                    <TranscriptionActions
                                      checkInId={checkIn.id}
                                      onDelete={() => {
                                        // Refresh check-ins after deletion
                                        const updatedCheckIns = checkIns.map((c) =>
                                          c.id === checkIn.id ? { ...c, transcription: "" } : c,
                                        )
                                        setCheckIns(updatedCheckIns)
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-5 gap-1 mt-2">
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">E: </span>
                                    {checkIn.energy}
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">M: </span>
                                    {checkIn.mood}
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">F: </span>
                                    {checkIn.focus}
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">P: </span>
                                    {checkIn.productivity}
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">S: </span>
                                    {checkIn.stress}
                                  </div>
                                </div>
                              )}
                              {checkIn.transcription && (
                                <div className="mt-1 text-xs italic text-muted-foreground line-clamp-2">
                                  "{checkIn.transcription}"
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
              {transcriptionCount > 0 && (
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setShowExportDialog(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Transcriptions ({transcriptionCount})
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </DragDropContext>

      {showCheckInForm && (
        <Dialog open={showCheckInForm} onOpenChange={setShowCheckInForm}>
          <DialogContent className="sm:max-w-md">
            <CheckInForm segments={segments || []} onCheckInComplete={handleCheckInSubmit} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
