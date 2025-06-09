"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Mic, Square, Play, Save, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { db } from "@/lib/db"

interface SoundRecorderProps {
  type: "timer" | "notification"
  onRecordingComplete?: (soundId: string) => void
}

export function SoundRecorder({ type, onRecordingComplete }: SoundRecorderProps) {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingComplete, setRecordingComplete] = useState(false)
  const [recordingName, setRecordingName] = useState("")
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [browserSupported, setBrowserSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support for MediaRecorder
  useEffect(() => {
    if (!window.MediaRecorder) {
      setBrowserSupported(false)
      toast({
        title: "Browser not supported",
        description: "Your browser doesn't support audio recording. Try using Chrome, Firefox, or Edge.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  // Start recording
  const startRecording = async () => {
    try {
      // Reset state
      setRecordingComplete(false)
      setRecordingDuration(0)
      setRecordingProgress(0)
      audioChunksRef.current = []

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" })

        // Create URL for the audio blob
        const audioUrl = URL.createObjectURL(audioBlob)
        audioUrlRef.current = audioUrl

        // Set audio source
        if (audioRef.current) {
          audioRef.current.src = audioUrl
        }

        setRecordingComplete(true)
        setIsRecording(false)

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop())

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // Set up timer for recording duration (max 10 seconds)
      const startTime = Date.now()
      const maxDuration = 10000 // 10 seconds

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const duration = Math.min(elapsed, maxDuration)
        const progress = (duration / maxDuration) * 100

        setRecordingDuration(duration / 1000) // Convert to seconds
        setRecordingProgress(progress)

        // Stop recording after max duration
        if (elapsed >= maxDuration && mediaRecorderRef.current) {
          mediaRecorderRef.current.stop()
        }
      }, 100)

      // Reset permission denied flag
      setPermissionDenied(false)
    } catch (error) {
      console.error("Error starting recording:", error)

      // Check if permission was denied
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setPermissionDenied(true)
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to record sounds.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Recording failed",
          description: "There was an error starting the recording.",
          variant: "destructive",
        })
      }
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
  }

  // Play recording
  const playRecording = () => {
    if (audioRef.current && audioUrlRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Save recording
  const saveRecording = async () => {
    if (!audioUrlRef.current) return

    try {
      // Validate name
      const name = recordingName.trim() || `Recorded Sound ${new Date().toLocaleTimeString()}`

      // Convert blob URL to data URL
      const response = await fetch(audioUrlRef.current)
      const blob = await response.blob()

      const reader = new FileReader()
      reader.readAsDataURL(blob)

      reader.onload = async () => {
        const dataUrl = reader.result as string

        // Generate a unique ID for the sound
        const soundId = `recorded-${Date.now()}`

        // Save to IndexedDB
        await db.sounds.add({
          id: soundId,
          name,
          type,
          url: dataUrl,
          dateAdded: new Date().toISOString(),
        })

        // Notify parent component
        if (onRecordingComplete) {
          onRecordingComplete(soundId)
        }

        toast({
          title: "Sound saved",
          description: "Your recorded sound has been saved.",
        })

        // Reset state
        setRecordingComplete(false)
        setRecordingName("")

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
      }
    } catch (error) {
      console.error("Error saving recording:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving your recording.",
        variant: "destructive",
      })
    }
  }

  // Handle audio ended event
  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  if (!browserSupported) {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Browser not supported</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your browser doesn't support audio recording. Try using Chrome, Firefox, or Edge.
        </p>
      </div>
    )
  }

  if (permissionDenied) {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Microphone access denied</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Please allow microphone access in your browser settings to record sounds.
        </p>
        <Button variant="outline" className="mt-2" onClick={() => setPermissionDenied(false)}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 border rounded-md p-4">
      <div>
        <h3 className="text-lg font-medium">Record Your Own Sound</h3>
        <p className="text-sm text-muted-foreground">Create a custom sound by recording up to 10 seconds of audio.</p>
      </div>

      {isRecording && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Recording... {recordingDuration.toFixed(1)}s</span>
            <span className="text-sm text-muted-foreground">Max 10s</span>
          </div>
          <Progress value={recordingProgress} className="h-2" />
          <Button variant="destructive" className="w-full" onClick={stopRecording}>
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        </div>
      )}

      {!isRecording && !recordingComplete && (
        <Button variant="default" className="w-full" onClick={startRecording}>
          <Mic className="h-4 w-4 mr-2" />
          Start Recording
        </Button>
      )}

      {recordingComplete && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={playRecording} disabled={isPlaying}>
              <Play className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Name your sound"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button variant="default" className="w-full" onClick={saveRecording}>
            <Save className="h-4 w-4 mr-2" />
            Save Recording
          </Button>
          <Button variant="outline" className="w-full" onClick={startRecording}>
            <Mic className="h-4 w-4 mr-2" />
            Record Again
          </Button>
        </div>
      )}

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
    </div>
  )
}
