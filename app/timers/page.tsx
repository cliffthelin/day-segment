"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Play, Pause, RotateCcw, Save } from "lucide-react"
import { useTasks, useSegments, useTimerSessions, useCheckIns, useSetting } from "@/hooks/use-dexie-store"
import { formatTimerTime, parseTimeToMilliseconds } from "@/lib/time-utils"
import { getCurrentSegment } from "@/lib/segment-utils"
import { ContinueSessionDialog } from "@/components/continue-session-dialog"
import { db } from "@/lib/db"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { vibrate, VibrationPatterns } from "@/lib/haptic-utils"

// Define default sound URLs
const DEFAULT_SOUNDS: Record<string, string> = {
  default: "/sounds/default.mp3",
  "clapping-106694": "/sounds/clapping-106694.mp3",
  "dark-engine-logo-141942": "/sounds/dark-engine-logo-141942.mp3",
  "dark-guitar-130435": "/sounds/dark-guitar-130435.mp3",
  "epic-glitch-hit-logo-142960": "/sounds/epic-glitch-hit-logo-142960.mp3",
  "epic-hybrid-logo-157092": "/sounds/epic-hybrid-logo-157092.mp3",
  "happy-outro-8110": "/sounds/happy-outro-8110.mp3",
  "intro-music-black-box-string-violin-12349": "/sounds/intro-music-black-box-string-violin-12349.mp3",
  "joyful-messy-piano-116715": "/sounds/joyful-messy-piano-116715.mp3",
  "modern-tech-logo-13492": "/sounds/modern-tech-logo-13492.mp3",
  "quotend-of-chapter-2quot-290229": "/sounds/quotend-of-chapter-2quot-290229.mp3",
  "reverse-logo-143857": "/sounds/reverse-logo-143857.mp3",
  "short-melancholic-theme-on-piano-34024": "/sounds/short-melancholic-theme-on-piano-34024.mp3",
  "short-soothing-strings-guitar-music-324302": "/sounds/short-soothing-strings-guitar-music-324302.mp3",
  "simple-clean-logo-13775": "/sounds/simple-clean-logo-13775.mp3",
  "techology-intro-short-version-185783": "/sounds/techology-intro-short-version-185783.mp3",
  "trompetenmusik-184249": "/sounds/trompetenmusik-184249.mp3",
}

