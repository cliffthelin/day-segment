"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { analyzeEmotion, getEmotionEmoji } from "@/lib/emotion-analysis"

export function EmotionSettings() {
  const [emotionalAnalysisEnabled, setEmotionalAnalysisEnabled] = useState(true)
  const [autoApply, setAutoApply] = useState(false)
  const [demoText, setDemoText] = useState(
    "I'm feeling really happy today because I accomplished my goals, but I'm a bit nervous about tomorrow's meeting.",
  )
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === "undefined") return

        const enabledSetting = await db.settings.get("emotionalAnalysisEnabled")
        if (enabledSetting) {
          setEmotionalAnalysisEnabled(enabledSetting.value)
        }

        const autoApplySetting = await db.settings.get("emotionalAnalysisAutoApply")
        if (autoApplySetting) {
          setAutoApply(autoApplySetting.value)
        }
      } catch (error) {
        console.error("Error loading emotion settings:", error)
      }
    }

    loadSettings()
  }, [])

  // Save settings to database
  const saveSettings = async (key: string, value: any) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") return

      await db.settings.put({ key, value })
    } catch (error) {
      console.error(`Error saving ${key} setting:`, error)
    }
  }

  // Handle toggle changes
  const handleEmotionalAnalysisToggle = (checked: boolean) => {
    setEmotionalAnalysisEnabled(checked)
    saveSettings("emotionalAnalysisEnabled", checked)
  }

  const handleAutoApplyToggle = (checked: boolean) => {
    setAutoApply(checked)
    saveSettings("emotionalAnalysisAutoApply", checked)
  }

  // Analyze demo text
  const analyzeDemoText = () => {
    setIsLoading(true)
    setTimeout(() => {
      try {
        const result = analyzeEmotion(demoText)
        setAnalysisResult(result)
      } catch (error) {
        console.error("Error analyzing text:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300) // Add a small delay to simulate processing
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Emotional Analysis Settings</CardTitle>
          <CardDescription>Configure how emotional analysis works for your voice check-ins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="emotional-analysis" className="flex flex-col space-y-1">
              <span>Enable Emotional Analysis</span>
              <span className="font-normal text-sm text-muted-foreground">
                Analyze voice check-ins to detect emotions and sentiment
              </span>
            </Label>
            <Switch
              id="emotional-analysis"
              checked={emotionalAnalysisEnabled}
              onCheckedChange={handleEmotionalAnalysisToggle}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="auto-apply" className="flex flex-col space-y-1">
              <span>Auto-Apply Analysis</span>
              <span className="font-normal text-sm text-muted-foreground">
                Automatically apply emotional analysis to all voice check-ins
              </span>
            </Label>
            <Switch
              id="auto-apply"
              checked={autoApply}
              onCheckedChange={handleAutoApplyToggle}
              disabled={!emotionalAnalysisEnabled}
            />
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">Test Emotional Analysis</h3>
            <Textarea
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              placeholder="Enter text to analyze emotions..."
              className="min-h-[100px] mb-4"
              disabled={!emotionalAnalysisEnabled}
            />
            <Button onClick={analyzeDemoText} disabled={!emotionalAnalysisEnabled || !demoText.trim() || isLoading}>
              {isLoading ? "Analyzing..." : "Analyze Text"}
            </Button>

            {analysisResult && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{analysisResult.emoji}</span>
                  <h4 className="text-md font-medium capitalize">{analysisResult.primaryEmotion}</h4>
                </div>

                <p className="text-sm mb-3">{analysisResult.description}</p>

                <div className="grid grid-cols-2 gap-2">
                  {analysisResult.secondaryEmotions.map((emotion: string) => (
                    <div key={emotion} className="flex items-center gap-2">
                      <span className="text-sm">{getEmotionEmoji(emotion)}</span>
                      <span className="text-sm capitalize">{emotion}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sentiment:</span>
                    <span
                      className={`text-sm font-medium ${
                        analysisResult.sentiment > 0
                          ? "text-green-500"
                          : analysisResult.sentiment < 0
                            ? "text-red-500"
                            : ""
                      }`}
                    >
                      {analysisResult.sentiment > 0
                        ? "Positive"
                        : analysisResult.sentiment < 0
                          ? "Negative"
                          : "Neutral"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <span className="text-sm font-medium">{Math.round(analysisResult.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Emotional analysis is performed locally on your device and is not sent to any external servers.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
