"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Play, Square, Save, Heart } from "lucide-react"
import { SpeechToText } from "./speech-to-text"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { db } from "@/lib/db"
import { analyzeEmotion, getEmotionEmoji, getEmotionColor } from "@/lib/emotion-analysis"
import { Checkbox } from "@/components/ui/checkbox"
import { v4 as uuidv4 } from "uuid"
import { format } from "date-fns"

interface VoiceCheckInProps {
  onSubmit: (data: {
    recordingUrl: string
    notes: string
    transcription: string
    emotionalAnalysis?: any
    emotionalAnalysisEnabled?: boolean
  }) => void
  onCancel: () => void
}

export function VoiceCheckIn({ onSubmit, onCancel }: VoiceCheckInProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [transcription, setTranscription] = useState("")
  const [recordingTime, setRecordingTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [emotionalAnalysisEnabled, setEmotionalAnalysisEnabled] = useState(true)
  const [globalAnalysisEnabled, setGlobalAnalysisEnabled] = useState(true)
  const [autoApplyAnalysis, setAutoApplyAnalysis] = useState(false)
  const [rememberChoice, setRememberChoice] = useState(false)
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<any>(null)
  const [showAnalysisPrompt, setShowAnalysisPrompt] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add these state variables
  const [emotionalAnalysisAutoApply, setEmotionalAnalysisAutoApply] = useState(false)
  const [rememberEmotionChoice, setRememberEmotionChoice] = useState(false)
  const [emotionAnalysisResult, setEmotionAnalysisResult] = useState<any>(null)
  const [showEmotionPrompt, setShowEmotionPrompt] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio element and load settings
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.addEventListener("ended", () => {
      setIsPlaying(false)
    })

    // Load emotional analysis settings
    const loadSettings = async () => {
      try {
        // Load existing settings
        const settings = await db.settings.toArray()
        const settingsMap = settings.reduce(
          (acc, setting) => {
            acc[setting.key] = setting.value
            return acc
          },
          {} as Record<string, any>,
        )

        // Set emotion analysis settings
        setEmotionalAnalysisEnabled(settingsMap.emotionalAnalysisEnabled !== false)
        setEmotionalAnalysisAutoApply(settingsMap.emotionalAnalysisAutoApply === true)
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    loadSettings()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  // Start recording
  const startRecording = async () => {
    try {
      // Reset state
      setIsRecording(true)
      setRecordingUrl(null)
      setRecordingTime(0)
      setProgress(0)
      setError(null)
      setEmotionalAnalysis(null)
      setShowAnalysisPrompt(false)
      audioChunksRef.current = []

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)

      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        // Create recording blob
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" })
        const url = URL.createObjectURL(audioBlob)
        setRecordingUrl(url)
        setAudioURL(url)

        // Set audio source
        if (audioRef.current) {
          audioRef.current.src = url
        }

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorderRef.current.start()

      // Start timer
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setRecordingTime(elapsed)
        setProgress(Math.min((elapsed / 60) * 100, 100)) // Max 60 seconds

        // Auto-stop at 60 seconds
        if (elapsed >= 60) {
          stopRecording()
        }
      }, 100)
    } catch (err) {
      console.error("Error starting recording:", err)
      setError("Could not access microphone. Please check permissions.")
      setIsRecording(false)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  // Play/pause recording
  const togglePlayback = () => {
    if (!audioRef.current || !recordingUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Handle transcription changes
  const handleTranscriptionChange = (text: string) => {
    setTranscription(text)

    // If we have a transcription and emotional analysis is enabled
    if (text && globalAnalysisEnabled) {
      if (autoApplyAnalysis) {
        // Auto-apply analysis
        const analysis = analyzeEmotion(text)
        setEmotionalAnalysis(analysis)
        setEmotionalAnalysisEnabled(true)
      } else {
        // Show prompt to apply analysis
        setShowAnalysisPrompt(true)
      }
    }
  }

  const handleTranscriptionSuccess = async (transcription: string) => {
    setTranscription(transcription)
    setIsTranscribing(false)

    // Perform emotion analysis if enabled
    if (emotionalAnalysisEnabled) {
      const analysis = analyzeEmotion(transcription)
      setEmotionAnalysisResult(analysis)

      // If auto-apply is enabled, we'll include the analysis in the check-in
      // Otherwise, we'll show a prompt to the user
      if (!emotionalAnalysisAutoApply) {
        setShowEmotionPrompt(true)
      }
    }

    // Rest of the function remains the same
  }

  // Apply emotional analysis
  const applyEmotionalAnalysis = () => {
    if (!transcription) return

    const analysis = analyzeEmotion(transcription)
    setEmotionalAnalysis(analysis)
    setEmotionalAnalysisEnabled(true)
    setShowAnalysisPrompt(false)

    // Save preference if remember choice is selected
    if (rememberChoice) {
      db.settings.put({ key: "emotionalAnalysisAutoApply", value: true })
    }
  }

  // Skip emotional analysis
  const skipEmotionalAnalysis = () => {
    setEmotionalAnalysisEnabled(false)
    setShowAnalysisPrompt(false)

    // Save preference if remember choice is selected
    if (rememberChoice) {
      db.settings.put({ key: "emotionalAnalysisEnabled", value: false })
    }
  }

  // Add this function
  const handleEmotionAnalysisChoice = async (apply: boolean) => {
    // If user chose to remember this choice, update the setting
    if (rememberEmotionChoice) {
      await db.settings.put({ key: "emotionalAnalysisAutoApply", value: apply })
      setEmotionalAnalysisAutoApply(apply)
    }

    // Hide the prompt
    setShowEmotionPrompt(false)

    // If user chose not to apply, clear the result
    if (!apply) {
      setEmotionAnalysisResult(null)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!recordingUrl) {
      setError("Please record a voice check-in before submitting.")
      return
    }

    onSubmit({
      recordingUrl,
      notes,
      transcription,
      emotionalAnalysis: emotionalAnalysisEnabled ? emotionalAnalysis : undefined,
      emotionalAnalysisEnabled,
    })
  }

  const handleSubmit2 = async () => {
    if (!audioURL) return

    try {
      setIsSubmitting(true)

      // Create check-in data
      const checkInData = {
        id: uuidv4(),
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm"),
        segmentId: selectedSegment?.id,
        segmentName: selectedSegment?.name,
        productivity: 5, // Default values for required fields
        energy: 5,
        focus: 5,
        happiness: 5,
        stress: 5,
        isVoiceCheckIn: true,
        recordingUrl: audioURL,
        transcription: transcription,
        voiceNotes: notes,
        // Add emotional analysis if available and enabled
        emotionalAnalysis:
          emotionalAnalysisEnabled && (emotionalAnalysisAutoApply || (showEmotionPrompt && emotionAnalysisResult))
            ? emotionAnalysisResult
            : undefined,
        emotionalAnalysisEnabled:
          emotionalAnalysisEnabled && (emotionalAnalysisAutoApply || (showEmotionPrompt && emotionAnalysisResult)),
      }

      // Rest of the function remains the same
    } catch (error) {
      console.error("Error submitting check-in:", error)
      setIsSubmitting(false)
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Voice Check-in</h3>
          {recordingTime > 0 && !isRecording && (
            <span className="text-xs text-muted-foreground">Recording length: {formatTime(recordingTime)}</span>
          )}
        </div>

        {/* Recording controls */}
        {!recordingUrl ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              className="w-full"
            >
              {isRecording ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Recording ({formatTime(recordingTime)})
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>

            {isRecording && <Progress value={progress} className="h-2" />}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={togglePlayback} className="flex-1">
                {isPlaying ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Play Recording
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRecordingUrl(null)
                  setTranscription("")
                  setEmotionalAnalysis(null)
                  setShowAnalysisPrompt(false)
                }}
              >
                Record Again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transcription */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Transcription</h3>
        {!recordingUrl ? (
          <SpeechToText onTranscriptionChange={handleTranscriptionChange} autoStart={isRecording} maxDuration={60} />
        ) : (
          <Textarea
            value={transcription}
            onChange={(e) => {
              setTranscription(e.target.value)
              // Update emotional analysis if enabled
              if (emotionalAnalysisEnabled && globalAnalysisEnabled) {
                const analysis = analyzeEmotion(e.target.value)
                setEmotionalAnalysis(analysis)
              }
            }}
            placeholder="Edit transcription if needed..."
            className="min-h-[100px]"
          />
        )}
      </div>

      {emotionalAnalysisEnabled && emotionalAnalysisAutoApply && emotionAnalysisResult && !showEmotionPrompt && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium">Emotional Analysis:</span>
          </div>
          <div
            className="p-2 rounded-md text-sm"
            style={{
              backgroundColor: `${getEmotionColor(emotionAnalysisResult.primaryEmotion)}20`,
              borderLeft: `3px solid ${getEmotionColor(emotionAnalysisResult.primaryEmotion)}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{getEmotionEmoji(emotionAnalysisResult.primaryEmotion)}</span>
              <span className="capitalize">{emotionAnalysisResult.primaryEmotion}</span>
              {emotionAnalysisResult.secondaryEmotion && (
                <>
                  <span className="text-muted-foreground">with</span>
                  <span className="capitalize">{emotionAnalysisResult.secondaryEmotion}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showEmotionPrompt && emotionAnalysisResult && (
        <div className="mt-4 border rounded-lg p-4 bg-muted/30">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Emotional Analysis
            </h4>
          </div>

          <div
            className="p-3 rounded-md mb-3"
            style={{
              backgroundColor: `${getEmotionColor(emotionAnalysisResult.primaryEmotion)}20`,
              borderLeft: `3px solid ${getEmotionColor(emotionAnalysisResult.primaryEmotion)}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{getEmotionEmoji(emotionAnalysisResult.primaryEmotion)}</span>
              <span className="font-medium capitalize">{emotionAnalysisResult.primaryEmotion}</span>
              {emotionAnalysisResult.secondaryEmotion && (
                <>
                  <span className="text-muted-foreground">with</span>
                  <span className="capitalize">{emotionAnalysisResult.secondaryEmotion}</span>
                </>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">{emotionAnalysisResult.description}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm">Would you like to include this emotional analysis with your check-in?</p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-emotion-choice"
                checked={rememberEmotionChoice}
                onCheckedChange={(checked) => setRememberEmotionChoice(!!checked)}
              />
              <label
                htmlFor="remember-emotion-choice"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember my choice
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleEmotionAnalysisChoice(false)}>
                No, Skip
              </Button>
              <Button className="flex-1" onClick={() => handleEmotionAnalysisChoice(true)}>
                Yes, Include
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Emotional Analysis Prompt */}
      {showAnalysisPrompt && transcription && globalAnalysisEnabled && !emotionalAnalysis && (
        <Alert className="bg-primary/5 border-primary/20">
          <Heart className="h-4 w-4 text-primary" />
          <AlertTitle>Emotional Analysis Available</AlertTitle>
          <AlertDescription>
            <p className="text-sm mb-2">Would you like to analyze the emotions in your voice check-in?</p>
            <div className="flex items-center gap-2 mb-2">
              <Switch id="remember-choice" checked={rememberChoice} onCheckedChange={setRememberChoice} />
              <Label htmlFor="remember-choice" className="text-sm">
                Remember my choice
              </Label>
            </div>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={skipEmotionalAnalysis}>
                No Thanks
              </Button>
              <Button type="button" size="sm" onClick={applyEmotionalAnalysis}>
                <Heart className="mr-1 h-3 w-3" /> Analyze Emotions
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Emotional Analysis Results */}
      {emotionalAnalysis && emotionalAnalysisEnabled && globalAnalysisEnabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <Heart className="h-4 w-4 text-pink-500" />
              Emotional Analysis
            </h3>
            <Switch
              checked={emotionalAnalysisEnabled}
              onCheckedChange={setEmotionalAnalysisEnabled}
              aria-label="Enable emotional analysis"
            />
          </div>

          <div
            className="p-3 rounded-md text-sm"
            style={{
              backgroundColor: `${getEmotionColor(emotionalAnalysis.primaryEmotion)}20`,
              borderLeft: `3px solid ${getEmotionColor(emotionalAnalysis.primaryEmotion)}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getEmotionEmoji(emotionalAnalysis.primaryEmotion)}</span>
              <span className="font-medium">{emotionalAnalysis.description}</span>
            </div>

            {emotionalAnalysis.confidence < 0.4 && (
              <p className="text-xs text-muted-foreground italic mb-2">
                Note: Low confidence detection. Results may not be accurate.
              </p>
            )}

            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>
                <span className="text-muted-foreground">Primary emotion:</span>{" "}
                <span className="font-medium">{emotionalAnalysis.primaryEmotion}</span>
              </div>
              {emotionalAnalysis.secondaryEmotion && (
                <div>
                  <span className="text-muted-foreground">Secondary:</span>{" "}
                  <span className="font-medium">{emotionalAnalysis.secondaryEmotion}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Sentiment:</span>{" "}
                <span className="font-medium">
                  {emotionalAnalysis.sentiment > 0.2
                    ? "Positive"
                    : emotionalAnalysis.sentiment < -0.2
                      ? "Negative"
                      : "Neutral"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>{" "}
                <span className="font-medium">{Math.round(emotionalAnalysis.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Additional Notes (Optional)</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes here..."
          className="min-h-[80px]"
        />
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Submit/Cancel buttons */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!recordingUrl || isRecording}>
          <Save className="mr-2 h-4 w-4" />
          Save Check-in
        </Button>
      </div>
    </form>
  )
}
