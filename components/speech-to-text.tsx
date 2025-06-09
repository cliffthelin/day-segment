"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Edit2 } from "lucide-react"
import { improveTranscription } from "@/lib/transcription-utils"
import { db } from "@/lib/db"

interface SpeechToTextProps {
  onTranscriptionChange: (text: string) => void
  maxDuration?: number // in seconds
  autoStart?: boolean
  placeholder?: string
}

export function SpeechToText({
  onTranscriptionChange,
  maxDuration = 60,
  autoStart = false,
  placeholder = "Your transcription will appear here...",
}: SpeechToTextProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [processedTranscript, setProcessedTranscript] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    enableTranscriptionImprovement: true,
    removeFillerWords: true,
    improveFormatting: true,
  })

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const enableImprovement = await db.settings.get("enableTranscriptionImprovement")
        const removeFillers = await db.settings.get("removeFillerWords")
        const improveFormat = await db.settings.get("improveFormatting")

        setSettings({
          enableTranscriptionImprovement: enableImprovement?.value ?? true,
          removeFillerWords: removeFillers?.value ?? true,
          improveFormatting: improveFormat?.value ?? true,
        })
      } catch (err) {
        console.error("Error loading transcription settings:", err)
      }
    }

    loadSettings()
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Speech recognition is not supported in this browser.")
      return
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()

    // Configure recognition
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = "en-US"

    // Set up event handlers
    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // Update raw transcript
      const newTranscript = finalTranscript || interimTranscript
      setTranscript((prev) => prev + newTranscript)

      // Process transcript if enabled
      if (settings.enableTranscriptionImprovement) {
        const processed = improveTranscription(newTranscript, {
          removeFillers: settings.removeFillerWords,
          improveFormatting: settings.improveFormatting,
        })
        setProcessedTranscript((prev) => prev + processed)
        onTranscriptionChange((prev) => prev + processed)
      } else {
        setProcessedTranscript((prev) => prev + newTranscript)
        onTranscriptionChange((prev) => prev + newTranscript)
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      setError(`Error: ${event.error}`)
      stopRecording()
    }

    // Auto-start if enabled
    if (autoStart) {
      startRecording()
    }

    // Clean up
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [autoStart, onTranscriptionChange, settings])

  // Start recording
  const startRecording = () => {
    if (!recognitionRef.current) return

    try {
      // Reset state
      setTranscript("")
      setProcessedTranscript("")
      setProgress(0)
      setError(null)
      setIsEditing(false)

      // Start recognition
      recognitionRef.current.start()
      setIsRecording(true)
      startTimeRef.current = Date.now()

      // Start progress timer
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          const newProgress = Math.min((elapsed / maxDuration) * 100, 100)
          setProgress(newProgress)

          // Auto-stop when max duration is reached
          if (elapsed >= maxDuration) {
            stopRecording()
          }
        }
      }, 100)
    } catch (err) {
      console.error("Error starting speech recognition:", err)
      setError("Failed to start speech recognition.")
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Process final transcript if needed
      if (settings.enableTranscriptionImprovement && transcript) {
        const processed = improveTranscription(transcript, {
          removeFillers: settings.removeFillerWords,
          improveFormatting: settings.improveFormatting,
        })
        setProcessedTranscript(processed)
        onTranscriptionChange(processed)
      }
    } catch (err) {
      console.error("Error stopping speech recognition:", err)
    }
  }

  // Toggle editing mode
  const toggleEditing = () => {
    setIsEditing(!isEditing)

    // Focus textarea when entering edit mode
    if (!isEditing && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }

  // Handle manual edits
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setProcessedTranscript(newText)
    onTranscriptionChange(newText)
  }

  // Calculate remaining time
  const remainingTime = maxDuration - (progress / 100) * maxDuration
  const formattedTime = Math.max(0, Math.floor(remainingTime))

  return (
    <div className="space-y-3">
      {/* Recording controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!!error || isEditing}
          >
            {isRecording ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleEditing}
            disabled={isRecording || (!transcript && !processedTranscript)}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            {isEditing ? "Done Editing" : "Edit Text"}
          </Button>
        </div>

        {isRecording && <span className="text-sm text-muted-foreground">{formattedTime}s remaining</span>}
      </div>

      {/* Progress bar */}
      {isRecording && <Progress value={progress} className="h-2" />}

      {/* Transcription display/edit */}
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={processedTranscript}
          onChange={handleTextChange}
          className="min-h-[100px]"
          placeholder="Edit your transcription here..."
        />
      ) : (
        <div className={`rounded-md border p-3 min-h-[100px] ${isRecording ? "bg-muted/50 animate-pulse" : ""}`}>
          {processedTranscript ? (
            <p>{processedTranscript}</p>
          ) : (
            <p className="text-muted-foreground">{isRecording ? "Listening..." : placeholder}</p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
