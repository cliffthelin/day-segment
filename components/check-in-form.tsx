"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VoiceCheckIn } from "./voice-check-in"
import { db, type Segment, type CheckIn } from "@/lib/db"
import { formatDateForDB, getCurrentTimeForDB } from "@/lib/time-utils"
import { getCurrentSegment } from "@/lib/segment-utils"
import { markSimilarPromptsAsCompleted, addNewSuggestedPrompt } from "@/lib/prompt-utils"
import { analyzeEmotion } from "@/lib/emotion-analysis"

interface CheckInFormProps {
  onCheckInComplete: () => void
  segments: Segment[]
}

export function CheckInForm({ onCheckInComplete, segments }: CheckInFormProps) {
  const [productivity, setProductivity] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [focus, setFocus] = useState(5)
  const [happiness, setHappiness] = useState(5)
  const [stress, setStress] = useState(5)
  const [notes, setNotes] = useState("")
  const [currentSegment, setCurrentSegment] = useState<Segment | null>(null)
  const [checkInType, setCheckInType] = useState<"slider" | "voice">("slider")
  const [emotionalAnalysisEnabled, setEmotionalAnalysisEnabled] = useState(true)

  useEffect(() => {
    // Load preferred check-in type from localStorage
    const savedType = localStorage.getItem("preferredCheckInType")
    if (savedType === "slider" || savedType === "voice") {
      setCheckInType(savedType)
    }

    // Set current segment
    if (segments.length > 0) {
      const segment = getCurrentSegment(segments, new Date())
      setCurrentSegment(segment)
    }
  }, [segments])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const emotionSetting = await db.settings.get("emotionalAnalysisEnabled")
        if (emotionSetting) {
          setEmotionalAnalysisEnabled(emotionSetting.value)
        }
      } catch (error) {
        console.error("Error loading emotion settings:", error)
      }
    }

    loadSettings()
  }, [])

  const handleTabChange = (value: string) => {
    if (value === "slider" || value === "voice") {
      setCheckInType(value)
      localStorage.setItem("preferredCheckInType", value)
    }
  }

  const handleSliderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentSegment) return

    const checkIn: Omit<CheckIn, "id"> = {
      id: Date.now().toString(),
      date: formatDateForDB(new Date()),
      time: getCurrentTimeForDB(),
      segmentId: currentSegment.id!,
      segmentName: currentSegment.name,
      productivity,
      energy,
      focus,
      happiness,
      stress,
      notes,
      isVoiceCheckIn: false,
    }

    await db.checkIns.add(checkIn)
    await markSimilarPromptsAsCompleted("Create a check-in")
    await addNewSuggestedPrompt()
    onCheckInComplete()
  }

  const handleVoiceCheckInSave = async (data: {
    recordingUrl: string
    notes: string
    transcription: string
    emotionalAnalysis?: any
    emotionalAnalysisEnabled?: boolean
  }) => {
    if (!currentSegment) return

    const checkIn: Omit<CheckIn, "id"> = {
      id: Date.now().toString(),
      date: formatDateForDB(new Date()),
      time: getCurrentTimeForDB(),
      segmentId: currentSegment.id!,
      segmentName: currentSegment.name,
      productivity: 5, // Default values for voice check-ins
      energy: 5,
      focus: 5,
      happiness: 5,
      stress: 5,
      notes: data.notes,
      isVoiceCheckIn: true,
      recordingUrl: data.recordingUrl,
      transcription: data.transcription,
      emotionalAnalysis: data.emotionalAnalysis,
      emotionalAnalysisEnabled: data.emotionalAnalysisEnabled,
    }

    await db.checkIns.add(checkIn)
    onCheckInComplete()
  }

  const handleVoiceCheckInCancel = () => {
    // Switch back to slider check-in if voice check-in is cancelled
    setCheckInType("slider")
    localStorage.setItem("preferredCheckInType", "slider")
  }

  const handleVoiceCheckInComplete = (checkInData: any) => {
    // If emotional analysis is enabled and there's a transcription,
    // add emotional analysis to the check-in data
    if (emotionalAnalysisEnabled && checkInData.transcription) {
      const analysis = analyzeEmotion(checkInData.transcription)
      checkInData.emotionalAnalysis = analysis
      checkInData.emotionalAnalysisEnabled = true
    }

    // Submit the check-in
    onCheckInComplete(checkInData)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Check-in for {currentSegment?.name || "Current Segment"}</h2>

      <Tabs value={checkInType} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="slider">Slider Check-in</TabsTrigger>
          <TabsTrigger value="voice">Voice Check-in</TabsTrigger>
        </TabsList>

        <TabsContent value="slider" className="space-y-4">
          <form onSubmit={handleSliderSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="productivity" className="block text-sm font-medium">
                  Productivity: {productivity}
                </label>
                <Slider
                  id="productivity"
                  min={1}
                  max={10}
                  step={1}
                  value={[productivity]}
                  onValueChange={(value) => setProductivity(value[0])}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="energy" className="block text-sm font-medium">
                  Energy: {energy}
                </label>
                <Slider
                  id="energy"
                  min={1}
                  max={10}
                  step={1}
                  value={[energy]}
                  onValueChange={(value) => setEnergy(value[0])}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="focus" className="block text-sm font-medium">
                  Focus: {focus}
                </label>
                <Slider
                  id="focus"
                  min={1}
                  max={10}
                  step={1}
                  value={[focus]}
                  onValueChange={(value) => setFocus(value[0])}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="happiness" className="block text-sm font-medium">
                  Happiness: {happiness}
                </label>
                <Slider
                  id="happiness"
                  min={1}
                  max={10}
                  step={1}
                  value={[happiness]}
                  onValueChange={(value) => setHappiness(value[0])}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="stress" className="block text-sm font-medium">
                  Stress: {stress}
                </label>
                <Slider
                  id="stress"
                  min={1}
                  max={10}
                  step={1}
                  value={[stress]}
                  onValueChange={(value) => setStress(value[0])}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium">
                  Notes (Optional)
                </label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this time period..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Submit Check-in
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="voice">
          <VoiceCheckIn onSubmit={handleVoiceCheckInSave} onCancel={handleVoiceCheckInCancel} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