export default function Timers() {
  const { toast } = useToast()
  const [tasks] = useTasks()
  const [segments] = useSegments()
  const [timerSessions, addTimerSession, updateTimerSession, isLoading] = useTimerSessions()
  const [checkIns, setCheckIns, addCheckIn, updateCheckIn, checkInsLoading] = useCheckIns()
  const [timerSound] = useSetting("timerSound", "default")
  const [timerCompleteSound] = useSetting("timerCompleteSound", "bell")
  const [timerVolume] = useSetting("timerVolume", 0.7) // Default to 70% volume
  const [enableHapticFeedback] = useLocalStorage("enableHapticFeedback", true)

  // Timer state
  const [selectedTask, setSelectedTask] = useState("")
  const [timerType, setTimerType] = useState<"stopwatch" | "countdown">("stopwatch")
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [countdownDuration, setCountdownDuration] = useState("00:25:00") // Default 25 minutes
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [mood, setMood] = useState(5)
  const [notes, setNotes] = useState("")
  const [activeSession, setActiveSession] = useState<string | null>(null)

  // Continue session dialog state
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [previousSession, setPreviousSession] = useState<any>(null)

  // Refs for timer
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Get current segment
  const currentSegment = getCurrentSegment(segments, new Date())

  // Check for incomplete sessions when task is selected
  useEffect(() => {
    if (!selectedTask) return

    const checkForIncompleteSessions = async () => {
      // Find the most recent session for this task that's not 100% complete
      const incompleteSessions = timerSessions
        .filter(
          (session) =>
            session.taskId === selectedTask && session.completionPercentage < 100 && session.endTime !== null, // Only consider saved sessions
        )
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

      if (incompleteSessions.length > 0) {
        const latestIncomplete = incompleteSessions[0]
        setPreviousSession({
          id: latestIncomplete.id,
          taskName: latestIncomplete.taskName,
          date: latestIncomplete.date,
          completionValue: latestIncomplete.completionValue || latestIncomplete.completionPercentage / 100,
          duration: latestIncomplete.duration,
        })
        setShowContinueDialog(true)
      }
    }

    checkForIncompleteSessions()
  }, [selectedTask, timerSessions])

  // Initialize timer based on type
  useEffect(() => {
    if (timerType === "countdown") {
      const ms = parseTimeToMilliseconds(countdownDuration)
      setTime(ms)
    } else {
      setTime(0)
    }

    // Clear any running timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      setIsRunning(false)
    }
  }, [timerType, countdownDuration])

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      if (timerType === "stopwatch") {
        startTimeRef.current = Date.now() - time
        intervalRef.current = setInterval(() => {
          setTime(Date.now() - startTimeRef.current)
        }, 10)
      } else {
        // Countdown timer
        startTimeRef.current = Date.now()
        const initialTime = time

        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current
          const remaining = initialTime - elapsed

          if (remaining <= 0) {
            setTime(0)
            setIsRunning(false)
            clearInterval(intervalRef.current!)

            // Play completion sound
            playSound(timerCompleteSound)

            // Trigger haptic feedback for timer completion
            vibrate(VibrationPatterns.TIMER_COMPLETE, enableHapticFeedback)

            // Alert the user
            toast({
              title: "Time's up!",
              description: "Your countdown timer has finished.",
            })
          } else {
            setTime(remaining)
          }
        }, 10)
      }
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timerType, toast, time, timerCompleteSound, enableHapticFeedback])

  // Play a sound
  const playSound = async (soundId: string) => {
    if (!soundId || soundId === "none") return

    try {
      let soundUrl = ""

      // Check if it's a default sound
      if (soundId in DEFAULT_SOUNDS) {
        soundUrl = DEFAULT_SOUNDS[soundId]
      } else {
        // Find custom sound in database
        try {
          const sound = await db.sounds.get(soundId)
          if (sound?.url) {
            soundUrl = sound.url
          }
        } catch (error) {
          console.error("Error retrieving custom sound:", error)
        }
      }

      // If no sound URL was found, use the default
      if (!soundUrl) {
        console.log("No sound found for ID:", soundId, "- using default")
        soundUrl = DEFAULT_SOUNDS.default
      }

      if (audioRef.current) {
        // Create a new Audio element to avoid issues with previous sound
        const audio = new Audio(soundUrl)
        audio.volume = timerVolume

        // Test if the audio can be played
        audio.addEventListener("error", (e) => {
          console.error("Audio error:", e)
          toast({
            title: "Sound Error",
            description: "Could not play the selected sound. Please check your sound settings.",
            variant: "destructive",
          })
        })

        // Try to play the sound
        audio.play().catch((error) => {
          console.error("Error playing sound:", error)

          // Try to play a simple beep as fallback
          try {
            const fallbackAudio = new Audio(
              "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBhxQo97tuHQpCRRAlO/+yoZEGxZAgfj/0YxVJhVBfvX3x4dXKRZMjfP2xHxPJRVPl/X9yHZBGhBQoP0Fz3Q6FQ1Qqgj/x3M9GAteuhDptGxHHw5dvOu6jF9KMBxLo+Kul3BlRDEtdKGzlXh9WDkYJliRfWlwbGE/HgkAGj9jbXJ8kZeQZ0OsYTUcK1Nsd4yZm5d9Wz0OFzRJVmBziZ+jmHhVKwoTKz5OWGp+laeolnJKHQUQJjVCUGJ5kqeqnX1VJgcNHy46SFhugJeqqZt2SSAGDhsnN0ZYboOdrKuadEIaBgwWJTVEV22Fna6smXI/FwQKEyEyQVVsg5yvr5x2RBkFChIeLz1QZ4CasLCfekgcBgoQHCs5S2R+mLCxoX1MGwUJDhkpN0ljfZevsqGATx4GCQ0XJjRHYXuVrrOjgVIgBwkMFSMxRF96lK2zo4JTIQcJCxMgL0Jdd5OttKWEVSMICQoRHi1AWHWRrLWmhVYkCQkJDxwrPVZ0kKy2p4dYJQoJCA0aKTtTc4+st6iJWSYKCQcLGCc5UnKOq7iqilsnCwkHChYlN1BxjKq5q4xdKAsJBwkUJDVPcIuqua2NXikMCQYIEiIzTW+Kqbquj18qDAkGBxAgMUxuiam7sJFhKw0JBgYPHzBKbYiovLGSYiwNCQUFDR0vSWyHp72ykZQsDQkFBA0cLUhrhqe+tJRlLQ4JBQQMGitHaoWmv7WVZy4OCQUDCxkqRWmEpsC2l2gvDwkFAwkYKERog6XBt5hpMA8JBQMIFydDZ4Klw7maajEQCQUDBxYlQmaCpcS6m2sxEAkFAwYVJEFkgaXFu5xsMhEJBQMGFCNAY4CkxrydbjMRCQUDBRMiP2J/pMe9nm80EgkFAwQSIT5hfqPIvp9wNRIJBQMEESA9YH6jyb+gcTYTCQUDAxAfPF9+o8rAoXI2EwkFAwMPHjtef6TLwaJzNxQJBQMDDh05XX6ky8KjdDgUCQUDAw0cOFx9pMzDpHU5FQkFAwMMGzdafKTNxKV2OhUJBQMCCxo2WXuj0MamdzwWCQUDAgkYNFh6o9HHp3g8FgkFAwIIFzNXeqPS1rB/QBkKBgMCBxUxVXmj0/nVkFAiDAcEAwYUL1J3oNL//N2dYjUTCgYEBRIsT3We0f//4KRpPBkNCQYFECpMcpvP///jqnBCHQ8LBwUOJ0lvmc3//+atdUciEg0IBg0lRm2Xy///6LF5SiYVDwoHCyJDapXK///ps31PKBgRDAkKID9nksj//+u2gVMrGxMOCggeO2SPxv//7bqFVy4dFQ8LBxw4YIzE///vvYlbMR8XEAsGGjVdi8P//vDBjV81IR0VDwsYMll+tcz/9uLRqoJQMykmHhEPDhEcLEVgiKe91fHx4cWlh3NfTkU8MikhGRQQDQsJCQoMDxIWGx8jJyowNTs/Q0dKTU9RUVBPT01LSUZEQkA+PDo5NzY1NDMyMTAvLi0sKyopKCcmJSUkIyMiISEgHx8eHh0dHBwbGxoaGRkZGBgXFxcWFhYVFRUUFBQTExMSEhIREREQEBAQDw8PDg4ODQ0NDAwMCwsLCgoKCQkJCAgIBwcHBgYGBQUFBAQEAwMDAgICAgEBAQEBAQAAAAAAAAEB",
            )
            fallbackAudio.volume = timerVolume
            fallbackAudio.play()
          } catch (fallbackError) {
            console.error("Fallback sound also failed:", fallbackError)
          }
        })
      }
    } catch (error) {
      console.error("Error playing sound:", error)
    }
  }

  // Handle continuing a previous session
  const handleContinueSession = useCallback(() => {
    if (!previousSession) return

    // Find the session in timerSessions
    const session = timerSessions.find((s) => s.id === previousSession.id)
    if (!session) return

    // Set up the timer with the previous session's data
    setCompletionPercentage(session.completionPercentage)
    setNotes(session.notes || "")
    setMood(session.mood || 5)

    // Create a new session that references the previous one
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    const newSession = {
      id: Date.now().toString(),
      taskId: session.taskId,
      taskName: session.taskName,
      type: timerType,
      startTime: now.toISOString(),
      endTime: null,
      duration: 0,
      completionPercentage: session.completionPercentage,
      completionValue: session.completionValue || session.completionPercentage / 100,
      mood: session.mood || 5,
      date: today,
      segmentId: currentSegment?.id || "",
      segmentName: currentSegment?.name || "",
      notes: session.notes || "",
      previousSessionId: session.id,
    }

    addTimerSession(newSession)
    setActiveSession(newSession.id)
    setShowContinueDialog(false)

    // Trigger haptic feedback
    vibrate(VibrationPatterns.SUCCESS, enableHapticFeedback)
  }, [previousSession, timerSessions, timerType, currentSegment, addTimerSession, enableHapticFeedback])

  // Handle starting a fresh session
  const handleStartFresh = useCallback(() => {
    setCompletionPercentage(0)
    setNotes("")
    setMood(5)
    setShowContinueDialog(false)

    // Trigger haptic feedback
    vibrate(VibrationPatterns.TAP, enableHapticFeedback)
  }, [enableHapticFeedback])

  // Start/pause timer
  const toggleTimer = useCallback(async () => {
    if (!selectedTask) {
      toast({
        title: "No task selected",
        description: "Please select a task before starting the timer.",
        variant: "destructive",
      })

      // Trigger error haptic feedback
      vibrate(VibrationPatterns.ERROR, enableHapticFeedback)
      return
    }

    if (!isRunning) {
      // Starting timer
      if (!activeSession) {
        // Create a new session
        const task = tasks.find((t) => t.id === selectedTask)
        if (!task) return

        const now = new Date()
        const today = now.toISOString().split("T")[0]

        const newSession = {
          id: Date.now().toString(),
          taskId: selectedTask,
          taskName: task.name,
          type: timerType,
          startTime: now.toISOString(),
          endTime: null,
          duration: 0,
          completionPercentage: completionPercentage,
          completionValue: completionPercentage / 100,
          mood: 5,
          date: today,
          segmentId: currentSegment?.id || "",
          segmentName: currentSegment?.name || "",
          notes: "",
        }

        await addTimerSession(newSession)
        setActiveSession(newSession.id)
      }

      // Play start sound
      playSound(timerSound)

      // Trigger start haptic feedback
      vibrate(VibrationPatterns.TIMER_START, enableHapticFeedback)

      setIsRunning(true)
    } else {
      // Pausing timer
      setIsRunning(false)

      // Trigger stop haptic feedback
      vibrate(VibrationPatterns.TIMER_STOP, enableHapticFeedback)

      // Update session duration
      if (activeSession) {
        await updateTimerSession(activeSession, {
          duration: timerType === "stopwatch" ? time : parseTimeToMilliseconds(countdownDuration) - time,
        })
      }
    }
  }, [
    isRunning,
    selectedTask,
    activeSession,
    tasks,
    timerType,
    time,
    countdownDuration,
    completionPercentage,
    currentSegment,
    addTimerSession,
    updateTimerSession,
    toast,
    timerSound,
    enableHapticFeedback,
  ])

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (timerType === "stopwatch") {
      setTime(0)
    } else {
      setTime(parseTimeToMilliseconds(countdownDuration))
    }

    // Reset session
    setActiveSession(null)
    setCompletionPercentage(0)
    setMood(5)
    setNotes("")

    // Trigger haptic feedback
    vibrate(VibrationPatterns.CANCEL, enableHapticFeedback)
  }, [timerType, countdownDuration, enableHapticFeedback])

  // Save session
  const saveSession = useCallback(async () => {
    if (!selectedTask) {
      toast({
        title: "Cannot save session",
        description: "Please select a task before saving.",
        variant: "destructive",
      })

      // Trigger error haptic feedback
      vibrate(VibrationPatterns.ERROR, enableHapticFeedback)
      return
    }

    // Check if any time has elapsed
    if (time === 0) {
      toast({
        title: "Cannot save session",
        description: "No time has been recorded yet.",
        variant: "destructive",
      })

      // Trigger error haptic feedback
      vibrate(VibrationPatterns.ERROR, enableHapticFeedback)
      return
    }

    try {
      // Stop timer if running
      if (isRunning) {
        setIsRunning(false)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }

      const now = new Date()
      const duration = timerType === "stopwatch" ? time : parseTimeToMilliseconds(countdownDuration) - time

      // If no active session, create one
      if (!activeSession) {
        const task = tasks.find((t) => t.id === selectedTask)
        if (!task) {
          toast({
            title: "Error",
            description: "Selected task not found.",
            variant: "destructive",
          })

          // Trigger error haptic feedback
          vibrate(VibrationPatterns.ERROR, enableHapticFeedback)
          return
        }

        const today = now.toISOString().split("T")[0]
        const newSession = {
          id: Date.now().toString(),
          taskId: selectedTask,
          taskName: task.name,
          type: timerType,
          startTime: new Date(now.getTime() - duration).toISOString(), // Calculate start time based on duration
          endTime: now.toISOString(),
          duration,
          completionPercentage,
          completionValue: completionPercentage / 100,
          mood,
          date: today,
          segmentId: currentSegment?.id || "",
          segmentName: currentSegment?.name || "",
          notes,
        }

        await addTimerSession(newSession)
      } else {
        // Update existing timer session
        await updateTimerSession(activeSession, {
          endTime: now.toISOString(),
          duration,
          completionPercentage,
          completionValue: completionPercentage / 100,
          mood,
          notes,
        })
      }

      // Update mood in check-in if one exists for this segment
      const today = now.toISOString().split("T")[0]
      const segmentCheckIn = checkIns.find((c) => c.date === today && c.segmentId === currentSegment?.id)

      if (segmentCheckIn) {
        // Update existing check-in with mood
        await updateCheckIn(segmentCheckIn.id, { mood })
      } else if (currentSegment) {
        // Create a new check-in with just the mood
        const newCheckIn = {
          id: Date.now().toString(),
          date: today,
          time: now.toISOString(),
          segmentId: currentSegment.id,
          segmentName: currentSegment.name,
          energy: mood, // Use mood as default for other metrics
          mood,
          focus: mood,
          productivity: mood,
          stress: mood,
        }

        await addCheckIn(newCheckIn)
      }

      // Play completion sound
      playSound(timerCompleteSound)

      // Trigger success haptic feedback
      vibrate(VibrationPatterns.SUCCESS, enableHapticFeedback)

      toast({
        title: "Session saved",
        description: "Your timer session has been saved successfully.",
      })

      // Reset the form
      resetTimer()
    } catch (error) {
      console.error("Error saving timer session:", error)

      // Trigger error haptic feedback
      vibrate(VibrationPatterns.ERROR, enableHapticFeedback)

      toast({
        title: "Save failed",
        description: "There was an error saving your session. Please try again.",
        variant: "destructive",
      })
    }
  }, [
    selectedTask,
    time,
    activeSession,
    isRunning,
    timerType,
    countdownDuration,
    completionPercentage,
    mood,
    notes,
    currentSegment,
    tasks,
    checkIns,
    updateTimerSession,
    updateCheckIn,
    addCheckIn,
    addTimerSession,
    resetTimer,
    toast,
    timerCompleteSound,
    enableHapticFeedback,
  ])

  // Handle countdown duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCountdownDuration(e.target.value)
    if (!isRunning) {
      setTime(parseTimeToMilliseconds(e.target.value))
    }
  }

  // Handle slider change with haptic feedback
  const handleSliderChange = (value: number[], type: "completion" | "mood") => {
    // Provide haptic feedback
    vibrate(VibrationPatterns.SLIDER_CHANGE, enableHapticFeedback)

    // Update the appropriate state
    if (type === "completion") {
      setCompletionPercentage(value[0])
    } else {
      setMood(value[0])
    }
  }

  // Determine if save button should be enabled
  const canSave = selectedTask && time > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Timers</h1>
          <p className="text-muted-foreground">Track your time spent on tasks with stopwatch or countdown timers.</p>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Select a task and timer type to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-select">Select Task</Label>
                <Select
                  value={selectedTask}
                  onValueChange={(value) => {
                    setSelectedTask(value)
                    vibrate(VibrationPatterns.TAP, enableHapticFeedback)
                  }}
                  disabled={isRunning}
                >
                  <SelectTrigger id="task-select">
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timer-type">Timer Type</Label>
                <Select
                  value={timerType}
                  onValueChange={(value: "stopwatch" | "countdown") => {
                    setTimerType(value)
                    vibrate(VibrationPatterns.TAP, enableHapticFeedback)
                  }}
                  disabled={isRunning || activeSession !== null}
                >
                  <SelectTrigger id="timer-type">
                    <SelectValue placeholder="Select timer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stopwatch">Stopwatch</SelectItem>
                    <SelectItem value="countdown">Countdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {timerType === "countdown" && (
              <div className="space-y-2">
                <Label htmlFor="countdown-duration">Countdown Duration (HH:MM:SS)</Label>
                <Input
                  id="countdown-duration"
                  type="text"
                  value={countdownDuration}
                  onChange={handleDurationChange}
                  placeholder="00:25:00"
                  pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                  disabled={isRunning}
                />
              </div>
            )}

            <div className="flex justify-center items-center h-64 md:h-96">
              <div className="text-7xl md:text-9xl font-mono font-bold tabular-nums">{formatTimerTime(time)}</div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={toggleTimer} size="lg" className="w-32" disabled={!selectedTask ? true : false}>
                {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isRunning ? "Pause" : "Start"}
              </Button>
              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="w-32"
                disabled={isRunning || time === 0 ? true : false}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>

            {/* Always show the form if a task is selected and time > 0 */}
            {canSave && (
              <div className="space-y-6 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="completion">Task Completion ({completionPercentage}%)</Label>
                  </div>
                  <Slider
                    id="completion"
                    min={0}
                    max={100}
                    step={10}
                    value={[completionPercentage]}
                    onValueChange={(value) => handleSliderChange(value, "completion")}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="mood">Mood ({mood})</Label>
                  </div>
                  <Slider
                    id="mood"
                    min={1}
                    max={10}
                    step={1}
                    value={[mood]}
                    onValueChange={(value) => handleSliderChange(value, "mood")}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this session..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={saveSession} className="w-full" disabled={isLoading ? true : false}>
                  <Save className="mr-2 h-5 w-5" />
                  Save Session
                </Button>
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <p>
                    You can customize timer sounds and volume in the Settings page. Upload your own MP3 files for start
                    and completion sounds.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="today">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today" onClick={() => vibrate(VibrationPatterns.TAP, enableHapticFeedback)}>
              Today's Sessions
            </TabsTrigger>
            <TabsTrigger value="recent" onClick={() => vibrate(VibrationPatterns.TAP, enableHapticFeedback)}>
              Recent Sessions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Today's Timer Sessions</CardTitle>
                <CardDescription>Your timer sessions from today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timerSessions.filter((session) => {
                    const today = new Date().toISOString().split("T")[0]
                    return session.date === today
                  }).length > 0 ? (
                    timerSessions
                      .filter((session) => {
                        const today = new Date().toISOString().split("T")[0]
                        return session.date === today
                      })
                      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                      .map((session) => (
                        <div key={session.id} className="border-b pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{session.taskName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(session.startTime).toLocaleTimeString()} -
                                {session.endTime ? new Date(session.endTime).toLocaleTimeString() : "In progress"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatTimerTime(session.duration)}</p>
                              <p className="text-sm text-muted-foreground">{session.type}</p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Completion:</span> {session.completionPercentage}%
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mood:</span> {session.mood}/10
                            </div>
                          </div>
                          {session.notes && <p className="mt-2 text-sm italic">{session.notes}</p>}
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No timer sessions recorded today. Start a timer to track your work.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Timer Sessions</CardTitle>
                <CardDescription>Your most recent timer sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timerSessions.length > 0 ? (
                    timerSessions
                      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                      .slice(0, 5)
                      .map((session) => (
                        <div key={session.id} className="border-b pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{session.taskName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(session.date).toLocaleDateString()} - {session.segmentName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatTimerTime(session.duration)}</p>
                              <p className="text-sm text-muted-foreground">{session.type}</p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Completion:</span> {session.completionPercentage}%
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mood:</span> {session.mood}/10
                            </div>
                          </div>
                          {session.notes && <p className="mt-2 text-sm italic">{session.notes}</p>}
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No timer sessions recorded yet. Start a timer to track your work.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Continue Session Dialog */}
      <ContinueSessionDialog
        open={showContinueDialog}
        onOpenChange={setShowContinueDialog}
        previousSession={previousSession}
        onContinue={handleContinueSession}
        onStartFresh={handleStartFresh}
      />

      {/* Hidden audio element for sounds */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
